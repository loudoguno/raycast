import { execSync } from "child_process";
import type { BeadIssue, BeadStatusSummary } from "./types";

const BD_PATH = "/opt/homebrew/bin/bd";
const EXEC_TIMEOUT = 10_000; // 10 seconds max per command

/**
 * Execute a bd command and return parsed JSON output.
 *
 * All beads interaction goes through this single function — we never
 * touch the database directly. The bd CLI handles Dolt server connections,
 * JSONL syncing, and git operations transparently.
 *
 * @param args - Command arguments (e.g., ["list", "--status", "open"])
 * @param cwd - Project directory to run from (bd auto-discovers .beads/)
 */
export function bdCommand<T>(args: string[], cwd: string): T {
  const command = `${BD_PATH} ${args.map(shellEscape).join(" ")} --json`;
  try {
    const output = execSync(command, {
      cwd,
      timeout: EXEC_TIMEOUT,
      encoding: "utf-8",
      // Suppress stderr noise from bd (warnings, progress indicators)
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NO_COLOR: "1" },
    });
    return JSON.parse(output.trim()) as T;
  } catch (error) {
    const err = error as { stderr?: string; message?: string; status?: number };
    const stderr = err.stderr || err.message || "Unknown error";

    // Check for common beads failure modes
    if (stderr.includes("database") && stderr.includes("not found")) {
      throw new BeadsError(
        "Database not found — the Dolt server may need restarting. Try: bd doctor --fix",
        "db_not_found",
      );
    }
    if (stderr.includes("no issues found") || stderr.includes("no results")) {
      return [] as unknown as T;
    }
    throw new BeadsError(stderr.trim(), "command_failed");
  }
}

/**
 * Execute a bd write command (create, update, close) without expecting JSON output.
 * Returns the raw stdout text (which usually contains the new issue ID or confirmation).
 */
export function bdMutate(args: string[], cwd: string): string {
  const command = `${BD_PATH} ${args.map(shellEscape).join(" ")}`;
  try {
    return execSync(command, {
      cwd,
      timeout: EXEC_TIMEOUT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NO_COLOR: "1" },
    }).trim();
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    throw new BeadsError(
      err.stderr || err.message || "Command failed",
      "mutation_failed",
    );
  }
}

/** Check if bd CLI is installed and accessible */
export function isBdInstalled(): boolean {
  try {
    execSync(`${BD_PATH} --version`, {
      timeout: 5000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/** Get bd version string */
export function getBdVersion(): string {
  try {
    return execSync(`${BD_PATH} --version`, {
      timeout: 5000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "unknown";
  }
}

/** Check if a project's beads database is healthy */
export function isProjectHealthy(projectPath: string): {
  healthy: boolean;
  error?: string;
} {
  try {
    bdCommand<BeadStatusSummary>(["status"], projectPath);
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof BeadsError ? error.message : "Unknown error",
    };
  }
}

// ── Convenience wrappers ──────────────────────────────────────

/** List issues with optional filters */
export function listIssues(
  cwd: string,
  opts?: { status?: string; priority?: string; type?: string },
): BeadIssue[] {
  const args = ["list"];
  if (opts?.status) args.push("--status", opts.status);
  if (opts?.priority) args.push("--priority", opts.priority);
  if (opts?.type) args.push("--type", opts.type);
  return bdCommand<BeadIssue[]>(args, cwd);
}

/** Get ready (unblocked) issues */
export function readyIssues(cwd: string): BeadIssue[] {
  return bdCommand<BeadIssue[]>(["ready"], cwd);
}

/** Get blocked issues */
export function blockedIssues(cwd: string): BeadIssue[] {
  return bdCommand<BeadIssue[]>(["blocked"], cwd);
}

/** Get project status summary */
export function statusSummary(cwd: string): BeadStatusSummary {
  return bdCommand<BeadStatusSummary>(["status"], cwd);
}

/** Show a single issue's full details */
export function showIssue(cwd: string, issueId: string): BeadIssue {
  const result = bdCommand<BeadIssue[]>(["show", issueId], cwd);
  // bd show --json returns an array with one element
  return Array.isArray(result) ? result[0] : result;
}

/** Search issues by text */
export function searchIssues(cwd: string, query: string): BeadIssue[] {
  return bdCommand<BeadIssue[]>(["search", query], cwd);
}

/** Create a new issue, returns the raw output (contains new ID) */
export function createIssue(
  cwd: string,
  title: string,
  opts?: {
    type?: string;
    priority?: number;
    description?: string;
    labels?: string;
    parent?: string;
  },
): string {
  const args = ["create", title];
  if (opts?.type) args.push("--type", opts.type);
  if (opts?.priority !== undefined)
    args.push("--priority", String(opts.priority));
  if (opts?.description) args.push("--description", opts.description);
  if (opts?.labels) args.push("--labels", opts.labels);
  if (opts?.parent) args.push("--parent", opts.parent);
  return bdMutate(args, cwd);
}

/** Claim an issue (set status to in_progress with current user) */
export function claimIssue(cwd: string, issueId: string): string {
  return bdMutate(["update", issueId, "--claim"], cwd);
}

/** Close an issue */
export function closeIssue(
  cwd: string,
  issueId: string,
  reason?: string,
): string {
  const args = ["close", issueId];
  if (reason) args.push("--reason", reason);
  return bdMutate(args, cwd);
}

/** Add a comment to an issue */
export function addComment(cwd: string, issueId: string, text: string): string {
  return bdMutate(["comments", issueId, "--add", text], cwd);
}

// ── Error class ───────────────────────────────────────────────

export class BeadsError extends Error {
  constructor(
    message: string,
    public code:
      | "db_not_found"
      | "command_failed"
      | "mutation_failed"
      | "not_installed",
  ) {
    super(message);
    this.name = "BeadsError";
  }
}

// ── Helpers ───────────────────────────────────────────────────

/** Escape a string for safe shell use */
function shellEscape(arg: string): string {
  // If it's a simple arg (letters, numbers, hyphens, underscores, dots, slashes), pass through
  if (/^[a-zA-Z0-9._\-/=]+$/.test(arg)) return arg;
  // Otherwise, single-quote it with proper escaping
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
