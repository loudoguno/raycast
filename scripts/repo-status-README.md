# repo-status.sh

A Raycast script command that gives you a quick overview of all your important git repos across machines — without pulling or modifying anything.

## Why this exists

Lou works across two machines (mxb and mx3) and has key repos scattered across several directories. Before starting work, it's important to know:

- Do I have uncommitted changes locally?
- Does the other machine have uncommitted or unpushed work I should grab first?
- Am I behind the remote?

This script answers all three in one shot. It deliberately **does not pull** — it fetches only, so you see the status and decide what to do.

## What it does

For each repo in the list:

1. **Local status** — checks for uncommitted changes and unpushed commits
2. **Cross-machine check** — SSHes into the other machine and checks that repo for uncommitted changes and unpushed commits
3. **Fetch** — runs `git fetch` (safe, never touches your working tree)
4. **Ahead/behind** — shows how many commits you're ahead or behind the remote tracking branch

## How to run

- **Raycast**: Search for "Repo Status"
- **Terminal**: `./scripts/repo-status.sh`

## How to add repos

Edit the `REPOS` array at the top of the script (line 16):

```bash
REPOS=(
  "$HOME/code/raycast"
  "$HOME/keybindings"
  "$HOME/.ssh"
  "$HOME/ky/kb"
  "$HOME/ky/ky-network"
  "$HOME/code/new-project"    # <-- add new repos here
)
```

Repos must be git repositories. Non-git directories are skipped with a warning.

## How to add machines

Edit the machine detection block (line 25):

```bash
THIS_MACHINE=$(hostname -s)
if [ "$THIS_MACHINE" = "mxb" ]; then
  OTHER="mx3"
elif [ "$THIS_MACHINE" = "mx3" ]; then
  OTHER="mxb"
elif [ "$THIS_MACHINE" = "new-host" ]; then   # <-- add new machine
  OTHER="mxb"                                   # <-- which machine to check
fi
```

Requirements for cross-machine checks:
- SSH key-based auth to the other machine (no password prompts)
- The repo must exist at the **same path** on both machines (uses `$HOME` expansion)
- 2-second connection timeout — if the other machine is off/unreachable, it's silently skipped

## Important notes

- **Fetch-only**: This script never runs `git pull`, `git merge`, or modifies your working tree in any way
- **SSH timeouts**: If the other machine is unreachable, the cross-machine check is silently skipped (2s timeout)
- **No upstream**: Repos without a tracking branch (like `~/.ssh`) will show a warning but still report local status
- **Same paths assumed**: Cross-machine checks assume repos live at the same `$HOME`-relative path on both machines
