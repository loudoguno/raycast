import { getPreferenceValues } from "@raycast/api";
import { CreateIssueParams, GitHubIssue } from "./types";

const REPO = "loudoguno/raycast";
const API_BASE = "https://api.github.com";

function getToken(): string {
  const { githubToken } = getPreferenceValues<{ githubToken: string }>();
  if (!githubToken) {
    throw new Error("GitHub PAT not configured. Set it in extension preferences.");
  }
  return githubToken;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export async function createIssue(params: CreateIssueParams): Promise<GitHubIssue> {
  const res = await fetch(`${API_BASE}/repos/${REPO}/issues`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      title: params.title,
      body: params.body,
      labels: params.labels,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${text}`);
  }

  return (await res.json()) as GitHubIssue;
}

export async function listIssues(labels?: string[]): Promise<GitHubIssue[]> {
  const params = new URLSearchParams({ state: "open", per_page: "100" });
  if (labels && labels.length > 0) {
    params.set("labels", labels.join(","));
  }

  const res = await fetch(`${API_BASE}/repos/${REPO}/issues?${params}`, {
    headers: headers(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${text}`);
  }

  return (await res.json()) as GitHubIssue[];
}
