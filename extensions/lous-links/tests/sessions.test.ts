/**
 * Contract tests for the agent-session surface: search over a fixture index,
 * and `sessions push` (dedupe-by-url + the exact body shape) against the same
 * Bun.serve mock the link tests use.
 */
import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient, saveLink, type LousLink } from "../src/lib/api";
import {
  localDate,
  parseSessionsIndex,
  planSessionPush,
  readSessionsIndex,
  searchSessions,
  sessionToPush,
  sessionUrl,
  type AgentSession,
  type SessionsIndex,
} from "../src/lib/sessions";

const FIXTURE: SessionsIndex = {
  v: 1,
  generated: "2026-09-04T22:00:00.000Z",
  machine: "mx3",
  sessions: [
    {
      id: "s1",
      agent: "claude-code",
      machine: "mx3",
      title: "work-board first-principles sweep",
      goal: "burn down the WORK board",
      started: "2026-09-04T18:00:00.000Z",
      cwd: "/Users/loudog/code/raycast",
      url: "https://claude.ai/chat/s1",
      resume: "claude --resume s1",
      source: "/Users/loudog/.claude/projects/raycast/s1.jsonl",
      projects: ["raycast", "lous-links"],
      summary: "Built the lous-links extension",
      turns: 42,
      tags: ["build"],
    },
    {
      id: "s2",
      agent: "codex-cli",
      machine: "next-mbp",
      title: "icloud sync storm",
      started: "2026-09-03T09:30:00.000Z",
      cwd: "/Users/loudog/code/other",
      resume: "codex resume s2",
      source: "/tmp/s2.log",
      projects: ["fleet"],
      // no url and no aagUrl — must be skipped by push
    },
    {
      id: "s3",
      agent: "hermes",
      machine: "mx3",
      title: "telegram gateway restart",
      started: "2026-09-02T12:00:00.000Z",
      aagUrl: "https://github.com/loudoguno/agent-activity-graph/s3",
      resume: "hermes resume s3",
      projects: [],
    },
  ],
};

interface Seen {
  method: string;
  path: string;
  query: Record<string, string>;
  body: unknown;
}

const EXISTING: LousLink = {
  handle: "already",
  url: "https://claude.ai/chat/s1",
  title: "work-board first-principles sweep · claude-code · mx3 · 2026-09-04",
  note: null,
  tags: "session",
  dom: "claude.ai",
  scheme: null,
  star: 0,
  pin: 0,
  hide: 0,
  created_at: 1757000000000,
  open_count: 0,
};

let server: ReturnType<typeof Bun.serve>;
let base: string;
const seen: Seen[] = [];

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

      if (u.pathname === "/api/links") return Response.json([EXISTING]);
      if (u.pathname === "/api/save") {
        const b = body as { url: string; title?: string };
        return Response.json({
          ...EXISTING,
          handle: "new1",
          url: b.url,
          title: b.title ?? null,
          note: null,
          tags: null,
        });
      }
      if (u.pathname.startsWith("/api/links/")) {
        return Response.json({ ...EXISTING, ...(body as object) });
      }
      return new Response("not found", { status: 404 });
    },
  });
  base = `http://localhost:${server.port}`;
});

afterAll(() => server.stop(true));

describe("index reading", () => {
  test("parses the collector's schema", () => {
    const index = parseSessionsIndex(JSON.stringify(FIXTURE));
    expect(index.sessions).toHaveLength(3);
    expect(index.machine).toBe("mx3");
  });

  test("rejects a payload with no sessions array", () => {
    expect(() => parseSessionsIndex('{"v":1}')).toThrow(/sessions/);
  });

  test("returns null when the index has not been built", async () => {
    expect(await readSessionsIndex("/tmp/does-not-exist-lous-links.json")).toBe(
      null,
    );
  });

  test("reads a real file from disk", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ll-sessions-"));
    const path = join(dir, "sessions.json");
    await writeFile(path, JSON.stringify(FIXTURE));
    const index = await readSessionsIndex(path);
    expect(index?.sessions[0].id).toBe("s1");
  });
});

describe("searchSessions", () => {
  const sessions = FIXTURE.sessions;

  test("matches on title", () => {
    expect(searchSessions(sessions, "work-board").map((s) => s.id)).toEqual([
      "s1",
    ]);
  });

  test("matches on goal, summary, cwd and projects", () => {
    expect(searchSessions(sessions, "burn down").map((s) => s.id)).toEqual([
      "s1",
    ]);
    expect(searchSessions(sessions, "extension").map((s) => s.id)).toEqual([
      "s1",
    ]);
    expect(searchSessions(sessions, "code/other").map((s) => s.id)).toEqual([
      "s2",
    ]);
    expect(searchSessions(sessions, "fleet").map((s) => s.id)).toEqual(["s2"]);
  });

  test("is order-insensitive across tokens", () => {
    expect(searchSessions(sessions, "sweep board").map((s) => s.id)).toEqual(
      searchSessions(sessions, "board sweep").map((s) => s.id),
    );
  });

  test("filters by agent", () => {
    expect(
      searchSessions(sessions, "", { agent: "hermes" }).map((s) => s.id),
    ).toEqual(["s3"]);
    expect(searchSessions(sessions, "", { agent: "claude-ai" })).toEqual([]);
  });

  test("returns nothing when no session matches", () => {
    expect(searchSessions(sessions, "zzzz-nope")).toEqual([]);
  });
});

