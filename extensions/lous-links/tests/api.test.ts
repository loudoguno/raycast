/**
 * Contract tests for the lous-links API client.
 *
 * Every assertion encodes something derived from the served client JS
 * (evidence: /tmp/ll/app.js — see README.md "API contract"). A local Bun.serve
 * mock stands in for the Worker so the suite is hermetic: no token, no network.
 */
import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import {
  createClient,
  prepareRequest,
  redactUrl,
  normalizeBaseUrl,
  parseLinks,
  saveLink,
  type LousLink,
} from "../src/lib/api";

interface Seen {
  method: string;
  path: string;
  query: Record<string, string>;
  body: unknown;
}

let server: ReturnType<typeof Bun.serve>;
let base: string;
const seen: Seen[] = [];

const SAMPLE: LousLink = {
  handle: "abc123",
  url: "https://example.com/a",
  title: "Example A",
  note: "a note",
  tags: "one,two",
  dom: "example.com",
  scheme: null,
  star: 0,
  pin: 0,
  hide: 0,
  created_at: 1757000000000,
  open_count: 3,
};

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    async fetch(req) {
      const u = new URL(req.url);
      let body: unknown = null;
      if (req.method === "POST" || req.method === "PATCH") {
        const text = await req.text();
        body = text ? JSON.parse(text) : null;
      }
      seen.push({
        method: req.method,
        path: u.pathname,
        query: Object.fromEntries(u.searchParams.entries()),
        body,
      });

      if (u.pathname === "/api/unauthorized") {
        return new Response("Unauthorized.", { status: 401 });
      }
      if (u.pathname === "/api/links") {
        return Response.json([SAMPLE]);
      }
      if (u.pathname === "/api/save") {
        const b = body as { url: string; title?: string };
        return Response.json({ ...SAMPLE, url: b.url, title: b.title ?? null });
      }
      if (u.pathname.startsWith("/api/links/")) {
        return Response.json({ ...SAMPLE, ...(body as object) });
      }
      if (u.pathname.startsWith("/api/open/")) {
        return new Response("ok");
      }
      return new Response("not found", { status: 404 });
    },
  });
  base = `http://localhost:${server.port}`;
});

afterAll(() => server.stop(true));

function last(): Seen {
  return seen[seen.length - 1];
}

describe("normalizeBaseUrl", () => {
  test("strips trailing slashes", () => {
    expect(normalizeBaseUrl("https://x.dev/")).toBe("https://x.dev");
    expect(normalizeBaseUrl("https://x.dev///")).toBe("https://x.dev");
  });

  test("keeps a base path (loudog.uno/links is base-path aware)", () => {
    expect(normalizeBaseUrl("https://loudog.uno/links")).toBe(
      "https://loudog.uno/links",
    );
  });
});

describe("prepareRequest", () => {
  test("appends the ?t= token to every request", () => {
    const r = prepareRequest(
      { baseUrl: "https://x.dev", token: "SEKRET" },
      "GET",
      "/api/links",
    );
    expect(r.url).toBe("https://x.dev/api/links?t=SEKRET");
    expect(r.method).toBe("GET");
    expect(r.body).toBeUndefined();
  });

  test("sets a JSON content-type and body when given one", () => {
    const r = prepareRequest(
      { baseUrl: "https://x.dev", token: "SEKRET" },
      "POST",
      "/api/save",
      { url: "https://a.b" },
    );
    expect(r.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(r.body as string)).toEqual({ url: "https://a.b" });
  });

  test("throws rather than sending an unauthenticated request", () => {
    expect(() =>
      prepareRequest(
        { baseUrl: "https://x.dev", token: "" },
        "GET",
        "/api/links",
      ),
    ).toThrow(/token/i);
  });
});

describe("redactUrl", () => {
  test("never leaks the token", () => {
    expect(redactUrl("https://x.dev/api/save?t=SUPERSECRET")).toBe(
      "https://x.dev/api/save?t=***",
    );
    expect(redactUrl("https://x.dev/api/links?t=a&q=b")).not.toContain("t=a");
  });
});

