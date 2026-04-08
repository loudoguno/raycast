import { showHUD, showToast, Toast } from "@raycast/api";
import { spawnSync } from "child_process";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { homedir } from "os";

const LOUTOOLS_PATH = "/usr/local/bin/loutools";
const DISABLED_FLAG = `${homedir()}/.loutools_disabled`;

/**
 * Returns true if the user has set the remote to "Disabled" mode.
 * Uses a flag file so the check is synchronous (no async complications).
 */
export function isDisabled(): boolean {
  return existsSync(DISABLED_FLAG);
}

/**
 * Set or clear the disabled flag.
 */
export function setDisabled(disabled: boolean): void {
  if (disabled) {
    writeFileSync(DISABLED_FLAG, "1");
  } else {
    try {
      unlinkSync(DISABLED_FLAG);
    } catch {
      // already gone — fine
    }
  }
}

/**
 * Run a loutools remote command and show HUD feedback.
 *
 * Only shows failure if stdout explicitly contains "Error:" — the CLI's
 * error format. Ignores exit codes entirely since AppleScript NSLog
 * warnings can cause non-zero exits even when the command worked.
 */
export async function runRemote(args: string[], hudMessage: string): Promise<void> {
  if (isDisabled()) {
    return; // silent no-op — remote is disabled, shortcut does nothing
  }

  const result = spawnSync(LOUTOOLS_PATH, ["remote", ...args], {
    encoding: "utf-8",
    timeout: 5000,
  });

  const stdout = (result.stdout || "").trim();

  // Only treat as failure if the CLI explicitly printed an error
  if (stdout.startsWith("Error:")) {
    const reason = stdout.replace(/^Error:\s*/, "");
    await showToast({ style: Toast.Style.Failure, title: reason });
    return;
  }

  await showHUD(hudMessage);
}

/**
 * Run `loutools remote status` and return parsed JSON.
 */
export function getStatus(): MediaStatus | null {
  try {
    const result = spawnSync(LOUTOOLS_PATH, ["remote", "status"], {
      encoding: "utf-8",
      timeout: 5000,
    });
    const stdout = (result.stdout || "").trim();
    if (!stdout || !stdout.startsWith("{")) return null;
    return JSON.parse(stdout) as MediaStatus;
  } catch {
    return null;
  }
}

export interface MediaStatus {
  app: string;
  title: string | null;
  position: number | null;
  duration: number | null;
  isPlaying: boolean;
  speed: number | null;
  volume: number | null;
}

/**
 * Format seconds as m:ss or h:mm:ss.
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ss = s.toString().padStart(2, "0");
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}
