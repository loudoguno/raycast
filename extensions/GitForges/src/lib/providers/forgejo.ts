import { getPreferenceValues } from "@raycast/api";
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

function getConfig(): { baseUrl: string; token: string } | null {
  const { forgejoUrl, forgejoToken } = getPreferenceValues<Preferences>();
  if (!forgejoUrl || !forgejoToken) return null;
  return { baseUrl: forgejoUrl.replace(/\/$/, ""), token: forgejoToken };
}

async function call<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string | number> } = {},
): Promise<{ data: T; headers: Headers }> {
  const cfg = getConfig();
  if (!cfg) throw new Error("Forgejo not configured");

  const url = new URL(`${cfg.baseUrl}/api/v1${path}`);
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `token ${cfg.token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(
      `Forgejo API ${res.status}: ${await res.text().catch(() => res.statusText)}`,
    );
  }

  // Some endpoints (raw README) return text; try JSON first, fall back to text
  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? ((await res.json()) as T)
    : ((await res.text()) as unknown as T);

  return { data, headers: res.headers };
}

interface ForgejoRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  website: string;
  language: string;
  default_branch: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  owner: { login: string; avatar_url: string };
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  updated_at: string;
  created_at: string;
}

function mapRepo(r: ForgejoRepo): Repo {
  return {
    provider: "forgejo",
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description || null,
    htmlUrl: r.html_url,
    cloneUrl: r.clone_url,
    sshUrl: r.ssh_url,
    homepage: r.website || null,
    language: r.language || null,
    defaultBranch: r.default_branch,
    private: r.private,
    fork: r.fork,
    archived: r.archived,
    owner: { login: r.owner.login, avatarUrl: r.owner.avatar_url },
    stargazersCount: r.stars_count,
    forksCount: r.forks_count,
    openIssuesCount: r.open_issues_count,
    size: r.size,
    pushedAt: r.updated_at,
    updatedAt: r.updated_at,
    createdAt: r.created_at,
    topics: [],
    license: null,
  };
}

export const forgejoProvider: GitForgeProvider = {
  id: "forgejo",
  displayName: "Forgejo",

  isConfigured: () => getConfig() !== null,

  hostname: () => {
    const cfg = getConfig();
    if (!cfg) return null;
    try {
      return new URL(cfg.baseUrl).hostname;
    } catch {
      return null;
    }
  },

  async fetchRepos(): Promise<Repo[]> {
    const all: Repo[] = [];
    let page = 1;
    while (true) {
      const { data } = await call<ForgejoRepo[]>("/repos/search", {
        query: { limit: 50, page, sort: "updated", order: "desc", uid: 0 },
      });
      // /repos/search wraps in { data: [...], ok: true } — handle both shapes
      const repos: ForgejoRepo[] = Array.isArray(data)
        ? data
        : ((data as unknown as { data: ForgejoRepo[] }).data ?? []);
      if (repos.length === 0) break;
      all.push(...repos.map(mapRepo));
      if (repos.length < 50 || all.length >= 500) break;
      page += 1;
    }
    return all;
  },

  async fetchRepoDetails(owner: string, name: string): Promise<RepoDetails> {
    const [
      repoRes,
      readmeRes,
      commitsRes,
      branchesRes,
      releasesRes,
      contributorsRes,
      prsRes,
    ] = await Promise.allSettled([
      call<ForgejoRepo>(`/repos/${owner}/${name}`),
      call<string>(`/repos/${owner}/${name}/raw/README.md`),
      call<
        Array<{
          sha: string;
          commit: { message: string; author: { name: string; date: string } };
        }>
      >(`/repos/${owner}/${name}/commits`, { query: { limit: 1 } }),
      call<unknown[]>(`/repos/${owner}/${name}/branches`, {
        query: { limit: 1 },
      }),
      call<unknown[]>(`/repos/${owner}/${name}/releases`, {
        query: { limit: 1 },
      }),
      call<unknown[]>(`/repos/${owner}/${name}/contributors`, {
        query: { limit: 1 },
      }),
      call<unknown[]>(`/repos/${owner}/${name}/pulls`, {
        query: { state: "open", limit: 1 },
      }),
    ]);

    const repo =
      repoRes.status === "fulfilled" ? mapRepo(repoRes.value.data) : null;
    const readme =
      readmeRes.status === "fulfilled" ? String(readmeRes.value.data) : null;

    let latestCommit = null;
    if (commitsRes.status === "fulfilled" && commitsRes.value.data.length > 0) {
      const c = commitsRes.value.data[0];
      latestCommit = {
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split("\n")[0],
        author: c.commit.author?.name ?? "unknown",
        date: c.commit.author?.date ?? "",
      };
    }

    return {
      repo: repo!,
      readme,
      latestCommit,
      branches: extractTotalCount(branchesRes),
      releases: extractTotalCount(releasesRes),
      contributors: extractTotalCount(contributorsRes),
      openPRs: extractTotalCount(prsRes),
    };
  },

  async fetchLabels(owner: string, name: string): Promise<Label[]> {
    const { data } = await call<
      Array<{ id: number; name: string; color: string; description: string }>
    >(`/repos/${owner}/${name}/labels`, { query: { limit: 100 } });
    return data.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color.replace(/^#/, ""),
      description: l.description || null,
    }));
  },

  async fetchMilestones(owner: string, name: string): Promise<Milestone[]> {
    const { data } = await call<Array<{ id: number; title: string }>>(
      `/repos/${owner}/${name}/milestones`,
      { query: { state: "open", limit: 100 } },
    );
    return data.map((m) => ({ number: m.id, title: m.title }));
  },

  async fetchCollaborators(
    owner: string,
    name: string,
  ): Promise<Collaborator[]> {
    try {
      const { data } = await call<Array<{ login: string; avatar_url: string }>>(
        `/repos/${owner}/${name}/collaborators`,
        { query: { limit: 100 } },
      );
      return data.map((c) => ({ login: c.login, avatarUrl: c.avatar_url }));
    } catch {
      return [];
    }
  },

  async createIssue(
    owner: string,
    name: string,
    params: CreateIssueParams,
  ): Promise<string> {
    const body: Record<string, unknown> = { title: params.title };
    if (params.body) body.body = params.body;
    if (params.labels && params.labels.length > 0) body.labels = params.labels;
    if (params.assignees && params.assignees.length > 0)
      body.assignees = params.assignees;
    if (params.milestone) body.milestone = params.milestone;

    const { data } = await call<{ html_url: string }>(
      `/repos/${owner}/${name}/issues`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
    return data.html_url;
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTotalCount(result: PromiseSettledResult<any>): number {
  if (result.status !== "fulfilled") return 0;
  // Forgejo exposes X-Total-Count for paginated endpoints
  const totalHeader = result.value.headers?.get?.("x-total-count");
  if (totalHeader) {
    const n = parseInt(totalHeader, 10);
    if (!isNaN(n)) return n;
  }
  return Array.isArray(result.value.data) ? result.value.data.length : 0;
}
