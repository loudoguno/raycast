/**
 * PROVENANCE: copied verbatim (imports retargeted only) from
 * ~/code/raycast/extensions/universal-copy-link/src on 2026-09-04 by sai-mx3.
 * Raycast extensions are separate build roots and cannot import across
 * directories, so the front-window resolver is vendored here.
 * Upstream is canonical — fix bugs there first, then re-copy.
 */
import { runAppleScript } from "@raycast/utils";
import type { LinkResult } from "../types";

/**
 * Menu command strategy — simulates clicking a menu item (e.g., "Share → Copy Link"),
 * waits for the clipboard to update, then reads the URL from clipboard.
 * Title comes from the window title or accessibility attributes.
 */
export async function menuCommandStrategy(
  appName: string,
  menuPath: string[],
  titleSource: "windowTitle" | "clipboard",
  delay = 300,
): Promise<LinkResult> {
  // Build the nested menu click AppleScript
  // For paths like ["Share", "Copy Link"], we need:
  //   click menu item "Copy Link" of menu 1 of menu item "Share" of menu 1 of menu bar item "Share" of menu bar 1
  let clickPath: string;
  if (menuPath.length === 1) {
    clickPath = `click menu item "${menuPath[0]}" of menu 1 of menu bar item "${menuPath[0]}" of menu bar 1`;
  } else {
    // Build nested path from innermost to outermost
    const parts = [...menuPath];
    const topMenu = parts.shift()!;
    let path = `menu bar item "${topMenu}" of menu bar 1`;
    path = `menu 1 of ${path}`;

    for (let i = 0; i < parts.length - 1; i++) {
      path = `menu item "${parts[i]}" of ${path}`;
      path = `menu 1 of ${path}`;
    }
    clickPath = `click menu item "${parts[parts.length - 1]}" of ${path}`;
  }

  const delaySeconds = delay / 1000;

  const result = await runAppleScript(
    `
    -- Save current clipboard
    set oldClip to the clipboard

    tell application "System Events"
      tell process "${appName}"
        ${clickPath}
      end tell
    end tell

    delay ${delaySeconds}

    -- Read new clipboard content (should be the URL)
    set newClip to the clipboard

    -- Get window title
    set winTitle to ""
    tell application "System Events"
      tell process "${appName}"
        try
          set winTitle to name of front window
        end try
      end tell
    end tell

    return winTitle & "|||" & newClip
    `,
    { humanReadableOutput: true },
  );

  const [rawTitle, rawUrl] = result.split("|||");
  const title = (rawTitle ?? appName).trim();
  const url = (rawUrl ?? "").trim();

  if (titleSource === "clipboard") {
    // The clipboard content is the URL; title from window
    return { title, url };
  }

  return { title, url };
}