describe("sessionToPush", () => {
  test("builds title, note and tags per the spec", () => {
    const push = sessionToPush(FIXTURE.sessions[0]);
    expect(push?.url).toBe("https://claude.ai/chat/s1");
    expect(push?.title).toBe(
      `work-board first-principles sweep · claude-code · mx3 · ${localDate("2026-09-04T18:00:00.000Z")}`,
    );
    expect(push?.note).toBe("claude --resume s1");
    expect(push?.tags).toBe(
      "session,agent:claude-code,machine:mx3,raycast,lous-links",
    );
  });

  test("only carries the summary with --with-summary", () => {
    const plain = sessionToPush(FIXTURE.sessions[0]);
    const rich = sessionToPush(FIXTURE.sessions[0], { withSummary: true });
    expect(plain?.note).not.toContain("Built the lous-links extension");
    expect(rich?.note).toContain("Built the lous-links extension");
  });

  test("falls back to the AAG page URL", () => {
    expect(sessionUrl(FIXTURE.sessions[2])).toBe(
      "https://github.com/loudoguno/agent-activity-graph/s3",
    );
  });

  test("a session with no URL is not pushable", () => {
    expect(sessionUrl(FIXTURE.sessions[1])).toBe(null);
    expect(sessionToPush(FIXTURE.sessions[1])).toBe(null);
  });
});

describe("planSessionPush", () => {
  test("skips sessions already saved, by URL", () => {
    const plan = planSessionPush(FIXTURE.sessions, [EXISTING.url]);
    expect(plan.planned.map((p) => p.session.id)).toEqual(["s3"]);
    expect(plan.skipped).toEqual([
      { id: "s1", reason: "already-saved" },
      { id: "s2", reason: "no-url" },
    ]);
  });

  test("dedupes within one run", () => {
    const twice = [FIXTURE.sessions[2], { ...FIXTURE.sessions[2], id: "s3b" }];
    const plan = planSessionPush(twice, []);
    expect(plan.planned).toHaveLength(1);
    expect(plan.skipped).toEqual([{ id: "s3b", reason: "already-saved" }]);
  });

  test("--since keeps that day and drops everything older", () => {
    const plan = planSessionPush(FIXTURE.sessions, [], {
      since: localDate("2026-09-04T18:00:00.000Z"),
    });
    expect(plan.planned.map((p) => p.session.id)).toEqual(["s1"]);
    expect(plan.skipped).toEqual([
      { id: "s2", reason: "before-since" },
      { id: "s3", reason: "before-since" },
    ]);
  });
});

describe("sessions push over the wire", () => {
  test("POSTs {url,title} then PATCHes note/tags, and never re-posts a known URL", async () => {
    seen.length = 0;
    const client = createClient({ baseUrl: base, token: "TT" });

    const existing = (await client.list()).map((l) => l.url);
    const plan = planSessionPush(FIXTURE.sessions, existing);
    expect(plan.planned).toHaveLength(1);

    for (const push of plan.planned) {
      await saveLink(client, {
        url: push.url,
        title: push.title,
        note: push.note,
        tags: push.tags,
      });
    }

    const paths = seen.map((s) => `${s.method} ${s.path}`);
    expect(paths).toEqual([
      "GET /api/links",
      "POST /api/save",
      "PATCH /api/links/new1",
    ]);
    expect(seen.every((s) => s.query.t === "TT")).toBe(true);

    expect(seen[1].body).toEqual({
      url: "https://github.com/loudoguno/agent-activity-graph/s3",
      title: `telegram gateway restart · hermes · mx3 · ${localDate("2026-09-02T12:00:00.000Z")}`,
    });
    expect(seen[2].body).toEqual({
      note: "hermes resume s3",
      tags: "session,agent:hermes,machine:mx3",
    });
  });
});

describe("localDate", () => {
  test("uses the local calendar day, not UTC", () => {
    const iso = "2026-09-04T23:30:00.000Z";
    const d = new Date(iso);
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect(localDate(iso)).toBe(expected);
  });

  test("degrades to the leading 10 chars for an unparseable value", () => {
    expect(localDate("not-a-date")).toBe("not-a-date");
  });
});

// keep the type import used
const _typecheck: AgentSession = FIXTURE.sessions[0];
void _typecheck;
