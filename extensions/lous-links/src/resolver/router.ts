/**
 * PROVENANCE: copied verbatim (imports retargeted only) from
 * ~/code/raycast/extensions/universal-copy-link/src on 2026-09-04 by sai-mx3.
 * Raycast extensions are separate build roots and cannot import across
 * directories, so the front-window resolver is vendored here.
 * Upstream is canonical — fix bugs there first, then re-copy.
 */
import { runAppleScript } from "@raycast/utils";
import { resolveAlias } from "./aliases";
import { handlers, type HandlerConfig } from "./handlers";

export interface FrontApp {
  bundleId: string;
  name: string;
}

/**
 * Get the frontmost application's bundle ID and name via JXA.
 * Uses NSWorkspace which is fast and doesn't require accessibility permissions.
 */
export async function getFrontApp(): Promise<FrontApp> {
  const result = await runAppleScript(
    `
    use framework "AppKit"
    set frontApp to current application's NSWorkspace's sharedWorkspace()'s frontmostApplication()
    set bid to frontApp's bundleIdentifier() as text
    set appName to frontApp's localizedName() as text
    return bid & "|||" & appName
    `,
    { humanReadableOutput: true },
  );

  const [bundleId, name] = result.split("|||");
  return { bundleId: bundleId ?? "", name: name ?? "" };
}

/**
 * Look up the handler config for a given bundle ID.
 * Resolves aliases first, then checks the handler registry.
 */
export function getHandler(bundleId: string): HandlerConfig | undefined {
  const canonical = resolveAlias(bundleId);
  return handlers[canonical];
}
