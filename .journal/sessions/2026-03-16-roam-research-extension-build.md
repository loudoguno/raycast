---
date: "2026-03-16"
started_at: "16:21"
logged_at: "23:23"
duration: "estimated 7h"
session_id: "6a9b38cf-a728-43bc-a0e2-662f23ccc347"
machine: "mx3"
commits:
  - "e1745c2 — Migrate omnifocus tracking from project name to ID format"
  - "3a75761 — Gitignore beads lock files and algorithm MEMORY directory"
  - "5b4f0d0 — Add RoamResearch extension — zero-friction search and preview"
  - "2952323 — Document RoamResearch extension and update fork-vs-fresh guidance"
  - "aa9c70d — Link RoamResearch extension to OmniFocus project"
tags: [roam-research, extension, fresh-build, api]
---

# Session: RoamResearch Extension -- Full Build from Scratch

## Summary

Built a custom Raycast extension for Roam Research from scratch (not forked from the Raycast Store extension). The Store extension requires graph picking, 2+ character minimum, and 500ms debounce. The new extension skips the graph picker, pre-populates with recently edited blocks, searches on first keystroke, and provides rich block previews with nested children and linked references.

## What was accomplished

Built 4 commands and a full library layer:

1. **Search** -- zero-friction search: skips graph picker (uses Primary Graph preference), shows recently edited blocks on open (Datalog `:edit/time` query, last 48h), fires search on first keystroke, rich Detail preview with 3 levels of child blocks and linked references with clickable `[[page]]` deeplinks.

2. **Quick Capture** -- append notes to daily page or any page.

3. **Daily Note** -- one-keystroke open of today's daily note (`no-view` mode).

4. **Add Graph** -- graph setup with API token validation.

Library layer:
- `roam-client.ts` -- vendored minimal Roam API client (q, pull, search, createBlock, batchActions) with peer URL caching. Strongly typed, no `any`.
- `roam-api.ts` -- high-level operations (searchGraph, fetchRecentEdits, fetchBackRefs, getAllPages).
- `graph-config.ts` -- graph config via Raycast `LocalStorage` (replaces the Store extension's broken `usePersistentState`).
- `markdown.ts` -- Roam-to-Raycast markdown rendering: `[[page links]]` as `raycast://` deeplinks, `((block refs))` resolution, `{{[[TODO]]}}` checkboxes, search term highlighting, nested children sorted by `:block/order`, linked references section.

Also committed the OmniFocus UUID migration (from 03-13 session) and beads lock file gitignore updates.

## Key decisions

- **Fresh build over fork** -- the Store extension had too much friction and broken patterns (`usePersistentState`, mandatory graph picker). Starting fresh gave a clean architecture with modern deps. Used PascalCase directory name (`RoamResearch`) to distinguish from lowercase store extensions.
- **`LocalStorage` over `usePersistentState`** -- the Store extension's custom state hook was broken (stale reads). Raycast's built-in `LocalStorage` is simpler and reliable.
- **Datalog for recent edits** -- the `:edit/time` attribute lets us query blocks edited in the last 48h without a text search, enabling the "show content before typing" UX.
- **`throttle` mode for usePromise** -- fires search immediately on first keystroke rather than waiting for a debounce period.

## Files created

- `extensions/RoamResearch/src/search.tsx`, `quick-capture.tsx`, `daily-note.tsx`, `add-graph.tsx`
- `extensions/RoamResearch/src/lib/roam-client.ts`, `roam-api.ts`, `graph-config.ts`, `markdown.ts`, `types.ts`

## What a future agent needs to know

### Roam API gotchas
- Roam's search API expects `search-str` as the request body key, not `query`. Easy to miss when writing a fresh client.
- `usePromise` can fire with empty args even when you have guards in the callback -- add belt-and-suspenders empty checks at the API layer too.
- `:block/_children` is the parent chain (reverse), `:block/children` is actual children (forward). The naming is confusing. The Store extension only used `_children` which is why it never showed page content.
- `:block/_refs` needs to be pulled with content -- bare keyword pulls give you just UIDs. Need `{:block/_refs [:block/uid :block/string ...]}` to get renderable data.
- Encrypted Roam graphs are not supported (Roam backend limitation).
- API rate limits are undocumented -- the client uses exponential backoff.
- Graph owner must generate API tokens; collaborators cannot.

### PascalCase convention
The directory `extensions/RoamResearch/` uses PascalCase to signal "custom spin-off" vs lowercase store extensions. This is a repo convention, not a Raycast requirement.

### Icon generation
No image generation API keys were available on mx3. Used ImageMagick to generate the icon programmatically. Works for geometric/icon designs but should be replaced with a polished icon when possible.

### ESLint upstream issue
ESLint 9 + `@raycast/eslint-config` has an upstream `@rushstack/eslint-patch` compatibility issue. Lint errors are dev-only and don't affect build.

### Per-machine registration required
After `git pull` on a new machine, must run `npm install && npm run dev` (or `ray develop`) to register the extension with Raycast. Just having the source isn't enough.
