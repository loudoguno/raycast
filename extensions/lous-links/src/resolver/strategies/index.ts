/**
 * PROVENANCE: copied verbatim (imports retargeted only) from
 * ~/code/raycast/extensions/universal-copy-link/src on 2026-09-04 by sai-mx3.
 * Raycast extensions are separate build roots and cannot import across
 * directories, so the front-window resolver is vendored here.
 * Upstream is canonical — fix bugs there first, then re-copy.
 */
import type { LinkResult } from "../types";
import type { HandlerConfig } from "../handlers";
import { browserStrategy } from "./browser";
import { applescriptStrategy } from "./applescript";
import { accessibilityStrategy } from "./accessibility";
import { menuCommandStrategy } from "./menu-command";
import { shellStrategy } from "./shell";

/**
 * Execute the appropriate strategy for a handler config.
 * Returns a LinkResult with title and url.
 */
export async function executeStrategy(
  config: HandlerConfig,
  bundleId: string,
  appName: string,
): Promise<LinkResult> {
  switch (config.strategy) {
    case "browser":
      return browserStrategy(bundleId, appName, config.tabAccessor);

    case "applescript":
      return applescriptStrategy(config.script);

    case "accessibility":
      return accessibilityStrategy(appName);

    case "menu-command":
      return menuCommandStrategy(
        appName,
        config.menuPath,
        config.titleSource,
        config.delay,
      );

    case "shell":
      return shellStrategy(config.command);

    default:
      return accessibilityStrategy(appName);
  }
}
