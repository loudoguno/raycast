/**
 * lous-links API client — the single source of truth for talking to the Worker.
 *
 * Used by every Raycast command AND by cli/ll.ts, so it deliberately depends on
 * nothing but `fetch`. No @raycast/api import here: that is what lets the CLI
 * and `bun test` run it outside Raycast.
 *
 * The contract below was derived from the served client JS (evidence:
 * /tmp/ll/app.js, archived alongside the session evidence). Line refs are in
 * README.md. Auth: the Worker accepts a browser cookie OR `?t=<token>` on the
 * query string — the latter is the documented path for "the Shortcut / CLI /
 * agent", so every request here carries it.
 */

export const DEFAULT_BASE_URL =
  "https://lous-links.myoldkylakehouse.workers.dev";

/** A saved link, as the Worker returns it. Field names from app.js. */
export interface LousLink {
  /** Stable id; the `:h` path segment of /api/open|links/:h. app.js:42,116 */
  handle: string;
  url: string;
  title: string | null;
  note: string | null;
  /** Comma-separated, not an array. app.js:43 does `d.tags.split(",")`. */
  tags: string | null;
  /** Host, used for the glyph. app.js:42 */
  dom: string | null;
  /** Non-http scheme (raycast://, obsidian://…) when present. app.js:43 */
  scheme: string | null;
  /** 0/1 from the server; PATCH takes a boolean. app.js:76 */
  star: number | boolean;
  pin: number | boolean;
  hide: number | boolean;
  /** Epoch milliseconds — app.js:18 does `Date.now() - ts`. */
  created_at: number;
  open_count: number;
}

/** Fields the Worker is known to accept on PATCH /api/links/:h. app.js:76,112,115,123,124,125,128 */
export interface LinkPatch {
  title?: string;
  url?: string;
  note?: string;
  tags?: string;
  star?: boolean;
  pin?: boolean;
  hide?: boolean;
  created_at?: number;
}

/** What POST /api/save is proven to carry. app.js:132-135 */
export interface SaveInput {
  url: string;
  title?: string;
}

/** What a caller wants saved, including fields that need the PATCH follow-up. */
export interface SaveRequest extends SaveInput {
  note?: string;
  tags?: string;
}

export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<Response>;

export interface ApiConfig {
  baseUrl?: string;
  token: string;
  fetchImpl?: FetchLike;
}

export interface PreparedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export class MissingTokenError extends Error {}

/** Trailing slashes off; a base *path* (loudog.uno/links) is preserved. */
export function normalizeBaseUrl(baseUrl: string | undefined): string {
  const trimmed = (baseUrl ?? "").trim();
  const stripped = trimmed.replace(/\/+$/, "");
  return stripped || DEFAULT_BASE_URL;
}

/** Replace the token in a URL with `***`. Every log line goes through this. */
export function redactUrl(url: string): string {
  return url.replace(/([?&]t=)[^&]*/g, "$1***");
}

/**
 * Build (but do not send) a request. Exposed so `ll --dry-run` can print the
 * exact wire call without touching the network.
 */
export function prepareRequest(
  config: ApiConfig,
  method: string,
  path: string,
  body?: unknown,
): PreparedRequest {
  const token = (config.token ?? "").trim();
  if (!token) {
    throw new MissingTokenError(
      "No lous-links token. Set LOUS_LINKS_TOKEN, write ~/.config/lous-links/token, " +
        "or fill the Token preference in Raycast.",
    );
  }

  const sep = path.includes("?") ? "&" : "?";
  const url = `${normalizeBaseUrl(config.baseUrl)}${path}${sep}t=${encodeURIComponent(token)}`;

  const headers: Record<string, string> = { accept: "application/json" };
  const prepared: PreparedRequest = { method, url, headers };

  if (body !== undefined) {
    headers["content-type"] = "application/json";
    prepared.body = JSON.stringify(body);
  }
  return prepared;
}

