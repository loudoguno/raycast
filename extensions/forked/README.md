# Forked Raycast Extensions

Personal forks of Raycast extensions with custom modifications.

## Quick Start

### Fork a new extension
```bash
./scripts/fork-extension.sh linear
# or with custom suffix
./scripts/fork-extension.sh obsidian my-obsidian
```

### Check for upstream updates
```bash
./scripts/sync-check.sh              # Check all forks
./scripts/sync-check.sh linear-custom  # Check specific fork
```

### Apply upstream changes
```bash
./scripts/apply-upstream.sh linear-custom
```

## Directory Structure

```
forked/
├── README.md              # This file
├── FORKING.md            # Complete protocol documentation
├── CUSTOMIZATIONS.md     # Track all planned customizations
├── _template/            # Templates for new forks
├── scripts/              # Helper scripts
│   ├── fork-extension.sh
│   ├── sync-check.sh
│   └── apply-upstream.sh
└── {extension}-custom/   # Your forked extensions
```

## Documentation

- **[FORKING.md](./FORKING.md)** - Complete forking protocol and workflow
- **[CUSTOMIZATIONS.md](./CUSTOMIZATIONS.md)** - Track planned changes for each extension

## Key Concepts

| Question | Answer |
|----------|--------|
| Can I publish forks to the Store? | No, forks are local-only |
| Can I share forks? | Yes, via git repo - recipients run `npm run dev` |
| Will forks conflict with originals? | No, different identifiers allow coexistence |
| How do I get upstream updates? | Manual sync with provided scripts |

## Planned Forks

- [ ] **Linear** - Custom hotkeys, quick assign, UI tweaks
- [ ] **Obsidian** - Multi-vault support, quick capture, templates
- [ ] **Roam Research** - Daily note shortcuts, block templates

## Workflow

1. Fork extension with `fork-extension.sh`
2. Customize `package.json` (hotkeys, defaults)
3. Modify source in `src/`
4. Run `npm install && npm run dev`
5. Document changes in `MODS.md`
6. Periodically run `sync-check.sh`
