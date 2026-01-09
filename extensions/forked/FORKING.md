# Raycast Extension Forking Protocol

A systematic workflow for forking, customizing, and maintaining personal versions of Raycast extensions.

## Overview

**Why fork instead of contribute upstream?**
- Personal keyboard shortcuts and hotkeys
- Custom aesthetics (colors, icons, layouts)
- Workflow-specific features that don't fit the general audience
- Experimental modifications you want to test long-term
- Combinations of features from multiple extensions

**Key Constraint**: Forked extensions are **local-only**. You cannot publish a fork to the Raycast Store—you would need to contribute changes upstream or create an entirely new extension with a different name/identifier.

---

## Quick Start

### Method 1: Fork via Raycast UI (Recommended)
1. Open Raycast → Search for the extension
2. Press `⌘ K` → Select **Fork Extension**
3. Choose destination folder (e.g., `~/code/raycast/extensions/forked/`)
4. Run `npm install && npm run dev`

### Method 2: Fork from GitHub
```bash
# Clone the entire extensions repo (sparse checkout for efficiency)
git clone --filter=blob:none --sparse https://github.com/raycast/extensions.git raycast-upstream
cd raycast-upstream
git sparse-checkout set extensions/linear extensions/obsidian extensions/roam-research

# Copy desired extension to your local repo
cp -r extensions/linear ~/code/raycast/extensions/forked/linear-custom
```

---

## Directory Structure

```
extensions/
├── forked/                    # All forked extensions live here
│   ├── FORKING.md            # This protocol document
│   ├── CUSTOMIZATIONS.md     # Track all your customizations
│   │
│   ├── linear-custom/        # Forked Linear extension
│   │   ├── .upstream         # Tracks upstream version info
│   │   ├── MODS.md          # Documents your specific changes
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── obsidian-custom/      # Forked Obsidian extension
│   │   ├── .upstream
│   │   ├── MODS.md
│   │   └── ...
│   │
│   └── roam-custom/          # Forked Roam Research extension
│       ├── .upstream
│       ├── MODS.md
│       └── ...
│
├── balloons/                  # Your original extensions
├── balloons-fancy/
└── claude-usage/
```

---

## Forking Workflow

### Step 1: Initial Fork

```bash
# Navigate to forked directory
cd ~/code/raycast/extensions/forked

# Use Raycast's Fork Extension action, OR manually copy from upstream
# The extension will be placed in your chosen directory
```

### Step 2: Create Tracking Files

Create `.upstream` file to track the source:
```bash
cat > .upstream << 'EOF'
# Upstream tracking for this forked extension
UPSTREAM_REPO=https://github.com/raycast/extensions
UPSTREAM_PATH=extensions/linear
FORKED_FROM_COMMIT=abc123def456
FORKED_DATE=2025-01-09
LAST_SYNC_CHECK=2025-01-09
EOF
```

Create `MODS.md` to document customizations:
```markdown
# Linear Custom - Modifications

## Forked From
- Extension: Linear
- Original Author: @raycast
- Fork Date: 2025-01-09
- Upstream Commit: abc123def456

## Customizations

### Keyboard Shortcuts
- [ ] Changed default hotkey for "Create Issue" from ⌘N to ⌃⌘I

### UI Changes
- [ ] Modified list item subtitle to show project name
- [ ] Changed accent color in detail view

### New Features
- [ ] Added "Quick Assign to Me" action
- [ ] Custom template for bug reports

### Removed Features
- [ ] Disabled telemetry/analytics

## Files Modified
- `src/create-issue.tsx` - Custom template
- `src/components/IssueListItem.tsx` - UI tweaks
- `package.json` - Hotkey changes
```

### Step 3: Modify package.json Identity

**Critical**: Change the extension identifier to avoid conflicts:

```json
{
  "name": "linear-custom",
  "title": "Linear (Custom)",
  "description": "Personal fork of Linear extension",
  "author": "yourusername",
  "owner": "yourusername"
}
```

### Step 4: Develop and Test

```bash
npm install
npm run dev

# Extension appears in Raycast as "Linear (Custom)"
# Original "Linear" extension remains unaffected
```

---

## Syncing Upstream Changes

### Manual Sync Process

Since forked extensions don't have automatic upstream tracking, you need a manual process:

```bash
# 1. Set up upstream remote (one-time)
cd ~/code/raycast-upstream
git remote add upstream https://github.com/raycast/extensions.git

# 2. Fetch latest changes
git fetch upstream main

# 3. View changes to the extension you care about
git diff HEAD..upstream/main -- extensions/linear/

# 4. If changes look good, create a patch
git diff HEAD..upstream/main -- extensions/linear/ > ~/linear-updates.patch

# 5. Apply patch to your fork (may need manual conflict resolution)
cd ~/code/raycast/extensions/forked/linear-custom
patch -p3 < ~/linear-updates.patch
```

