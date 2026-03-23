import { execFile } from "child_process";
import { promisify } from "util";
import { chmod } from "fs/promises";
import path from "path";
import { environment } from "@raycast/api";
import type { ScanResult } from "./types";

const execFileAsync = promisify(execFile);

function getHelperPath(): string {
  return path.join(environment.assetsPath, "status-menu-helper");
}

export async function scanMenuBarItems(): Promise<ScanResult> {
  const helperPath = getHelperPath();

  // Ensure the binary is executable (Raycast build may strip permissions)
  try {
    await chmod(helperPath, 0o755);
  } catch {
    // Ignore — might already be executable
  }

  try {
    const { stdout, stderr } = await execFileAsync(helperPath, ["scan"], {
      timeout: 10_000,
      maxBuffer: 5 * 1024 * 1024,
    });

    if (stderr) {
      console.error("status-menu-helper stderr:", stderr);
    }

    return JSON.parse(stdout) as ScanResult;
  } catch (error: unknown) {
    // Extract useful error info from execFile failure
    const err = error as Error & { stderr?: string; code?: number; killed?: boolean; signal?: string };

    // Check for accessibility permission errors in stderr
    if (err.stderr?.includes("assistive") || err.stderr?.includes("accessibility")) {
      return { permitted: false, items: [] };
    }

    // Provide actionable error message
    const details = [
      err.message,
      err.stderr ? `stderr: ${err.stderr}` : null,
      err.code !== undefined ? `exit code: ${err.code}` : null,
      err.signal ? `signal: ${err.signal}` : null,
      err.killed ? "process was killed (timeout?)" : null,
    ]
      .filter(Boolean)
      .join("; ");

    throw new Error(`Swift helper failed: ${details}`);
  }
}
