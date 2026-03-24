import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { LinkResult } from "./clipboard";

const CLAUDE_PROJECTS_DIR = join(homedir(), ".claude", "projects");

const TERMINAL_BUNDLE_IDS = new Set([
  "com.mitchellh.ghostty",
  "com.apple.Terminal",
  "com.googlecode.iterm2",
]);

/**
 * Check if the front app is a terminal that might be running Claude Code.
 */
export function isTerminalApp(bundleId: string): boolean {
  return TERMINAL_BUNDLE_IDS.has(bundleId);
}

/**
 * Try to get a Claude Code session link from a terminal app.
 * Returns null if no active session is found.
 *
 * Algorithm:
 * 1. Get CWD from terminal window title
 * 2. Map CWD to project folder path
 * 3. Find most recently modified .jsonl session file
 * 4. Parse first line for bridge_status URL
 * 5. Search for /rename command for session name
 */
export async function getClaudeSessionLink(
  windowTitle: string,
): Promise<LinkResult | null> {
  // Try to extract CWD from window title
  // Ghostty typically shows: "user@host:~/path" or just "~/path" or "/absolute/path"
  const cwd = extractCwdFromTitle(windowTitle);
  if (!cwd) return null;

  // Map CWD to Claude project directory name
  const projectDirName = cwdToProjectDir(cwd);
  const projectPath = join(CLAUDE_PROJECTS_DIR, projectDirName);

  try {
    const entries = readdirSync(projectPath);
    const jsonlFiles = entries
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => ({
        name: f,
        path: join(projectPath, f),
        mtime: statSync(join(projectPath, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (jsonlFiles.length === 0) return null;

    // Read the most recent session file
    const sessionFile = jsonlFiles[0];
    const content = readFileSync(sessionFile.path, "utf-8");
    const lines = content.split("\n").filter(Boolean);

    if (lines.length === 0) return null;

    // Look for bridge_status URL in first few lines
    let sessionUrl = "";
    let sessionId = "";
    for (const line of lines.slice(0, 5)) {
      try {
        const entry = JSON.parse(line) as {
          type?: string;
          subtype?: string;
          url?: string;
          sessionId?: string;
        };
        if (entry.subtype === "bridge_status" && entry.url) {
          sessionUrl = entry.url;
          sessionId = entry.sessionId ?? "";
          break;
        }
      } catch {
        continue;
      }
    }

    // Look for session name from /rename command
    let sessionName = "";
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as {
          type?: string;
          subtype?: string;
          content?: string;
        };
        if (
          entry.subtype === "local_command" &&
          entry.content &&
          entry.content.includes("/rename")
        ) {
          // Extract rename value — format varies but typically:
          // "<command-name>/rename</command-name> New Session Name"
          const match = entry.content.match(
            /<command-name>\/rename<\/command-name>\s*(.+)/,
          );
          if (match) {
            sessionName = match[1].trim();
          }
        }
      } catch {
        continue;
      }
    }

    // Fallback title: use CWD basename
    if (!sessionName) {
      const parts = cwd.split("/");
      sessionName = parts[parts.length - 1] || "Claude Session";
    }

    // Construct the link
    if (sessionUrl) {
      return { title: sessionName, url: sessionUrl };
    }

    // Fallback: CLI resume command
    if (sessionId) {
      const shortId = sessionId.substring(0, 8);
      return { title: sessionName, url: `claude --resume ${shortId}` };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract a CWD path from a terminal window title.
 * Handles formats like:
 * - "~/code/project"
 * - "/Users/loudog/code/project"
 * - "user@host:~/code/project"
 * - "project — zsh" or "project — bash"
 */
function extractCwdFromTitle(title: string): string | null {
  if (!title) return null;

  // Try "user@host:path" format
  const colonMatch = title.match(/:\s*(~?\/.+?)(?:\s|$)/);
  if (colonMatch) {
    return expandTilde(colonMatch[1]);
  }

  // Try absolute path at start
  if (title.startsWith("/")) {
    const path = title.split(/\s/)[0];
    return path;
  }

  // Try tilde path at start
  if (title.startsWith("~")) {
    const path = title.split(/\s/)[0];
    return expandTilde(path);
  }

  // Try to find a path anywhere in the title
  const pathMatch = title.match(/(\/[\w/.-]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }

  return null;
}

function expandTilde(path: string): string {
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }
  return path;
}

/**
 * Convert a CWD path to Claude's project directory name.
 * /Users/loudog/code/project → -Users-loudog-code-project
 */
function cwdToProjectDir(cwd: string): string {
  return cwd.replace(/\//g, "-").replace(/^-/, "-");
}
