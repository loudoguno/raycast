# User Feedback Loop — Remaining Tasks

## Context

The extension code is **done and pushed** to `claude/refine-local-plan-HcDrL`. Build passes. Two remaining tasks to make it fully operational:

1. **Add feedback-loop section to CLAUDE.md** — so any future local agent has full context on the extension's architecture, v2 roadmap, and how to work on it
2. **Create GitHub labels** — the `feedback` + 18 `ext:*` labels on `loudoguno/raycast` that the extension uses to categorize issues

---

## Step 1: Update CLAUDE.md

### 1a. Add to Repository Overview list (after line 18)

Insert after item 8 (Search Status Menu):

```
9. **User Feedback Loop** - Submit feedback as GitHub Issues for any extension, burn through backlog with Claude Code agents
```

### 1b. Add architectural section (after line 263, before "### Technology Stack")

Insert new section `#### 9. User Feedback Loop Extension` with:

- Overview: central feedback hub, two commands (Submit Feedback, Burn Backlog)
- GitHub Issues integration via REST API with PAT stored in Raycast password preference
- Hybrid extension discovery: runtime scan of `extensions/` + static fallback for 18 known extensions
- Draft persistence via `LocalStorage` (debounced saves, resume on reopen)
- Terminal agent spawning adapted from `claude-built` extension (`getTerminalApp()` + osascript)

**Commands**:
- `submit-feedback` - Form with extension picker, type selector, title/description, draft auto-save
- `burn-backlog` - Extension list with issue counts, drill into issues, "Burn" spawns `claude -p` in Terminal

**Key Architecture**:
- `src/submit-feedback.tsx` - Form with LocalStorage draft persistence, GitHub Issue creation
- `src/burn-backlog.tsx` - Extension list → issue list → agent spawn in Terminal
- `src/lib/github-client.ts` - `createIssue()`, `listIssues()` via GitHub REST API (native fetch)
- `src/lib/extensions.ts` - `discoverExtensions()` with runtime scan + static fallback
- `src/lib/terminal.ts` - `executeInTerminal()` via osascript (Ghostty/iTerm/Terminal auto-detect)
- `src/lib/types.ts` - ExtensionInfo, GitHubIssue, DraftState interfaces

**Preferences**:
- `githubToken` (password) - Fine-grained PAT with Issues R/W scope
- `extensionsPath` (textfield) - Path to raycast repo, default `~/code/raycast`

**v2 Roadmap** (deferred):
- AI triage layer in Burn Backlog (dedup, prioritize, score difficulty, assess actionability)
- Beads integration (route feedback to beads in addition to GitHub Issues)
- "New extension request" form variant
- Per-extension ActionPanel shortcuts

**File**: `CLAUDE.md` lines 18 (overview list) and 263 (before Technology Stack)

---

## Step 2: Create GitHub Labels

Create labels on `loudoguno/raycast` using `gh label create`:

| Label | Color | Description |
|---|---|---|
| `feedback` | `#d876e3` | User feedback submission |
| `bug` | `#d73a4a` | Bug report |
| `enhancement` | `#a2eeef` | Feature request |
| `improvement` | `#0075ca` | Improvement to existing feature |
| `ext:balloons` | `#0075ca` | Balloons extension |
| `ext:balloons-fancy` | `#0075ca` | Balloons Fancy extension |
| `ext:claude-usage` | `#0075ca` | Claude Usage extension |
| `ext:universal-copy-link` | `#0075ca` | Universal Copy Link extension |
| `ext:omnifocus-custom` | `#0075ca` | OmniFocus extension |
| `ext:roam-research-custom` | `#0075ca` | RoamResearch extension |
| `ext:claude-sessions` | `#0075ca` | Claude Sessions extension |
| `ext:search-status-menu` | `#0075ca` | Search Status Menu extension |
| `ext:beads` | `#0075ca` | Beads extension |
| `ext:claude-built` | `#0075ca` | Claude Built extension |
| `ext:contextual-cheatsheet` | `#0075ca` | Contextual Cheatsheet extension |
| `ext:finder-actions` | `#0075ca` | Finder Actions extension |
| `ext:git-repos` | `#0075ca` | Git Repos extension |
| `ext:loutools` | `#0075ca` | LouTools Remote extension |
| `ext:machine-sync` | `#0075ca` | Machine Sync extension |
| `ext:promptbox` | `#0075ca` | Promptbox extension |
| `ext:session-launcher` | `#0075ca` | Session Launcher extension |
| `ext:typing-practice` | `#0075ca` | Typing Practice extension |
| `ext:feedback-loop` | `#0075ca` | User Feedback Loop extension |

Note: `bug` and `enhancement` may already exist as GitHub defaults. Check first, only create if missing.

---

## Verification

1. CLAUDE.md has feedback-loop in both the overview list and the architectural patterns section
2. All 19+ labels exist on `loudoguno/raycast`
3. Commit and push the CLAUDE.md update
4. `npm run build` still passes in `extensions/feedback-loop/`