/** Drop undefined/empty values so we never post `{"title": undefined}`. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out as Partial<T>;
}

export interface LousLinksClient {
  config: ApiConfig;
  prepare(method: string, path: string, body?: unknown): PreparedRequest;
  request(method: string, path: string, body?: unknown): Promise<Response>;
  list(): Promise<LousLink[]>;
  save(input: SaveInput): Promise<LousLink | null>;
  open(handle: string): Promise<void>;
  patch(handle: string, fields: LinkPatch): Promise<LousLink | null>;
  remove(handle: string): Promise<void>;
  feedback(text: string, context?: string): Promise<void>;
}

export function createClient(config: ApiConfig): LousLinksClient {
  const doFetch: FetchLike =
    config.fetchImpl ?? ((input, init) => fetch(input, init));

  const prepare = (method: string, path: string, body?: unknown) =>
    prepareRequest(config, method, path, body);

  async function request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response> {
    const req = prepare(method, path, body);
    const res = await doFetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
    if (!res.ok) {
      const detail = await res
        .text()
        .then((t) => t.slice(0, 300).trim())
        .catch(() => "");
      throw new Error(
        `lous-links ${res.status} on ${req.method} ${redactUrl(req.url)}` +
          (detail ? ` — ${detail}` : ""),
      );
    }
    return res;
  }

  async function json<T>(res: Response): Promise<T | null> {
    try {
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  return {
    config,
    prepare,
    request,
    async list() {
      const res = await request("GET", "/api/links");
      return (await json<LousLink[]>(res)) ?? [];
    },
    async save(input) {
      const res = await request(
        "POST",
        "/api/save",
        compact({ url: input.url, title: input.title }),
      );
      return json<LousLink>(res);
    },
    async open(handle) {
      await request("POST", `/api/open/${encodeURIComponent(handle)}`);
    },
    async patch(handle, fields) {
      const res = await request(
        "PATCH",
        `/api/links/${encodeURIComponent(handle)}`,
        fields,
      );
      return json<LousLink>(res);
    },
    async remove(handle) {
      await request("DELETE", `/api/links/${encodeURIComponent(handle)}`);
    },
    async feedback(text, context = "cli") {
      await request("POST", "/api/feedback", { text, context });
    },
  };
}

/**
 * Save a link, then reconcile note/tags.
 *
 * POST /api/save is only *proven* to carry url + title (app.js:132-135 builds
 * `{url}` or `{url,title}` and hands it straight to API.save). note and tags
 * are only proven on PATCH (app.js:123-125). So: save, resolve the handle, and
 * PATCH the rest. One request in the common case, two when there is metadata.
 */
export async function saveLink(
  client: LousLinksClient,
  input: SaveRequest,
): Promise<LousLink> {
  const created = await client.save({ url: input.url, title: input.title });

  let link: LousLink | null = created?.handle ? created : null;
  if (!link) {
    // The Worker did not hand back the row — find it by URL instead.
    const all = await client.list();
    link = all.find((l) => l.url === input.url) ?? null;
  }
  if (!link) {
    throw new Error(
      `Saved ${input.url} but could not resolve its handle to finish the save.`,
    );
  }

  const patch: LinkPatch = {};
  if (input.note && input.note !== link.note) patch.note = input.note;
  if (input.tags && input.tags !== link.tags) patch.tags = input.tags;

  if (Object.keys(patch).length > 0) {
    const updated = await client.patch(link.handle, patch);
    if (updated?.handle) link = updated;
    else link = { ...link, ...patch } as LousLink;
  }
  return link;
}

export interface ParsedLink {
  url: string;
  title?: string;
}

const MARKDOWN_LINK = /\[([^\]]+)\]\(\s*([a-z][a-z0-9+.-]*:\/\/[^\s)]+)\)/gi;
const BARE_LINK = /\b[a-z][a-z0-9+.-]*:\/\/[^\s)]+/gi;
const TRAILING_PUNCT = /[)\]}>,.'"]+$/;

/**
 * Pull links out of arbitrary text — markdown first (so titles survive), then
 * bare URLs of any scheme. Ported from app.js:131-134 so the extension, the CLI
 * and the web app all treat a pasted blob identically.
 */
export function parseLinks(text: string): ParsedLink[] {
  const out: ParsedLink[] = [];
  const seen = new Set<string>();
  if (!text) return out;

  const md = new RegExp(MARKDOWN_LINK.source, MARKDOWN_LINK.flags);
  let m: RegExpExecArray | null;
  while ((m = md.exec(text)) !== null) {
    const url = m[2].trim().replace(TRAILING_PUNCT, "");
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push({ url, title: m[1].trim() });
    }
  }

  const rest = text.replace(new RegExp(md.source, md.flags), " ");
  const bare = rest.match(new RegExp(BARE_LINK.source, BARE_LINK.flags)) ?? [];
  for (const raw of bare) {
    const url = raw.replace(TRAILING_PUNCT, "");
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push({ url });
    }
  }
  return out;
}

/** Best-effort display host, for list subtitles. */
export function hostOf(link: Pick<LousLink, "url" | "dom" | "scheme">): string {
  if (link.dom) return link.dom;
  if (link.scheme) return link.scheme;
  try {
    return new URL(link.url).host;
  } catch {
    return link.url.split("/")[0] ?? "";
  }
}

export function toMarkdown(link: Pick<LousLink, "url" | "title">): string {
  return `[${link.title || link.url}](${link.url})`;
}
