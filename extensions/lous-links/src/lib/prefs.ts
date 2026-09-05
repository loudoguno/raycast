/**
 * Raycast preferences → ApiConfig. Kept separate from lib/api.ts so the API
 * client stays free of @raycast/api and can run under bun in cli/ll.ts.
 */
import { getPreferenceValues } from "@raycast/api";
import { DEFAULT_BASE_URL, type ApiConfig } from "./api";

export const DEFAULT_REPO_PATH = "~/code/raycast";

export interface LousLinksPreferences {
  baseUrl: string;
  token: string;
  defaultTags?: string;
  /** Checkout that holds sessions/collect.ts, for the Rebuild Index action. */
  repoPath: string;
}

export function getPrefs(): LousLinksPreferences {
  const prefs = getPreferenceValues<LousLinksPreferences>();
  return {
    baseUrl: (prefs.baseUrl || DEFAULT_BASE_URL).trim(),
    token: (prefs.token || "").trim(),
    defaultTags: (prefs.defaultTags || "").trim() || undefined,
    repoPath: (prefs.repoPath || DEFAULT_REPO_PATH).trim(),
  };
}

export function getConfig(prefs = getPrefs()): ApiConfig {
  return { baseUrl: prefs.baseUrl, token: prefs.token };
}

/** The human-facing URL for a link, for "Open in lous-links web". */
export function webUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "") || DEFAULT_BASE_URL;
}
