# Obsidian (Custom Fork)

Personal fork of the [Obsidian Raycast extension](https://raycast.com/marcjulianschwarz/obsidian) with custom improvements.

## Quick Start

```bash
# 1. Clone the official extension
cd ~/code/raycast/extensions/forked
../scripts/fork-extension.sh obsidian

# 2. Install dependencies
cd obsidian-custom
npm install

# 3. Start development
npm run dev

# 4. Open Raycast and search for "Obsidian (Custom)"
```

## Planned Improvements

See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for the full list of planned customizations.

### Priority 1: Quick Capture
- [ ] Global hotkey for quick capture → `⌃⌥N`
- [ ] Append to daily note without opening Obsidian
- [ ] Template selector for new notes

### Priority 2: Search Enhancements
- [ ] Full-text search across all vaults
- [ ] Search within specific folders
- [ ] Recent files command

### Priority 3: Multi-Vault Support
- [ ] Quick vault switcher
- [ ] Vault-specific preferences
- [ ] Cross-vault search

## How Obsidian Extension Works

The extension reads vault data from:
```
~/Library/Application Support/obsidian/obsidian.json
```

This file contains paths to all vaults opened in Obsidian. The extension then reads markdown files directly from the filesystem.

### Key Files in Original Extension

```
src/
├── searchNoteCommand.tsx    # Main search functionality
├── dailyNoteCommand.tsx     # Daily notes
├── createNoteCommand.tsx    # Note creation
├── utils/
│   ├── utils.ts            # Vault discovery, file reading
│   └── yaml.ts             # Frontmatter parsing
```

## Feedback-Driven Development

This fork includes a **Submit Feedback** command.

### How It Works

1. While using Obsidian extension, notice something to improve
2. Run "Submit Feedback" command
3. Describe the improvement/bug
4. GitHub issue created with context
5. Claude Code implements → PR → you get update

## Development Workflow

### Testing with Your Vaults

The extension auto-detects vaults from Obsidian's config. To test:

1. Ensure Obsidian has opened your test vault at least once
2. Run `npm run dev`
3. Search for your notes in Raycast

### Iterative Claude Code Development

```bash
# Reference your issues
claude "Implement issue #42 - add quick capture to daily note"

# Or describe improvements directly
claude "Add a preference for default capture location"
```

## File Structure

```
obsidian-custom/
├── src/
│   ├── searchNoteCommand.tsx
│   ├── dailyNoteCommand.tsx
│   ├── createNoteCommand.tsx
│   ├── quickCaptureCommand.tsx   # NEW: Quick capture
│   ├── recentNotesCommand.tsx    # NEW: Recent files
│   ├── submit-feedback.tsx       # Feedback command
│   └── utils/
│       ├── utils.ts
│       ├── yaml.ts
│       └── capture.ts            # NEW: Capture utilities
├── assets/
├── package.json
├── IMPROVEMENTS.md
├── MODS.md
└── .upstream
```

## Syncing Upstream

The original extension is actively maintained by Kevin Batdorf. Sync regularly:

```bash
# Check for updates
../scripts/sync-check.sh obsidian-custom

# Apply updates
../scripts/apply-upstream.sh obsidian-custom
```

## Vault Requirements

- Obsidian must be installed
- Vault must have been opened in Obsidian at least once
- For content search: Enable in command preferences

## License

Based on the official Obsidian extension by Marc Julian Schwarz, maintained by Kevin Batdorf.
