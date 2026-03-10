# Project Handoff

**Project**: Raycast Extensions (OmniFocus Custom)
**Location**: `/Users/loudog/code/raycast/extensions/omnifocus/`
**Date**: 2026-03-10
**Milestone**: 001 - omnifocus-extension-scaffolded

---

## Goal
Build a custom OmniFocus Raycast extension with a "Quick Add Anywhere" command that lets you fuzzy search projects and tasks, then create a task or subtask at the selected destination with full property support (name, tags, due, repeat, flag, note).

## Current Progress

### Completed
- [x] Researched official OmniFocus Raycast extension (by nicolas-marien) — architecture, JXA patterns, capabilities/gaps
- [x] Researched OmniFocus automation APIs (JXA, Omni Automation, URL schemes)
- [x] Scaffolded standalone extension at `extensions/omnifocus/` (named `omnifocus-custom` to avoid store conflict)
- [x] Implemented JXA execution layer (`execute-script.ts`, `escape-jxa.ts`)
- [x] Implemented destination fetching — single JXA call returns Inbox + active projects + tasks with breadcrumb hierarchy
- [x] Implemented task creation API — supports inbox, project, and subtask destinations with tag assignment
- [x] Implemented repeat rule API via Omni Automation bridge (`evaluateJavascript`)
- [x] Built destination picker UI (List with fuzzy search, icons by type, depth indicators)
- [x] Built task form UI (name, flag, tags, due date, repeat presets + custom, repeat method, note)
- [x] Fixed JXA gotchas: status enum coercion, `whose()` crash, `humanReadableOutput` double-quoting
- [x] Destination list loads successfully in Raycast (confirmed working)
- [x] Build and lint pass clean
- [x] Updated CLAUDE.md with OmniFocus extension docs, fork workflow, and current Raycast best practices
- [x] Committed and pushed to main

### Not Yet Tested
- [ ] Actually creating a task via the form (end-to-end)
- [ ] Subtask creation under an existing task
- [ ] Tag assignment (existing + new tags)
- [ ] Repeat rule assignment
- [ ] Due date assignment

### Future Ideas
- [ ] Consider forking the store OmniFocus extension instead (Raycast Fork Extension action) to get existing commands (list tasks, perspectives, complete/delete) for free
- [ ] Add more commands: list tasks, complete task, quick add to inbox (no-view)
- [ ] Upgrade to current `@raycast/api` ^1.104 and `@raycast/utils` ^2.2 (requires React 19)
- [ ] Migrate from `.eslintrc.json` to `eslint.config.mjs` (ESLint 9 flat config)

## What Worked
- JXA via `runAppleScript` with `language: "JavaScript"` — reliable once gotchas are handled
- `humanReadableOutput: true` — clean JSON output, no double-quoting issues
- `String()` coercion for OmniFocus enum comparison
- JS-side filtering instead of JXA `whose()` clauses
- `usePromise` instead of `useCachedPromise` to avoid stale cache during development
- Single JXA call for all destinations (~0.3s for typical database)

## What Didn't Work
- `whose({ status: { _equals: 'active status' } })` — throws "Can't convert types" error
- `humanReadableOutput: false` (`-ss` flag) — wraps output in quotes, breaks JSON.parse
- `useCachedPromise` — cached a bad value from first broken run, persisted across code fixes
- JXA `repetitionRule` setter — crashes OmniFocus, must use Omni Automation bridge
- `effectivelyDropped()` — may not exist in all OmniFocus versions

## Blocking Issues
None — extension is functional, just needs end-to-end testing.

## Next Steps (in order)
1. Test creating a task via the form in Raycast (end-to-end)
2. Test subtask creation, tags, repeat, due date
3. Fix any issues found during testing
4. Decide whether to keep standalone or fork the store extension

## Key Files
- `extensions/omnifocus/src/quick-add-anywhere.tsx` - Main command: destination picker + task form
- `extensions/omnifocus/src/lib/api/list-destinations.ts` - JXA script fetching all projects/tasks
- `extensions/omnifocus/src/lib/api/add-task.ts` - Task creation at any destination
- `extensions/omnifocus/src/lib/api/set-repetition.ts` - Repeat rules via Omni Automation
- `extensions/omnifocus/src/lib/utils/execute-script.ts` - Core JXA runner
- `extensions/omnifocus/src/lib/utils/escape-jxa.ts` - String escaping for injection safety
- `extensions/omnifocus/src/lib/types.ts` - TypeScript types
- `CLAUDE.md` - Full project documentation including OmniFocus architecture and Raycast best practices

## Notes
- Extension is named `omnifocus-custom` in package.json to avoid conflict with store extension `omnifocus` (by nicolas-marien)
- The store extension is still installed and functional — both coexist
- OmniFocus Pro is required for JXA automation
- Plan file from this session: `~/.claude/plans/swift-noodling-sun.md`
