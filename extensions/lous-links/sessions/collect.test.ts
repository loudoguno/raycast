/**
 * collect.test.ts — `bun test`
 *
 * Every fixture here is SYNTHETIC. No real session data lives in this repo:
 * the shapes are copied from the real sources, the content is invented.
 * Run: bun test  (from extensions/lous-links/sessions/)
 */
import { describe, expect, test } from "bun:test";
import {
  bridgeUrl,
  mergeSessions,
  parseAagSessionPage,
  parseChatgptConversations,
  parseClaudeAgents,
  parseClaudeAiConversations,
  parseClaudeCodeSession,
  parseCodexRollout,
  parseHermesRows,
} from "./collect";
import { SCHEMA_VERSION, trimSummary, validate, validateSession } from "./schema";

const jsonl = (...records: unknown[]) => records.map((r) => JSON.stringify(r)).join("\n") + "\n";

// ---------------------------------------------------------------- Claude Code

const CC_SOURCE = "/tmp/fixtures/projects/-tmp-demo/aaaaaaaa-1111-4222-8333-444444444444.jsonl";

const claudeCodeFixture = jsonl(
  {
    parentUuid: null,
    isSidechain: false,
    promptId: "p1",
    type: "user",
    message: { role: "user", content: "Build me a session index for every agent chat on this machine." },
    uuid: "u1",
    timestamp: "2026-09-04T12:53:00.000Z",
    cwd: "/tmp/demo",
    sessionId: "aaaaaaaa-1111-4222-8333-444444444444",
    version: "2.1.261",
  },
  { parentUuid: "u1", isSidechain: false, type: "assistant", message: { role: "assistant" }, uuid: "u2", timestamp: "2026-09-04T12:54:00.000Z" },
  {
    parentUuid: "u2",
    isSidechain: false,
    promptId: "p2",
    type: "user",
    message: { role: "user", content: "second turn" },
    uuid: "u3",
    timestamp: "2026-09-04T12:58:00.000Z",
  },
  { type: "ai-title", aiTitle: "Session index design", sessionId: "aaaaaaaa-1111-4222-8333-444444444444" },
  { type: "custom-title", customTitle: "mx3: 🗂️ demo-session", sessionId: "aaaaaaaa-1111-4222-8333-444444444444" },
  { type: "bridge-session", bridgeSessionId: "cse_01ABCDEFGHIJKLMNOP", sessionId: "aaaaaaaa-1111-4222-8333-444444444444" },
);

