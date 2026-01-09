# {EXTENSION_NAME} Custom - Modifications

## Fork Information

| Field | Value |
|-------|-------|
| **Original Extension** | {EXTENSION_NAME} |
| **Original Author** | {ORIGINAL_AUTHOR} |
| **Fork Date** | {FORK_DATE} |
| **Upstream Commit** | {UPSTREAM_COMMIT} |
| **Raycast Store URL** | https://raycast.com/{ORIGINAL_AUTHOR}/{EXTENSION_NAME} |

---

## Customizations

### Keyboard Shortcuts

| Command | Original | Custom | Notes |
|---------|----------|--------|-------|
| {command} | {original_hotkey} | {new_hotkey} | {reason} |

### UI/Aesthetic Changes

- [ ] {Description of UI change}
  - File: `src/{file}.tsx`
  - Lines: {line_numbers}
  - Reason: {why}

### Feature Additions

- [ ] **{Feature Name}**
  - Description: {what it does}
  - Files Added/Modified: {list}
  - Dependencies Added: {if any}

### Feature Modifications

- [ ] **{Feature Name}**
  - Original Behavior: {what it did}
  - New Behavior: {what it does now}
  - Reason: {why changed}

### Feature Removals

- [ ] **{Feature Name}**
  - Reason: {why removed}
  - Files: {affected files}

---

## Files Modified

Track all files changed from upstream:

```
src/
├── {file1}.tsx      # {brief description of changes}
├── {file2}.tsx      # {brief description of changes}
└── utils/
    └── {file3}.ts   # {brief description of changes}

package.json         # {what changed - hotkeys, name, etc}
```

---

## Sync History

| Date | Upstream Commit | Changes Merged | Conflicts |
|------|-----------------|----------------|-----------|
| {date} | {commit_hash} | {description} | {yes/no - details} |

---

## Testing Notes

### Commands Tested
- [ ] {Command 1}: Working / Issues
- [ ] {Command 2}: Working / Issues

### Known Issues
- {Issue description and workaround if any}

---

## Rollback Plan

If this fork becomes unmaintainable:
1. Uninstall custom version: Stop `npm run dev`, remove from Raycast
2. Install original: `raycast://extensions/{ORIGINAL_AUTHOR}/{EXTENSION_NAME}`
3. Archive this fork or delete
