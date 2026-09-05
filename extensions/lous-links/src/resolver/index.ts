/**
 * Front-window link resolver.
 *
 * PROVENANCE: this directory is a vendored copy of the resolver from
 * ~/code/raycast/extensions/universal-copy-link (2026-09-04, sai-mx3). Raycast
 * extensions are separate build roots and cannot import across directories.
 * Upstream stays canonical: fix app handlers there, then re-copy.
 *
 * This file is the only original code in the directory — it wraps the copied
 * router/strategies into the one call this extension needs.
 */
import { getFrontApp, getHandler } from "./router";
import { executeStrategy } from "./strategies";
import { accessibilityStrategy } from "./strategies/accessibility";
import type { LinkResult } from "./types";

export interface FrontLink extends LinkResult {
  appName: string;
}

/**
 * Resolve title + URL for whatever is frontmost. Never throws: a failure to
 * resolve is an empty `url`, which callers treat as "fall back to clipboard".
 */
export async function resolveFrontLink(): Promise<FrontLink> {
  let appName = "";
  try {
    const frontApp = await getFrontApp();
    appName = frontApp.name;

    const handler = getHandler(frontApp.bundleId);
    let result: LinkResult;
    if (handler) {
      try {
        result = await executeStrategy(
          handler,
          frontApp.bundleId,
          frontApp.name,
        );
      } catch {
        result = await accessibilityStrategy(frontApp.name);
      }
    } else {
      result = await accessibilityStrategy(frontApp.name);
    }

    return {
      title: (result.title ?? "").trim(),
      url: (result.url ?? "").trim(),
      appName,
    };
  } catch {
    return { title: "", url: "", appName };
  }
}