describe("parseClaudeCodeSession", () => {
  const row = parseClaudeCodeSession(claudeCodeFixture, CC_SOURCE)!;

  test("returns a schema-valid row", () => {
    expect(validateSession(row)).toEqual([]);
  });

  test("prefers the custom-title record over the ai-title record", () => {
    expect(row.title).toBe("mx3: 🗂️ demo-session");
  });

  test("falls back to ai-title when no custom-title record exists", () => {
    const noCustom = claudeCodeFixture.split("\n").filter((l) => !l.includes('"custom-title"')).join("\n");
    expect(parseClaudeCodeSession(noCustom, CC_SOURCE)!.title).toBe("Session index design");
  });

  test("normalises the cse_ bridge id into a claude.ai/code session_ URL", () => {
    expect(row.url).toBe("https://claude.ai/code/session_01ABCDEFGHIJKLMNOP");
  });

  test("captures id, cwd, resume, timestamps and turn count", () => {
    expect(row.id).toBe("aaaaaaaa-1111-4222-8333-444444444444");
    expect(row.cwd).toBe("/tmp/demo");
    expect(row.resume).toBe("claude --resume aaaaaaaa-1111-4222-8333-444444444444");
    expect(row.started).toBe("2026-09-04T12:53:00.000Z");
    expect(row.ended).toBe("2026-09-04T12:58:00.000Z");
    expect(row.turns).toBe(2);
    expect(row.agent).toBe("claude-code");
  });

  test("summary is the first user message, never a later one", () => {
    expect(row.summary).toBe("Build me a session index for every agent chat on this machine.");
  });

  test("marks sessionKind bg as claude-code-bg", () => {
    const bg = jsonl({
      isSidechain: false,
      type: "user",
      promptId: "p1",
      message: { role: "user", content: "background work" },
      timestamp: "2026-09-04T01:00:00.000Z",
      cwd: "/tmp/demo",
      sessionId: "bbbbbbbb-1111-4222-8333-444444444444",
      sessionKind: "bg",
    });
    expect(parseClaudeCodeSession(bg, CC_SOURCE)!.agent).toBe("claude-code-bg");
  });

  test("skips subagent transcripts (isSidechain)", () => {
    const side = jsonl({
      isSidechain: true,
      type: "user",
      message: { role: "user", content: "subagent prompt" },
      timestamp: "2026-09-04T12:53:00.000Z",
      cwd: "/tmp/demo",
      sessionId: "cccccccc-1111-4222-8333-444444444444",
    });
    expect(parseClaudeCodeSession(side, CC_SOURCE)).toBeNull();
  });

  test("skips injected meta prompts when picking the summary", () => {
    const meta = jsonl(
      {
        isSidechain: false,
        isMeta: true,
        type: "user",
        message: { role: "user", content: "<command-name>/clear</command-name>" },
        timestamp: "2026-09-04T12:00:00.000Z",
        cwd: "/tmp/demo",
        sessionId: "dddddddd-1111-4222-8333-444444444444",
      },
      {
        isSidechain: false,
        promptId: "p1",
        type: "user",
        message: { role: "user", content: [{ type: "text", text: "the real first prompt" }] },
        timestamp: "2026-09-04T12:01:00.000Z",
      },
    );
    expect(parseClaudeCodeSession(meta, CC_SOURCE)!.summary).toBe("the real first prompt");
  });

  test("rejects a resume preamble that buries <system-reminder> past char 0", () => {
    const resumed = jsonl(
      {
        isSidechain: false,
        promptId: "p1",
        type: "user",
        message: {
          role: "user",
          content: 'CONTEXT: User: <system-reminder> The user named this session "next: hermes-helper". </system-reminder> User: help me',
        },
        timestamp: "2026-09-04T15:40:02.592Z",
        cwd: "/tmp/demo",
        sessionId: "eeeeeeee-1111-4222-8333-444444444444",
      },
    );
    expect(parseClaudeCodeSession(resumed, CC_SOURCE)!.summary).toBeNull();
  });

  test("returns null for an empty or unparseable file", () => {
    expect(parseClaudeCodeSession("", CC_SOURCE)).toBeNull();
    expect(parseClaudeCodeSession("not json\n", CC_SOURCE)).toBeNull();
  });
});

test("bridgeUrl normalises both known prefixes and rejects junk", () => {
  expect(bridgeUrl("cse_01AB")).toBe("https://claude.ai/code/session_01AB");
  expect(bridgeUrl("session_01AB")).toBe("https://claude.ai/code/session_01AB");
  expect(bridgeUrl(null)).toBeNull();
  expect(bridgeUrl("")).toBeNull();
});

// ------------------------------------------------------------------ Codex CLI

const CODEX_SOURCE = "/tmp/fixtures/codex/rollout-2026-09-04T22-30-23-01a06f67.jsonl";

const codexFixture = jsonl(
  {
    timestamp: "2026-09-05T02:30:27.664Z",
    type: "session_meta",
    payload: {
      session_id: "01a06f67-1da9-79c1-ac1a-8ec527b5969e",
      id: "01a06f67-1da9-79c1-ac1a-8ec527b5969e",
      timestamp: "2026-09-05T02:30:23.955Z",
      cwd: "/tmp/demo-codex",
      originator: "codex_cli_rs",
      cli_version: "0.153.1",
    },
  },
  {
    timestamp: "2026-09-05T02:30:40.000Z",
    type: "response_item",
    payload: { type: "message", role: "user", content: [{ type: "input_text", text: "<recommended_plugins>\n- Airtable\n</recommended_plugins>" }] },
  },
  {
    timestamp: "2026-09-05T02:30:46.910Z",
    type: "response_item",
    payload: { type: "message", role: "user", content: [{ type: "input_text", text: "Audit the work board and tell me what is stale." }] },
  },
  {
    timestamp: "2026-09-05T02:31:00.000Z",
    type: "response_item",
    payload: { type: "message", role: "assistant", content: [{ type: "output_text", text: "..." }] },
  },
);

