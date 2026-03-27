---
date: "2026-03-13"
started_at: "17:06"
logged_at: "10:39"
duration: "estimated 3h"
session_id: "e5703efc-4891-46d0-b3f4-300b03c7b31e"
machine: "mx3"
commits: []
tags: [omnifocus, skill-development, jxa, investigation]
---

# Session: OmniFocus UUID Migration + LouTools Remote Mode Investigation

## Summary

Overhauled the `/check-omnifocus` skill to use UUID-based project association instead of fragile name matching, and conducted a massive investigation session for the LouTools Remote Mode module (separate repo but informs future raycast extension work).

## What was accomplished

### /check-omnifocus UUID Migration

Replaced `omnifocus_project: "Name"` with `omnifocus_id: UUID  # Name` in CLAUDE.md files across all linked projects. The need was proven in real-time: the Raycast project had been renamed from "Create OmniFocus Raycast Extension:" to "OmniFocus Raycast extension" and the old name-based lookup silently failed.

Added auto-create flow: when `/check-omnifocus` runs in a directory with no linked OmniFocus project, it offers to create one. Derives name from filesystem path, picks folder via path-prefix heuristic, creates project with `file:///` and GitHub links in the note, writes UUID back to CLAUDE.md.

Established filesystem-path naming convention for OmniFocus projects (e.g., `~/code/raycast` instead of "Raycast Extensions").

### LouTools Remote Mode Investigation (raycast-adjacent)

Deployed 10 parallel agents to research a system for controlling media apps (YouTube, Spotify, etc.) without switching windows. Key finding: Chrome's AppleScript `execute javascript` does NOT steal focus, eliminating the core limitation of the old Keyboard Maestro-based system.

Set up `~/code/LouTools` repo with architecture docs. This later led to the `extensions/loutools` Raycast extension (13 commands for remote media control).

## Key decisions

- **UUID over project name** for OmniFocus linking -- names change, UUIDs are stable (mostly -- see gotcha below).
- **Filesystem-path naming** for OmniFocus projects -- `~/code/raycast` is more findable than "Raycast Extensions".
- **Two scripting layers** for OmniFocus: JXA for reading (simpler), Omni Automation bridge for writes and attachments (JXA throws "Access not allowed" on writes).

## Files created

- Updated `~/code/raycast/CLAUDE.md` -- migrated from `omnifocus_project:` to `omnifocus_id:` at line 1
- Updated `extensions/claude-sessions/CLAUDE.md` -- same migration
- `~/code/LouTools/` -- new repo (separate from this one)

## What a future agent needs to know

### OmniFocus UUID stability warning
OmniFocus UUIDs can shift during sync between machines. Observed `dYSEErhzWgu` changing to `nZE86i0HgFd` for the Journal project. This is a known fragility -- still far more reliable than name matching, but not 100% stable. If `/check-omnifocus` fails to find a project by UUID, it should fall back to searching by name before offering to create a new one.

### OmniFocus API layers
- **JXA** (`osascript -l JavaScript`): Good for reading. Returns JSON easily. Cannot write reliably.
- **Omni Automation bridge** (`app.evaluateJavascript()`): Required for `markComplete()`, `markDropped()` (which doesn't exist -- use `markComplete()`), attachments, and creating items. Uses `id.primaryKey` for lookups.
- **`flattenedTasks.byId()` doesn't exist** in Omni Automation -- use `.find()`.
- **`moveSections()`** is correct for moving projects between folders (not `moveTasks()` or `moveProjects()`).
- **No IIFEs in JXA `-e` mode** -- the last expression must be bare for output.

### LouTools relevance to this repo
The `extensions/loutools/` directory contains a Raycast extension that wraps the `/usr/local/bin/loutools` CLI binary. The binary itself lives in `~/code/LouTools` (separate Swift monorepo). The Raycast extension is just a thin shell-out layer.
