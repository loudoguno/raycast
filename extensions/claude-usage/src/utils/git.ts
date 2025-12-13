import { exec } from "child_process";
import { promisify } from "util";
import { access } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

export interface GitStatus {
  isGitRepo: boolean;
  hasGitHubRemote: boolean;
  remoteName?: string; // e.g., "origin"
  remoteUrl?: string; // e.g., "git@github.com:user/repo.git"
}

/**
 * Check if a directory is a git repository and if it has a GitHub remote
 */
export async function checkGitStatus(projectPath: string): Promise<GitStatus> {
  const result: GitStatus = {
    isGitRepo: false,
    hasGitHubRemote: false,
  };

  try {
    // Check if .git directory exists
    const gitDir = join(projectPath, ".git");
    await access(gitDir);
    result.isGitRepo = true;

    // Check for GitHub remote
    try {
      const { stdout } = await execAsync("git remote -v", {
        cwd: projectPath,
        timeout: 5000,
      });

      const remotes = stdout.trim().split("\n");
      for (const remote of remotes) {
        if (remote.includes("github.com")) {
          result.hasGitHubRemote = true;
          const match = remote.match(/^(\S+)\s+(\S+)/);
          if (match) {
            result.remoteName = match[1];
            result.remoteUrl = match[2];
          }
          break;
        }
      }
    } catch {
      // Git command failed, but directory exists - still a git repo
    }
  } catch {
    // .git directory doesn't exist
  }

  return result;
}

/**
 * Get git status indicator symbol
 * ⑃ = git initialized
 * ⑃☁️ = published to GitHub
 */
export function getGitStatusSymbol(status: GitStatus): string {
  if (status.hasGitHubRemote) {
    return "⑃☁️";
  }
  if (status.isGitRepo) {
    return "⑃";
  }
  return "";
}

/**
 * Get git status label for display
 */
export function getGitStatusLabel(status: GitStatus): string {
  if (status.hasGitHubRemote) {
    return "Git + GitHub";
  }
  if (status.isGitRepo) {
    return "Git (local only)";
  }
  return "No version control";
}
