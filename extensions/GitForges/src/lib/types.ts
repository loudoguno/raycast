export type ProviderId = "github" | "forgejo";

export interface Preferences {
  githubToken?: string;
  forgejoUrl?: string;
  forgejoToken?: string;
  localScanPaths: string;
  primaryProvider: "recent" | "github" | "forgejo";
}

export interface Repo {
  provider: ProviderId;
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  homepage: string | null;
  language: string | null;
  defaultBranch: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  owner: { login: string; avatarUrl: string };
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  size: number;
  pushedAt: string;
  updatedAt: string;
  createdAt: string;
  topics: string[];
  license: string | null;
}

/**
 * A merged entry. If the same repo (matched by lowercase name) exists on
 * multiple providers, this groups them. `key` is what we use for React keys
 * and stable identity.
 */
export interface MergedRepo {
  key: string;
  displayName: string;
  variants: Repo[];
}

export interface RepoDetails {
  repo: Repo;
  readme: string | null;
  latestCommit: {
    sha: string;
    message: string;
    author: string;
    date: string;
  } | null;
  branches: number;
  releases: number;
  contributors: number;
  openPRs: number;
}

export interface LocalRepoInfo {
  path: string;
  currentBranch: string;
  hasUncommittedChanges: boolean;
  ahead: number;
  behind: number;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface Milestone {
  number: number;
  title: string;
}

export interface Collaborator {
  login: string;
  avatarUrl: string;
}

export interface CreateIssueParams {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

/**
 * A unified interface every git forge implementation must satisfy.
 * Add a new provider by implementing this and registering it in
 * `providers/index.ts`.
 */
export interface GitForgeProvider {
  id: ProviderId;
  displayName: string;
  isConfigured: () => boolean;
  fetchRepos: () => Promise<Repo[]>;
  fetchRepoDetails: (owner: string, name: string) => Promise<RepoDetails>;
  fetchLabels: (owner: string, name: string) => Promise<Label[]>;
  fetchMilestones: (owner: string, name: string) => Promise<Milestone[]>;
  fetchCollaborators: (owner: string, name: string) => Promise<Collaborator[]>;
  createIssue: (
    owner: string,
    name: string,
    params: CreateIssueParams,
  ) => Promise<string>;
  /**
   * Hostname used to recognize local clones (e.g. "github.com" or "git.example.com")
   */
  hostname: () => string | null;
}
