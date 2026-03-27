---
date: "2026-03-10"
started_at: "~10:00"
logged_at: "17:55"
duration: "estimated full day"
session_id: "multiple"
machine: "mx3"
commits:
  - "5d8c986 — Add OmniFocus Raycast extension with Quick Add Anywhere command"
  - "8ae7b48 — Rename omnifocus extension to omnifocus-custom to avoid store conflict"
  - "5a7b909 — Document Raycast Fork Extension workflow in CLAUDE.md"
  - "a0dd6cb — Update CLAUDE.md to reflect current Raycast development practices"
  - "61046dd — Add session handoff: OmniFocus extension scaffolded (milestone 001)"
  - "1743650 — Add type filter (Cmd+P) and fix project icons in OmniFocus extension"
  - "33c4c0b — Fix folders, add new tags field, markdown link copy, reorder actions"
  - "7e472ad — Add Show Today command center and Quick Add to Inbox"
  - "08c0eeb — Add post-merge hook for auto-rebuild and mxb setup instructions"
  - "41b1f68 — Fix session matching and add session name display in Claude Sessions extension"
tags: [omnifocus, jxa, claude-sessions, journal, big-day]
---

# Session: OmniFocus Full Build + Claude Sessions Fixes + Journal Setup

## Summary

A massive day on mx3 that produced the OmniFocus extension (3 commands, 5 API modules), fixed critical session matching in the Claude Sessions extension, built the `/check-omnifocus` skill for bidirectional OmniFocus-Claude Code integration, and set up the CloudClaude journal vault with Obsidian and an HTML changelog dashboard.

## What was accomplished

### OmniFocus Extension (primary work)

Took the OmniFocus extension from a basic "Quick Add Anywhere" scaffolding to a full-featured control center:

1. **Quick Add Anywhere** -- Browse all projects, tasks, folders, and tags with fuzzy search. Select a destination and create a task/subtask with full metadata. Added `Cmd+P` type filter dropdown, folder/tag support, and new actions (open in OmniFocus, copy URL, copy markdown link).

2. **Show Today** -- Daily command center with 4 auto-sorted sections: Overdue, Due Today, Flagged, Due Soon. Full action panel with complete (`Cmd+D`), reschedule presets (`Cmd+E`), flag toggle, defer presets, and "Complete & Await Reply" (`Cmd+Shift+W`).

3. **Quick Add to Inbox** -- Zero-UI `no-view` command for instant inbox capture via global hotkey.

