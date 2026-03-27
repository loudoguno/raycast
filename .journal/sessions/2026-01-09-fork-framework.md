---
date: "2026-01-09"
started_at: "08:04"
logged_at: "09:50"
duration: "estimated ~2h"
session_id: "reconstructed-from-git"
machine: "unknown"
commits:
  - "4247841 — Add forked extensions framework with templates and scripts"
  - "1d88eac — Add fork templates for Linear, Obsidian, and Roam Research"
  - "81b7629 — Add Claude Code prompts for kickoff and iterative development"
  - "a2365ef — Add comprehensive extension suggestions and batch fork script"
tags: [forking, framework, planning, ai-assisted]
---

# Session: Fork Framework

> [!info] Reconstructed from git history — no live session notes exist for this date.

## Summary

An AI-driven planning session (all 4 commits authored by "Claude") that created a comprehensive framework for forking, customizing, and maintaining Raycast Store extensions. This was an ambitious design for a self-developing extension ecosystem — fork store extensions, add custom features, and keep them synced with upstream.

## What was accomplished

### Forking protocol and tooling

Created `extensions/forked/` with full documentation and helper scripts:
- `FORKING.md` — complete protocol for fork, customize, sync workflow (387 lines)
- `fork-extension.sh` — script to fork a store extension into the repo
- `sync-check.sh` — check if upstream has updates
- `apply-upstream.sh` — merge upstream changes into forked extensions
- `.upstream` and `MODS.md` templates for tracking modifications

### Extension-specific fork plans

Detailed improvement plans for three target extensions:
- **Linear** — quick assign, keyboard shortcuts, UI enhancements
- **Obsidian** — quick capture, multi-vault support, content search
- **Roam Research** — semantic RAG, graph-aware AI, alias resolution (this plan would later influence the fresh-build RoamResearch extension)

### Iterative development workflow

Designed a self-developing loop: submit feedback from within the extension itself, Claude Code implements changes, PR created, update installed. Included a shared `submit-feedback.tsx` component.

### Extension suggestions

Comprehensive list of 27 extensions across 6 priority tiers, with detailed improvement ideas for each. Included a batch fork script (`fork-all-tier1.sh`) to set up all Tier 1 extensions at once.

## Files created

- `extensions/forked/FORKING.md` — fork protocol (387 lines)
- `extensions/forked/CUSTOMIZATIONS.md` — planned modifications
- `extensions/forked/ITERATIVE-DEV.md` — self-developing workflow
- `extensions/forked/CLAUDE-PROMPTS.md` — Claude Code prompts for kickoff
- `extensions/forked/KICKOFF.md` — project kickoff template
- `extensions/forked/EXTENSION-SUGGESTIONS.md` — 27 extensions across 6 tiers (465 lines)
- `extensions/forked/scripts/` — fork, sync-check, apply-upstream helper scripts
- `extensions/forked/_template/` — .upstream and MODS.md templates
- `extensions/forked/{linear,obsidian,roam}-custom/` — per-extension plans

## What a future agent needs to know

- All commits have author "Claude" with UTC timestamps — this was likely a headless Claude Code session without local git user config.
- The fork framework was mostly a planning artifact. In practice, the Roam Research extension was later built fresh (as `extensions/RoamResearch/`) rather than forked, following the "fresh start" approach documented in the repo's CLAUDE.md.
- The `extensions/forked/` directory represents aspirational architecture that was partially superseded by simpler approaches.
- The iterative-dev / submit-feedback concept was ahead of its time but not actively used.