### Sync Decision Framework

| Upstream Change Type | Recommended Action |
|---------------------|-------------------|
| Bug fixes | Usually merge |
| New features | Evaluate, selectively merge |
| UI changes | Review carefully, may conflict with your customizations |
| Breaking API changes | Must merge to maintain functionality |
| Dependency updates | Generally merge for security |

### Tracking Sync Status

Add to your `.upstream` file after each sync check:
```
LAST_SYNC_CHECK=2025-01-15
LAST_SYNC_COMMIT=def789abc012
SYNC_NOTES=Merged bug fix for OAuth refresh
```

---

## Customization Patterns

### Pattern 1: Keyboard Shortcut Changes

Edit `package.json`:
```json
{
  "commands": [
    {
      "name": "create-issue",
      "title": "Create Issue",
      "subtitle": "Linear",
      "description": "Create a new issue",
      "mode": "view",
      "keywords": ["new", "add", "task"],
      "preferences": []
    }
  ],
  "preferences": []
}
```

Then in Raycast: Settings → Extensions → Your Fork → Set hotkey

### Pattern 2: Default Value Changes

Many extensions use preferences. Modify defaults in `package.json`:
```json
{
  "preferences": [
    {
      "name": "defaultProject",
      "type": "textfield",
      "required": false,
      "title": "Default Project",
      "description": "Pre-fill this project on new issues",
      "default": "my-project-id"
    }
  ]
}
```

### Pattern 3: UI/Aesthetic Changes

Modify React components in `src/`:
```tsx
// Before
<List.Item
  title={issue.title}
  subtitle={issue.identifier}
/>

// After - your customization
<List.Item
  title={issue.title}
  subtitle={`${issue.project?.name} • ${issue.identifier}`}
  accessories={[
    { tag: { value: issue.priority, color: getPriorityColor(issue.priority) } }
  ]}
/>
```

### Pattern 4: Adding Actions

```tsx
<ActionPanel>
  {/* Original actions */}
  <Action.OpenInBrowser url={issue.url} />

  {/* Your custom action */}
  <Action
    title="Assign to Me"
    icon={Icon.Person}
    shortcut={{ modifiers: ["cmd"], key: "m" }}
    onAction={() => assignToCurrentUser(issue.id)}
  />
</ActionPanel>
```

### Pattern 5: Removing Features

Comment out or delete unwanted features:
```tsx
// Removed: Analytics tracking I don't want
// import { trackEvent } from "./analytics";

export default function Command() {
  // trackEvent("command_opened"); // Removed
  return <List>...</List>;
}
```

---

## Sharing Forked Extensions

### Can You Share Forked Extensions?

| Method | Possible? | Notes |
|--------|-----------|-------|
| Raycast Store | No | Must contribute upstream or create new extension |
| Direct file sharing | Yes | Recipient runs `npm run dev` locally |
| Git repository | Yes | Share your fork repo, others clone and run locally |
| Raycast Teams/Org | Maybe | If you have a team plan, can publish to private store |

### Sharing via Git

```bash
# Your forked extensions are already in your git repo
cd ~/code/raycast
git add extensions/forked/linear-custom
git commit -m "Add custom Linear fork"
git push

# Others can clone and use
git clone https://github.com/you/raycast-extensions
cd raycast-extensions/extensions/forked/linear-custom
npm install && npm run dev
```

---

## Maintenance Checklist

### Weekly
- [ ] Check if upstream has important bug fixes
- [ ] Verify extension still works after Raycast updates

### Monthly
- [ ] Review upstream changelog for new features to potentially merge
- [ ] Update dependencies: `npm update`
- [ ] Test all customized commands

### After Raycast Updates
- [ ] Verify hot reload still works
- [ ] Check for deprecated API usage
- [ ] Test OAuth/authentication flows

---

## Extension-Specific Notes

### Linear
- Uses OAuth - tokens stored securely by Raycast
- API rate limits apply
- Workspace switching requires re-auth

### Obsidian
- Reads from `~/Library/Application Support/obsidian/obsidian.json`
- Content search is optional preference
- Vault paths are auto-detected

### Roam Research
- Requires API token from Roam
- Graph name configuration required
- Block references may need special handling

---

## Troubleshooting

### Extension not appearing after fork
```bash
# Refresh Raycast extensions
# In Raycast: search "Refresh Extensions"

# Or restart dev server
npm run dev
```

### Conflicts with original extension
- Ensure `name` in package.json is unique
- Both can coexist - they're separate extensions

### Build errors after upstream merge
```bash
# Clear node_modules and rebuild
rm -rf node_modules
npm install
npm run build
```

### TypeScript errors
```bash
# Check for API changes
npm run lint
# Review Raycast changelog for breaking changes
```
