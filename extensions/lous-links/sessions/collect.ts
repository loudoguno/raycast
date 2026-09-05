#!/usr/bin/env bun
/**
 * collect.ts — build ONE local index of every agent session and AI chat.
 *
 *   bun collect.ts [--out <path>] [--stats] [--since YYYY-MM-DD] [--json]
 *                  [--chatgpt] [--no-cache]
 *
 * Default out: ~/.local/share/lous-links/sessions.json
 * Read-only on every source. No network. Idempotent.
 *
 * Created 2026-09-04 by sai-mx3, session "mx3: 🗂️ work-board first-principles sweep".
 * Related: WORK#85, the lous-links Raycast extension, the Codex voice sidecar.
 * Source shapes and privacy note: see README.md.
 */
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { hostname } from "node:os";
import { basename, join } from "node:path";
import {
  type Agent,
  type Machine,
  type Session,
  type SessionIndex,
  MACHINES,
  SCHEMA_VERSION,
  trimSummary,
} from "./schema";

export interface Collected extends Session {
  /** Which side of a merge this row came from. Stripped before the index is written. */
  origin: "local" | "graph";
}

const HOME = process.env.HOME ?? "/Users/loudog";
const AAG_REPO = "https://github.com/loudoguno/agent-activity-graph/blob/main/pages";

// ------------------------------------------------------------------- helpers

/** Walk lines without materialising the whole file as an array of strings. */
function* lineRanges(text: string): Generator<[number, number]> {
  let start = 0;
  while (start < text.length) {
    let end = text.indexOf("\n", start);
    if (end === -1) end = text.length;
    if (end > start) yield [start, end];
    start = end + 1;
  }
}

function parseJson<T = any>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Last JSONL record whose line begins with `prefix`. Cheap: no per-line allocation. */
function lastJsonLineByPrefix(text: string, prefix: string): any | null {
  let at = text.lastIndexOf(prefix);
  while (at !== -1) {
    const lineStart = at === 0 ? 0 : text.lastIndexOf("\n", at - 1) + 1;
    if (lineStart === at) {
      let end = text.indexOf("\n", at);
      if (end === -1) end = text.length;
      const rec = parseJson(text.slice(at, end));
      if (rec) return rec;
    }
    at = text.lastIndexOf(prefix, at - 1);
  }
  return null;
}

function countOccurrences(text: string, needle: string): number {
  let n = 0;
  let at = text.indexOf(needle);
  while (at !== -1) {
    n++;
    at = text.indexOf(needle, at + needle.length);
  }
  return n;
}

/** Split a top-level JSON array into its element substrings, one at a time. */
export function* iterTopLevelObjects(text: string): Generator<string> {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        yield text.slice(start, i + 1);
        start = -1;
      }
    }
  }
}

/** mtime as ISO, or null when the path is unreadable (e.g. a remote fleet path). */
function mtimeIso(path: string): string | null {
  try {
    return isoFrom(statSync(path).mtimeMs);
  } catch {
    return null;
  }
}

function isoFrom(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    // Heuristic: >1e12 is epoch milliseconds, otherwise epoch seconds.
    const ms = value > 1e12 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value.trim().replace(" ", "T"));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

/**
 * Injected scaffolding that is not something Lou typed. Used to pick the real
 * first prompt for `summary`.
 */
const INJECTED = [
  "<command-name>",
  "<command-message>",
  "<local-command-stdout>",
  "<local-command-caveat>",
  "<system-reminder>",
  "<recommended_plugins>",
  "<user_instructions>",
  "<environment_context>",
  "<available_plugins>",
  "Caveat: The messages below",
  "[Request interrupted",
  "This session is being continued from a previous",
  "CONTEXT:",
  "RECENT CONVERSATION:",
];

/** Tells that show up a little way in rather than at char 0. */
const INJECTED_ANYWHERE = ["<system-reminder>", "<local-command-caveat>", "Caveat: The messages below"];

function isInjected(text: string): boolean {
  const head = text.trimStart();
  if (INJECTED.some((p) => head.startsWith(p))) return true;
  // Resume/compaction preambles bury the tell a little way in rather than at
  // char 0, so a prefix test alone lets them through into `summary`.
  const window = head.slice(0, 300);
  return INJECTED_ANYWHERE.some((p) => window.includes(p));
}

/** Message content is either a plain string or an array of typed blocks. */
function textOfContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const block of content) {
    if (typeof block === "string") parts.push(block);
    else if (block && typeof block === "object") {
      const t = (block as any).text;
      if (typeof t === "string") parts.push(t);
    }
  }
  return parts.join("\n");
}

function titleFrom(summary: string | null, fallback: string): string {
  if (!summary) return fallback;
  const first = summary.split(/(?<=[.!?])\s|\n/)[0].trim();
  const t = (first.length >= 12 ? first : summary).trim();
  return (t.length > 90 ? t.slice(0, 89).trimEnd() + "…" : t) || fallback;
}

