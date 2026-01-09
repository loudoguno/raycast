# Linear (Custom Fork)

Personal fork of the [Linear Raycast extension](https://raycast.com/linear/linear) with custom improvements.

## Quick Start

```bash
# 1. Clone the official extension (or use fork script)
cd ~/code/raycast/extensions/forked
../scripts/fork-extension.sh linear

# 2. Install dependencies
cd linear-custom
npm install

# 3. Start development
npm run dev

# 4. Open Raycast and search for "Linear (Custom)"
```

## Planned Improvements

See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for the full list of planned customizations.

### Priority 1: Keyboard Shortcuts
- [ ] Global hotkey for "Create Issue" → `⌃⌥L`
- [ ] Quick "Assign to Me" action → `⌘M`
- [ ] Copy issue as markdown link → `⌘⇧C`

### Priority 2: UI Enhancements
- [ ] Show project name prominently in list view
- [ ] Add priority color badges to list items
- [ ] Customizable default filters

### Priority 3: New Features
- [ ] Quick status change menu (skip detail view)
- [ ] Batch assign multiple issues
- [ ] Custom issue templates

## Feedback-Driven Development

This fork includes a **Submit Feedback** command that creates GitHub issues for improvements.

### How It Works

1. While using the extension, you notice something to improve
2. Run "Submit Feedback" command (`⌘⇧F` or search)
3. Describe the improvement/bug
4. Issue created in GitHub with extension context
5. Claude Code picks up the issue and implements
6. PR submitted → you get the update

### Setup for Feedback Command

1. Get a [GitHub Personal Access Token](https://github.com/settings/tokens) with `repo` scope
2. In Raycast: Settings → Extensions → Linear (Custom) → Preferences
3. Add your GitHub token

## Development Workflow

### Iterative Claude Code Development

```bash
# 1. Open the extension directory in Claude Code
cd ~/code/raycast/extensions/forked/linear-custom
claude

# 2. Reference an issue
"Implement issue #123 - add quick assign feature"

# 3. Claude Code implements, tests, commits
# 4. Push and create PR (or test locally first)
```

### Manual Development

```bash
# Start dev mode (hot reload)
npm run dev

# Build and validate
npm run build

# Lint
npm run lint
npm run fix-lint
```

## File Structure

```
linear-custom/
├── src/
│   ├── create-issue.tsx       # Issue creation (customize templates here)
│   ├── search-issues.tsx      # Issue search (customize list view here)
│   ├── submit-feedback.tsx    # Feedback command
│   └── utils/
│       └── linear-api.ts      # API utilities
├── assets/
│   └── linear-app-icon.png
├── package.json               # Commands, hotkeys, preferences
├── IMPROVEMENTS.md            # Planned improvements tracker
├── MODS.md                    # Applied modifications log
└── .upstream                  # Upstream tracking
```

## Syncing Upstream

```bash
# Check for updates
../scripts/sync-check.sh linear-custom

# Apply updates (may need conflict resolution)
../scripts/apply-upstream.sh linear-custom
```

## License

Based on the official Linear extension. See [original repository](https://github.com/raycast/extensions/tree/main/extensions/linear).
