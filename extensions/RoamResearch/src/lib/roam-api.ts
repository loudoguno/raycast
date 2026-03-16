/**
 * High-level Roam API operations built on roam-client.
 *
 * Provides typed wrappers for common queries: search, recent edits,
 * back-references, and block detail fetching.
 */

import { Cache } from "@raycast/api";
import {
  createClient,
  q,
  search as rawSearch,
  createBlock,
  todayUid,
} from "./roam-client";
import type { GraphConfig, RoamBlock, SearchResult } from "./types";

// ---------------------------------------------------------------------------
// Pull pattern for rich block data
// ---------------------------------------------------------------------------

const BLOCK_PULL = `:block/string :node/title :block/uid :edit/time :create/time :block/order {:block/_refs [:block/uid :block/string :node/title {:block/_children [:block/uid :block/string :node/title]}]} {:block/_children [:block/uid :block/string :node/title {:block/_children ...}]} {:block/children [:block/uid :block/string :block/order {:block/children [:block/uid :block/string :block/order {:block/children [:block/uid :block/string :block/order]}]}]} {:block/refs [:block/uid :block/string :node/title]}`;

// ---------------------------------------------------------------------------
// Client helper
// ---------------------------------------------------------------------------

function client(graph: GraphConfig) {
  return createClient(graph.name, graph.token);
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** Search the graph — returns minimal results (uid + string/title) */
export async function searchGraph(
  graph: GraphConfig,
  query: string,
): Promise<SearchResult[]> {
  if (!query || !query.trim()) return [];
  const results = await rawSearch(client(graph), query.trim());
  return (results ?? []) as SearchResult[];
}

/** Fetch full block data for a list of UIDs */
export async function fetchBlocksByUids(
  graph: GraphConfig,
  uids: string[],
): Promise<RoamBlock[]> {
  if (uids.length === 0) return [];
  const results = await q(
    client(graph),
    `[:find [(pull ?e [${BLOCK_PULL}]) ...] :in $ [?uid ...] :where [?e :block/uid ?uid]]`,
    [uids],
  );
  return (results ?? []) as RoamBlock[];
}

// ---------------------------------------------------------------------------
// Recent edits
// ---------------------------------------------------------------------------

/** Fetch blocks edited in the last N hours, sorted by most recent first */
export async function fetchRecentEdits(
  graph: GraphConfig,
  hours: number = 48,
): Promise<RoamBlock[]> {
  const threshold = Date.now() - hours * 60 * 60 * 1000;
  const results = await q(
    client(graph),
    `[:find [(pull ?e [${BLOCK_PULL}]) ...] :in $ ?threshold :where [?e :edit/time ?t] [(> ?t ?threshold)] [?e :block/string]]`,
    [threshold],
  );
  const blocks = (results ?? []) as RoamBlock[];
  // Sort by edit time descending
  blocks.sort((a, b) => (b[":edit/time"] ?? 0) - (a[":edit/time"] ?? 0));
  // Limit to a reasonable number for the UI
  return blocks.slice(0, 50);
}

// ---------------------------------------------------------------------------
// Back-references
// ---------------------------------------------------------------------------

/** Get all blocks that reference a given block/page UID */
export async function fetchBackRefs(
  graph: GraphConfig,
  uid: string,
): Promise<RoamBlock[]> {
  const results = await q(
    client(graph),
    `[:find [(pull ?e [${BLOCK_PULL}]) ...] :where [?page :block/uid "${uid}"] [?e :block/refs ?page] [?e :block/string]]`,
  );
  return (results ?? []) as RoamBlock[];
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/** Append a block to today's daily note */
export async function appendToDailyNote(
  graph: GraphConfig,
  content: string,
): Promise<void> {
  await createBlock(client(graph), {
    location: {
      "page-title": { "daily-note-page": todayUid() },
      order: "last",
    },
    block: { string: content },
  });
}

/** Append a block to a specific page */
export async function appendToPage(
  graph: GraphConfig,
  pageUid: string,
  content: string,
): Promise<void> {
  await createBlock(client(graph), {
    location: {
      "parent-uid": pageUid,
      order: "last",
    },
    block: { string: content },
  });
}

// ---------------------------------------------------------------------------
// Page list (cached)
// ---------------------------------------------------------------------------

const pagesCache = new Cache({ namespace: "roam-pages" });
const PAGES_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

interface PagesCacheEntry {
  time: number;
  pages: Record<string, string>;
}

/** Get all pages in the graph (uid → title), cached for 2 hours */
export async function getAllPages(
  graph: GraphConfig,
): Promise<Record<string, string>> {
  const cached = pagesCache.get(graph.name);
  if (cached) {
    try {
      const entry: PagesCacheEntry = JSON.parse(cached);
      if (Date.now() - entry.time < PAGES_CACHE_TTL) {
        return entry.pages;
      }
    } catch {
      // Corrupted cache, fetch fresh
    }
  }

  const results = await q(
    client(graph),
    "[:find ?uid ?title :where [?id :node/title ?title] [?id :block/uid ?uid]]",
  );
  const pages: Record<string, string> = {};
  for (const [uid, title] of results as [string, string][]) {
    pages[uid] = title;
  }

  pagesCache.set(graph.name, JSON.stringify({ time: Date.now(), pages }));
  return pages;
}
