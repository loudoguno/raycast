---
date: "2026-04-08"
started_at: "02:08"
logged_at: "04:01"
duration: "~6 hours (multi-day: Apr 5-8)"
session_id: "93aa560d-f79c-4dcd-b843-7cd20110b75a"
machine: "mx3 (MacBook Pro, Apple M3 Max, 128 GB)"
location: "Somerset, Kentucky"
agents_used: 18
commits:
  - "7a8cfb3 — Add User Feedback Loop extension (from web session)"
tags: [feedback-loop, burndown-agent, github-issues, cicd, agents, council-debate]
---

# Session: Raycast Feedback Loop Extension & Burndown Agent

## Summary

Built a complete feedback-to-fix loop for the Raycast monorepo: a "User Feedback Loop" Raycast extension (Submit Feedback + Burn Backlog commands) and a persistent Claude Code burndown agent (`.claude/agents/raycast-burndown.md`). Included a 5-expert council debate that drove six key architecture decisions, plus deep research into Claude Code headless billing, PAI persistent agents, and multi-agent orchestration.

## What was accomplished

### Phase 1: Planning & Council Debate
- Ran PAI Algorithm v3.7.0 with Advanced effort tier (35 ISC criteria)
- FirstPrinciples decomposition: identified 6 atomic subsystems, 10 failure modes, 4 parallelism opportunities
- 5-expert council debate (3 rounds, 15 agents total):
  - Rex (Raycast Extension Expert): Identified 3-tier extension health triage
  - Maki (Scripting Expert): Proposed pre-commit sync guard (eventually deferred to v2)
  - Tara (TypeScript/React Expert): Found the @raycast/utils v1/v2 split landmine
  - Ciro (CICD Specialist): Designed async completion sentinel pattern
  - Algo (PAI Algorithm Expert): Identified SHOWSTOPPER — Raycast kills child_process, must use osascript Terminal launch
- IterativeDepth analysis (8 lenses) on the "Burn" UX flow — resulted in two-phase triage→execute model

### Phase 2: Architecture Simplification
- Original plan: shared code synced to 18 extensions (90 copied files, sync script, ActionPanel wiring)
- Web Claude Code session redesigned as single standalone extension — zero integration points
- Pulled down `claude/refine-local-plan-HcDrL` branch with working code

### Phase 3: Implementation
- Built and verified `extensions/feedback-loop/` (npm install + npm run build passes)
- Created 23 GitHub labels on `loudoguno/raycast` via gh CLI
- Updated CLAUDE.md with extension overview + full architectural section
- Created `.claude/agents/raycast-burndown.md` persistent agent definition
- Updated `burn-backlog.tsx` with three burn levels (single issue, extension, all)
- Wrote README.md for the extension

### Phase 4: Research
- Confirmed Claude Code headless (`-p`) uses Max subscription, NOT API billing
- Mapped Claude Code agents architecture: `.claude/agents/*.md`, `--agent` flag, subagents, teams
- Researched PAI ComposeAgent system for custom persistent agents with traits/voices

## Key decisions

1. **Single extension, not shared code** — The web session's approach of one standalone `feedback-loop` extension eliminated the entire shared code infrastructure (sync script, per-extension wiring, 90 copied files). Massive simplification.

2. **osascript Terminal launch, not child_process** — Council unanimously agreed (5-0). Raycast GCs child processes after command exit. Pattern proven in `extensions/claude-built/src/execute.ts`.

3. **Interactive mode, not headless** — User wants to check in on progress and answer agent questions. Interactive Terminal session is the right UX.

4. **Custom agent file, not PAI algorithm** — `.claude/agents/raycast-burndown.md` is simpler than PRD-based algorithm.ts loop mode for issue-sized work. Agent has the same triage/execute/verify pattern without the ceremony.

5. **Raycast preferences for PAT, not file-based** — `getPreferenceValues<{githubToken: string}>()` is Raycast-native. Avoids managing `~/.config/raycast/github-pat` file.

6. **Three burn levels from one agent** — Same agent definition, different scope in the prompt. Simplest possible dispatch.

## Files created

- `extensions/feedback-loop/` — entire extension (package.json, tsconfig, eslint config, 6 source files, README)
- `.claude/agents/raycast-burndown.md` — persistent burndown agent (4-phase workflow)
- `Plans/feedback-loop-remaining-tasks.md` — implementation plan from web session
- `Plans/breezy-hatching-valiant.md` — original council-informed plan (historical reference)
- 23 GitHub labels on `loudoguno/raycast` repo

## Open issues

- Three burn levels not yet tested end-to-end with the burndown agent
- Burndown agent's git housekeeping phase (Phase 0) not yet exercised in real use
- Extensions missing node_modules (beads, claude-built, Search_Status_Menu) may need `npm install` before burndown agent can build them
- `auto` permission mode requires Team/Enterprise plan — agent runs with default permissions, requiring user approval for each tool call. `acceptEdits` is the practical alternative on Max.

## What a future agent needs to know

- **Read CLAUDE.md first** — it has the full architecture for all 19 extensions including the feedback-loop
- **The burndown agent is at `.claude/agents/raycast-burndown.md`** — Claude Code auto-discovers it. Launch with `claude --agent raycast-burndown`
- **Package.json names differ from directory names** for 3 extensions: omnifocus→omnifocus-custom, RoamResearch→roam-research-custom, Search_Status_Menu→search-status-menu. GitHub labels use package.json names.
- **@raycast/utils v1/v2 split** — 12 extensions on v1 (React 18), 3 on v2 (React 19). Never import from `@raycast/utils` in shared or cross-extension code.
- **Terminal launch pattern** — `executeInTerminal()` in `extensions/feedback-loop/src/lib/terminal.ts` uses osascript with `getTerminalApp()` detecting Ghostty/iTerm/Terminal. Adapted from `extensions/claude-built/src/execute.ts`.
- **The original plan** at `Plans/breezy-hatching-valiant.md` has the full council debate findings and 35 ISC criteria. Most of the architecture decisions there still apply even though the implementation was simplified.
- **v2 roadmap** is documented in CLAUDE.md: AI triage, Beads integration, per-extension ActionPanel shortcuts, multi-provider CLI fallback.
