import { runAppleScript } from "@raycast/utils";
import type { LinkResult } from "../clipboard";
import { scripts } from "../scripts";

/**
 * AppleScript strategy — runs an inline AppleScript from the scripts registry.
 * Each script returns JSON: {"title":"...", "url":"..."}
 */
export async function applescriptStrategy(
  scriptName: string,
): Promise<LinkResult> {
  const script = scripts[scriptName];
  if (!script) {
    throw new Error(`AppleScript not found: ${scriptName}`);
  }

  const result = await runAppleScript(script, { humanReadableOutput: true });
  return parseScriptResult(result);
}

/**
 * Parse the JSON output from an AppleScript.
 * Handles both clean JSON and the common AppleScript quirk of
 * returning strings with smart quotes or extra whitespace.
 */
function parseScriptResult(raw: string): LinkResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { title: "", url: "" };
  }

  try {
    const parsed = JSON.parse(trimmed) as { title?: string; url?: string };
    return {
      title: parsed.title ?? "",
      url: parsed.url ?? "",
    };
  } catch {
    // If JSON parsing fails, try to extract title|||url format
    if (trimmed.includes("|||")) {
      const [title, url] = trimmed.split("|||");
      return { title: title ?? "", url: url ?? "" };
    }
    // Last resort: treat entire output as title
    return { title: trimmed, url: "" };
  }
}