describe("parseCodexRollout", () => {
  const row = parseCodexRollout(codexFixture, CODEX_SOURCE)!;

  test("returns a schema-valid row from session_meta", () => {
    expect(validateSession(row)).toEqual([]);
    expect(row.id).toBe("01a06f67-1da9-79c1-ac1a-8ec527b5969e");
    expect(row.cwd).toBe("/tmp/demo-codex");
    expect(row.agent).toBe("codex-cli");
    expect(row.started).toBe("2026-09-05T02:30:23.955Z");
    expect(row.resume).toBe("codex resume 01a06f67-1da9-79c1-ac1a-8ec527b5969e");
  });

  test("skips the injected <recommended_plugins> block and titles from the real prompt", () => {
    expect(row.summary).toBe("Audit the work board and tell me what is stale.");
    expect(row.title).toBe("Audit the work board and tell me what is stale.");
  });

  test("originator Codex Desktop maps to codex-desktop", () => {
    const desktop = codexFixture.replace('"originator":"codex_cli_rs"', '"originator":"Codex Desktop"');
    expect(parseCodexRollout(desktop, CODEX_SOURCE)!.agent).toBe("codex-desktop");
  });

  test("returns null without a session_meta first record", () => {
    expect(parseCodexRollout(jsonl({ type: "response_item", payload: {} }), CODEX_SOURCE)).toBeNull();
  });
});

// ------------------------------------------------------- Agent Activity Graph

const AAG_FILE = "session___2026-09-04___sai-mx3___demo-session.md";
const AAG_SOURCE = `/tmp/fixtures/aag/pages/${AAG_FILE}`;

const aagFixture = `title:: session/2026-09-04/sai-mx3/demo-session
type:: session
date:: [[2026-09-04]]
agent:: [[agent/sai-mx3]]
machine:: [[machine/mx3]]
surface:: [[surface/claude-code]]
session-name:: 🗂️ demo-session
session-id:: aaaaaaaa-1111-4222-8333-444444444444
session-url:: https://claude.ai/code/session_01ABCDEFGHIJKLMNOP
resume:: \`claude --resume aaaaaaaa-1111-4222-8333-444444444444\`
cwd:: ~/.claude
projects:: [[project/lous-links]], [[project/synapse]]
status:: done
started:: 2026-09-04 12:53
tags:: session
ended:: 2026-09-04 12:58

- ## Goal
\t- Index every agent session and AI chat behind one searchable tab
- ## Log
\t- **12:53** session started
`;

describe("parseAagSessionPage", () => {
  const row = parseAagSessionPage(aagFixture, AAG_FILE, AAG_SOURCE)!;

  test("returns a schema-valid row", () => {
    expect(validateSession(row)).toEqual([]);
  });

  test("reads the property block", () => {
    expect(row.id).toBe("aaaaaaaa-1111-4222-8333-444444444444");
    expect(row.agent).toBe("claude-code");
    expect(row.machine).toBe("mx3");
    expect(row.title).toBe("🗂️ demo-session");
    expect(row.projects).toEqual(["project/lous-links", "project/synapse"]);
    expect(row.url).toBe("https://claude.ai/code/session_01ABCDEFGHIJKLMNOP");
    expect(row.resume).toBe("claude --resume aaaaaaaa-1111-4222-8333-444444444444");
  });

  test("reads the ## Goal line", () => {
    expect(row.goal).toBe("Index every agent session and AI chat behind one searchable tab");
  });

  test("falls back to the GitHub page URL when session-url is absent", () => {
    const noUrl = aagFixture.split("\n").filter((l) => !l.startsWith("session-url::")).join("\n");
    expect(parseAagSessionPage(noUrl, AAG_FILE, AAG_SOURCE)!.url).toBe(
      `https://github.com/loudoguno/agent-activity-graph/blob/main/pages/${encodeURIComponent(AAG_FILE)}`,
    );
  });

  test("maps agent namespaces", () => {
    const map = (agent: string, surface = "surface/codex") =>
      parseAagSessionPage(
        aagFixture.replace("[[agent/sai-mx3]]", `[[${agent}]]`).replace("[[surface/claude-code]]", `[[${surface}]]`),
        AAG_FILE,
        AAG_SOURCE,
      )!.agent;
    expect(map("agent/codex-mx3")).toBe("codex-cli");
    expect(map("agent/codex-mx3", "surface/codex-desktop")).toBe("codex-desktop");
    expect(map("agent/cowork", "surface/cowork")).toBe("cowork");
    expect(map("agent/claude-ai", "surface/claude-ai")).toBe("claude-ai");
    expect(map("agent/hermes", "surface/hermes")).toBe("hermes");
  });

  test("falls back to the page title as id when session-id is absent", () => {
    const noId = aagFixture.split("\n").filter((l) => !l.startsWith("session-id::")).join("\n");
    expect(parseAagSessionPage(noId, AAG_FILE, AAG_SOURCE)!.id).toBe("session/2026-09-04/sai-mx3/demo-session");
  });

  test("ignores non-session pages", () => {
    expect(parseAagSessionPage("title:: agent/sai-mx3\ntype:: agent\n", "agent___sai-mx3.md", AAG_SOURCE)).toBeNull();
  });
});

