---
date: "2025-12-13"
started_at: "04:45"
logged_at: "18:39"
duration: "estimated"
session_id: "reconstructed-from-git"
machine: "mxb3"
commits:
  - "e20ada2 — Add kbexp and cctimeline scripts, claude-usage extension, session logs"
  - "c871e1e — Add Claude usage script and auto-updating README"
  - "e54fd25 — feat: Consolidate scripts from projects folder"
tags: [claude-usage, scripts, new-extension]
---

# Session: Claude Usage Extension and Script Consolidation

> [!info] Reconstructed from git history — no live session notes exist for this date.

## Summary

Major two-day session (Dec 13-14) that added the Claude Usage Raycast extension and consolidated scattered scripts into the monorepo. The claude-usage extension uses Safari automation via AppleScript to scrape usage data from claude.ai/settings/usage. Also added CLAUDE.md project instructions for the first time.

## What was accomplished

### Claude Usage extension created (Dec 13)

Built the full claude-usage extension with multiple commands:
- `show-usage` — usage dashboard with pacing indicators
- `menu-bar` — persistent menubar display with 10-minute auto-refresh
- `daily-summary` — today's Claude Code productivity
- `weekly-summary` and `monthly-summary` — stub commands for later

The extension uses AppleScript to automate Safari, navigating to the Claude usage page and scraping text content with regex parsing. The `applescript.ts` utility handles both interactive mode (opens Safari if needed) and quiet mode (reads existing tabs only, for background refresh).

### Scripts added (Dec 13-14)

- `kbexp.sh` — launch keybinding explorer
- `cctimeline.sh` — launch Claude Code timeline
- `claude-usage-quick-ask.sh` — quick CLI check of Claude usage stats
- `.scripts/update-readme.sh` — auto-generates scripts README from metadata
- Pre-push hook to update README before pushing

### Script consolidation (Dec 14)

Migrated scripts from `~/code/projects/scripts/` into the monorepo:
- `abb-quick-replies-ky-house-chrome-profile.sh`
- `new-git-project-directory.sh`
- `template-script-for-raycast.sh`

### Project-level CLAUDE.md

Added the first CLAUDE.md with project instructions for Claude Code sessions — architecture notes, development commands, Safari automation requirements.

## Files created

- `extensions/claude-usage/` — full extension (src, package.json, README, CHANGELOG)
- `extensions/claude-usage/src/show-usage.tsx` — main usage dashboard
- `extensions/claude-usage/src/daily-summary.tsx` — productivity summary (646 lines)
- `extensions/claude-usage/src/menu-bar.tsx` — menubar command
- `extensions/claude-usage/src/utils/applescript.ts` — Safari automation core
- `extensions/claude-usage/src/utils/git.ts` — git status helpers
- `CLAUDE.md` — project instructions (179 lines)
- `scripts/cctimeline.sh`, `scripts/kbexp.sh`, `scripts/claude-usage-quick-ask.sh`
- `scripts/.scripts/update-readme.sh` — README auto-generator

## What a future agent needs to know

- This was done on `mxb3`, a different machine from the initial commit's `mxb`.
- The claude-usage extension requires Safari permissions: Develop menu enabled, JavaScript from Apple Events allowed, and Raycast accessibility access.
- The session log files added under `extensions/.claude/sessions/` were early experiment tracking — they would be removed during the Feb 22 consolidation.
- Co-authored with Claude Opus 4.5.
