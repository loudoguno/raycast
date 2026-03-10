import { runAppleScript } from "@raycast/utils";

/**
 * Execute a JXA (JavaScript for Automation) script against OmniFocus.
 * Wraps the script in an IIFE and parses the JSON result.
 */
export async function executeScript<T = unknown>(source: string): Promise<T> {
  const result = await runAppleScript(`(function(){${source}})()`, {
    humanReadableOutput: true,
    language: "JavaScript",
    timeout: 20_000,
  });
  return JSON.parse(result) as T;
}