function uniq(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function baseTags(agent: Agent, machine: Machine, extra: string[] = []): string[] {
  return uniq(["session", `agent:${agent}`, `machine:${machine}`, ...extra]);
}

export function detectMachine(): Machine {
  const h = hostname().toLowerCase();
  for (const m of MACHINES) {
    if (m === "unknown" || m === "cloud") continue;
    if (h.includes(m)) return m;
  }
  return "unknown";
}

/**
 * The claude.ai code URL. Claude Code writes the bridge id as `cse_…` inside the
 * transcript but as `session_…` in ~/.claude/sessions/<pid>.json; the URL wants
 * `session_…`. Same suffix either way.
 */
export function bridgeUrl(bridgeSessionId: string | null | undefined): string | null {
  if (typeof bridgeSessionId !== "string" || !bridgeSessionId.trim()) return null;
  const id = bridgeSessionId.trim();
  const suffix = id.includes("_") ? id.slice(id.indexOf("_") + 1) : id;
  if (!suffix) return null;
  return `https://claude.ai/code/session_${suffix}`;
}

// -------------------------------------------------------- Claude Code (jsonl)

const HEADER_LINES = 400;

export function parseClaudeCodeSession(text: string, source: string): Collected | null {
  if (!text.trim()) return null;

  let sessionId: string | null = null;
  let cwd: string | null = null;
  let started: string | null = null;
  let sessionKind: string | null = null;
  let summaryText: string | null = null;
  let sidechain = false;
  let sawRecord = false;

  let seen = 0;
  for (const [s, e] of lineRanges(text)) {
    if (seen++ >= HEADER_LINES) break;
    const rec = parseJson(text.slice(s, e));
    if (!rec || typeof rec !== "object") continue;
    sawRecord = true;
    if (rec.isSidechain === true) sidechain = true;
    if (!sessionId && typeof rec.sessionId === "string") sessionId = rec.sessionId;
    if (!cwd && typeof rec.cwd === "string") cwd = rec.cwd;
    if (!started && typeof rec.timestamp === "string") started = isoFrom(rec.timestamp);
    if (!sessionKind && typeof rec.sessionKind === "string") sessionKind = rec.sessionKind;
    if (!summaryText && rec.type === "user" && rec.isSidechain !== true && rec.isMeta !== true) {
      const t = textOfContent(rec.message?.content);
      if (t.trim() && !isInjected(t)) summaryText = t;
    }
    if (sessionId && cwd && started && summaryText) break;
  }

  if (!sawRecord) return null;
  // Subagent transcripts are not Lou's sessions.
  if (sidechain && !summaryText) return null;
  if (!sessionId) sessionId = basename(source).replace(/\.jsonl$/, "");
  if (!started) started = mtimeIso(source) ?? new Date(0).toISOString();

  const custom = lastJsonLineByPrefix(text, '{"type":"custom-title"');
  const ai = lastJsonLineByPrefix(text, '{"type":"ai-title"');
  const bridge = lastJsonLineByPrefix(text, '{"type":"bridge-session"');

  const summary = trimSummary(summaryText);
  const title =
    (typeof custom?.customTitle === "string" && custom.customTitle.trim()) ||
    (typeof ai?.aiTitle === "string" && ai.aiTitle.trim()) ||
    titleFrom(summary, basename(source).replace(/\.jsonl$/, ""));

  // Unescaped `,"type":"user",` only occurs at the top level of a record;
  // any transcript quoted inside a tool result is backslash-escaped.
  const turns = countOccurrences(text, ',"type":"user",');

  const lastTs = text.lastIndexOf('"timestamp":"');
  const ended = lastTs === -1 ? null : isoFrom(text.slice(lastTs + 13, lastTs + 37));

  const agent: Agent = sessionKind === "bg" ? "claude-code-bg" : "claude-code";
  const machine = detectMachine();

  return {
    id: sessionId,
    agent,
    machine,
    title,
    goal: null,
    started,
    ended: ended && ended >= started ? ended : null,
    cwd,
    url: bridgeUrl(bridge?.bridgeSessionId),
    resume: `claude --resume ${sessionId}`,
    source,
    projects: [],
    summary,
    turns: turns > 0 ? turns : null,
    tags: baseTags(agent, machine, ["surface:claude-code"]),
    origin: "local",
  };
}

// ---------------------------------------------------------- Codex CLI rollout

export function parseCodexRollout(text: string, source: string): Collected | null {
  let meta: any = null;
  let summaryText: string | null = null;
  let lastTs: string | null = null;

  for (const [s, e] of lineRanges(text)) {
    const rec = parseJson(text.slice(s, e));
    if (!rec) continue;
    if (!meta && rec.type === "session_meta" && rec.payload) meta = rec.payload;
    if (typeof rec.timestamp === "string") lastTs = rec.timestamp;
    if (!summaryText && rec.type === "response_item" && rec.payload?.role === "user") {
      const t = textOfContent(rec.payload?.content);
      if (t.trim() && !isInjected(t)) summaryText = t;
    }
    if (meta && summaryText && !lastTs) break;
  }
  if (!meta) return null;

  const id: string = meta.session_id ?? meta.id;
  if (typeof id !== "string" || !id) return null;

  const started = isoFrom(meta.timestamp) ?? mtimeIso(source) ?? new Date(0).toISOString();
  const originator = String(meta.originator ?? "");
  const agent: Agent = /desktop/i.test(originator) ? "codex-desktop" : "codex-cli";
  const machine = detectMachine();
  const summary = trimSummary(summaryText);
  const ended = isoFrom(lastTs);

  return {
    id,
    agent,
    machine,
    title: titleFrom(summary, basename(source).replace(/\.jsonl$/, "")),
    goal: null,
    started,
    ended: ended && ended >= started ? ended : null,
    cwd: typeof meta.cwd === "string" ? meta.cwd : null,
    url: null,
    resume: `codex resume ${id}`,
    source,
    projects: [],
    summary,
    turns: null,
    tags: baseTags(agent, machine, [
      "surface:codex",
      ...(meta.cli_version ? [`codex:${meta.cli_version}`] : []),
    ]),
    origin: "local",
  };
}

// -------------------------------------------------- Agent Activity Graph page

function aagProperties(text: string): Map<string, string> {
  const props = new Map<string, string>();
  for (const [s, e] of lineRanges(text)) {
    const line = text.slice(s, e);
    if (line.startsWith("- ")) break; // property block ends at the first bullet
    const at = line.indexOf(":: ");
    if (at > 0) props.set(line.slice(0, at).trim(), line.slice(at + 3).trim());
  }
  return props;
}

function wikilinks(value: string | undefined): string[] {
  if (!value) return [];
  return [...value.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim());
}

function aagAgent(agentLink: string, surfaceLink: string): Agent {
  const a = agentLink.replace(/^agent\//, "");
  const s = surfaceLink.replace(/^surface\//, "");
  if (a.startsWith("codex")) return s === "codex-desktop" ? "codex-desktop" : "codex-cli";
  if (a === "cowork") return "cowork";
  if (a === "hermes") return "hermes";
  if (a.startsWith("chatgpt")) return "other";
  if (a.startsWith("claude")) return "claude-ai";
  if (a.startsWith("sai")) return "claude-code";
  return "other";
}

function aagMachine(machineLink: string): Machine {
  const m = machineLink.replace(/^machine\//, "");
  if ((MACHINES as readonly string[]).includes(m)) return m as Machine;
  if (m === "web") return "cloud";
  return "unknown";
}

export function parseAagSessionPage(text: string, filename: string, source: string): Collected | null {
  const props = aagProperties(text);
  if (props.get("type") !== "session") return null;

  const pageTitle = props.get("title") ?? filename.replace(/\.md$/, "");
  const id = props.get("session-id") || pageTitle;
  const agent = aagAgent(wikilinks(props.get("agent"))[0] ?? "", wikilinks(props.get("surface"))[0] ?? "");
  const machine = aagMachine(wikilinks(props.get("machine"))[0] ?? "");

  const started =
    isoFrom(props.get("started")) ?? isoFrom(props.get("date")?.replace(/[[\]]/g, "")) ?? new Date(0).toISOString();
  const ended = isoFrom(props.get("ended"));

  // "- ## Goal" then a tab-indented child bullet holds the one-line goal.
  let goal: string | null = null;
  const goalAt = text.indexOf("## Goal");
  if (goalAt !== -1) {
    for (const [s, e] of lineRanges(text.slice(goalAt))) {
      const line = text.slice(goalAt + s, goalAt + e);
      const m = line.match(/^\s*-\s+(.*)$/);
      if (m && !m[1].startsWith("##")) {
        goal = trimSummary(m[1]);
        break;
      }
      if (line.includes("## Log") || line.includes("## Outcome")) break;
    }
  }

  const resume = (props.get("resume") ?? "").replace(/^`|`$/g, "").trim() || null;
  const url = props.get("session-url") || `${AAG_REPO}/${encodeURIComponent(filename)}`;

  return {
    id,
    agent,
    machine,
    title: props.get("session-name") || pageTitle,
    goal,
    started,
    ended: ended && ended >= started ? ended : null,
    cwd: props.get("cwd") ?? null,
    url,
    resume,
    source,
    projects: wikilinks(props.get("projects")),
    summary: null,
    turns: null,
    tags: baseTags(agent, machine, [
      "aag",
      ...(props.get("status") ? [`status:${props.get("status")}`] : []),
      ...wikilinks(props.get("surface")).map((s) => `surface:${s.replace(/^surface\//, "")}`),
    ]),
    origin: "graph",
  };
}

// ------------------------------------------------------------ claude.ai chats

export function parseClaudeAiConversations(text: string, source: string): Collected[] {
  const rows: Collected[] = [];
  for (const raw of iterTopLevelObjects(text)) {
    const c = parseJson(raw);
    if (!c || typeof c.uuid !== "string") continue;

    const messages: any[] = Array.isArray(c.chat_messages) ? c.chat_messages : [];
    let summaryText: string | null = null;
    let humanTurns = 0;
    for (const m of messages) {
      const role = m?.sender ?? m?.role;
      if (role !== "human" && role !== "user") continue;
      humanTurns++;
      if (!summaryText) {
        const t = (typeof m?.text === "string" && m.text) || textOfContent(m?.content);
        if (t.trim() && !isInjected(t)) summaryText = t;
      }
    }

    const summary = trimSummary(summaryText);
    const started = isoFrom(c.created_at) ?? new Date(0).toISOString();
    const ended = isoFrom(c.updated_at);
    const title =
      (typeof c.name === "string" && c.name.trim()) ||
      titleFrom(summary, `claude.ai chat ${c.uuid.slice(0, 8)}`);

    rows.push({
      id: c.uuid,
      agent: "claude-ai",
      machine: "cloud",
      title,
      // The export's `summary` is a multi-paragraph overview; `goal` is one line.
      goal: trimSummary(c.summary),
      started,
      ended: ended && ended >= started ? ended : null,
      cwd: null,
      url: `https://claude.ai/chat/${c.uuid}`,
      resume: null,
      source,
      projects: [],
      summary,
      turns: humanTurns > 0 ? humanTurns : null,
      tags: baseTags("claude-ai", "cloud", ["claude-ai", "export"]),
      origin: "local",
    });
  }
  return rows;
}

// -------------------------------------------------------------- ChatGPT chats

export function parseChatgptConversations(text: string, source: string): Collected[] {
  const rows: Collected[] = [];
  for (const raw of iterTopLevelObjects(text)) {
    const c = parseJson(raw);
    const id = c?.conversation_id ?? c?.id;
    if (!c || typeof id !== "string") continue;

    const nodes: any[] = c.mapping && typeof c.mapping === "object" ? Object.values(c.mapping) : [];
    const userMsgs = nodes
      .map((n) => n?.message)
      .filter((m) => m?.author?.role === "user")
      .sort((a, b) => (a?.create_time ?? 0) - (b?.create_time ?? 0));

    let summaryText: string | null = null;
    for (const m of userMsgs) {
      const parts = m?.content?.parts;
      const t = Array.isArray(parts) ? parts.filter((p: unknown) => typeof p === "string").join("\n") : "";
      if (t.trim() && !isInjected(t)) {
        summaryText = t;
        break;
      }
    }

    const summary = trimSummary(summaryText);
    const started = isoFrom(c.create_time) ?? new Date(0).toISOString();
    const ended = isoFrom(c.update_time);

    rows.push({
      id,
      agent: "other",
      machine: "cloud",
      title: (typeof c.title === "string" && c.title.trim()) || titleFrom(summary, `ChatGPT chat ${id.slice(0, 8)}`),
      goal: null,
      started,
      ended: ended && ended >= started ? ended : null,
      cwd: null,
      url: `https://chatgpt.com/c/${id}`,
      resume: null,
      source,
      projects: [],
      summary,
      turns: userMsgs.length > 0 ? userMsgs.length : null,
      tags: baseTags("other", "cloud", ["chatgpt", "export"]),
      origin: "local",
    });
  }
  return rows;
}

// -------------------------------------------------------------------- Hermes

export interface HermesRow {
  id: string;
  source: string;
  chat_type?: string | null;
  display_name?: string | null;
  title?: string | null;
  started_at: number;
  ended_at?: number | null;
  message_count?: number | null;
  cwd?: string | null;
  first_user_message?: string | null;
}

export function parseHermesRows(rows: HermesRow[], source: string): Collected[] {
  const out: Collected[] = [];
  for (const r of rows) {
    if (!r?.id) continue;
    // `subagent` rows are Hermes' own internal fan-out, not Lou's conversations.
    if (r.source === "subagent") continue;

    const summary = trimSummary(r.first_user_message);
    const started = isoFrom(r.started_at) ?? new Date(0).toISOString();
    const ended = isoFrom(r.ended_at ?? null);
    const machine = detectMachine();

    out.push({
      id: r.id,
      agent: "hermes",
      machine,
      title: (r.title ?? "").trim() || titleFrom(summary, (r.display_name ?? "").trim() || `hermes ${r.id}`),
      goal: null,
      started,
      ended: ended && ended >= started ? ended : null,
      cwd: r.cwd ?? null,
      url: null,
      resume: null,
      source,
      projects: [],
      summary,
      turns: typeof r.message_count === "number" ? r.message_count : null,
      tags: baseTags("hermes", machine, [`hermes:${r.source}`, ...(r.chat_type ? [`chat:${r.chat_type}`] : [])]),
      origin: "local",
    });
  }
  return out;
}

// -------------------------------------------- claude agents --json --all (bg)

export function parseClaudeAgents(text: string, source: string): Collected[] {
  const list = parseJson(text);
  if (!Array.isArray(list)) return [];
  const machine = detectMachine();
  const rows: Collected[] = [];
  for (const a of list) {
    const id = a?.sessionId ?? a?.id;
    if (typeof id !== "string" || !id) continue;
    const started = isoFrom(a?.startedAt) ?? new Date(0).toISOString();
    rows.push({
      id,
      agent: "claude-code-bg",
      machine,
      title: (typeof a?.name === "string" && a.name.trim()) || `background agent ${id.slice(0, 8)}`,
      goal: null,
      started,
      ended: null,
      cwd: typeof a?.cwd === "string" ? a.cwd : null,
      url: null,
      resume: `claude --resume ${id}`,
      source,
      projects: [],
      summary: null,
      turns: null,
      tags: baseTags("claude-code-bg", machine, [
        "surface:claude-code",
        "claude-agents",
        ...(a?.state ? [`state:${a.state}`] : []),
        ...(a?.kind ? [`kind:${a.kind}`] : []),
      ]),
      origin: "local",
    });
  }
  return rows;
}

// ------------------------------------------------------------- merge + sort

function pick<T>(graph: T | null | undefined, local: T | null | undefined): T | null {
  return (graph ?? null) !== null && graph !== undefined ? (graph as T) : ((local ?? null) as T | null);
}

/**
 * Dedupe by id, merging across sources. The graph page wins on
 * title/goal/projects/url; the local file wins on cwd/turns/summary.
 * Order-independent: preference is decided by `origin`, never by input order.
 */
export function mergeSessions(rows: Collected[]): Session[] {
  const byId = new Map<string, { graph: Collected[]; local: Collected[] }>();
  for (const r of rows) {
    if (!r?.id) continue;
    const slot = byId.get(r.id) ?? { graph: [], local: [] };
    slot[r.origin].push(r);
    byId.set(r.id, slot);
  }

  const merged: Session[] = [];
  for (const [id, { graph, local }] of byId) {
    const g = graph[0] ?? null;
    const l = local[0] ?? null;
    const primary = (l ?? g)!;

    const title = (g?.title || l?.title || primary.title) as string;
    const startedCandidates = [l?.started, g?.started].filter(Boolean) as string[];
    const started = startedCandidates.sort()[0] ?? primary.started;
    const endedCandidates = [l?.ended, g?.ended].filter(Boolean) as string[];
    const ended = endedCandidates.sort().at(-1) ?? null;

    merged.push({
      id,
      agent: (l?.agent ?? g?.agent)!,
      machine: (g?.machine && g.machine !== "unknown" ? g.machine : l?.machine ?? g?.machine)!,
      title,
      goal: pick(g?.goal, l?.goal),
      started,
      ended: ended && ended >= started ? ended : null,
      cwd: pick(l?.cwd, g?.cwd),
      url: pick(g?.url, l?.url),
      resume: pick(l?.resume, g?.resume),
      source: (l?.source ?? g?.source)!,
      projects: g?.projects?.length ? g.projects : l?.projects ?? [],
      summary: pick(l?.summary, g?.summary),
      turns: typeof l?.turns === "number" ? l.turns : typeof g?.turns === "number" ? g.turns : null,
      tags: uniq([...(g?.tags ?? []), ...(l?.tags ?? [])]).sort(),
    });
  }

  merged.sort((a, b) => (a.started < b.started ? 1 : a.started > b.started ? -1 : a.id < b.id ? -1 : 1));
  return merged;
}

// ------------------------------------------------------------------- caching

type CacheEntry = { mtimeMs: number; size: number; row: Collected | null };
type Cache = Record<string, CacheEntry>;

async function readCache(path: string): Promise<Cache> {
  try {
    const data = parseJson(await Bun.file(path).text());
    return data && typeof data === "object" ? (data as Cache) : {};
  } catch {
    return {};
  }
}

/** Parse a file, reusing the cached row when mtime+size are unchanged. */
async function cachedParse(
  path: string,
  cache: Cache,
  next: Cache,
  parse: (text: string, source: string) => Collected | null,
  useCache: boolean,
): Promise<Collected | null> {
  let st: ReturnType<typeof statSync>;
  try {
    st = statSync(path);
  } catch {
    return null;
  }
  const hit = useCache ? cache[path] : undefined;
  if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) {
    next[path] = hit;
    return hit.row;
  }
  let row: Collected | null = null;
  try {
    row = parse(await Bun.file(path).text(), path);
  } catch {
    row = null;
  }
  next[path] = { mtimeMs: st.mtimeMs, size: st.size, row };
  return row;
}

// ---------------------------------------------------------------- collectors

function listDir(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

async function collectClaudeCode(cache: Cache, next: Cache, useCache: boolean): Promise<Collected[]> {
  const root = join(HOME, ".claude", "projects");
  const rows: Collected[] = [];
  for (const dir of listDir(root)) {
    const projectDir = join(root, dir);
    // Depth 1 only: <uuid>/subagents/ and <uuid>/tool-results/ are not sessions.
    for (const entry of listDir(projectDir)) {
      if (!entry.endsWith(".jsonl")) continue;
      const row = await cachedParse(join(projectDir, entry), cache, next, parseClaudeCodeSession, useCache);
      if (row) rows.push(row);
    }
  }
  return rows;
}

async function collectClaudeAgents(): Promise<Collected[]> {
  try {
    const proc = Bun.spawn(["claude", "agents", "--json", "--all"], { stdout: "pipe", stderr: "ignore" });
    const out = await new Response(proc.stdout).text();
    await proc.exited;
    // Background jobs are backed by ~/.claude/jobs; the row's `source` must be a
    // real path, so point there rather than at the command that listed them.
    return parseClaudeAgents(out, join(HOME, ".claude", "jobs"));
  } catch {
    return [];
  }
}

function codexRolloutPaths(): string[] {
  const paths: string[] = [];
  const sessions = join(HOME, ".codex", "sessions");
  const walk = (dir: string, depth: number) => {
    for (const entry of listDir(dir)) {
      const p = join(dir, entry);
      if (entry.endsWith(".jsonl")) paths.push(p);
      else if (depth < 4 && !entry.startsWith(".")) {
        try {
          if (statSync(p).isDirectory()) walk(p, depth + 1);
        } catch {
          /* unreadable */
        }
      }
    }
  };
  walk(sessions, 0);
  for (const entry of listDir(join(HOME, ".codex", "archived_sessions"))) {
    if (entry.endsWith(".jsonl")) paths.push(join(HOME, ".codex", "archived_sessions", entry));
  }
  return paths;
}

/** Codex Desktop state: thread titles, cwd hints and project names, by thread id. */
function codexDesktopState(): {
  titles: Map<string, string>;
  cwds: Map<string, string>;
  projects: Map<string, string>;
} {
  const titles = new Map<string, string>();
  const cwds = new Map<string, string>();
  const projects = new Map<string, string>();
  const path = join(HOME, ".codex", ".codex-global-state.json");
  if (!existsSync(path)) return { titles, cwds, projects };
  let gs: any;
  try {
    gs = JSON.parse(require("node:fs").readFileSync(path, "utf8"));
  } catch {
    return { titles, cwds, projects };
  }
  for (const [k, v] of Object.entries(gs["thread-titles"]?.titles ?? {})) {
    if (typeof v === "string") titles.set(k, v);
  }
  for (const [k, v] of Object.entries(gs["thread-workspace-root-hints"] ?? {})) {
    if (typeof v === "string") cwds.set(k, v);
  }
  const local = gs["local-projects"] ?? {};
  for (const [threadId, a] of Object.entries<any>(gs["thread-project-assignments"] ?? {})) {
    const name = local?.[a?.projectId]?.name;
    if (typeof name === "string") projects.set(threadId, name);
  }
  return { titles, cwds, projects };
}

async function collectCodex(cache: Cache, next: Cache, useCache: boolean): Promise<Collected[]> {
  const state = codexDesktopState();
  const rows: Collected[] = [];
  const seenCwd = new Set<string>();

  for (const path of codexRolloutPaths()) {
    const row = await cachedParse(path, cache, next, parseCodexRollout, useCache);
    if (!row) continue;
    // Enrich from Codex Desktop's own state file.
    const desktopTitle = state.titles.get(row.id);
    if (desktopTitle) row.title = desktopTitle;
    if (!row.cwd) row.cwd = state.cwds.get(row.id) ?? null;
    const project = state.projects.get(row.id);
    if (project) row.projects = uniq([...row.projects, `project/${project}`]);
    if (state.cwds.has(row.id) || state.titles.has(row.id)) row.tags = uniq([...row.tags, "codex-desktop-state"]);
    if (row.cwd) seenCwd.add(row.cwd);
    rows.push(row);
  }

  // Codex Desktop project dirs with no surviving rollout still name real work.
  const docRoot = join(HOME, "Documents", "Codex");
  for (const day of listDir(docRoot)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    for (const slug of listDir(join(docRoot, day))) {
      const dir = join(docRoot, day, slug);
      let st: ReturnType<typeof statSync>;
      try {
        st = statSync(dir);
      } catch {
        continue;
      }
      if (!st.isDirectory() || seenCwd.has(dir)) continue;
      const machine = detectMachine();
      rows.push({
        id: `codex-desktop:${day}/${slug}`,
        agent: "codex-desktop",
        machine,
        title: slug.replace(/-/g, " "),
        goal: null,
        started: isoFrom(st.birthtimeMs || st.mtimeMs)!,
        ended: isoFrom(st.mtimeMs),
        cwd: dir,
        url: null,
        resume: null,
        source: dir,
        projects: [],
        summary: null,
        turns: null,
        tags: baseTags("codex-desktop", machine, ["surface:codex-desktop", "project-dir"]),
        origin: "local",
      });
    }
  }
  return rows;
}

async function collectAag(): Promise<Collected[]> {
  const pages = join(HOME, "vaults", "agent-activity-graph", "pages");
  const rows: Collected[] = [];
  for (const entry of listDir(pages)) {
    if (!entry.endsWith(".md") || !entry.startsWith("session___")) continue;
    const path = join(pages, entry);
    try {
      const row = parseAagSessionPage(await Bun.file(path).text(), entry, path);
      if (row) rows.push(row);
    } catch {
      /* unreadable page */
    }
  }
  return rows;
}

async function collectHermes(): Promise<Collected[]> {
  const db = join(HOME, ".hermes", "state.db");
  if (!existsSync(db)) return [];
  // The gateway holds the DB open, so work on a snapshot copy. state.db is in WAL
  // mode: copy the -wal/-shm sidecars too, or committed-but-uncheckpointed rows
  // are invisible. The copy is opened read-write (SQLite must be able to create
  // its -shm to read a WAL database at all); the real state.db is never touched.
  const copy = join("/tmp", `lous-links-hermes-${process.pid}.db`);
  const sidecars = [copy, `${copy}-wal`, `${copy}-shm`];
  try {
    for (const suffix of ["", "-wal", "-shm"]) {
      if (existsSync(`${db}${suffix}`)) {
        await Bun.spawn(["cp", `${db}${suffix}`, `${copy}${suffix}`], { stdout: "ignore", stderr: "ignore" }).exited;
      }
    }
    const { Database } = await import("bun:sqlite");
    const conn = new Database(copy);
    const rows = conn
      .query(
        `SELECT s.id, s.source, s.chat_type, s.display_name, s.title,
                s.started_at, s.ended_at, s.message_count, s.cwd,
                (SELECT m.content FROM messages m
                  WHERE m.session_id = s.id AND m.role = 'user'
                  ORDER BY m.timestamp ASC LIMIT 1) AS first_user_message
           FROM sessions s
          ORDER BY s.started_at DESC`,
      )
      .all() as HermesRow[];
    conn.close();
    return parseHermesRows(rows, db);
  } catch {
    return [];
  } finally {
    for (const f of sidecars) {
      try {
        require("node:fs").rmSync(f, { force: true });
      } catch {
        /* already gone */
      }
    }
  }
}

/** Stream one entry out of a zip without extracting the archive. */
async function unzipEntry(zip: string, entry: string): Promise<string | null> {
  try {
    const proc = Bun.spawn(["unzip", "-p", zip, entry], { stdout: "pipe", stderr: "ignore" });
    const text = await new Response(proc.stdout).text();
    await proc.exited;
    return text.trim() ? text : null;
  } catch {
    return null;
  }
}

function exportDir(vendor: string): string {
  return join(HOME, "code", "vehicular-agentic-computing", "exports", vendor);
}

async function collectClaudeAi(): Promise<Collected[]> {
  const dir = exportDir("claude-ai-2026-08-27");
  const zip = join(dir, "conversations-000.zip");
  const plain = join(dir, "conversations.json");
  if (existsSync(plain)) {
    return parseClaudeAiConversations(await Bun.file(plain).text(), plain);
  }
  if (!existsSync(zip)) return [];
  const text = await unzipEntry(zip, "conversations.json");
  return text ? parseClaudeAiConversations(text, zip) : [];
}

async function collectChatgpt(): Promise<Collected[]> {
  const zip = join(exportDir("chatgpt-2026-08-27"), "chatgpt-export-full.zip");
  if (!existsSync(zip)) return [];
  const rows: Collected[] = [];
  for (let i = 0; i < 100; i++) {
    const entry = `conversations-${String(i).padStart(3, "0")}.json`;
    const text = await unzipEntry(zip, entry);
    if (!text) break;
    rows.push(...parseChatgptConversations(text, `${zip}!${entry}`));
  }
  return rows;
}

// ------------------------------------------------------- fleet (ssh, opt-in)

/**
 * Streams only what a row needs from a remote machine: the head of each
 * transcript (ids, cwd, first prompt), the trailing title/bridge sidecar
 * records, a true turn count and the last timestamp. Never the message bodies.
 */
const FLEET_SCRIPT = `
emit() {
  printf '@@LL@@%s\\n' "$1"
  head -c 4000 "$1"
  printf '\\n'
}
for f in "$HOME"/.claude/projects/*/*.jsonl; do
  [ -f "$f" ] || continue
  emit "$f"
  grep -h '^{"type":"custom-title"' "$f" | tail -1
  grep -h '^{"type":"ai-title"' "$f" | tail -1
  grep -h '^{"type":"bridge-session"' "$f" | tail -1
  printf '{"type":"ll-turns","turns":%s}\\n' "$(grep -c ',"type":"user",' "$f" || echo 0)"
  tail -c 4000 "$f" | grep -o '"timestamp":"[^"]*"' | tail -1 | sed 's/^/{/;s/$/}/'
done
for f in "$HOME"/.codex/sessions/*/*/*/*.jsonl "$HOME"/.codex/archived_sessions/*.jsonl; do
  [ -f "$f" ] || continue
  emit "$f"
done
`;

async function collectFleet(host: string, machine: Machine, timeoutMs = 120_000): Promise<Collected[]> {
  let out = "";
  try {
    const proc = Bun.spawn(
      ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8", host, "bash -s"],
      { stdin: new TextEncoder().encode(FLEET_SCRIPT), stdout: "pipe", stderr: "ignore" },
    );
    const timer = setTimeout(() => proc.kill(), timeoutMs);
    out = await new Response(proc.stdout).text();
    await proc.exited;
    clearTimeout(timer);
  } catch {
    return [];
  }

  const rows: Collected[] = [];
  for (const chunk of out.split("@@LL@@").slice(1)) {
    const nl = chunk.indexOf("\n");
    if (nl === -1) continue;
    const remotePath = chunk.slice(0, nl).trim();
    const body = chunk.slice(nl + 1);
    if (!remotePath.startsWith("/")) continue;

    const isCodex = remotePath.includes("/.codex/");
    // The remote head is truncated mid-line; drop the trailing partial record.
    const safe = body.slice(0, body.lastIndexOf("\n") + 1);
    const row = isCodex ? parseCodexRollout(safe, remotePath) : parseClaudeCodeSession(safe, remotePath);
    if (!row) continue;

    const turns = lastJsonLineByPrefix(safe, '{"type":"ll-turns"');
    row.turns = typeof turns?.turns === "number" && turns.turns > 0 ? turns.turns : null;
    row.machine = machine;
    row.tags = baseTags(row.agent, machine, [
      ...row.tags.filter((t) => !t.startsWith("machine:") && !t.startsWith("agent:")),
      `host:${host}`,
    ]);
    rows.push(row);
  }
  return rows;
}

// ------------------------------------------------------------------- the CLI

function argValue(argv: string[], flag: string): string | undefined {
  const at = argv.indexOf(flag);
  return at !== -1 && at + 1 < argv.length ? argv[at + 1] : undefined;
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const t0 = performance.now();
  const wantStats = argv.includes("--stats");
  const wantJson = argv.includes("--json");
  const useCache = !argv.includes("--no-cache");
  // On by default: `unzip -p` seeks straight to each shard, so the 2.7 GB
  // archive costs ~0.7s for ~3.9k chats. Measured, not assumed.
  const withChatgpt = !argv.includes("--no-chatgpt");
  const withFleet = argv.includes("--fleet");
  const since = argValue(argv, "--since");
  const outPath = argValue(argv, "--out") ?? join(HOME, ".local", "share", "lous-links", "sessions.json");

  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(
      [
        "bun collect.ts [--out <path>] [--stats] [--since YYYY-MM-DD] [--json]",
        "               [--fleet] [--no-chatgpt] [--no-cache]",
        "",
        "  --out          index path (default ~/.local/share/lous-links/sessions.json)",
        "  --stats        print {sessions, by_agent, by_machine, seconds}",
        "  --since        keep only sessions started on/after this date",
        "  --json         print the whole index to stdout",
        "  --fleet        also ssh next-mbp for its Claude Code + Codex sessions",
        "  --no-chatgpt   skip the ChatGPT export shards",
        "  --no-cache     ignore the mtime cache and re-read every transcript",
      ].join("\n"),
    );
    return 0;
  }
  if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    console.error(`--since expects YYYY-MM-DD, got ${since}`);
    return 2;
  }

  const cachePath = outPath.replace(/\.json$/, "") + ".cache.json";
  const cache = useCache ? await readCache(cachePath) : {};
  const next: Cache = {};

  const collected = (
    await Promise.all([
      collectClaudeCode(cache, next, useCache),
      collectClaudeAgents(),
      collectCodex(cache, next, useCache),
      collectAag(),
      collectHermes(),
      collectClaudeAi(),
      withChatgpt ? collectChatgpt() : Promise.resolve([]),
      withFleet ? collectFleet("next-mbp", "next-mbp") : Promise.resolve([]),
    ])
  ).flat();

  let sessions = mergeSessions(collected);
  if (since) {
    const floor = `${since}T00:00:00.000Z`;
    sessions = sessions.filter((s) => s.started >= floor);
  }

  const index: SessionIndex = {
    v: SCHEMA_VERSION,
    generated: new Date().toISOString(),
    machine: detectMachine(),
    sessions,
  };

  mkdirSync(join(outPath, ".."), { recursive: true });
  await Bun.write(outPath, JSON.stringify(index, null, 2) + "\n");
  if (useCache) await Bun.write(cachePath, JSON.stringify(next));

  if (wantJson) {
    console.log(JSON.stringify(index));
  }
  if (wantStats) {
    const by = (key: "agent" | "machine") =>
      sessions.reduce<Record<string, number>>((acc, s) => {
        acc[s[key]] = (acc[s[key]] ?? 0) + 1;
        return acc;
      }, {});
    console.log(
      JSON.stringify({
        sessions: sessions.length,
        by_agent: by("agent"),
        by_machine: by("machine"),
        seconds: Number(((performance.now() - t0) / 1000).toFixed(2)),
      }),
    );
  }
  if (!wantStats && !wantJson) {
    console.log(`${sessions.length} sessions → ${outPath}`);
  }
  return 0;
}

if (import.meta.main) {
  process.exit(await main());
}
