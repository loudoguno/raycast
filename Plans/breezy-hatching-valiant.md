# Raycast CICD: Submit Feedback + Burn Backlog — Implementation Plan

## Context

Build a tight feedback loop for 18 Raycast extensions: a "Submit Feedback" action that creates GitHub issues, and a "Burn Backlog" action that spawns PAI algorithm agents to fix them. Source prompt: `~/Library/Mobile Documents/.../raycast-burn-backlog.md`.

### Why
Currently there's no feedback mechanism or automated issue resolution for these extensions. Users (just you) notice bugs or improvements but have no structured way to capture them or trigger fixes. This creates a GitHub-based feedback loop: capture -> triage -> fix -> verify.

### Council Debate Results (5 experts, 3 rounds)
Six design changes from the original prompt spec based on expert analysis:

| Original Spec | Changed To | Why |
|---|---|---|
| `child_process.exec` for algorithm spawn | **osascript Terminal launch** | Raycast kills child processes after command exit (5-0 unanimous) |
| `min(issues, 4)` parallel agents | **`min(issues, 2)`** for v1 | Sequential forces PRD quality; structure for easy parallelism later |
| Auto-ensure labels in SubmitFeedback | **Pre-create labels, read-only validate** | `repo:write` scope too broad for feedback PAT |
| JSONL fallback for missing PAT | **Fail-fast Toast with setup instructions** | Queue without consumer is a bug |
| Pre-commit hook for sync | **No hook in v1** | Manual command; add pre-push in v2 with timing data |
| Shared code imports @raycast/utils | **NO @raycast/utils imports** | v1/v2 split across extensions (12 on v1, 3 on v2) is a landmine |

---

## Extension Registry

Critical: `package.json` name differs from directory for 3 extensions.

| Directory | `package.json` name | `extensionDir` prop | Primary Command File | Mode |
|---|---|---|---|---|
| balloons | balloons | `"balloons"` | src/balloons.tsx | no-view |
| balloons-fancy | balloons-fancy | `"balloons-fancy"` | src/balloons-fancy.tsx | no-view |
| beads | beads | `"beads"` | src/beads-dashboard.tsx | view (needs npm install) |
| claude-built | claude-built | `"claude-built"` | src/index.tsx | view (needs npm install) |
| claude-sessions | claude-sessions | `"claude-sessions"` | src/list-sessions.tsx | view |
| claude-usage | claude-usage | `"claude-usage"` | src/show-usage.tsx | view |
| contextual-cheatsheet | contextual-cheatsheet | `"contextual-cheatsheet"` | src/manage-cheatsheets.tsx | view |
| finder-actions | finder-actions | `"finder-actions"` | src/index.tsx | view |
| git-repos | git-repos | `"git-repos"` | src/git-repos.tsx | view |
| loutools | loutools | `"loutools"` | src/status.tsx | view |
| machine-sync | machine-sync | `"machine-sync"` | src/machine-sync.tsx | view |
| omnifocus | omnifocus-custom | `"omnifocus"` | src/show-today.tsx | view |
| promptbox | promptbox | `"promptbox"` | src/browse-promptbox.tsx | view (PILOT) |
| RoamResearch | roam-research-custom | `"RoamResearch"` | src/search.tsx | view |
| Search_Status_Menu | search-status-menu | `"Search_Status_Menu"` | src/search-status-menu.tsx | view (needs npm install) |
| session-launcher | session-launcher | `"session-launcher"` | src/session-launcher.tsx | view |
| typing-practice | typing-practice | `"typing-practice"` | src/typing-practice.tsx | view |
| universal-copy-link | universal-copy-link | `"universal-copy-link"` | src/copy-link.tsx | no-view |

---

## Implementation Phases

### Phase 0: Prerequisites
- [ ] Create `~/.config/raycast/github-pat` with fine-grained PAT (Issues R/W for loudoguno/raycast)
- [ ] Run `npm install` in: beads, claude-built, Search_Status_Menu

### Phase 1: Shared Code Infrastructure
Create 5 canonical files in `shared/` + sync script.

**Files to create:**
- `shared/constants.ts` — GITHUB_OWNER ("loudoguno"), GITHUB_REPO ("raycast"), GITHUB_API, GITHUB_TOKEN_PATH, LABEL_PREFIX ("ext:"), FEEDBACK_LABEL ("feedback")
- `shared/types.ts` — GitHubIssue, CreateIssueParams interfaces
- `shared/github-client.ts` — getToken (reads PAT file), createIssue, listIssues, ensureLabel (read-only validate with LocalStorage cache). Pattern: `extensions/RoamResearch/src/lib/roam-client.ts`. No `any`, no `@raycast/utils`.
- `shared/SubmitFeedback.tsx` — Action.Push -> Form. Props: `{ extensionName: string }`. Shortcut: Cmd+Shift+F.
- `shared/BurnBacklog.tsx` — Action calling launchCommand to burn-backlog extension. Props: `{ extensionName: string, extensionDir: string }`. Shortcut: Cmd+Shift+B.
- `scripts/sync-shared.sh` — copies shared/ to each extension's src/lib/shared/. Skips templates/. All copied files have `// AUTO-SYNCED` header.

**Constraints:**
- Only `@raycast/api` + `react` imports (NO `@raycast/utils`)
- CommonJS compatible (no top-level await)
- TypeScript ^5.4.5 floor
- All use `import`/`export` ESM syntax (bundler handles both CommonJS and ES2022 targets)

