# Map of Content (MOC)

> **Purpose**: Source of truth for project structure. Verify at session start, update before each commit.

## 📁 Project Structure

```
extensions/
├── .claude/                     # Claude Code extension configuration
│   ├── commands/                # Custom slash commands for Claude (if needed)
│   └── settings.local.json      # Local Claude settings (user-specific)
│
├── agents/                      # AI agent documentation (uppercase = important)
│   ├── AGENTS.md                # General AI agent instructions & conventions
│   ├── INITIAL.md               # Initial project requirements & context
│   ├── MOC.md                   # This file - project structure map
│   └── PROGRESS.md              # Session-by-session progress tracking
│
├── gong/                        # Gong celebration extension (PUBLISHED ✅)
│   ├── assets/                  # Icons and sound effects
│   │   ├── gong.wav             # Gong sound effect (1.4MB)
│   │   └── icon.png             # Extension icon (512x512 PNG)
│   ├── src/                     # Extension source code
│   │   └── gong.tsx             # Main command implementation
│   ├── .eslintrc.json           # ESLint configuration
│   ├── .prettierrc.json         # Prettier configuration
│   ├── package.json             # Extension manifest & dependencies
│   ├── raycast-env.d.ts         # Raycast TypeScript definitions
│   ├── README.md                # Extension documentation
│   └── tsconfig.json            # TypeScript configuration
│
├── .gitignore                   # Git ignore patterns
└── README.md                    # Repository overview & setup guide
```

## 📝 Key Directories

### `/agents/` - AI Agent Documentation
Contains all AI-focused documentation using uppercase naming convention (like README.md, LICENSE). These files guide AI agents through development sessions and track progress.

### `/.claude/` - Claude Code Configuration
Claude Code extension settings and custom slash commands. The `settings.local.json` file should not be committed to git as it contains user-specific permissions.

### `/gong/` - Gong Celebration Extension ✅
**Status**: Published to SalesSprint organization

First Raycast extension - plays a gong sound, triggers confetti animation, and shows celebration notifications. "No-view" command for instant execution. Includes custom gong.wav sound file and 512x512 PNG icon.

## 🔍 Important Files

| File | Purpose |
|------|---------|
| `README.md` | Repository overview, getting started guide |
| `agents/AGENTS.md` | General conventions for all AI agents working on this project |
| `agents/INITIAL.md` | Initial project requirements & context |
| `agents/PROGRESS.md` | Session-by-session changelog & status tracker |
| `agents/MOC.md` | This file - project structure reference |
| `gong/README.md` | Gong extension documentation |
| `gong/src/gong.tsx` | Main command implementation |
| `gong/package.json` | Extension manifest with commands and metadata |

## 🔄 Maintenance

**At session start**: Verify this file matches actual project structure
**Before each commit**: Update this file if structure changed
**When adding files/folders**: Document purpose in this file immediately

---

**Last Updated**: October 8, 2025 - Session 1 Complete (Gong extension published)
**Last Verified**: October 8, 2025 - Session 1 Complete
**Extensions**: 1 (Gong - Published to SalesSprint org)
