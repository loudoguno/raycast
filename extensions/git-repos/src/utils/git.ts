import { execSync } from "child_process";
import { readdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface RepoStatus {
  name: string;
  path: string;
  branch: string;
  isDirty: boolean;
  dirtyCount: number;
  unpushedCount: number;
  lastCommitMsg: string;
  lastCommitDate: Date;
  isStale: boolean;
  error?: string;
}

function runGit(args: string, cwd: string): string {
  return execSync(`git ${args}`, {
    cwd,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 5000,
  }).trim();
}

export function getRepoStatus(repoPath: string): RepoStatus {
  const resolvedPath = repoPath.startsWith("~") ? join(homedir(), repoPath.slice(1)) : repoPath;

  const name = resolvedPath.split("/").pop() || resolvedPath;

  const defaultStatus: RepoStatus = {
    name,
    path: resolvedPath,
    branch: "unknown",
    isDirty: false,
    dirtyCount: 0,
    unpushedCount: 0,
    lastCommitMsg: "",
    lastCommitDate: new Date(0),
    isStale: false,
  };

  if (!existsSync(resolvedPath)) {
    return { ...defaultStatus, error: "Path does not exist" };
  }

  if (!existsSync(join(resolvedPath, ".git"))) {
    return { ...defaultStatus, error: "Not a git repository" };
  }

  try {
    const branch = runGit("rev-parse --abbrev-ref HEAD", resolvedPath);

    const statusOutput = runGit("status --porcelain", resolvedPath);
    const isDirty = statusOutput.length > 0;
    const dirtyCount = isDirty ? statusOutput.split("\n").filter((l) => l.trim()).length : 0;

    let unpushedCount = 0;
    try {
      const unpushedOutput = runGit("rev-list @{u}..HEAD --count", resolvedPath);
      unpushedCount = parseInt(unpushedOutput, 10) || 0;
    } catch {
      // No upstream configured or other error - treat as 0
    }

    const lastCommitMsg = runGit("log -1 --pretty=%s", resolvedPath);
    const lastCommitTimestamp = runGit("log -1 --pretty=%ct", resolvedPath);
    const lastCommitDate = new Date(parseInt(lastCommitTimestamp, 10) * 1000);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isStale = lastCommitDate < sevenDaysAgo;

    return {
      name,
      path: resolvedPath,
      branch,
      isDirty,
      dirtyCount,
      unpushedCount,
      lastCommitMsg,
      lastCommitDate,
      isStale,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ...defaultStatus, error: message };
  }
}

export function scanForRepos(scanDir: string): string[] {
  const resolvedDir = scanDir.startsWith("~") ? join(homedir(), scanDir.slice(1)) : scanDir;

  if (!existsSync(resolvedDir)) return [];

  try {
    const entries = readdirSync(resolvedDir, { withFileTypes: true });
    const repos: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue;

      const fullPath = join(resolvedDir, entry.name);
      if (existsSync(join(fullPath, ".git"))) {
        repos.push(fullPath);
      }
    }

    return repos;
  } catch {
    return [];
  }
}

export function getWatchedRepos(): string[] {
  const home = homedir();
  const explicit = [join(home, "code", "raycast"), join(home, "keybindings")];

  const scanned = scanForRepos(join(home, "code")).filter(
    (p) => !explicit.includes(p) && p !== join(home, "code", "raycast") && p !== join(home, "keybindings"),
  );

  return [...explicit, ...scanned];
}

export function statusIcon(repo: RepoStatus): string {
  if (repo.error) return "✗";
  if (repo.isDirty && repo.unpushedCount > 0) return "⬆●";
  if (repo.unpushedCount > 0) return "⬆";
  if (repo.isDirty) return "●";
  return "✓";
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function sortRepos(repos: RepoStatus[]): RepoStatus[] {
  return [...repos].sort((a, b) => {
    // Errors last
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;

    // Dirty/unpushed first
    const aNeedsAttention = (a.isDirty || a.unpushedCount > 0) ? 1 : 0;
    const bNeedsAttention = (b.isDirty || b.unpushedCount > 0) ? 1 : 0;
    if (aNeedsAttention !== bNeedsAttention) return bNeedsAttention - aNeedsAttention;

    // Then by last commit date (most recent first)
    return b.lastCommitDate.getTime() - a.lastCommitDate.getTime();
  });
}
