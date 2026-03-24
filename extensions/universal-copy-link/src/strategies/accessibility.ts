import { runAppleScript } from "@raycast/utils";
import type { LinkResult } from "../clipboard";

/**
 * Accessibility strategy — reads AXTitle and AXDocument from the frontmost window
 * via System Events. This is the global fallback for apps without specific handlers.
 *
 * Fallback chain:
 * 1. AXTitle + AXDocument (full link)
 * 2. AXTitle + file path from AXDocument
 * 3. AXTitle only (no URL)
 * 4. Empty (caller handles error)
 */
export async function accessibilityStrategy(
  appName: string,
): Promise<LinkResult> {
  const result = await runAppleScript(
    `
    tell application "System Events"
      set frontProc to first process whose frontmost is true
      set procName to name of frontProc
      try
        set frontWin to front window of frontProc
        set winTitle to name of frontWin
      on error
        set winTitle to ""
      end try

      -- Try to get AXDocument attribute
      set docURL to ""
      try
        set docURL to value of attribute "AXDocument" of frontWin
      end try

      return winTitle & "|||" & docURL
    end tell
    `,
    { humanReadableOutput: true },
  );

  const [rawTitle, rawUrl] = result.split("|||");
  const title = (rawTitle ?? "").trim();
  const url = (rawUrl ?? "").trim();

  // If we got a file:// URL from AXDocument, use it
  if (url && url.startsWith("file://")) {
    return { title: title || appName, url };
  }

  // If we got any URL from AXDocument, use it
  if (url && (url.startsWith("http") || url.includes("://"))) {
    return { title: title || appName, url };
  }

  // Title only — still useful for pasting
  if (title) {
    return { title, url: "" };
  }

  // Nothing found
  return { title: appName, url: "" };
}
