import { showHUD } from "@raycast/api";
import { getFrontApp, getHandler } from "./router";
import { executeStrategy } from "./strategies";
import { accessibilityStrategy } from "./strategies/accessibility";
import { writeMultiFormatClipboard, type LinkResult } from "./clipboard";
import { isTerminalApp, getClaudeSessionLink } from "./claude-session";

export default async function Command() {
  try {
    // Step 1: Get front app BEFORE any UI (JXA runs synchronously-ish)
    const frontApp = await getFrontApp();

    // Step 2: If terminal app, try Claude Code session linking first
    if (isTerminalApp(frontApp.bundleId)) {
      const sessionLink = await tryClaudeSession(frontApp.bundleId);
      if (sessionLink) {
        await writeMultiFormatClipboard(sessionLink);
        await showHUD(`📋 ${sessionLink.title}`);
        return;
      }
    }

    // Step 3: Look up handler in registry
    const handler = getHandler(frontApp.bundleId);

    let result: LinkResult;

    if (handler) {
      // Step 4a: Execute registered handler
      try {
        result = await executeStrategy(
          handler,
          frontApp.bundleId,
          frontApp.name,
        );
      } catch {
        // Handler failed — fall through to accessibility
        result = await accessibilityStrategy(frontApp.name);
      }
    } else {
      // Step 4b: No handler registered — use accessibility fallback
      result = await accessibilityStrategy(frontApp.name);
    }

    // Step 5: Validate we got something useful
    if (!result.title && !result.url) {
      await showHUD(`⚠️ No link available for ${frontApp.name}`);
      return;
    }

    // Step 6: Write to clipboard + show HUD
    await writeMultiFormatClipboard(result);

    const display =
      result.title.length > 50
        ? result.title.substring(0, 47) + "..."
        : result.title;
    await showHUD(`📋 ${display}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await showHUD(`❌ Copy Link failed: ${message}`);
  }
}

/**
 * Attempt to get a Claude Code session link from a terminal.
 * First gets the window title via accessibility, then checks for an active session.
 */
async function tryClaudeSession(bundleId: string): Promise<LinkResult | null> {
  try {
    // Get window title from the terminal
    const axResult = await accessibilityStrategy(bundleId);
    if (!axResult.title) return null;

    return await getClaudeSessionLink(axResult.title);
  } catch {
    return null;
  }
}
