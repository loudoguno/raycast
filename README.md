# Raycast

Personal Raycast customization system: extensions, scripts, snippets, and assets. Synced between machines via git.

**Repo:** [github.com/loudoguno/raycast](https://github.com/loudoguno/raycast)
**Local path:** `~/code/raycast/` (both mxb and mx3)

> **Note:** The previous `loudoguno/extensions` repo has been archived. All extension work now lives here. See [Architecture Decisions](#architecture-decisions) for why.

---

## Structure

```
~/code/raycast/
├── extensions/        # Raycast extensions (TypeScript/React, some with Swift/AppleScript)
│   ├── balloons/          13 custom extensions
│   ├── balloons-fancy/
│   ├── beads/
│   ├── claude-built/
│   ├── claude-sessions/
│   ├── claude-usage/
│   ├── contextual-cheatsheet/
│   ├── finder-actions/
│   ├── loutools/
│   ├── omnifocus/
│   ├── RoamResearch/
│   ├── Search_Status_Menu/
│   ├── universal-copy-link/
│   ├── docs/              Development reference docs
│   ├── templates/         hello-world starter templates (detail, form, list)
│   └── instructions.md   Extension development guide
├── scripts/           # Raycast script commands (bash, applescript)
│   ├── *.sh / *.applescript   24 main scripts
│   ├── pai/                   8 PAI-related scripts
│   ├── g-scripts/             2 imported scripts
│   └── .scripts/              1 utility (README auto-generator)
├── assets/            # Shared resources (icons, images)
├── snippets/          # Text snippets (exported for backup)
├── CLAUDE.md          # Claude Code development guide
└── README.md          # This file
```

---

## Extensions Inventory

| Extension | Commands | Tech Stack | Description |
|-----------|----------|------------|-------------|
| **balloons** | 1 | TypeScript | Browser-based balloon celebration (30 balloons, 8 colors, 8s) |
| **balloons-fancy** | 11 | TypeScript + Swift/SwiftUI | Native macOS overlay effects (50-700 particles, 24 colors, 11 effects) |
| **beads** | — | TypeScript | Raycast integration for beads issue tracker |
| **claude-built** | 1 | TypeScript | Unified palette for all Claude-built skills, tools, scripts, and aliases |
| **claude-sessions** | 1 | TypeScript + AppleScript | Live dashboard of running Claude Code terminal sessions with status and remote control |
| **claude-usage** | 5 | TypeScript + AppleScript | Claude subscription usage monitoring + daily/weekly/monthly productivity summaries |
| **contextual-cheatsheet** | — | TypeScript | Context-aware keyboard shortcut cheatsheets |
| **finder-actions** | 1 | TypeScript | Action palette for frontmost Finder window (open in terminal, etc.) |
| **loutools** | — | TypeScript | Personal utilities and tools collection |
| **omnifocus** | 1 | TypeScript + JXA | Quick Add Anywhere — fuzzy search projects/tasks, create with tags, due, repeat, flag |
| **RoamResearch** | 4 | TypeScript | Zero-friction search and preview for Roam Research knowledge graphs |
| **Search_Status_Menu** | 1 | TypeScript + Swift | Keyboard-driven search and click for macOS menubar items via Accessibility API |
| **universal-copy-link** | 1 | TypeScript + AppleScript | One hotkey, any app: copy markdown [title](url) link with RTF — supports 40+ apps |

### balloons-fancy Effects

| Command | Icon | Particles | Duration |
|---------|------|-----------|----------|
| Balloons | `🎈` | 50 balloons | 12s |
| Fireworks | `🎆` | 20-25 bursts | 8s |
| Snow | `❄️` | 500-700 snowflakes | 10s |
| Cupcake | `🧁` | Explosion | 8s |
| Campfire | `🔥` | 150-200 embers | 10s |
| Feather | `🪶` | 35-50 feathers | 25s |
| Beer | `🍺` | 200-300 bubbles | 6s |
| Leaves | `🍁` | 80-120 leaves | 12s |
| Rainbow | `🌈` | Full arc | 8s |
| Pixels | `👾` | 40 invaders | 8s |
| Galaxy | `🪐` | 300 stars | 8s |

### claude-usage Commands

| Command | Mode | Description |
|---------|------|-------------|
| Show Claude Usage | view | Dashboard with session/weekly usage and pacing indicators |
| Claude Usage Menu Bar | menu-bar | Persistent menu bar display (auto-refresh 10m) |
| Daily Summary | view | Today's Claude Code productivity with heatmap |
| Weekly Summary | view | Past 7 days with activity charts |
| Monthly Summary | view | Past 30 days with trends |

---

## Scripts Inventory

### Claude & AI (6 scripts)
| Script | Description |
|--------|-------------|
| `claude-code-here.sh` | Open current Finder directory in Claude Code |
| `claude-code-open.sh` | Open Claude Code in a project by number or path |
| `claude-code-recent.sh` | Open Claude Code in a recent project directory |
| `claude-review-file.sh` | Review focused file with Claude Code |
| `claude-review-history.sh` | Browse past Claude review sessions |
| `claude-usage-quick-ask.sh` | Quick Claude Code usage stats (last 7 days) |

### PAI Scripts (8 scripts in `scripts/pai/`)
| Script | Description |
|--------|-------------|
| `ask-pai.sh` | Open PAI inbox for quick questions |
| `pai-quick-ask.sh` | Open new terminal with PAI inbox |
| `pai-dashboard.sh` | Show PAI status in menu bar |
| `pai-settings.sh` | Open PAI Settings Dashboard |
| `pai-voice-toggle.sh` | Toggle PAI voice output |
| `anki-review.sh` | Review due Anki flashcards |
| `live-narrator.sh` | AI narrates camera feed (5 styles) |
| `live-narrator-quick.sh` | Start narrator immediately |

### Keybindings (5 scripts)
| Script | Description |
|--------|-------------|
| `keybindings-claude.sh` | Open Claude Code in keybinding workspace |
| `kbexp.sh` | Launch keybinding explorer (GUI/TUI) |
| `ikdb-query.sh` | Check if key combo is taken |
| `ikdb-cheatsheet.sh` | View all shortcuts |
| `ikdb-quick-add.sh` | Capture a new keybinding |

### System Utilities (4 scripts)
| Script | Description |
|--------|-------------|
| `stickies-grid.sh` | Arrange stickies in uniform grid |
| `stickies-timeline.sh` | Arrange stickies by creation date |
| `stickies-info.sh` | Show stickies info |
| `toggle-microphone.applescript` | Toggle mic input on/off |

### File Operations (3 scripts)
| Script | Description |
|--------|-------------|
| `finder-actions.sh` | Open Finder directory in Terminal/Ghostty/iTerm |
| `copy-file-contents.sh` | Copy selected Finder file contents to clipboard |
| `copy-content-of-selected-file-in-finder.applescript` | Same (AppleScript variant) |

### Browser & Apps (3 scripts)
| Script | Description |
|--------|-------------|
| `chrome-profile-my-old-kentucky-host.sh` | Switch Chrome profile for KY house |
| `abb-quick-replies-ky-house-chrome-profile.sh` | Open Airbnb quick replies in KY profile |
| `list-obsidiain-vaults.applescript` | List Obsidian vaults |

### Other (3 scripts)
| Script | Description |
|--------|-------------|
| `chezmoi-update.sh` | Check for and apply dotfile updates |
| `new-git-project-directory.sh` | Create new project in ~/projects with git init |
| `healthcheck.sh` | System health check utility |
| `restart-all.sh` | Reload Goku, Karabiner, Slate, Raycast |

---

## Multi-Machine Setup

This repo is the single source of truth for Raycast customizations across machines.

| Machine | Hostname | Location | Status |
|---------|----------|----------|--------|
| MacBook Pro (NYC) | **mxb** | `~/code/raycast/` | Primary development |
| MacBook Pro M3 (KY) | **mx3** | `~/code/raycast/` | Synced via git |

### Syncing Between Machines

```bash
# On the machine where you made changes:
git add -A && git commit -m "description of changes" && git push

# On the other machine:
git pull
```

Raycast script commands auto-reload. Extensions need `npm run dev` after pulling if there were source changes.

### Setting Up Custom Extensions on a New Machine

**Important:** `git pull` alone does NOT make custom extensions available in Raycast. Dev extensions must be explicitly built and registered per machine. This is a Raycast security/trust boundary — extensions get system access, so they require local registration.

**First-time setup (once per machine):**

```bash
# 1. Ensure the ray CLI is installed globally
npm install -g @raycast/api

# 2. For each custom extension, install deps and register with Raycast
cd ~/code/raycast/extensions/RoamResearch  # (or any extension directory)
npm install
ray develop    # Builds the extension and registers it with Raycast
```

**What each step does:**
- `npm install` — installs Node dependencies (node_modules is gitignored)
- `ray develop` — compiles TypeScript, generates type definitions, and registers the extension with Raycast via deeplink. Runs as a dev server with hot reload. Works headlessly (no interactive UI needed).

**After pulling changes to an existing extension:**

```bash
cd ~/code/raycast/extensions/{name}
npm install    # In case new deps were added
ray develop    # Rebuild and re-register
```

**Persistence note:** `ray develop` runs as a long-lived process. If the process dies (e.g., terminal closes), the extension *may* disappear from Raycast. If this happens, just run `ray develop` again. Alternatively, `ray build` does a one-time build without staying alive.

**How to verify an extension is registered:**
- Check if its deeplink works: `open "raycast://extensions/loudog/{extension-name}/{command}"`
- Or open Raycast and search for the extension's commands

### What Raycast References

- **Extensions:** Imported individually via Raycast > Extensions > Add Extension (+ button) > point to the extension subdirectory
- **Script Commands:** Raycast > Extensions > Script Commands > Add Directories > point to `~/code/raycast/scripts/`
- **Installed extensions** (from Raycast Store) live in `~/.config/raycast/extensions/` — those are NOT in this repo

---

## Development Workflow

### Creating a New Extension

```bash
cd ~/code/raycast/extensions

# Option 1: Use Raycast's built-in command
# Open Raycast > "Create Extension" > choose template > set location to this directory

# Option 2: Copy a template
cp -r templates/hello-world-list my-new-extension
cd my-new-extension
# Edit package.json with your extension details
npm install
npm run dev
```

### Creating a New Script Command

```bash
cd ~/code/raycast/scripts

# Copy the template
cp template-script-for-raycast.sh my-new-script.sh
chmod +x my-new-script.sh

# Edit the Raycast metadata headers (@raycast.title, @raycast.description, etc.)
# Script appears in Raycast immediately if scripts/ is added as a script directory
```

### Extension Development

```bash
cd extensions/{name}
npm install          # Install dependencies
npm run dev          # Start dev mode (hot reload)
npm run build        # Build and validate
npm run lint         # Check code style
npm run fix-lint     # Auto-fix style issues
```

### balloons-fancy Native App

The balloons-fancy extension requires building a native macOS app:

```bash
cd extensions/balloons-fancy/BalloonsApp
./build.sh                                    # Compile Swift files
cp -r build/BalloonsApp.app /Applications/     # Install
cd .. && npm install && npm run dev            # Start extension
```

Rebuild after any Swift file changes.

---

## Architecture Decisions

*Documented February 2026 during repo consolidation.*

### Why a monorepo (not submodules or separate repos)

**Decision:** All Raycast customizations (extensions + scripts) live in one repo (`loudoguno/raycast`).

**Why not separate repos:**
- We had a separate `loudoguno/extensions` repo that drifted from this one — identical files with divergent git histories, a nested `.git` on one machine, and confusion about which repo was canonical. Separate repos for a solo developer's related tools creates exactly this kind of drift.

**Why not git submodules:**
- Submodules require extra commands on every pull (`git submodule update --init --recursive`). Forgetting this = the exact desync we were already experiencing. Submodules solve multi-team coordination problems we don't have.

**Why co-mingled history is fine:**
- Scripts and extensions are the same concern: "my Raycast customizations." One `git pull` syncs everything. One `git push` shares everything. Adding a new extension or script = create a subdirectory and push.

### What was cleaned up

- **Archived:** `loudoguno/extensions` GitHub repo (duplicate, 7 commits, subset of this repo)
- **Removed from mx3:** Nested `.git` inside `extensions/` that pointed to the old extensions repo
- **Removed from mx3:** `extensions/linear/` (unmodified clone of official Linear extension, no remote)
- **Removed:** `extensions/agents/` (stale SalesSprint scaffolding from Oct 2025)
- **Removed:** `extensions/balloons/balloons/` (nested duplicate directory)
- **Removed:** Stale `PLAN.md` files, `ICON_NEEDED.txt` placeholder, `.claude/sessions/`
- **Updated:** `.gitignore` (now covers package-lock.json, build/, raycast-env.d.ts, editor state)
- **Fixed:** Missing `$schema` in claude-usage `package.json`

### Publishing to Raycast Store

If you want to publish an extension publicly, you'd submit a PR to the official `github.com/raycast/extensions` repo. That's a fork/PR workflow — this repo remains your development workspace, not the distribution channel.

---

## Quick Reference

| What | Where |
|------|-------|
| GitHub repo | [loudoguno/raycast](https://github.com/loudoguno/raycast) |
| Local path (both machines) | `~/code/raycast/` |
| Installed Raycast extensions | `~/.config/raycast/extensions/` |
| Raycast config | `~/.config/raycast/config.json` |
| Extension templates | `extensions/templates/` |
| Script template | `scripts/template-script-for-raycast.sh` |
| Development docs | `extensions/docs/` and `extensions/instructions.md` |
| Claude Code guide | `CLAUDE.md` |
| Ideas backlog | `extensions/💡 ideas.md` |