// ----------------------------------------------------------------- claude.ai

describe("parseClaudeAiConversations", () => {
  const fixture = JSON.stringify([
    {
      uuid: "11111111-2222-4333-8444-555555555555",
      name: "Glassblower logo brief",
      summary: "",
      created_at: "2026-05-20T20:53:50.416721Z",
      updated_at: "2026-05-20T20:54:16.058602Z",
      chat_messages: [
        { uuid: "m1", sender: "human", text: "Draft a logo brief for a glassblowing consultancy.", created_at: "2026-05-20T20:53:50Z" },
        { uuid: "m2", sender: "assistant", text: "Here is a brief...", created_at: "2026-05-20T20:54:00Z" },
      ],
    },
    { uuid: "66666666-2222-4333-8444-555555555555", name: "", created_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-01T00:05:00Z", chat_messages: [] },
  ]);

  const rows = parseClaudeAiConversations(fixture, "/tmp/fixtures/claude-ai/conversations.json");

  test("returns schema-valid rows", () => {
    for (const r of rows) expect(validateSession(r)).toEqual([]);
    expect(rows).toHaveLength(2);
  });

  test("builds the chat URL and takes the first human message as summary", () => {
    expect(rows[0].url).toBe("https://claude.ai/chat/11111111-2222-4333-8444-555555555555");
    expect(rows[0].agent).toBe("claude-ai");
    expect(rows[0].machine).toBe("cloud");
    expect(rows[0].title).toBe("Glassblower logo brief");
    expect(rows[0].summary).toBe("Draft a logo brief for a glassblowing consultancy.");
    expect(rows[0].turns).toBe(1);
  });

  test("gives untitled conversations a non-empty title", () => {
    expect(rows[1].title.length).toBeGreaterThan(0);
  });

  test("flattens the export's multi-paragraph summary into a one-line capped goal", () => {
    const withOverview = JSON.stringify([
      {
        uuid: "77777777-2222-4333-8444-555555555555",
        name: "Long one",
        summary: "**Conversation Overview**\n\n" + "Lou is doing a thing. ".repeat(40),
        created_at: "2026-06-02T00:00:00Z",
        updated_at: "2026-06-02T01:00:00Z",
        chat_messages: [],
      },
    ]);
    const [row] = parseClaudeAiConversations(withOverview, "/tmp/fixtures/claude-ai/conversations.json");
    expect(validateSession(row)).toEqual([]);
    expect(row.goal!.includes("\n")).toBe(false);
    expect(row.goal!.length).toBeLessThanOrEqual(200);
  });
});

// ------------------------------------------------------------------- ChatGPT

describe("parseChatgptConversations", () => {
  const fixture = JSON.stringify([
    {
      id: "001a6f53-cac6-409d-b86e-f8d7742f977c",
      conversation_id: "001a6f53-cac6-409d-b86e-f8d7742f977c",
      title: "Airbnb instant book rate",
      create_time: 1725405027.367077,
      update_time: 1725405400.0,
      mapping: {
        n1: { id: "n1", message: { author: { role: "system" }, content: { content_type: "text", parts: [""] }, create_time: 1725405027 } },
        n2: { id: "n2", message: { author: { role: "user" }, content: { content_type: "text", parts: ["Why is my nightly rate three dollars?"] }, create_time: 1725405028 } },
        n3: { id: "n3", message: { author: { role: "assistant" }, content: { content_type: "text", parts: ["Because..."] }, create_time: 1725405030 } },
      },
    },
  ]);

  const rows = parseChatgptConversations(fixture, "/tmp/fixtures/chatgpt/conversations-000.json");

  test("returns a schema-valid row tagged chatgpt", () => {
    expect(validateSession(rows[0])).toEqual([]);
    expect(rows[0].agent).toBe("other");
    expect(rows[0].tags).toContain("chatgpt");
    expect(rows[0].url).toBe("https://chatgpt.com/c/001a6f53-cac6-409d-b86e-f8d7742f977c");
    expect(rows[0].summary).toBe("Why is my nightly rate three dollars?");
    expect(rows[0].started).toBe(new Date(1725405027.367077 * 1000).toISOString());
  });
});

// -------------------------------------------------------------------- Hermes

describe("parseHermesRows", () => {
  const rows = parseHermesRows(
    [
      {
        id: "cron_c94509fbbcda_20260904_200024",
        source: "cron",
        chat_type: null,
        display_name: null,
        title: "bidaily update · Sep 04 20:03",
        started_at: 1788566424.5708101,
        ended_at: 1788566639.956485,
        message_count: 55,
        cwd: null,
        first_user_message: "run the bidaily update",
      },
      {
        id: "20260904_120000_aaaaaa",
        source: "telegram",
        chat_type: "private",
        display_name: "Lou",
        title: null,
        started_at: 1788500000,
        ended_at: null,
        message_count: 4,
        cwd: "/Users/loudog",
        first_user_message: "what is on the board today?",
      },
      { id: "sub_1", source: "subagent", title: null, started_at: 1788400000, ended_at: null, message_count: 3, cwd: null, first_user_message: "internal" },
    ],
    "/Users/loudog/.hermes/state.db",
  );

  test("returns schema-valid hermes rows and drops subagent sessions", () => {
    for (const r of rows) expect(validateSession(r)).toEqual([]);
    expect(rows.map((r) => r.id)).toEqual(["cron_c94509fbbcda_20260904_200024", "20260904_120000_aaaaaa"]);
  });

  test("uses the title when present and the first message otherwise", () => {
    expect(rows[0].title).toBe("bidaily update · Sep 04 20:03");
    expect(rows[1].title).toBe("what is on the board today?");
  });

  test("tags the platform and converts epoch seconds to ISO", () => {
    expect(rows[1].tags).toContain("hermes:telegram");
    expect(rows[1].agent).toBe("hermes");
    expect(rows[0].started).toBe(new Date(1788566424.5708101 * 1000).toISOString());
    expect(rows[0].turns).toBe(55);
  });
});

// ----------------------------------------------------- claude agents --json

describe("parseClaudeAgents", () => {
  const rows = parseClaudeAgents(
    JSON.stringify([
      { id: "5e467bfb", cwd: "/Users/loudog/.claude", kind: "background", startedAt: 1785830339418, sessionId: "5e467bfb-1136-455e-bfa0-d93d0b926c56", name: "mx3☸: check-installation status", state: "done" },
    ]),
    "/tmp/fixtures/.claude/jobs",
  );

  test("returns schema-valid claude-code-bg rows", () => {
    expect(validateSession(rows[0])).toEqual([]);
    expect(rows[0].agent).toBe("claude-code-bg");
    expect(rows[0].id).toBe("5e467bfb-1136-455e-bfa0-d93d0b926c56");
    expect(rows[0].title).toBe("mx3☸: check-installation status");
    expect(rows[0].resume).toBe("claude --resume 5e467bfb-1136-455e-bfa0-d93d0b926c56");
    expect(rows[0].tags).toContain("state:done");
  });

  test("tolerates junk", () => {
    expect(parseClaudeAgents("not json", "x")).toEqual([]);
  });
});

// --------------------------------------------------------- merge + dedupe

describe("mergeSessions", () => {
  const local = { ...parseClaudeCodeSession(claudeCodeFixture, CC_SOURCE)!, origin: "local" as const };
  const graph = { ...parseAagSessionPage(aagFixture, AAG_FILE, AAG_SOURCE)!, origin: "graph" as const };

  test("merges one session that appears in two sources into a single row", () => {
    expect(mergeSessions([local, graph])).toHaveLength(1);
  });

  test("prefers the graph title/goal/projects/url and the local cwd/turns/summary", () => {
    const [row] = mergeSessions([local, graph]);
    expect(row.title).toBe("🗂️ demo-session");
    expect(row.goal).toBe("Index every agent session and AI chat behind one searchable tab");
    expect(row.projects).toEqual(["project/lous-links", "project/synapse"]);
    expect(row.url).toBe("https://claude.ai/code/session_01ABCDEFGHIJKLMNOP");
    expect(row.cwd).toBe("/tmp/demo");
    expect(row.turns).toBe(2);
    expect(row.summary).toBe("Build me a session index for every agent chat on this machine.");
  });

  test("merge order does not matter", () => {
    expect(mergeSessions([graph, local])[0]).toEqual(mergeSessions([local, graph])[0]);
  });

  test("keeps both source paths as tags and unions tags", () => {
    const [row] = mergeSessions([local, graph]);
    expect(row.tags).toContain("agent:claude-code");
    expect(row.tags).toContain("machine:mx3");
    expect(new Set(row.tags).size).toBe(row.tags.length);
  });

  test("sorts by started descending", () => {
    const older = { ...local, id: "older", started: "2026-01-01T00:00:00.000Z", origin: "local" as const };
    const newer = { ...local, id: "newer", started: "2026-12-01T00:00:00.000Z", origin: "local" as const };
    expect(mergeSessions([older, newer]).map((r) => r.id)).toEqual(["newer", "older"]);
  });

  test("produces a valid index", () => {
    const index = { v: SCHEMA_VERSION, generated: new Date().toISOString(), machine: "mx3", sessions: mergeSessions([local, graph]) };
    expect(validate(index)).toEqual({ ok: true, errors: [] });
  });
});

// -------------------------------------------------------------- schema guards

describe("schema", () => {
  test("trimSummary collapses whitespace and caps at 200 chars", () => {
    expect(trimSummary("  a\n\n  b  ")).toBe("a b");
    expect(trimSummary("")).toBeNull();
    expect(trimSummary(null)).toBeNull();
    const long = trimSummary("x".repeat(500))!;
    expect(long.length).toBe(200);
    expect(long.endsWith("…")).toBe(true);
  });

  test("validate rejects a bad agent, an unsorted list and duplicate ids", () => {
    const base = mergeSessions([{ ...parseClaudeCodeSession(claudeCodeFixture, CC_SOURCE)!, origin: "local" as const }])[0];
    expect(validate({ v: SCHEMA_VERSION, generated: new Date().toISOString(), machine: "mx3", sessions: [{ ...base, agent: "nope" }] }).ok).toBe(false);
    const dup = { v: SCHEMA_VERSION, generated: new Date().toISOString(), machine: "mx3", sessions: [base, base] };
    expect(validate(dup).errors.some((e) => e.includes("duplicate id"))).toBe(true);
    const unsorted = {
      v: SCHEMA_VERSION,
      generated: new Date().toISOString(),
      machine: "mx3",
      sessions: [{ ...base, id: "a", started: "2026-01-01T00:00:00.000Z" }, { ...base, id: "b", started: "2026-06-01T00:00:00.000Z" }],
    };
    expect(validate(unsorted).errors.some((e) => e.includes("not sorted"))).toBe(true);
  });

  test("validate rejects an over-long summary and a relative source path", () => {
    const base = mergeSessions([{ ...parseClaudeCodeSession(claudeCodeFixture, CC_SOURCE)!, origin: "local" as const }])[0];
    expect(validateSession({ ...base, summary: "x".repeat(201) }).some((e) => e.includes("exceeds 200"))).toBe(true);
    expect(validateSession({ ...base, source: "relative/path.jsonl" }).some((e) => e.includes("absolute path"))).toBe(true);
  });

  test("validate rejects a multi-line or over-long goal", () => {
    const base = mergeSessions([{ ...parseClaudeCodeSession(claudeCodeFixture, CC_SOURCE)!, origin: "local" as const }])[0];
    expect(validateSession({ ...base, goal: "line one\nline two" }).some((e) => e.includes("single line"))).toBe(true);
    expect(validateSession({ ...base, goal: "x".repeat(201) }).some((e) => e.includes("exceeds 200"))).toBe(true);
  });
});
