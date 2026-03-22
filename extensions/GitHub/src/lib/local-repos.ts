import { execSync } from "child_process";
import { existsSync } from "fs";
import { getPreferenceValues } from "@raycast/api";
import type { LocalRepoInfo, Preferences } from "./types";

function expandHome(p: string): string {
  if (p.startsWith("~/")) {
    return p.replace("~", process.env.HOME ?? "/Users/" + process.env.USER);
  }
  return p;
}

function exec(cmd: string, cwd: string): string {
  try {
    return execSync(cmd, { cwd, timeout: 5000, encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

/**
 * Given a repo full name like "owner/repo-name", search local scan paths
 * for a directory that matches the repo name and contains a .git folder
 * with a remote pointing to the same GitHub repo.
 */
export function findLocalRepo(repoFullName: string): LocalRepoInfo | null {
  const { localScanPaths } = getPreferenceValues<Preferences>();
  if (!localScanPaths) return null;

  const repoName = repoFullName.split("/")[1];
  const paths = localScanPaths.split(",").map((p) => expandHome(p.trim()));

  for (const basePath of paths) {
    // Check direct match: basePath/repo-name
    const candidate = `${basePath}/${repoName}`;
    if (!existsSync(`${candidate}/.git`)) continue;

    // Verify the remote matches this GitHub repo
    const remotes = exec("git remote -v", candidate);
    const normalizedFullName = repoFullName.toLowerCase();
    if (!remotes.toLowerCase().includes(normalizedFullName)) continue;

    // It's a match — gather status
    const currentBranch =
      exec("git branch --show-current", candidate) || "HEAD";

    const statusOutput = exec("git status --porcelain", candidate);
    const hasUncommittedChanges = statusOutput.length > 0;

    // Fetch silently to compare with remote (best effort)
    exec("git fetch --quiet 2>/dev/null", candidate);

    let ahead = 0;
    let behind = 0;
    const tracking = exec("git rev-parse --abbrev-ref @{upstream}", candidate);
    if (tracking) {
      const aheadBehind = exec(
        `git rev-list --left-right --count HEAD...@{upstream}`,
        candidate,
      );
      const parts = aheadBehind.split(/\s+/);
      if (parts.length === 2) {
        ahead = parseInt(parts[0], 10) || 0;
        behind = parseInt(parts[1], 10) || 0;
      }
    }

    return {
      path: candidate,
      currentBranch,
      hasUncommittedChanges,
      ahead,
      behind,
    };
  }

  return null;
}
