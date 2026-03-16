/**
 * Roam Research API client.
 *
 * Adapted from the official roam-api-sdk. We vendor a minimal client rather
 * than depending on the npm package because:
 *   1. The SDK has no TypeScript strict mode support
 *   2. We only need q(), pull(), search(), createBlock(), and batchActions()
 *   3. We need control over peer URL caching for performance
 */

import fetch from "cross-fetch";
import { Cache } from "@raycast/api";
import dayjs from "dayjs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoamBackendClient {
  graph: string;
  token: string;
  peerUrl: string | null;
}

interface BlockLocation {
  "parent-uid"?: string;
  "page-title"?: string | { "daily-note-page": string };
  order: "last" | "first" | number;
}

interface CreateBlockParams {
  location: BlockLocation;
  block: { string: string };
}

// ---------------------------------------------------------------------------
// Peer URL cache — avoids a redirect on every API call
// ---------------------------------------------------------------------------

const peerUrlCache = new Cache({ namespace: "roam-peer-urls" });

function getPeerUrl(graph: string): string | null {
  return peerUrlCache.get(graph) ?? null;
}

function setPeerUrl(graph: string, url: string): void {
  peerUrlCache.set(graph, url);
}

export function clearPeerUrl(graph: string): void {
  peerUrlCache.remove(graph);
}

// ---------------------------------------------------------------------------
// Client initialization
// ---------------------------------------------------------------------------

export function createClient(graph: string, token: string): RoamBackendClient {
  return {
    graph,
    token,
    peerUrl: getPeerUrl(graph),
  };
}

// ---------------------------------------------------------------------------
// HTTP layer
// ---------------------------------------------------------------------------

const API_BASE = "https://api.roamresearch.com";

async function apiRequest(
  client: RoamBackendClient,
  path: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const baseUrl = client.peerUrl ?? `${API_BASE}/api/graph/${client.graph}`;
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${client.token}`,
      "x-authorization": `Bearer ${client.token}`,
    },
    body: JSON.stringify(body),
    redirect: "manual",
  });

  // Handle redirect — Roam uses this to route to the correct peer
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location) {
      // Extract peer base URL (everything before the path)
      const redirectUrl = new URL(location);
      const peerBase = `${redirectUrl.protocol}//${redirectUrl.host}/api/graph/${client.graph}`;
      setPeerUrl(client.graph, peerBase);
      client.peerUrl = peerBase;

      // Retry with peer URL
      return apiRequest(client, path, body);
    }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Roam API ${response.status}: ${text || response.statusText}`,
    );
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Query operations
// ---------------------------------------------------------------------------

/** Execute a Datalog query against the graph */
export async function q(
  client: RoamBackendClient,
  query: string,
  args?: unknown[],
): Promise<unknown> {
  const body: Record<string, unknown> = { query };
  if (args) body.args = args;
  const result = await apiRequest(client, "/q", body);
  return (result as { result: unknown }).result;
}

/** Pull structured data for an entity */
export async function pull(
  client: RoamBackendClient,
  selector: string,
  eid: string | number,
): Promise<unknown> {
  const result = await apiRequest(client, "/pull", { selector, eid });
  return (result as { result: unknown }).result;
}

/** Full-text search across the graph */
export async function search(
  client: RoamBackendClient,
  query: string,
): Promise<unknown> {
  const result = await apiRequest(client, "/search", { "search-str": query });
  return (result as { result: unknown }).result;
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/** Create a new block */
export async function createBlock(
  client: RoamBackendClient,
  params: CreateBlockParams,
): Promise<unknown> {
  return apiRequest(client, "/write", {
    action: "create-block",
    ...params,
  });
}

/** Execute multiple write operations atomically */
export async function batchActions(
  client: RoamBackendClient,
  actions: Record<string, unknown>,
): Promise<unknown> {
  return apiRequest(client, "/write", actions);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Format a Date as Roam's daily note page title (e.g., "March 16th, 2026") */
export function dateToPageTitle(date: Date): string {
  return dayjs(date)
    .format("MMMM D, YYYY")
    .replace(/\d+/, (d) => {
      const n = parseInt(d);
      const suffix =
        [, "st", "nd", "rd"][((n % 100) >> 3) ^ 1 && n % 10] || "th";
      return `${n}${suffix}`;
    });
}

/** Format today's date as a Roam daily note UID (MM-DD-YYYY) */
export function todayUid(): string {
  return dayjs().format("MM-DD-YYYY");
}
