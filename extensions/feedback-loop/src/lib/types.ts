export interface ExtensionInfo {
  name: string; // package.json name (used for labels)
  title: string; // Human-readable title
  dir: string; // Directory name under extensions/
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  labels: { name: string }[];
  state: string;
  html_url: string;
}

export interface CreateIssueParams {
  title: string;
  body: string;
  labels: string[];
}

export interface DraftState {
  extensionName: string; // package.json name
  title: string;
  description: string;
  feedbackType: string;
  savedAt: number; // Date.now()
}
