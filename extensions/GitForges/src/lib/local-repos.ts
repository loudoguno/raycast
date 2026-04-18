import { execSync } from "child_process";
import { existsSync } from "fs";
import { getPreferenceValues } from "@raycast/api";
import type { LocalRepoInfo, MergedRepo, Preferences } from "./types";

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
 * Look for a local clone of any of a merged repo's variants. Matches if a
 * candidate directory's git remotes mention any variant's host + full name.
 */
export function findLocalRepo(merged: MergedRepo): LocalRepoInfo | null {
  const { localScanPaths } = getPreferenceValues<Preferences>();
  if (!localScanPaths) return null;

  const paths = localScanPaths.split(",").map((p) => expandHome(p.trim()));
  const repoName = merged.displayName;

  // Build a list of remote-URL fragments any variant could appear under
  const remoteFragments: string[] = [];
  for (const v of merged.variants) {
    remoteFragments.push(v.fullName.toLowerCase());
    try {
      const host = new URL(v.htmlUrl).hostname.toLowerCase();
      remoteFragments.push(`${host}/${v.fullName.toLowerCase()}`);
      remoteFragments.push(`${host}:${v.fullName.toLowerCase()}`); // ssh form
    } catch {
      // ignore malformed urls
    }
  }

  for (const basePath of paths) {
    const candidate = `${basePath}/${repoName}`;
    if (!existsSync(`${candidate}/.git`)) continue;

    const remotes = exec("git remote -v", candidate).toLowerCase();
    if (!remoteFragments.some((f) => remotes.includes(f))) continue;

    const currentBranch =
      exec("git branch --show-current", candidate) || "HEAD";
    const statusOutput = exec("git status --porcelain", candidate);
    const hasUncommittedChanges = statusOutput.length > 0;

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
