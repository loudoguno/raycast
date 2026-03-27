---
date: "2026-03-21"
started_at: "15:58"
logged_at: "02:19"
duration: "estimated 4h"
session_id: "82fa1f94-fca0-48d6-b67b-afc876d75b1a, b25c803c-ab4f-41bc-8d04-e3a13351257e"
machine: "mxb"
commits: []
tags: [roam-research, mxb-setup, multi-machine, contextual-cheatsheet, loutools, sync]
---

# Session: Roam Extension mxb Setup + Multi-Machine Sync + Contextual Cheatsheet Discovery

## Summary

Two related sessions on mxb: (1) Fixed the `/+r` Roam Research keybinding by building and registering the extension on mxb, and (2) hunted down the "lost" contextual-cheatsheet extension on mx3, synced it via git, and discovered the multi-machine registration gap for Raycast dev extensions.

## What was accomplished

### Roam Research Extension on mxb
The `/+r` keybinding (Karabiner slash-mode) was pointing to a Raycast deeplink (`raycast://extensions/loudog/roam-research-custom/search`) but the extension had never been built on mxb. Fixed by:
1. Installing `@raycast/api` CLI globally (`npm install -g @raycast/api`)
2. Running `ray develop` headlessly from Claude Code
3. Verified the deeplink fired successfully

### Contextual Cheatsheet Discovery
Lou was looking for an extension he'd built that detects the frontmost app and opens an associated cheatsheet. It wasn't committed. After searching the repo, GitHub, PAI memory, iCloud, and keybindings repo without finding it, SSH'd to mx3 (via `mx3.local` -- Tailscale `mx3` timed out) and found `extensions/contextual-cheatsheet/` untracked.

The contextual-cheatsheet extension uses a 4-tier resolution: custom URL (per-app via LocalStorage) > vault cheatsheet.md > vault main note > setup prompt. An `app-mapping.json` maps bundle IDs to vault filenames.

### Multi-Machine Sync
1. Committed both untracked extensions on mx3 (contextual-cheatsheet + loutools)
2. Rebased mx3 onto origin/main (was 4 behind)
3. Fixed mx3's git remote from HTTPS to SSH (HTTPS auth was broken)
4. Pushed from mx3, pulled on mxb
5. Built RoamResearch on mxb (`npm install` + `npm run build`)

## Key decisions

- **`ray develop` for registration** -- works headlessly from a non-interactive terminal. But it's a long-running process and the extension may disappear from Raycast when it dies. `ray build` might be more permanent but wasn't tested.
- **SSH remote over HTTPS** -- mx3's HTTPS auth was broken ("Device not configured"). Switched to `git@github.com:loudoguno/raycast.git` which worked immediately.
- **`.local` for local network SSH** -- `mx3` (Tailscale) timed out. `mx3.local` (mDNS) worked when both machines are on the same network.

## Files created

- No new files in this repo on this date (commits were on the 03-20 date via mx3 rebase/push)

## What a future agent needs to know

### Per-machine extension registration is the #1 multi-machine friction point
Raycast dev extensions require explicit build + registration on each machine. A `git pull` only gets the source. The registration step varies:
- `npm install && npm run dev` -- starts dev server with hot reload, extension persists after stopping (usually)
- `ray develop` -- headless alternative, works from CLI
- `npm run build` alone -- compiles but does NOT register with Raycast

The post-merge hook (`hooks/post-merge`) handles `npm run build` automatically on `git pull`, but that only compiles -- it doesn't guarantee Raycast picks up new extensions. New extensions need `npm run dev` at least once.

### Contextual cheatsheet extension architecture
- `src/cheatsheet-store.ts` -- core: `getFrontmostApplication()`, 4-tier resolution
- Depends on `~/vaults/flote-vault/` for vault-based resolution -- this may not exist on all machines
- `app-mapping.json` at `~/vaults/flote-vault/_ADMIN/` maps bundle IDs to vault filenames

### `hyperfloat` red herring
An old scaffolded extension in `~/.config/raycast/extensions/hyperfloat/` has a similar concept (contextual floating notes) but only contains a `package.json` with no source code. Not the same project.

### RoamResearch "missing" source files
After this session, Lou thought the RoamResearch source was missing from mxb. It was actually identical on both machines -- only build artifacts (`node_modules`/`dist`) were missing. The `.gitignore` correctly excludes these.
