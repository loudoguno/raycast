import type { LinkResult } from "../clipboard";
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
