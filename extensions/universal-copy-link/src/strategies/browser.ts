import { runAppleScript } from "@raycast/utils";
import type { LinkResult } from "../clipboard";

export type TabAccessor = "currentTab" | "activeTab";

/**
 * Browser strategy — queries browser app for current/active tab title and URL.
 * Safari and Kagi use `currentTab`, Chrome-based browsers use `activeTab`.
 */
export async function browserStrategy(
  bundleId: string,
  appName: string,
  tabAccessor: TabAccessor,
): Promise<LinkResult> {
  // Firefox uses a different scripting model
  if (bundleId === "org.mozilla.firefox") {
    return firefoxStrategy();
  }

  const accessor = tabAccessor === "currentTab" ? "current tab" : "active tab";

  const result = await runAppleScript(
    `
    tell application id "${bundleId}"
      set t to ${accessor} of front window
      set tabTitle to title of t
      set tabURL to URL of t
      return tabTitle & "|||" & tabURL
    end tell
    `,
    { humanReadableOutput: true },
  );

  const [title, url] = result.split("|||");
  return { title: title ?? appName, url: url ?? "" };
}

async function firefoxStrategy(): Promise<LinkResult> {
  // Firefox doesn't expose tabs the same way — use UI scripting
  const result = await runAppleScript(
    `
    tell application "Firefox"
      activate
      delay 0.1
    end tell
    tell application "System Events"
      tell process "Firefox"
        set windowTitle to name of front window
        -- Firefox window title format: "Page Title — Mozilla Firefox" or "Page Title - Mozilla Firefox"
      end tell
    end tell
    tell application "Firefox"
      set tabURL to URL of active tab of front window
    end tell
    return windowTitle & "|||" & tabURL
    `,
    { humanReadableOutput: true },
  );

  const [rawTitle, url] = result.split("|||");
  // Strip " — Mozilla Firefox" or " - Mozilla Firefox" suffix
  const title = (rawTitle ?? "")
    .replace(/\s*[—–-]\s*Mozilla Firefox\s*$/i, "")
    .trim();
  return { title: title || "Firefox", url: url ?? "" };
}