describe("client requests", () => {
  test("list() GETs /api/links with the token", async () => {
    const c = createClient({ baseUrl: base, token: "TT" });
    const links = await c.list();
    expect(links[0].handle).toBe("abc123");
    expect(last().method).toBe("GET");
    expect(last().path).toBe("/api/links");
    expect(last().query.t).toBe("TT");
  });

  test("save() POSTs /api/save with a {url,title} JSON body", async () => {
    const c = createClient({ baseUrl: base, token: "TT" });
    await c.save({ url: "https://example.com/z", title: "Zed" });
    expect(last().method).toBe("POST");
    expect(last().path).toBe("/api/save");
    expect(last().query.t).toBe("TT");
    expect(last().body).toEqual({ url: "https://example.com/z", title: "Zed" });
  });

  test("save() omits empty optional fields entirely", async () => {
    const c = createClient({ baseUrl: base, token: "TT" });
    await c.save({ url: "https://example.com/y" });
    expect(last().body).toEqual({ url: "https://example.com/y" });
  });

  test("open() POSTs /api/open/:handle", async () => {
    const c = createClient({ baseUrl: base, token: "TT" });
    await c.open("abc123");
    expect(last().method).toBe("POST");
    expect(last().path).toBe("/api/open/abc123");
    expect(last().query.t).toBe("TT");
  });

  test("patch() PATCHes /api/links/:handle with the changed fields", async () => {
    const c = createClient({ baseUrl: base, token: "TT" });
    await c.patch("abc123", { star: true });
    expect(last().method).toBe("PATCH");
    expect(last().path).toBe("/api/links/abc123");
    expect(last().body).toEqual({ star: true });
  });

  test("remove() DELETEs /api/links/:handle", async () => {
    const c = createClient({ baseUrl: base, token: "TT" });
    await c.remove("abc123");
    expect(last().method).toBe("DELETE");
    expect(last().path).toBe("/api/links/abc123");
    expect(last().query.t).toBe("TT");
  });

  test("handle is URL-encoded into the path", async () => {
    const c = createClient({ baseUrl: base, token: "TT" });
    await c.open("a/b c");
    expect(last().path).toBe("/api/open/a%2Fb%20c");
  });

  test("a 401 surfaces as an actionable error with the token redacted", async () => {
    const c = createClient({ baseUrl: base, token: "TT" });
    await expect(c.request("GET", "/api/unauthorized")).rejects.toThrow(/401/);
    await expect(c.request("GET", "/api/unauthorized")).rejects.not.toThrow(
      /TT/,
    );
  });
});

describe("saveLink reconciliation", () => {
  test("PATCHes note/tags after save because /api/save only carries url+title", async () => {
    const c = createClient({ baseUrl: base, token: "TT" });
    const saved = await saveLink(c, {
      url: "https://example.com/n",
      title: "N",
      note: "hello",
      tags: "x,y",
    });
    expect(saved.handle).toBe("abc123");
    expect(last().method).toBe("PATCH");
    expect(last().path).toBe("/api/links/abc123");
    expect(last().body).toEqual({ note: "hello", tags: "x,y" });
  });

  test("no reconciling PATCH when no note/tags were asked for", async () => {
    const c = createClient({ baseUrl: base, token: "TT" });
    await saveLink(c, { url: "https://example.com/p", title: "P" });
    expect(last().method).toBe("POST");
    expect(last().path).toBe("/api/save");
  });
});

describe("parseLinks", () => {
  test("reads the title out of a markdown link", () => {
    expect(parseLinks("see [Title](https://a.b/c) ok")).toEqual([
      { url: "https://a.b/c", title: "Title" },
    ]);
  });

  test("finds bare URLs of any scheme and dedupes", () => {
    const out = parseLinks("https://a.b raycast://x https://a.b");
    expect(out.map((l) => l.url)).toEqual(["https://a.b", "raycast://x"]);
  });

  test("strips trailing punctuation", () => {
    expect(parseLinks("(https://a.b/c).")[0].url).toBe("https://a.b/c");
  });

  test("returns nothing for text with no links", () => {
    expect(parseLinks("just words")).toEqual([]);
  });
});
