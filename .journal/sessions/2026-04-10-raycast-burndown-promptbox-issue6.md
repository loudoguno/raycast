---
date: "2026-04-10"
started_at: "01:37"
logged_at: "14:24"
duration: "~13 hours (overnight session, logged mid-day)"
session_id: "ec67d0fb-e429-4b78-b628-b8e1eec2adff"
machine: "mx3 (MacBook Pro, Apple M3 Max, 128 GB)"
location: "Somerset, Kentucky"
agents_used: 1
commits:
  - "906b032 — Fix terminal detection: add full paths for Terminal.app in Utilities folder"
  - "89bebd5 — Fix: promptbox default view — flat list sorted by most recently edited (burn branch)"
transcript: "transcripts/ec67d0fb-e429-4b78-b628-b8e1eec2adff.jsonl"
tags: [burndown, promptbox, feedback-loop, issue-fix]
---

# Session: Raycast Burndown — Promptbox Issue #6 + Feedback-Loop Terminal Fix

## Summary

Ran the raycast-burndown agent workflow against a single GitHub issue: #6 on the promptbox extension ("default view should show items with most recently edited at the top and not grouped by folder"). Fixed the view to be a flat sorted list and closed the issue. Also committed a pending fix to feedback-loop's terminal detection logic (Terminal.app path). Two branches remain unmerged to main.

## What was accomplished

### Phase 0: Git Housekeeping
- Committed pending `feedback-loop/src/lib/terminal.ts` change on `claude/refine-local-plan-HcDrL`
- Pushed, rebased on main, created `burn/promptbox-issue6-20260407-0138`

### Phase 1: Fix feedback-loop terminal detection (commit 906b032)
- `extensions/feedback-loop/src/lib/terminal.ts`: `getTerminalApp()` now checks full absolute paths
- Added `/System/Applications/Utilities/Terminal.app` as first check (correct macOS path)
- Old code only checked `/Applications/Terminal.app` which doesn't exist on macOS
- Committed on `claude/refine-local-plan-HcDrL`, pushed

### Phase 2: Fix promptbox default view — issue #6 (commit 89bebd5)
- `extensions/promptbox/src/browse-promptbox.tsx`
- **Removed** `STAGE_ORDER.map()` + `<List.Section>` grouping
- **Added** `sortedPrompts` — flat array of all prompts sorted by `updated` desc
- **Added** stage tag accessory `{ tag: { value: p.stage, color } }` — replaces the section header for stage identification
- Build passed, committed, branch pushed
- GitHub issue #6 commented and closed

## Key decisions

1. **Add stage tag accessory** — Without sections, users lose the visual folder context. Added a colored pill tag showing `inbox`/`wip`/`outbox`/`complete` inline on each item. The icon tintColor already conveys stage, but the text tag makes it explicit and searchable.

2. **Use string comparison for ISO dates** — `updated` field is a YYYY-MM-DD string. Lexicographic comparison is correct for ISO dates. Items without `updated` get `""` and sink to the bottom.

## Files created

- Modified: `extensions/feedback-loop/src/lib/terminal.ts` (terminal path detection)
- Modified: `extensions/promptbox/src/browse-promptbox.tsx` (flat sorted view)

## Open issues

- **CRITICAL**: `browse-promptbox.tsx` was reverted after the burn branch commit (system-reminder from linter/manual edit). The fix is on `burn/promptbox-issue6-20260407-0138` at commit `89bebd5` but **has NOT been merged to main**. GitHub issue #6 is closed but the actual code may not be live on main.
- `claude/refine-local-plan-HcDrL` is unmerged — has the terminal.ts fix
- 50 doc drift items in PAI doc review queue (unrelated but worth addressing)

## What a future agent needs to know

- **Branch state**: `burn/promptbox-issue6-20260407-0138` has the working promptbox fix. Main does NOT have it. Do `git merge burn/promptbox-issue6-20260407-0138` to apply it.
- **Verify the fix is intact**: Before merging, check that `browse-promptbox.tsx` on the burn branch still has the flat `sortedPrompts` render (not the `STAGE_ORDER.map` + `List.Section` version). The file was reverted on the working tree at session end.
- **Build required after merge**: `cd extensions/promptbox && npm run build`
- **Terminal detection fix**: Is already on `claude/refine-local-plan-HcDrL`. Cherry-pick commit `906b032` to main if that branch isn't being merged: `git cherry-pick 906b032`
- **promptbox architecture**: Prompts live as markdown files with gray-matter frontmatter in stage-named directories. `STAGE_DIRS` in `lib/constants.ts` maps stage names to paths. Moving prompts = rewriting frontmatter + moving file.
- **Issue tracking**: GitHub Issues on `loudoguno/raycast` with labels `feedback`, `ext:<package-name>`. Burn agent = `~/.claude/agents/raycast-burndown.md`
- **OmniFocus task created**: "Raycast: Merge promptbox #6 fix + resolve open branches" was added to the `~/code/raycast/ (extensions and scripts)` project with full context notes.
