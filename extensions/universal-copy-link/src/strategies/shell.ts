import { execSync } from "child_process";
import type { LinkResult } from "../clipboard";

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
