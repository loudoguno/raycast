/**
 * schema.ts — the session-index contract.
 *
 * ONE local index of every agent session and AI chat on this machine (plus the
 * fleet, via the agent-activity-graph). Fixed shape: other agents build against
 * it (Raycast command, the `ll` CLI, a lous-links push, a Codex voice sidecar).
 *
 * Created 2026-09-04 by sai-mx3, session "mx3: 🗂️ work-board first-principles sweep".
 * Related: WORK#85, the lous-links Raycast extension, the Codex voice sidecar.
 *
 * Bump SCHEMA_VERSION on any breaking field change and tell the consumers.
 */

export const SCHEMA_VERSION = 1;

/** Which harness produced the session. */
export const AGENTS = [
  "claude-code",
  "claude-code-bg",
  "claude-ai",
  "codex-cli",
  "codex-desktop",
  "hermes",
  "cowork",
  "other",
] as const;
export type Agent = (typeof AGENTS)[number];

/** Where it ran. `cloud` covers web surfaces and hosted runners. */
export const MACHINES = ["mx3", "mxb", "next-mbp", "neo", "cloud", "unknown"] as const;
export type Machine = (typeof MACHINES)[number];

/** Privacy ceiling: `summary` is the only free-text field, hard-capped here. */
export const SUMMARY_MAX = 200;

export interface Session {
  /** Stable id: session uuid / rollout id / hermes session id / AAG page title. */
  id: string;
  agent: Agent;
  machine: Machine;
  /** Best available title: custom > ai-generated > first prompt > filename. */
  title: string;
  /** One line if known, else null. */
  goal: string | null;
  /** ISO 8601. */
  started: string;
  /** ISO 8601, or null if still open / unknown. */
  ended: string | null;
  cwd: string | null;
  /** claude.ai code/chat URL, AAG page URL, chatgpt URL, or null. */
  url: string | null;
  /** Shell one-liner that resumes it, or null. */
  resume: string | null;
  /** Absolute path of the file this row came from. */
  source: string;
  /** AAG-style project wikilink targets, e.g. "project/voice-capture". */
  projects: string[];
  /** First user message, trimmed to SUMMARY_MAX. No other message bodies, ever. */
  summary: string | null;
  turns: number | null;
  tags: string[];
}

export interface SessionIndex {
  v: number;
  /** ISO 8601 generation time. */
  generated: string;
  machine: string;
  /** Sorted by `started` descending. */
  sessions: Session[];
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function isIso(v: unknown): boolean {
  return typeof v === "string" && ISO_RE.test(v) && !Number.isNaN(Date.parse(v));
}

function isStringArray(v: unknown): boolean {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/**
 * Structural validation of a whole index.
 * Returns every problem found rather than throwing on the first.
 */
export function validate(value: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, errors: ["index: not an object"] };
  }
  const idx = value as Record<string, unknown>;

  if (idx.v !== SCHEMA_VERSION) errors.push(`v: expected ${SCHEMA_VERSION}, got ${JSON.stringify(idx.v)}`);
  if (!isIso(idx.generated)) errors.push(`generated: not an ISO timestamp (${JSON.stringify(idx.generated)})`);
  if (typeof idx.machine !== "string" || idx.machine.length === 0) errors.push("machine: missing");

  if (!Array.isArray(idx.sessions)) {
    errors.push("sessions: not an array");
    return { ok: false, errors };
  }

  const seen = new Set<string>();
  let prev: number | null = null;
  idx.sessions.forEach((row, i) => {
    for (const e of validateSession(row, `sessions[${i}]`)) errors.push(e);
    const r = row as Record<string, unknown>;
    if (typeof r?.id === "string") {
      if (seen.has(r.id)) errors.push(`sessions[${i}]: duplicate id ${r.id}`);
      seen.add(r.id);
    }
    if (typeof r?.started === "string") {
      const t = Date.parse(r.started);
      if (!Number.isNaN(t)) {
        if (prev !== null && t > prev) errors.push(`sessions[${i}]: not sorted by started desc`);
        prev = t;
      }
    }
  });

  return { ok: errors.length === 0, errors };
}

/** Validate one row. Returns a list of problems (empty means valid). */
export function validateSession(value: unknown, label = "session"): string[] {
  const errors: string[] = [];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [`${label}: not an object`];
  }
  const s = value as Record<string, unknown>;

  if (typeof s.id !== "string" || s.id.length === 0) errors.push(`${label}.id: missing`);
  if (!AGENTS.includes(s.agent as Agent)) errors.push(`${label}.agent: invalid (${JSON.stringify(s.agent)})`);
  if (!MACHINES.includes(s.machine as Machine)) errors.push(`${label}.machine: invalid (${JSON.stringify(s.machine)})`);
  if (typeof s.title !== "string" || s.title.length === 0) errors.push(`${label}.title: missing`);
  if (s.goal !== null && typeof s.goal !== "string") errors.push(`${label}.goal: must be string|null`);
  if (typeof s.goal === "string") {
    // `goal` is one line, same ceiling as `summary`: it must never become a
    // second, unbounded free-text field.
    if (s.goal.includes("\n")) errors.push(`${label}.goal: must be a single line`);
    if (s.goal.length > SUMMARY_MAX) errors.push(`${label}.goal: exceeds ${SUMMARY_MAX} chars (${s.goal.length})`);
  }
  if (!isIso(s.started)) errors.push(`${label}.started: not an ISO timestamp`);
  if (s.ended !== null && !isIso(s.ended)) errors.push(`${label}.ended: must be ISO|null`);
  if (s.cwd !== null && typeof s.cwd !== "string") errors.push(`${label}.cwd: must be string|null`);
  if (s.url !== null && typeof s.url !== "string") errors.push(`${label}.url: must be string|null`);
  if (s.resume !== null && typeof s.resume !== "string") errors.push(`${label}.resume: must be string|null`);
  if (typeof s.source !== "string" || !s.source.startsWith("/")) errors.push(`${label}.source: must be an absolute path`);
  if (!isStringArray(s.projects)) errors.push(`${label}.projects: must be string[]`);
  if (s.summary !== null && typeof s.summary !== "string") errors.push(`${label}.summary: must be string|null`);
  if (typeof s.summary === "string" && s.summary.length > SUMMARY_MAX) {
    errors.push(`${label}.summary: exceeds ${SUMMARY_MAX} chars (${s.summary.length})`);
  }
  if (s.turns !== null && !(typeof s.turns === "number" && Number.isInteger(s.turns) && s.turns >= 0)) {
    errors.push(`${label}.turns: must be a non-negative integer|null`);
  }
  if (!isStringArray(s.tags)) errors.push(`${label}.tags: must be string[]`);

  return errors;
}

/** Collapse whitespace and hard-cap at SUMMARY_MAX. The privacy gate. */
export function trimSummary(text: string | null | undefined): string | null {
  if (typeof text !== "string") return null;
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  return flat.length <= SUMMARY_MAX ? flat : flat.slice(0, SUMMARY_MAX - 1).trimEnd() + "…";
}
