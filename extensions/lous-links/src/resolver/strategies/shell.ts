/**
 * PROVENANCE: copied verbatim (imports retargeted only) from
 * ~/code/raycast/extensions/universal-copy-link/src on 2026-09-04 by sai-mx3.
 * Raycast extensions are separate build roots and cannot import across
 * directories, so the front-window resolver is vendored here.
 * Upstream is canonical — fix bugs there first, then re-copy.
 */
import { execSync } from "child_process";
import type { LinkResult } from "../types";

/**
 * Shell strategy — runs a shell command that outputs JSON {"title":"...", "url":"..."}.
 */
export async function shellStrategy(command: string): Promise<LinkResult> {
  const output = execSync(command, {
    encoding: "utf-8",
    timeout: 5000,
  }).trim();

  try {
    const parsed = JSON.parse(output) as { title?: string; url?: string };
    return {
      title: parsed.title ?? "",
      url: parsed.url ?? "",
    };
  } catch {
    // If not JSON, try title|||url format
    if (output.includes("|||")) {
      const [title, url] = output.split("|||");
      return { title: title ?? "", url: url ?? "" };
    }
    return { title: output, url: "" };
  }
}
