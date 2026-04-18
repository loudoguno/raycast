import { getPreferenceValues } from "@raycast/api";
import { Octokit } from "octokit";
import type {
  CreateIssueParams,
  Collaborator,
  GitForgeProvider,
  Label,
  Milestone,
  Preferences,
  Repo,
  RepoDetails,
} from "../types";

let _octokit: Octokit | null = null;
function getOctokit(): Octokit {
  if (!_octokit) {
    const { githubToken } = getPreferenceValues<Preferences>();
    _octokit = new Octokit({ auth: githubToken });
  }
  return _octokit;
}

function mapRepo(r: Record<string, unknown>): Repo {
  const repo = r as {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    clone_url: string;
    ssh_url: string;
    homepage: string | null;
    language: string | null;
    default_branch: string;
    private: boolean;
    fork: boolean;
    archived: boolean;
    owner: { login: string; avatar_url: string };
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    size: number;
    pushed_at: string;
    updated_at: string;
    created_at: string;
    topics?: string[];
    license?: { spdx_id: string } | null;
  };
  return {
    provider: "github",
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    sshUrl: repo.ssh_url,
    homepage: repo.homepage,
    language: repo.language,
    defaultBranch: repo.default_branch,
    private: repo.private,
    fork: repo.fork,
    archived: repo.archived,
    owner: { login: repo.owner.login, avatarUrl: repo.owner.avatar_url },
    stargazersCount: repo.stargazers_count,
    forksCount: repo.forks_count,
    openIssuesCount: repo.open_issues_count,
    size: repo.size,
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at,
    createdAt: repo.created_at,
    topics: repo.topics ?? [],
    license: repo.license?.spdx_id ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractLastPage(result: PromiseSettledResult<any>): number {
  if (result.status !== "fulfilled") return 0;
  const link = result.value.headers?.link as string | undefined;
  if (link) {
    const match = link.match(/page=(\d+)>; rel="last"/);
    if (match) return parseInt(match[1], 10);
  }
  return Array.isArray(result.value.data) ? result.value.data.length : 0;
}

export const githubProvider: GitForgeProvider = {
  id: "github",
  displayName: "GitHub",

  isConfigured: () => Boolean(getPreferenceValues<Preferences>().githubToken),

  hostname: () => "github.com",

  async fetchRepos() {
    const octokit = getOctokit();
    const repos: Repo[] = [];
    const iterator = octokit.paginate.iterator(
      octokit.rest.repos.listForAuthenticatedUser,
      {
        sort: "pushed",
        direction: "desc",
        per_page: 100,
        type: "all",
      },
    );
    for await (const response of iterator) {
      for (const repo of response.data) {
        repos.push(mapRepo(repo as unknown as Record<string, unknown>));
      }
      if (repos.length >= 500) break;
    }
    return repos;
  },

  async fetchRepoDetails(owner: string, name: string): Promise<RepoDetails> {
    const octokit = getOctokit();
    const [
      repoRes,
      readmeRes,
      commitsRes,
      branchesRes,
      releasesRes,
      contributorsRes,
      prsRes,
    ] = await Promise.allSettled([
      octokit.rest.repos.get({ owner, repo: name }),
      octokit.rest.repos.getReadme({
        owner,
        repo: name,
        mediaType: { format: "raw" },
      }),
      octokit.rest.repos.listCommits({ owner, repo: name, per_page: 1 }),
      octokit.rest.repos.listBranches({ owner, repo: name, per_page: 1 }),
      octokit.rest.repos.listReleases({ owner, repo: name, per_page: 1 }),
      octokit.rest.repos.listContributors({ owner, repo: name, per_page: 1 }),
      octokit.rest.pulls.list({
        owner,
        repo: name,
        state: "open",
        per_page: 1,
      }),
    ]);

    const repo =
      repoRes.status === "fulfilled"
        ? mapRepo(repoRes.value.data as unknown as Record<string, unknown>)
        : null;

    const readme =
      readmeRes.status === "fulfilled" ? String(readmeRes.value.data) : null;

    let latestCommit = null;
    if (commitsRes.status === "fulfilled" && commitsRes.value.data.length > 0) {
      const c = commitsRes.value.data[0];
      latestCommit = {
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split("\n")[0],
        author: c.commit.author?.name ?? c.author?.login ?? "unknown",
        date: c.commit.author?.date ?? "",
      };
    }

    return {
      repo: repo!,
      readme,
      latestCommit,
      branches: extractLastPage(branchesRes),
      releases: extractLastPage(releasesRes),
      contributors: extractLastPage(contributorsRes),
      openPRs: extractLastPage(prsRes),
    };
  },

  async fetchLabels(owner: string, repo: string): Promise<Label[]> {
    const { data } = await getOctokit().rest.issues.listLabelsForRepo({
      owner,
      repo,
      per_page: 100,
    });
    return data.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      description: l.description ?? null,
    }));
  },

  async fetchMilestones(owner: string, repo: string): Promise<Milestone[]> {
    const { data } = await getOctokit().rest.issues.listMilestones({
      owner,
      repo,
      state: "open",
      per_page: 100,
    });
    return data.map((m) => ({ number: m.number, title: m.title }));
  },

  async fetchCollaborators(
    owner: string,
    repo: string,
  ): Promise<Collaborator[]> {
    try {
      const { data } = await getOctokit().rest.repos.listCollaborators({
        owner,
        repo,
        per_page: 100,
      });
      return data.map((c) => ({
        login: c.login ?? "",
        avatarUrl: c.avatar_url ?? "",
      }));
    } catch {
      return [];
    }
  },

  async createIssue(
    owner: string,
    repo: string,
    params: CreateIssueParams,
  ): Promise<string> {
    const { data } = await getOctokit().rest.issues.create({
      owner,
      repo,
      title: params.title,
      body: params.body,
      labels: params.labels,
      assignees: params.assignees,
      milestone: params.milestone,
    });
    return data.html_url;
  },
};
