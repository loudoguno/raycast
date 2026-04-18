import { getPreferenceValues } from "@raycast/api";
import type { MergedRepo, Preferences, ProviderId, Repo } from "./types";

/**
 * Merge a flat list of repos from multiple providers into a unified list.
 * Same-named repos (case-insensitive on `name`) are grouped into one entry.
 *
 * The list is sorted by the most recent `pushedAt` across all variants of
 * each merged entry.
 */
export function mergeRepos(repos: Repo[]): MergedRepo[] {
  const groups = new Map<string, Repo[]>();
  for (const r of repos) {
    const key = r.name.toLowerCase();
    const existing = groups.get(key);
    if (existing) existing.push(r);
    else groups.set(key, [r]);
  }

  const merged: MergedRepo[] = [];
  for (const [key, variants] of groups) {
    // Sort variants so the "primary" appears first
    const sorted = sortVariants(variants);
    merged.push({
      key,
      displayName: sorted[0].name,
      variants: sorted,
    });
  }

  // Sort the entire list by most-recent push across all variants
  merged.sort((a, b) => {
    const aTime = new Date(a.variants[0].pushedAt).getTime();
    const bTime = new Date(b.variants[0].pushedAt).getTime();
    return bTime - aTime;
  });

  return merged;
}

/**
 * Sort variants so the "primary" comes first. The primary depends on the
 * user's `primaryProvider` preference.
 */
function sortVariants(variants: Repo[]): Repo[] {
  const { primaryProvider } = getPreferenceValues<Preferences>();
  return [...variants].sort((a, b) => {
    if (primaryProvider === "github" || primaryProvider === "forgejo") {
      if (a.provider === primaryProvider && b.provider !== primaryProvider)
        return -1;
      if (b.provider === primaryProvider && a.provider !== primaryProvider)
        return 1;
    }
    // Fall back to most-recently-pushed
    return new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime();
  });
}

export function variantFor(
  merged: MergedRepo,
  provider: ProviderId,
): Repo | undefined {
  return merged.variants.find((v) => v.provider === provider);
}

export function isOnProvider(
  merged: MergedRepo,
  provider: ProviderId,
): boolean {
  return merged.variants.some((v) => v.provider === provider);
}
