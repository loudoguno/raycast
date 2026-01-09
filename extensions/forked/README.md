# Forked Raycast Extensions

Personal forks of Raycast extensions with custom modifications and an **iterative development workflow** using Claude Code.

## Active Forks

| Extension | Status | Features |
|-----------|--------|----------|
| [Linear](./linear-custom/) | Template Ready | Quick assign, keyboard shortcuts, UI tweaks |
| [Obsidian](./obsidian-custom/) | Template Ready | Quick capture, multi-vault, content search |
| [Roam Research](./roam-custom/) | Template Ready | Semantic RAG, graph traversal, AI Q&A |

## Quick Start

### Fork a new extension
```bash
./scripts/fork-extension.sh linear
cd linear-custom
npm install && npm run dev
```

### Submit feedback from within extension
Use the "Submit Feedback" command (included in each fork) to create GitHub issues for improvements. Claude Code can then implement them automatically.

### Check for upstream updates
```bash
./scripts/sync-check.sh              # Check all forks
./scripts/sync-check.sh linear-custom  # Check specific fork
```

## Iterative Development Workflow

See [ITERATIVE-DEV.md](./ITERATIVE-DEV.md) for the complete workflow.

```
You → Notice Issue → Submit Feedback → Claude Code Implements → PR → Update
         ↑                                                          │
         └──────────────────────────────────────────────────────────┘
```

**No IDE required** - fire off improvements from the extension itself.

## Directory Structure

```
forked/
├── README.md                 # This file
├── FORKING.md               # Complete forking protocol
├── ITERATIVE-DEV.md         # Claude Code development workflow
├── CUSTOMIZATIONS.md        # Track all planned customizations
│
├── _template/               # Templates for new forks
├── _shared/                 # Shared components
│   └── submit-feedback.tsx  # Feedback command template
├── scripts/                 # Helper scripts
│   ├── fork-extension.sh
│   ├── sync-check.sh
│   └── apply-upstream.sh
│
├── linear-custom/           # Linear fork
│   ├── README.md
│   ├── IMPROVEMENTS.md
│   └── package.json.template
│
├── obsidian-custom/         # Obsidian fork
│   ├── README.md
│   ├── IMPROVEMENTS.md
│   └── package.json.template
│
└── roam-custom/             # Roam Research fork (with semantic RAG)
    ├── README.md
    ├── DESIGN.md            # Architecture for agentic features
    ├── FEATURES.md          # Feature specifications
    ├── IMPROVEMENTS.md
    └── package.json.template
```

## Documentation

| Document | Purpose |
|----------|---------|
| [FORKING.md](./FORKING.md) | Complete forking protocol and upstream sync |
| [ITERATIVE-DEV.md](./ITERATIVE-DEV.md) | Claude Code development workflow |
| [CUSTOMIZATIONS.md](./CUSTOMIZATIONS.md) | Track planned changes across all forks |

### Per-Extension Docs

| Extension | Key Docs |
|-----------|----------|
| Linear | [IMPROVEMENTS.md](./linear-custom/IMPROVEMENTS.md) |
| Obsidian | [IMPROVEMENTS.md](./obsidian-custom/IMPROVEMENTS.md) |
| Roam | [DESIGN.md](./roam-custom/DESIGN.md), [FEATURES.md](./roam-custom/FEATURES.md), [IMPROVEMENTS.md](./roam-custom/IMPROVEMENTS.md) |

## Key Concepts

| Question | Answer |
|----------|--------|
| Can I publish forks to the Store? | No, forks are local-only |
| Can I share forks? | Yes, via git repo - recipients run `npm run dev` |
| Will forks conflict with originals? | No, different identifiers allow coexistence |
| How do I get upstream updates? | Manual sync with provided scripts |
| Can I develop without an IDE? | Yes! Use Submit Feedback → Claude Code workflow |

## Workflow Summary

### Initial Setup
1. Fork extension with `fork-extension.sh`
2. Install dependencies: `npm install`
3. Start development: `npm run dev`
4. Configure preferences in Raycast

### Making Changes
1. Use extension, notice improvement opportunity
2. Run "Submit Feedback" command
3. Describe the change you want
4. Claude Code implements, creates PR
5. Review, merge, pull, enjoy

### Staying Updated
1. Run `sync-check.sh` periodically
2. Review upstream changes
3. Apply with `apply-upstream.sh`
4. Resolve any conflicts with your customizations

## Getting Started with Each Fork

### Linear
```bash
./scripts/fork-extension.sh linear
cd linear-custom
# Follow README.md for setup
```

### Obsidian
```bash
./scripts/fork-extension.sh obsidian
cd obsidian-custom
# Follow README.md for setup
```

### Roam Research (Agentic)
```bash
./scripts/fork-extension.sh roam-research roam-custom
cd roam-custom
# Follow README.md for setup
# See DESIGN.md for architecture
```
