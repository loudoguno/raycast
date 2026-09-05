/**
 * Agent-session index — read, search, and turn sessions into lous-links rows.
 *
 * The index itself is produced by `sessions/collect.ts` (owned by a sibling
 * agent; not edited from here) and lands at
 * ~/.local/share/lous-links/sessions.json. This module is the read side: it is
 * pure, imports no @raycast/api, and is shared by the Raycast command, the CLI
 * and the tests — the same discipline as lib/api.ts.
 */
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { SaveRequest } from "./api";

export const SESSIONS_INDEX_PATH = join(
  homedir(),
  ".local",
  "share",
  "lous-links",
  "sessions.json",
);

export type AgentKind =
  | "claude-code"
  | "claude-code-bg"
  | "claude-ai"
  | "codex-cli"
  | "codex-desktop"
  | "hermes"
  | "cowork"
  | "other";

export const AGENT_KINDS: AgentKind[] = [
  "claude-code",
  "claude-code-bg",
  "claude-ai",
  "codex-cli",
  "codex-desktop",
  "hermes",
  "cowork",
  "other",
];

/**
 * Mirrors `sessions/schema.ts` (SCHEMA_VERSION 1), which is the contract. The
 * collector emits explicit `null` for absent values; the fields are optional
 * here as well so fixtures and older indexes still typecheck.
 */
export interface AgentSession {
  id: string;
  agent: AgentKind;
  machine: string;
  title: string;
  goal?: string | null;
  /** ISO timestamp. */
  started: string;
  ended?: string | null;
  cwd?: string | null;
  /** Canonical web URL for the session, when one exists. */
  url?: string | null;
  /** Shell command that resumes it (e.g. `claude --resume <id>`). */
  resume?: string | null;
  /** Path to the transcript/log the row was built from. */
  source?: string | null;
  projects?: string[];
  summary?: string | null;
  turns?: number | null;
  tags?: string[];
  /**
   * Agent Activity Graph page URL, when the collector can resolve one.
   * Not in the v1 schema; read defensively so a later collector version that
   * adds it starts pushing those rows without a change here.
   */
  aagUrl?: string | null;
  aag_url?: string | null;
}

export interface SessionsIndex {
  v: number | string;
  generated: string;
  machine: string;
  sessions: AgentSession[];
}

export function parseSessionsIndex(raw: string): SessionsIndex {
  const parsed = JSON.parse(raw) as Partial<SessionsIndex>;
  if (!Array.isArray(parsed.sessions)) {
    throw new Error("sessions.json has no `sessions` array");
  }
  return {
    v: parsed.v ?? 0,
    generated: parsed.generated ?? "",
    machine: parsed.machine ?? "",
    sessions: parsed.sessions,
  };
}

/** Returns null when the index has not been built yet. */
export async function readSessionsIndex(
  path: string = SESSIONS_INDEX_PATH,
): Promise<SessionsIndex | null> {
  try {
    return parseSessionsIndex(await readFile(path, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function haystack(session: AgentSession): string {
  return [
    session.title,
    session.goal ?? "",
    session.summary ?? "",
    session.cwd ?? "",
    (session.projects ?? []).join(" "),
    (session.tags ?? []).join(" "),
    session.agent,
    session.machine,
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Order-insensitive token scoring, same shape as the link search so "nyc
 * housing" and "housing nyc" behave identically. Returns -1 for no match.
 */
export function scoreSession(session: AgentSession, query: string): number {
  const hay = haystack(session);
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0.001;

  let score = 0;
  const title = session.title.toLowerCase();
  for (const token of tokens) {
    const at = hay.indexOf(token);
    if (at < 0) return -1;
    score += (at === 0 ? 3 : 1) + (title.includes(token) ? 2 : 0);
  }
  return score;
}

export interface SessionSearchOptions {
  agent?: string;
}

export function searchSessions(
  sessions: AgentSession[],
  query: string,
  options: SessionSearchOptions = {},
): AgentSession[] {
  const filtered = options.agent
    ? sessions.filter((s) => s.agent === options.agent)
    : sessions;

  return filtered
    .map((session) => ({ session, score: scoreSession(session, query) }))
    .filter((x) => x.score >= 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Date.parse(b.session.started || "0") -
          Date.parse(a.session.started || "0"),
    )
    .map((x) => x.session);
}

/** Local (not UTC) YYYY-MM-DD, so a late-evening session keeps its own date. */
export function localDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return (iso || "").slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Which URL represents a session: its own, else the Agent Activity Graph page,
 * else none — and a session with no URL is not a link, so it is skipped.
 */
export function sessionUrl(session: AgentSession): string | null {
  const candidate = (
    session.url ||
    session.aagUrl ||
    session.aag_url ||
    ""
  ).trim();
  return candidate || null;
}

export interface SessionPushOptions {
  /** Only sessions started on or after this YYYY-MM-DD. */
  since?: string;
  /** Append the session summary to the note. */
  withSummary?: boolean;
}

export interface PlannedPush extends SaveRequest {
  url: string;
  session: AgentSession;
}

export interface SkippedPush {
  id: string;
  reason: "no-url" | "already-saved" | "before-since";
}

export interface SessionPushPlan {
  planned: PlannedPush[];
  skipped: SkippedPush[];
}

export function sessionToPush(
  session: AgentSession,
  options: SessionPushOptions = {},
): PlannedPush | null {
  const url = sessionUrl(session);
  if (!url) return null;

  const title = [
    session.title || session.id,
    session.agent,
    session.machine,
    localDate(session.started),
  ].join(" · ");

  const noteParts: string[] = [];
  if (session.resume) noteParts.push(session.resume);
  if (options.withSummary && session.summary) noteParts.push(session.summary);

  const tags = [
    "session",
    `agent:${session.agent}`,
    `machine:${session.machine}`,
    ...(session.projects ?? []),
  ]
    .map((t) => t.trim())
    .filter(Boolean)
    .join(",");

  return {
    url,
    title,
    note: noteParts.join(" — ") || undefined,
    tags,
    session,
  };
}

/**
 * Decide what to POST. Upsert == skip anything whose URL is already in the
 * library, so the caller fetches GET /api/links exactly once.
 */
export function planSessionPush(
  sessions: AgentSession[],
  existingUrls: Iterable<string>,
  options: SessionPushOptions = {},
): SessionPushPlan {
  const existing = new Set(existingUrls);
  const planned: PlannedPush[] = [];
  const skipped: SkippedPush[] = [];
  const seen = new Set<string>();

  for (const session of sessions) {
    if (options.since && localDate(session.started) < options.since) {
      skipped.push({ id: session.id, reason: "before-since" });
      continue;
    }
    const push = sessionToPush(session, options);
    if (!push) {
      skipped.push({ id: session.id, reason: "no-url" });
      continue;
    }
    if (existing.has(push.url) || seen.has(push.url)) {
      skipped.push({ id: session.id, reason: "already-saved" });
      continue;
    }
    seen.add(push.url);
    planned.push(push);
  }

  return { planned, skipped };
}