### Phase 2: GitHub Labels + Sync
- Run `scripts/sync-shared.sh` — syncs to all 18 extensions
- Create 19 GitHub labels via `gh label create`:
  - `feedback` (color: d876e3)
  - `ext:<package.json-name>` x 18 (color: 0075ca)
  - Use package.json names: `ext:omnifocus-custom`, `ext:roam-research-custom`, `ext:search-status-menu`

### Phase 3: Pilot on Promptbox
**File:** `extensions/promptbox/src/browse-promptbox.tsx`

1. Add `environment` to `@raycast/api` import
2. Add shared component imports
3. Insert before closing `</ActionPanel>`:
```tsx
<ActionPanel.Section title="Feedback">
  <SubmitFeedbackAction extensionName={environment.extensionName} />
  <BurnBacklogAction extensionName={environment.extensionName} extensionDir="promptbox" />
</ActionPanel.Section>
```
4. `cd extensions/promptbox && npm run build` — must pass
5. E2E: submit test feedback -> verify GitHub issue has `[promptbox]` prefix + `feedback` + `ext:promptbox` labels

### Phase 4: Batch Wire 14 View-Mode Extensions
Same pattern as promptbox. Add shared imports + ActionPanel.Section to each primary command file.

**Extensions with component-based ActionPanels (modify the shared component):**
- `beads` -> `src/components/IssueActions.tsx` (covers all beads views)
- `session-launcher` -> `src/session-launcher.tsx` (`SessionActions` function)
- `RoamResearch` -> `src/search.tsx` (`BlockActions` function)

**Extensions with multiple ActionPanels (wire the primary one only for v1):**
- `git-repos`, `machine-sync`, `claude-sessions`, `Search_Status_Menu`

**Parallelizable:** All 14 modifications are independent. Can use 4 worktree-isolated agents.

### Phase 5: 3 No-View Extensions
For balloons, balloons-fancy, universal-copy-link:

1. Create `src/feedback.tsx` — standalone Form view with SubmitFeedbackAction
2. Add `feedback` command to package.json (`mode: "view"`)

### Phase 6: Burn-Backlog Extension
Create `extensions/burn-backlog/` as standalone extension.

**Key files:**
- `package.json` — name: "burn-backlog", author: "loudog", deps: @raycast/api ^1.104
- `src/burn-backlog.tsx` — main command:
  1. Receives `launchContext` ({ extensionName, extensionDir }) or shows picker
  2. Fetches issues via `listIssues({ labels: ["ext:" + name] })`
  3. Shows issue list with "Burn" action
  4. Spawns algorithm via `executeInTerminal()` (NOT child_process.exec)
- `src/terminal.ts` — adapted from `extensions/claude-built/src/execute.ts` lines 13-79:
  - `getTerminalApp()` detects Ghostty/iTerm/Terminal
  - `executeInTerminal()` uses osascript keystroke injection
  - Proven pattern, already working in the repo
- `src/lib/shared/` — synced from shared/

**Algorithm spawn command:**
```
cd ~/code/raycast/extensions/<extensionDir> && claude -p "Fix GitHub issue #<N>: <title>\n\n<body>"
```

Agent count: `min(issues.length, 2)` for v1.

### Phase 7: Full Build Verification
```bash
for ext in extensions/*/; do
  if [ -f "$ext/package.json" ] && [ "$(basename "$ext")" != "templates" ]; then
    (cd "$ext" && npm run build 2>&1) || echo "FAIL: $(basename $ext)"
  fi
done
```
All 19 extensions (18 existing + burn-backlog) must pass.

### Phase 8: E2E Tests
1. Submit feedback from promptbox -> verify GitHub issue with correct labels
2. Submit feedback from balloons (no-view feedback command) -> verify
3. Trigger Burn Backlog from promptbox -> verify Terminal opens with correct command and CWD
4. Clean up test issues

---

## Files Changed Summary

### New files (28+):
- `shared/` — 5 canonical source files
- `scripts/sync-shared.sh` — sync script
- `extensions/burn-backlog/` — entire new extension (~6 files)
- `extensions/*/src/lib/shared/` — 5 synced copies x 18 extensions (90 files, auto-generated)
- `extensions/{balloons,balloons-fancy,universal-copy-link}/src/feedback.tsx` — 3 new commands

### Modified files (17):
- 14 view-mode extension primary command files (ActionPanel wiring)
- 3 no-view extension package.json files (new feedback command entry)

---

## Key Patterns to Reuse

| Pattern | Source File | What to Copy |
|---|---|---|
| osascript Terminal launch | `extensions/claude-built/src/execute.ts:59-79` | `getTerminalApp()` + `executeInTerminal()` |
| launchCommand (intra-ext) | `extensions/beads/src/beads-menu-bar.tsx:104-108` | `launchCommand({ name, type })` |
| Typed API client | `extensions/RoamResearch/src/lib/roam-client.ts` | Factory pattern, typed fetch, error handling |
| ActionPanel wiring | `extensions/promptbox/src/browse-promptbox.tsx:126-197` | Section placement pattern |

---

## Verification Checklist
- [ ] `shared/` has 5 files, all with AUTO-SYNCED header
- [ ] `scripts/sync-shared.sh` runs cleanly, syncs to all 18 extensions
- [ ] 19 GitHub labels exist on loudoguno/raycast
- [ ] Promptbox builds with shared code
- [ ] E2E: feedback submission creates correct GitHub issue
- [ ] All 14 view-mode extensions have Feedback ActionPanel section
- [ ] All 3 no-view extensions have feedback command
- [ ] burn-backlog extension builds and runs
- [ ] E2E: burn-backlog spawns Terminal with correct algorithm command
- [ ] All 19 extensions pass `npm run build`
