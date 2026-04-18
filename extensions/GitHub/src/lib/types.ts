export interface Preferences {
  token: string;
  localScanPaths: string;
}

export interface RepoItem {
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
  disabled: boolean;
  owner: {
    login: string;
    avatarUrl: string;
  };
  stargazersCount: number;
  watchersCount: number;
  forksCount: number;
  openIssuesCount: number;
  size: number;
  pushedAt: string;
  updatedAt: string;
  createdAt: string;
  topics: string[];
  license: string | null;
}

export interface RepoBranchCount {
  repoFullName: string;
  count: number;
}

export interface RepoPRCount {
  repoFullName: string;
  count: number;
}

export interface RepoDetails {
  repo: RepoItem;
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

export interface IssueFormValues {
  title: string;
  body: string;
  labels: string[];
  assignees: string[];
  milestone: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface Milestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: string;
}

export interface Collaborator {
  login: string;
  avatarUrl: string;
}
