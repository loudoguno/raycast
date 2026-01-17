# Claude Built Palette

A Raycast extension that shows all your Claude-built tools, skills, scripts, and aliases in one searchable palette. Built with Claude Code in January 2025.

## Why This Exists

When you build a lot of small tools, skills, and scripts with Claude, it's easy to forget what you made. This extension solves the discoverability problem by putting everything in one searchable palette - hit a hotkey, see what you built, and run it.

## Features

- **Unified view** of skills, CLI tools, Raycast scripts, aliases
- **Filter by type** using the dropdown
- **Favorites** - star items to pin them to top
- **Relative timestamps** - "2h ago", "yesterday"
- **Rich actions** - open in editor, terminal, Claude Code, view git history

---

## Installation

### Quick Setup (3 commands)

```bash
cd ~/code/raycast/extensions/claude-built
npm install
npm run setup   # Installs generator + builds registry
npm run build   # Builds the extension
```

Then open Raycast → search "Claude Built Palette" → optionally assign a hotkey.

---

## Usage

### Opening the Palette

1. Open Raycast (Cmd+Space or your hotkey)
2. Type "Claude Built" and select it
3. Or assign a dedicated hotkey in Raycast Settings → Extensions → Claude Built

### Filtering

Use the dropdown in the top-right to filter by:
- All Items
- Favorites
- Skills
- CLI Tools
- Raycast Scripts
- Aliases
- AIA Tools

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Execute | Enter |
| View Source | Cmd+E |
| View Documentation | Cmd+D |
| Open Folder in Finder | Cmd+O |
| Open Folder in Terminal | Cmd+Shift+T |
| Open in Claude Code | Cmd+Shift+C |
| Add/Remove Favorite | Cmd+F |
| View Git History | Cmd+G |
| Copy as Markdown | Cmd+Shift+M |
| Regenerate Registry | Cmd+R |

### Regenerating After Building New Tools

After creating new skills/tools with Claude, refresh the registry:

```bash
npm run generate
```

Or press **Cmd+R** inside the palette.

---

## How It Was Built

### Architecture

```
┌─────────────────────────────────────────────────┐
│         generate-registry.sh                     │
│  Scans: skills, CLI tools, aliases, scripts     │
│  Outputs: ~/.claude/claude-built-registry.json  │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│         Raycast Extension (TypeScript)          │
│                                                 │
│  src/index.tsx    - Main List UI                │
│  src/registry.ts  - Load registry, favorites    │
│  src/execute.ts   - Run items, open folders     │
│  src/types.ts     - TypeScript interfaces       │
└─────────────────────────────────────────────────┘
```

### The Generator Script

`scripts/generate-registry.sh` is a bash script that:

1. **Scans skills** - Parses YAML frontmatter from `~/.claude/skills/*/SKILL.md`
2. **Scans CLI tools** - Finds executables in `~/aia/bin/`
3. **Scans tools.yml** - Parses `~/aia/tools.yml` for aia subcommands
4. **Scans Raycast scripts** - Extracts `@raycast.*` metadata from `~/code/raycast/scripts/pai/*.sh`
5. **Scans aliases** - Greps `~/.zshrc` for alias definitions

Each item gets:
- `id`, `name`, `description`, `type`
- `path` to source file
- `created_at`, `updated_at` (file timestamps)
- `execution` config (terminal command or Raycast deeplink)
- `tags` for search

### The Extension

Built with Raycast's extension API (React + TypeScript):

- **List component** with search and dropdown filter
- **ActionPanel** with sections for Execute, Open, Manage, Copy
- **Favorites** stored in `~/.claude/claude-built-favorites.json`
- **Usage tracking** in `~/.claude/claude-built-usage.json`

### Key Design Decisions

1. **Registry is generated, not live** - Faster load, works offline
2. **Favorites/usage separate from registry** - Don't lose data on regenerate
3. **Type-based icons and colors** - Visual distinction at a glance
4. **Favorites sort to top** - Most important items always accessible
5. **Relative timestamps** - "2h ago" more useful than ISO dates

---

## What Gets Scanned

| Source | Location | Extracted From |
|--------|----------|----------------|
| Skills | `~/.claude/skills/*/SKILL.md` | YAML frontmatter |
| CLI tools | `~/aia/bin/*` | Filename + header comment |
| AIA tools | `~/aia/tools.yml` | YAML `desc` field |
| Raycast scripts | `~/code/raycast/scripts/pai/*.sh` | `@raycast.*` comments |
| Aliases | `~/.zshrc` | `alias name='command'` lines |

---

## Files

**Extension:**
- `src/` - TypeScript source code
- `scripts/generate-registry.sh` - Registry generator

**Generated (in ~/.claude/):**
- `claude-built-registry.json` - The item registry
- `claude-built-favorites.json` - Your starred items
- `claude-built-usage.json` - Execution counts and timestamps

---

## Customization

To scan additional locations, edit `scripts/generate-registry.sh` and add new scan sections following the existing patterns.

---

## Session

Built in Claude Code session: `recently-built-with-claude-palette-mxb`