Built 5 new JXA API modules: `list-today-tasks.ts`, `complete-task.ts`, `complete-and-await.ts`, `update-task-date.ts`, `toggle-flag.ts`. Fixed `list-destinations.ts` (folders were being silently skipped because `folder.status()` doesn't exist in JXA).

### OmniFocus Integration Skill

Created the `/check-omnifocus` Claude Code slash command -- a bridge that lets Claude query OmniFocus as a project issue tracker. Uses JXA for reading task data and Omni Automation bridge (`app.evaluateJavascript()`) for attachments and writes. Can extract screenshots from OmniFocus task attachments via `att.contents.toBase64()`.

Added `omnifocus_project:` mapping to CLAUDE.md so any project can link to its OmniFocus tracking project.

### Claude Sessions Extension Fixes

Fixed critical session matching that left 4 of 7 sessions without data:

- **Old matching** (broken): Compared process start time to JSONL birth time within 10 seconds. Claude Code takes 10-100+ seconds to create the JSONL, so most sessions never matched.
- **New matching** (CWD-based): Batch-fetch CWDs via `lsof`, match to JSONL `cwd` field, use birth time as tiebreaker for multiple JSONLs sharing a CWD.

Added session name extraction from `/rename` commands in JSONL transcripts. Display priority: session name > cleaned Terminal tab title > first user prompt > directory basename.

Filtered out non-interactive processes (subagents, `-p` one-shots with TTY `??`).

### Post-merge Hook

Created `hooks/post-merge` (version-controlled) for auto-rebuilding changed extensions after `git pull`. Diffs ORIG_HEAD vs HEAD to find which `extensions/` directories changed, runs `npm run build` only for those.

### Journal Vault Setup

Set up the CloudClaude journal system with Obsidian vault integration and an auto-generated HTML changelog dashboard. The `/write-in-your-journal` command writes session summaries, updates daily notes, and rebuilds the dashboard. Not directly raycast code, but established the session documentation workflow used going forward.

## Key decisions

- **JXA over AppleScript** for OmniFocus -- JXA gives JavaScript syntax and easier JSON handling. But it has limitations: can't access attachments or call `markComplete()`, so those go through the Omni Automation bridge.
- **CWD-based session matching** over time-based -- far more reliable since Claude Code's startup time is unpredictable.
- **`usePromise` over `useCachedPromise`** for OmniFocus data fetching -- avoids stale cache showing completed tasks. (This is the opposite choice from what Search Status Menu later made, where stale cache is acceptable.)
- **Post-merge hook as a symlink** -- stored in `hooks/post-merge` (tracked by git), symlinked from `.git/hooks/post-merge`. Each machine needs the symlink created once.
- **`humanReadableOutput: true`** in `runAppleScript` -- the `-ss` flag causes double-quoting issues with JXA output.

## Files created

- `extensions/omnifocus/src/show-today.tsx` -- daily command center
- `extensions/omnifocus/src/quick-add-inbox.tsx` -- zero-UI capture
- `extensions/omnifocus/src/lib/api/list-today-tasks.ts`, `complete-task.ts`, `complete-and-await.ts`, `update-task-date.ts`, `toggle-flag.ts` -- JXA API modules
- `extensions/claude-sessions/src/list-sessions.tsx` -- major rewrite for CWD matching + session names
- `hooks/post-merge` -- git post-merge auto-rebuild hook
- `~/.claude/commands/check-omnifocus.md` -- OmniFocus integration skill

## What a future agent needs to know

### OmniFocus JXA gotchas (critical)
- `folder.status()` does not exist in JXA -- unlike projects, folders have no status. Calling it throws silently, causing folders to be skipped.
- `String.repeat(-1)` crashes Node -- guard depth calculations with `Math.max(0, ...)`.
- `containingProject()` throws if a task is in the inbox -- always wrap in try/catch.
- `estimatedMinutes` may return null or 0 -- only display when > 0.
- OmniFocus status enum must be compared via `String()` coercion, not direct equality.
- `whose()` clauses can throw type conversion errors -- prefer JS-side filtering.
- `effectivelyDropped()` may not exist in all OF versions -- wrap in try/catch.
- JXA `-e` mode: don't wrap in IIFE -- last bare expression produces output.
- `flattenedTasks.byId()` doesn't exist in Omni Automation -- use `.find()` with `id.primaryKey`.

### Claude Sessions matching
- `lsof` exits code 1 if any PID in the list doesn't exist (session ended between `ps` and `lsof`). Fixed with `; true` suffix.
- Terminal.app's `custom title` returns the Claude status prefix (braille chars like `\u2810`). Stripped via regex.
- `settings.local.json` is gitignored -- each machine needs its own `Bash(osascript *)` permission.

### Post-merge hook setup
On any new machine or after clone: `ln -sf ../../hooks/post-merge .git/hooks/post-merge`

### "Complete & Await Reply" pattern
A beloved OmniFocus power-user workflow, now one keystroke: marks original task complete, creates "Waiting: {name}" duplicate in same project with "Waiting For" tag (auto-created if missing), defers to tomorrow 9 AM, due in 1 week.

### State of repo after this day
The OmniFocus extension went from scaffolding to fully functional with 3 commands. The Claude Sessions extension became usable for the first time (previously 4/7 sessions showed no data). The post-merge hook was created but needs the symlink on each machine.
