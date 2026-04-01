import { execSync, exec } from "child_process";
import { homedir } from "os";
import path from "path";
import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  claudeCodePath?: string;
}

/**
 * Expand ~ to home directory in a path string.
 */
export function expandTilde(p: string): string {
  if (p.startsWith("~/") || p === "~") {
    return path.join(homedir(), p.slice(1));
  }
  return p;
}

/**
 * Shorten home directory to ~ for display.
 */
export function shortenPath(p: string): string {
  const home = homedir();
  if (p.startsWith(home)) {
    return "~" + p.slice(home.length);
  }
  return p;
}

/**
 * Get the display name for a project path.
 * Shows basename, with parent dir for disambiguation when needed.
 */
export function projectName(projectPath: string): string {
  const expanded = expandTilde(projectPath);
  if (expanded === homedir()) return "~";
  return path.basename(expanded);
}

/**
 * Find the claude CLI binary path.
 */
export function findClaudePath(): string | null {
  const prefs = getPreferenceValues<Preferences>();
  if (prefs.claudeCodePath) {
    return prefs.claudeCodePath;
  }

  const candidates = [
    path.join(homedir(), ".claude/local/claude"),
    "/usr/local/bin/claude",
    "/opt/homebrew/bin/claude",
  ];

  for (const c of candidates) {
    try {
      execSync(`test -x "${c}"`, { stdio: "ignore" });
      return c;
    } catch {
      // not found
    }
  }

  try {
    const result = execSync(
      "which claude 2>/dev/null || command -v claude 2>/dev/null",
      {
        encoding: "utf-8",
        env: {
          ...process.env,
          PATH: `${process.env.PATH}:/usr/local/bin:/opt/homebrew/bin:${homedir()}/.claude/local`,
        },
      },
    ).trim();
    if (result) return result;
  } catch {
    // not found
  }

  return null;
}

/**
 * Run a shell command and return stdout. Shared by all commands.
 */
export function runCmd(cmd: string, timeout = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      cmd,
      {
        timeout,
        maxBuffer: 5 * 1024 * 1024,
        env: {
          ...process.env,
          PATH: `${process.env.PATH}:/usr/local/bin:/opt/homebrew/bin`,
        },
      },
      (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout.trim());
      },
    );
  });
}
