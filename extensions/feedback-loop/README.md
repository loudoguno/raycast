# User Feedback Loop

Submit feedback as GitHub Issues for any Raycast extension, then burn through the backlog with autonomous Claude Code agents.

## Commands

### Submit Feedback

Form-based feedback submission for any extension in the monorepo.

- **Extension picker** — auto-discovers extensions from `extensions/*/package.json` with static fallback
- **Type selector** — Bug Report, Feature Request, or Improvement
- **Draft auto-save** — drafts persist via LocalStorage with debounced saves; resume on reopen
- Creates a GitHub Issue with labels: `feedback` + `ext:<package-name>` + type label (`bug`/`enhancement`/`improvement`)
- Success toast with "Open in Browser" action

### Burn Backlog

Three-level burn system powered by the `raycast-burndown` custom agent (`.claude/agents/raycast-burndown.md`):

| Level | What it does |
|-------|-------------|
| **Burn This Issue** | Spawns an agent focused on one specific issue |
| **Burn All Issues** | Spawns an agent to triage and fix all open issues for one extension |
| **Burn All Extensions** | Spawns an agent to triage and fix all open feedback issues across every extension |

Each level launches an interactive `claude --agent raycast-burndown` session in Terminal (Ghostty/iTerm/Terminal auto-detected). The agent:

1. Does git housekeeping (clean tree, pull latest, create feature branch)
2. Triages issues and presents a plan for approval
3. Fixes issues sequentially, running `npm run build` after each
4. Comments on GitHub issues with fix details and closes them
5. Pushes the feature branch ready for merge

## Setup

### 1. GitHub PAT

Configure in Raycast extension preferences:

- Generate a [fine-grained PAT](https://github.com/settings/personal-access-tokens/new) for `loudoguno/raycast`
- Scope: **Issues** Read & Write
- Paste into the "GitHub PAT" preference field

### 2. GitHub Labels

Labels should already exist on the repo. If not:

```bash
gh label create "feedback" --color "d876e3" --repo loudoguno/raycast
# Plus ext: labels for each extension — see CLAUDE.md for the full list
```

### 3. Claude Code

The burndown agent requires [Claude Code](https://claude.ai/code) installed and authenticated (`claude` CLI available in Terminal).

## Architecture

```
feedback-loop/
├── src/
│   ├── submit-feedback.tsx     # Feedback form with draft persistence
│   ├── burn-backlog.tsx        # Extension list → issue list → agent launch
│   └── lib/
│       ├── github-client.ts    # createIssue(), listIssues() via GitHub REST API
│       ├── extensions.ts       # discoverExtensions() with runtime scan + static fallback
│       ├── terminal.ts         # executeInTerminal() via osascript
│       └── types.ts            # ExtensionInfo, GitHubIssue, DraftState
├── package.json
└── assets/
    └── extension-icon.png
```

The burndown agent definition lives at the repo root: `.claude/agents/raycast-burndown.md`

## How It Works

### Feedback Flow

```
User opens "Submit Feedback" in Raycast
  → Picks extension from dropdown
  → Fills title + description
  → Submit creates GitHub Issue with labels
  → Issue appears in "Burn Backlog" command
```

### Burn Flow

```
User opens "Burn Backlog" in Raycast
  → Sees extensions with issue count badges
  → Drills into extension → sees individual issues
  → Hits "Burn" at any level
  → Terminal opens with claude --agent raycast-burndown
  → Agent triages, plans, gets approval, fixes, closes issues
  → Session visible in Claude Sessions extension
```
