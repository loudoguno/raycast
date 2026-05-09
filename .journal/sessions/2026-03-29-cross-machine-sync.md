---
date: "2026-03-29"
started_at: "14:24"
logged_at: "01:42"
duration: "~11h (intermittent, multi-day session spanning Mar 27-29)"
session_id: "ef1f760e-1528-42b7-834f-be9e6cd51d1f"
machine: "mxb (MacBook Pro, Apple M1 Max, 64 GB)"
location: "Somerset, Kentucky"
agents_used: 0
commits:
  - "c8cb54d — Update PromptBox browse and review-complete components (mx3, pushed via SSH)"
tags: [multi-machine, cross-machine-sync, promptbox, claude-md]
---

# Session: Cross-Machine Sync & PromptBox Pull

## Summary

Discovered that the PromptBox extension built on mx3 had never been pushed to GitHub. SSHed into mx3 from mxb to commit and push the work, then pulled it locally. Added a permanent cross-machine sync check to CLAUDE.md so this never happens again.

## What was accomplished

### PromptBox extension recovery via SSH
- Confirmed SSH connectivity between mxb and mx3 (`ssh mx3 'hostname'` works)
- Found `extensions/promptbox/` on mx3 with commit `531ff6f` (unpushed) plus 2 uncommitted file changes
- Committed the changes remotely and pushed from mx3 via SSH
- Pulled to mxb — extension arrived with node_modules and dist intact

### Cross-machine sync check in CLAUDE.md
- Added `### Cross-machine sync check` subsection under Machine Setup Checks
- Instructs Sai to SSH into the other machine on session start
- Checks for both uncommitted changes (`git status --short`) and unpushed commits (`git log @{u}..HEAD`)
- If found, offers to commit and push via SSH

## Key decisions

1. **SSH approach over manual** — since SSH key auth is already configured between machines, it's faster and more reliable to have Sai do the push remotely than asking Lou to switch machines
2. **CLAUDE.md instruction, not a hook** — kept it as documentation guidance rather than automating as a hook, keeping it lightweight and transparent

## Files created

- `CLAUDE.md` — added cross-machine sync check section (lines 394-413)

## Open issues

- PromptBox extension needs testing on mxb via Raycast
- PromptBox extension not yet documented in CLAUDE.md architecture section
- Could consider making the cross-machine check a session-start hook for full automation

## What a future agent needs to know

- **SSH works between mxb and mx3** using `ssh mx3` and `ssh mxb` — no password needed, key auth is configured
- **Both machines share the same repo** at `~/code/raycast` with the same GitHub remote
- **CLAUDE.md now instructs session-start cross-machine checks** — read the "Cross-machine sync check" section under Machine Setup Checks
- **The PromptBox extension** was built on mx3 and is now synced. Check `extensions/promptbox/` for its source
- **node_modules and dist are tracked** in this repo — extensions arrive ready to use after `git pull`
