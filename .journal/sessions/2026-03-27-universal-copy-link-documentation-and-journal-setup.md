---
date: "2026-03-27"
started_at: "14:39"
logged_at: "02:41"
duration: "~12 hours (intermittent, left terminal open)"
session_id: "bc007fa5-2d2f-4685-b1e5-05d457a677ee"
machine: "mxb (MacBook Pro, M1 Max, 64 GB)"
location: "Somerset, Kentucky"
agents_used: 3
commits:
  - "6e4de0e — Add comprehensive README and supported apps reference for Universal Copy Link (mxb)"
tags: [docs, universal-copy-link, beads, journal]
---

# Session: Universal Copy Link Documentation + Project Journal Bootstrap

## Summary

Created comprehensive two-document README set for the Universal Copy Link extension, then created a 16-issue beads epic for documenting all other extensions. Finally, bootstrapped the project journal system (`.journal/`) with backfilled entries from git history and CloudClaude journal entries.

## What was accomplished

### Phase 1: Universal Copy Link Documentation

Wrote two documents totaling ~960 lines:

- **README.md** (500+ lines) — complete reference covering architecture (with mermaid diagram), all 5 execution strategies, multi-format clipboard pipeline (markdown + RTF + HTML via NSPasteboard), Claude Code session detection, bundle ID alias system, accessibility fallback, extensibility guide with step-by-step Logseq example, origin story, design decisions, known limitations, and file reference table.

- **SUPPORTED-APPS.md** (400+ lines) — reference table of all 57 supported apps (58 handler entries) grouped by tier: 8 browsers, 11 Tier 1 daily use, 11 Tier 2 regular, 20 Tier 3 carried from KM, 6 Hookmark-inspired, 1 terminal. Each entry shows bundle ID, strategy, URL type, and example link.

### Phase 2: Documentation Epic

Created beads epic `raycast-mg5` with 16 child issues, each containing a self-contained agent prompt:
- P1 (4): Claude Sessions, OmniFocus, RoamResearch, Search Status Menu
- P2 (3): Claude Usage upgrade, Beads, LouTools Remote
- P3 (6): Balloons x2, Claude Built, Contextual Cheatsheet, Git Repos, Session Launcher
- P4 (3): Finder Actions, Machine Sync, Typing Practice

### Phase 3: Project Journal Bootstrap

Created `.journal/` directory with `build.py` HTML viewer and backfilled entries from:
- Git history (69 commits across 22 dates)
- 31 existing CloudClaude journal entries mentioning raycast
- 3 parallel agents: early-history (git-only), march-entries (CloudClaude adaptation), build-viewer (HTML dashboard)

## Key decisions

1. **Two-document split for UCL** — README stays navigable, SUPPORTED-APPS.md gives exhaustive app reference. Better than one massive file.
2. **Beads for issue tracking** — Used `bd create` with rich descriptions containing agent-ready prompts, so any future session can `bd show raycast-mg5.N` and immediately start writing docs.
3. **Journal backfill strategy** — Mine CloudClaude entries (rich narratives already written) + supplement with git-reconstructed entries for dates without journal coverage. Early entries marked as reconstructed.

## Files created

- `extensions/universal-copy-link/README.md` — comprehensive extension documentation
- `extensions/universal-copy-link/SUPPORTED-APPS.md` — all 57 supported apps reference
- `.journal/sessions/` — project journal directory with backfilled entries
- `.journal/build.py` — HTML dashboard generator for project journal

## Open issues

- Documentation epic `raycast-mg5` has 16 open issues to work through
- OmniFocus task `opHlG9FFYwn` tracks the documentation work

## What a future agent needs to know

- **Universal Copy Link README quality** is the gold standard for this repo's extension documentation. Reference it when writing READMEs for other extensions: `extensions/universal-copy-link/README.md`
- **The documentation epic** lives in beads: `bd children raycast-mg5` shows all 16 issues. Each child issue contains a complete agent prompt with extension-specific architecture details.
- **This project journal** was bootstrapped in this session. Early entries (pre-March 2026) are reconstructed from git and marked as such. March 2026+ entries are adapted from CloudClaude journal entries with richer context.
- **CLAUDE.md** is the architectural source of truth for all extensions. It has detailed sections on each extension's architecture, commands, patterns, and gotchas.
- **The repo has two machines**: mxb (MacBook Pro M1 Max) and mx3 (MacBook Pro M3). Some extensions were built on one and synced to the other via git.
- **How to resume**: `cd ~/code/raycast && claude --resume bc007fa5`
