# `sessions/` — one index of every agent session and AI chat

> **Provenance.** Created 2026-09-04 by **sai-mx3**, session
> `mx3: 🗂️ work-board first-principles sweep`.
> Related: [WORK#85](https://github.com/loudoguno/WORK/issues/85), the
> **lous-links** Raycast extension (this repo, `src/` + `cli/`), and the Codex
> voice sidecar.
> Required? Optional today — nothing else breaks without it. It exists so the
> planned **Agent Sessions** tab in lous-links has a data layer to read.

Lou's ask, verbatim: *"something i desperately need in loulinks is a tab for
agent sessions and ai chats where all my claude, codex and hermes sessions are
searchable from the same interface."*

This directory is that data layer, and nothing more: **one local JSON index of
every agent session and AI chat on this machine** (plus the fleet, via the
agent-activity-graph), regenerable in about a second, with a stable schema that
a Raycast command, the `ll` CLI, a lous-links push and a Codex voice sidecar can
all read. It renders nothing and serves nothing.

```
sessions/
  collect.ts       the collector + CLI
  schema.ts        the type, the constants, validate()
  collect.test.ts  bun test, synthetic fixtures only
  README.md        this file
```

Scope note: this directory is self-contained. It does not touch `package.json`,
`src/`, `cli/`, or anything else in the extension.

---

## Run it

```sh
cd extensions/lous-links/sessions
bun collect.ts --stats
```

```
bun collect.ts [--out <path>] [--stats] [--since YYYY-MM-DD] [--json]
               [--fleet] [--no-chatgpt] [--no-cache]
```

| Flag | Meaning |
|---|---|
| `--out <path>` | Index path. Default `~/.local/share/lous-links/sessions.json` (directory created if missing). |
| `--stats` | Print `{"sessions":N,"by_agent":{…},"by_machine":{…},"seconds":x}`. |
| `--since YYYY-MM-DD` | Keep only sessions started on or after this date. Exits `2` on a malformed date. |
| `--json` | Print the whole index to stdout as well as writing it. |
| `--fleet` | Also `ssh next-mbp` for its Claude Code + Codex sessions. Off by default so the normal path needs no network. |
| `--no-chatgpt` | Skip the ChatGPT export shards. |
| `--no-cache` | Ignore the mtime cache and re-read every transcript. |

Properties that hold: **read-only on every source**, **no network** (unless you
pass `--fleet`), and **idempotent** — same inputs, same index.

**Speed.** ~1.3s cold over 608 MB of transcripts, ~0.7s warm. A sidecar
`sessions.cache.json` keyed on `path + mtime + size` skips re-parsing unchanged
transcripts; `--no-cache` forces a full re-read. Two things make the cold path
cheap: transcripts are scanned with `indexOf`/`startsWith` over the raw text
rather than `split("\n")` (no per-line allocation for the ~99% of lines nothing
needs), and the title/bridge sidecar records are found with a single
`lastIndexOf` per record type instead of a full parse.

---

## Schema

`schema.ts` is the contract. `v: 1`. Other agents build against it, so a
breaking field change means bumping `SCHEMA_VERSION` and telling them.

```jsonc
{ "v": 1, "generated": "<ISO>", "machine": "mx3",
  "sessions": [ {
    "id":       "<session uuid / rollout id / hermes id / AAG page title>",
    "agent":    "claude-code" | "claude-code-bg" | "claude-ai" | "codex-cli"
              | "codex-desktop" | "hermes" | "cowork" | "other",
    "machine":  "mx3" | "mxb" | "next-mbp" | "neo" | "cloud" | "unknown",
    "title":    "<best available>",
    "goal":     "<one line, ≤200 chars>" | null,
    "started":  "<ISO>",  "ended": "<ISO>" | null,
    "cwd":      "<path>" | null,
    "url":      "<https://claude.ai/code/session_… | …/chat/<uuid> | AAG page | chatgpt.com/c/<id>>" | null,
    "resume":   "<claude --resume <id> | codex resume <id>>" | null,
    "source":   "<absolute path of the file this row came from>",
    "projects": ["project/…"],
    "summary":  "<first user message, ≤200 chars>" | null,
    "turns":    <int> | null,
    "tags":     ["session", "agent:<agent>", "machine:<machine>", …]
  } ] }
```

Sorted by `started` **descending**. `validate(index)` returns
`{ok, errors[]}` and checks types, the agent/machine enums, ISO timestamps,
absolute `source` paths, the sort order, id uniqueness, and both free-text caps.
It reports every problem rather than throwing on the first.

### Dedupe and merge

Rows are deduped by `id`. When one session shows up in more than one source —
typically a Claude Code `.jsonl` **and** an agent-activity-graph page — the two
are merged field by field:

- the **graph page** wins on `title`, `goal`, `projects`, `url`
- the **local file** wins on `cwd`, `turns`, `summary`, `source`
- `machine` prefers the graph (it knows the fleet); `agent` prefers the local
  file (it knows `bg` sessions); `tags` are unioned and sorted

Merging is decided by which source a row came from, never by input order, so the
result is deterministic.

---

## Sources, and the shapes actually found

Every parser below was written after reading the real files on mx3 on
2026-09-04. Counts are from that day.

### 1. Claude Code — `~/.claude/projects/<encoded-cwd>/<uuid>.jsonl`

140 project dirs, **1584 top-level transcripts**, 608 MB. Only depth-1 `*.jsonl`
files are sessions; `<uuid>/subagents/` and `<uuid>/tool-results/` (which bring
the raw file count to 2178) are subagent and tool spill, not Lou's sessions.
Records carrying `isSidechain: true` are skipped for the same reason.

**The key finding: the custom session title is stored as its own sidecar record
inside the transcript**, not in a separate file and not in the header. Each
retitle appends a fresh record, so the *last* one wins:

```jsonc
{"type":"custom-title", "customTitle":"sai-mx3: 🔴⌚️ voice-memo-inbox_initial-exploration", "sessionId":"…"}
{"type":"ai-title",     "aiTitle":"Voice Memos asynchronous agentic workflow",             "sessionId":"…"}
{"type":"agent-name",   "agentName":"…",                                                   "sessionId":"…"}
{"type":"bridge-session","bridgeSessionId":"cse_01VHQEkKNdGNdzTeeGQHoPvz","sessionId":"…"}
{"type":"cost-state",   "startTime":1788540460279, "totalDuration":34728224, …}
```

Title precedence: `custom-title` → `ai-title` → first user prompt → filename.

**The bridge-id gotcha.** The same id is written with two different prefixes.
`~/.claude/sessions/<pid>.json` (live sessions only, keyed by pid, also holding
`name`, `nameSource`, `cwd`, `startedAt`) says
`session_01VHQEkKNdGNdzTeeGQHoPvz`, while the transcript's `bridge-session`
record says `cse_01VHQEkKNdGNdzTeeGQHoPvz` — **same suffix, different prefix**.
The claude.ai URL wants the `session_` form, so `bridgeUrl()` strips whatever
prefix it is given and rebuilds `https://claude.ai/code/session_<suffix>`.

Other fields: `sessionId`, `cwd`, `timestamp` from the head; `sessionKind: "bg"`
marks a background session (`claude-code-bg`); `turns` counts unescaped
`,"type":"user",` occurrences, which only appear at the top level of a record
because any transcript quoted inside a tool result is backslash-escaped.

### 2. Background agents — `claude agents --json --all`

`{id, cwd, kind, startedAt, sessionId, name, state}`. Indexed as
`claude-code-bg`; rows merge with the matching transcript when one exists.
`source` points at `~/.claude/jobs`, the directory that actually backs them.

### 3. claude.ai chats — the export in `~/code/vehicular-agentic-computing`

`exports/claude-ai-2026-08-27/conversations-000.zip` → `conversations.json`
(18 MB compressed, 70 MB raw, **575 conversations**). It is left zipped and
streamed with `unzip -p`; a pre-extracted `conversations.json` beside the zip is
used if present. Shape:
`{uuid, name, summary, created_at, updated_at, chat_messages:[{uuid, sender, text, created_at}]}`.

`url` = `https://claude.ai/chat/<uuid>`. The export's own `summary` is a
multi-paragraph overview, so it is flattened and capped into the one-line `goal`
rather than stored whole.

### 4. Codex CLI — `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` + `~/.codex/archived_sessions/`

141 live + 71 archived = **212 files, but only 125 distinct session ids**: a
resumed session writes a new rollout file under the same id, and 17 archived ids
are still present live. Dedupe collapses them, which is why the codex count is
lower than the file count.

First line is `session_meta`:

```jsonc
{"timestamp":"…","type":"session_meta","payload":{
  "session_id":"01a06f67-…","id":"01a06f67-…","timestamp":"…",
  "cwd":"/Users/loudog/Documents/ChatGPT/lifeos-codex-helper",
  "originator":"Codex Desktop","cli_version":"0.153.1","source":"vscode"}}
```

`originator` matching `/desktop/i` → `codex-desktop`, else `codex-cli`.
`resume` = `codex resume <id>`. Title comes from the first real user message —
which is *not* the first user record: Codex injects a `<recommended_plugins>`
block ahead of it, so injected wrappers are skipped.

### 5. Codex Desktop — `~/.codex/.codex-global-state.json` + `~/Documents/Codex/`

The 1.6 MB state file is parsed, never printed. Useful keys:
`thread-titles.titles` (thread id → title), `thread-workspace-root-hints`
(thread id → cwd), `thread-project-assignments` + `local-projects` (thread id →
project name). These enrich rollout rows by id.

`~/Documents/Codex/<date>/<slug>/` holds **63 project dirs**. A dir whose path
already appears as some rollout's `cwd` is dropped as a duplicate; the remaining
20 become `codex-desktop` rows with the slug as the title.

### 6. Hermes — `~/.hermes/state.db` (SQLite)

54 rows in `sessions`, by `source`: `cron` 31, `cli` 14, `subagent` 5,
`telegram` 2, `desktop` 2. The 5 `subagent` rows are Hermes' own internal
fan-out, not Lou's conversations, so they are dropped — **49 indexed**. Columns
used: `id, source, chat_type, display_name, title, started_at, ended_at,
message_count, cwd`, plus the earliest `messages.role='user'` row for the
summary. `started_at` is epoch **seconds** (float), not milliseconds.

**The WAL gotcha.** `state.db` runs in WAL mode. Copying only `state.db` to
`/tmp` and opening it with `{readonly: true}` fails with
`SQLiteError: unable to open database file`, because SQLite must create a `-shm`
to read a WAL database and cannot when readonly. So the collector copies
`state.db`, `state.db-wal` and `state.db-shm` together and opens **the copy**
read-write (SQLite may then create what it needs, and any uncheckpointed commits
in the WAL are visible). The real `state.db` is never opened or modified; all
three temp files are removed afterwards.

### 7. Agent Activity Graph — `~/vaults/agent-activity-graph/pages/session___*.md`

**22 session pages**, fleet-wide. A `key:: value` property block terminated by
the first `- ` bullet, then a `## Goal` bullet:

```
title:: session/2026-09-04/sai-mx3/voice-memo-inbox-initial-exploration
type:: session
agent:: [[agent/sai-mx3]]
machine:: [[machine/mx3]]
surface:: [[surface/claude-code]]
session-name:: 🔴⌚️ voice-memo-inbox_initial-exploration
session-id:: 47ec97a4-1b8e-452d-a7e1-b2fa9ffc97e7
session-url:: https://claude.ai/code/session_01VHQEkKNdGNdzTeeGQHoPvz
resume:: `claude --resume 47ec97a4-…`
projects:: [[project/voice-capture]], [[project/synapse]]
started:: 2026-09-04 12:53
ended:: 2026-09-04 12:58
```

Agent mapping: `agent/sai-*` → `claude-code`, `agent/codex-*` → `codex-cli`
(or `codex-desktop` if the surface says so), `agent/cowork` → `cowork`,
`agent/claude-*` → `claude-ai`, `agent/hermes` → `hermes`,
`agent/chatgpt*` → `other`. `machine/web` → `cloud`; unrecognised machines →
`unknown`. `url` = `session-url` if present, else the GitHub page URL. Missing
`session-id` falls back to the page title as the id. This is the only source
that contributes fleet rows without `--fleet`.

### 8. ChatGPT — the same export tree (on by default)

`exports/chatgpt-2026-08-27/chatgpt-export-full.zip` (2.7 GB) contains **39
`conversations-NNN.json` shards**, streamed one at a time with `unzip -p`.
Because zip is randomly accessible this costs only ~0.7s for **3863
conversations**, so it is indexed by default; `--no-chatgpt` opts out. Shape:
`{id, conversation_id, title, create_time, update_time, mapping:{…}}`, where
`create_time` is epoch seconds and user messages live at
`mapping[*].message.author.role === "user"` with text in `content.parts[]`
(strings; multimodal turns mix in objects, which are ignored). Indexed as agent
`other` with tag `chatgpt`, `url = https://chatgpt.com/c/<id>`. 3195 of 3863
have a summary — the rest are voice or image-only turns. `source` is written as
`<zip path>!<entry>` to name the shard inside the archive.

### 9. next-mbp — `--fleet` only

Verified reachable (16 project dirs). The remote shell streams, per transcript,
only the first 4 KB, the trailing `custom-title`/`ai-title`/`bridge-session`
records, a true turn count and the last timestamp — never message bodies. Adds
57 rows in ~2.3s. Off by default so the normal path stays offline.

---

## Privacy

- `summary` and `goal` are the **only** free-text fields, each hard-capped at
  200 characters and validated at that ceiling. `summary` is the first user
  message only; `goal` is one line.
- **No message bodies** beyond those two fields. No assistant output, no tool
  results, no file contents, no secrets.
- Harness scaffolding is deliberately excluded from `summary` — `<system-reminder>`,
  `<command-name>`, `<local-command-caveat>`, `<recommended_plugins>`,
  `CONTEXT:` / `RECENT CONVERSATION:` resume preambles and the like are skipped
  so the field holds something Lou actually typed. Verified: 0 rows leak
  scaffolding.
- Rows are written **only** to the local index file (default
  `~/.local/share/lous-links/sessions.json`, outside this repo). Nothing is
  uploaded, and the collector makes no network calls without `--fleet`.
- Sources are opened read-only. The one copy made (Hermes' WAL set) goes to
  `/tmp` and is deleted in a `finally`.
- Before any of this is pushed to lous-links or exposed beyond localhost,
  re-read this section: titles alone can be sensitive.

---

## Tests

```sh
bun test
```

43 tests. **Every fixture is synthetic** — the shapes are copied from the real
sources, the content is invented, and no real session data lives in this repo.
Each source parser is covered, along with the merge rules, the sort order, the
injected-text filter, the `cse_`/`session_` bridge normalisation and the schema
caps.
