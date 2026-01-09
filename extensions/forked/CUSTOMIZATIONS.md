# Forked Extensions - Customization Tracker

Central registry of all forked extensions and their customizations.

## Active Forks

| Extension | Status | Last Sync | Upstream Version |
|-----------|--------|-----------|------------------|
| Linear | Planned | - | - |
| Obsidian | Planned | - | - |
| Roam Research | Planned | - | - |

---

## Linear (Planned)

**Original**: [raycast/extensions/linear](https://github.com/raycast/extensions/tree/main/extensions/linear)
**Local Path**: `./linear-custom/`

### Planned Customizations

#### Keyboard Shortcuts
- [ ] Global hotkey: Create Issue → `⌃⌥L`
- [ ] In-command: Assign to Me → `⌘M`
- [ ] In-command: Change Status → `⌘S`

#### UI/Flow Changes
- [ ] Show project name prominently in list view
- [ ] Add priority color badges
- [ ] Custom issue templates for common types

#### Feature Additions
- [ ] Quick "Assign to Me" action
- [ ] Batch status change for multiple issues
- [ ] Copy issue as markdown link

#### Feature Removals
- [ ] (none planned)

---

## Obsidian (Planned)

**Original**: [raycast/extensions/obsidian](https://github.com/raycast/extensions/tree/main/extensions/obsidian)
**Local Path**: `./obsidian-custom/`

### Planned Customizations

#### Keyboard Shortcuts
- [ ] Global hotkey: Search Notes → `⌃⌥O`
- [ ] Global hotkey: Daily Note → `⌃⌥D`
- [ ] Global hotkey: Quick Capture → `⌃⌥N`

#### UI/Flow Changes
- [ ] Customize note preview markdown rendering
- [ ] Show vault name in list items (for multi-vault)
- [ ] Modified date in accessories

#### Feature Additions
- [ ] Quick append to daily note
- [ ] Template selector for new notes
- [ ] Recent notes command

#### Feature Removals
- [ ] (none planned)

---

## Roam Research (Planned)

**Original**: [raycast/extensions/roam-research](https://github.com/raycast/extensions/tree/main/extensions/roam-research)
**Local Path**: `./roam-custom/`

### Planned Customizations

#### Keyboard Shortcuts
- [ ] Global hotkey: Search → `⌃⌥R`
- [ ] Global hotkey: Quick Capture → `⌃⌥⇧R`
- [ ] Global hotkey: Daily Notes → `⌃⌥⇧D`

#### UI/Flow Changes
- [ ] Better block reference rendering
- [ ] Page hierarchy in search results
- [ ] Custom CSS for preview

#### Feature Additions
- [ ] Quick add to today's daily note
- [ ] Block template insertion
- [ ] Graph statistics command

#### Feature Removals
- [ ] (none planned)

---

## Customization Categories Reference

### Hotkey Conventions
Using consistent modifier patterns across all extensions:

| Action Type | Modifier Pattern | Example |
|-------------|-----------------|---------|
| Open/Search | `⌃⌥` + letter | `⌃⌥L` for Linear |
| Quick Capture | `⌃⌥⇧` + letter | `⌃⌥⇧R` for Roam capture |
| Daily/Today | `⌃⌥` + `D` | Universal daily note |

### Common UI Patterns
- **List Items**: Title + Subtitle + Accessories pattern
- **Detail Views**: Markdown with metadata header
- **Actions**: Primary action first, then common actions, then destructive

### Testing Checklist (Per Extension)
- [ ] All commands launch without error
- [ ] OAuth/auth flows work
- [ ] Data fetches successfully
- [ ] Custom hotkeys don't conflict
- [ ] Actions perform expected behavior
