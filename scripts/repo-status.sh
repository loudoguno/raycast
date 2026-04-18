#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Repo Status
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon 📊
# @raycast.packageName Git Sync

# Documentation:
# @raycast.description Fetch and show status of key repos — local, remote, and cross-machine
# @raycast.author Lou DeSantis

REPOS=(
  "$HOME/code/raycast"
  "$HOME/keybindings"
  "$HOME/.ssh"
  "$HOME/ky/kb"
  "$HOME/ky/ky-network"
)

# Determine the other machine for cross-machine checks
THIS_MACHINE=$(hostname -s)
if [ "$THIS_MACHINE" = "mxb" ]; then
  OTHER="mx3"
elif [ "$THIS_MACHINE" = "mx3" ]; then
  OTHER="mxb"
else
  OTHER=""
fi

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo "═══════════════════════════════════════"
echo "  Repo Status — $(date '+%Y-%m-%d %H:%M')"
echo "  Machine: $THIS_MACHINE"
echo "═══════════════════════════════════════"
echo ""

for repo in "${REPOS[@]}"; do
  name=$(basename "$repo")
  # Use full path for dotfile dirs
  [ "$name" = ".ssh" ] && name="~/.ssh"

  echo -e "${CYAN}▸ $name${RESET} ($repo)"

  if [ ! -d "$repo/.git" ]; then
    echo -e "  ${RED}✗ Not a git repo${RESET}"
    echo ""
    continue
  fi

  # Check for uncommitted local changes
  local_changes=$(git -C "$repo" status --short 2>/dev/null)
  if [ -n "$local_changes" ]; then
    count=$(echo "$local_changes" | wc -l | tr -d ' ')
    echo -e "  ${YELLOW}⚠ $count uncommitted local changes${RESET}"
  fi

  # Check for unpushed commits
  unpushed=$(git -C "$repo" log --oneline '@{u}..HEAD' 2>/dev/null)
  if [ -n "$unpushed" ]; then
    count=$(echo "$unpushed" | wc -l | tr -d ' ')
    echo -e "  ${YELLOW}⚠ $count unpushed local commits${RESET}"
  fi

  # Cross-machine check (only if other machine is reachable)
  if [ -n "$OTHER" ]; then
    if ssh -o ConnectTimeout=2 -o BatchMode=yes "$OTHER" true 2>/dev/null; then
      remote_changes=$(ssh -o ConnectTimeout=5 "$OTHER" "cd $repo 2>/dev/null && git status --short" 2>/dev/null)
      remote_unpushed=$(ssh -o ConnectTimeout=5 "$OTHER" "cd $repo 2>/dev/null && git log --oneline '@{u}..HEAD'" 2>/dev/null)

      if [ -n "$remote_changes" ]; then
        count=$(echo "$remote_changes" | wc -l | tr -d ' ')
        echo -e "  ${YELLOW}⚠ $count uncommitted changes on $OTHER${RESET}"
      fi
      if [ -n "$remote_unpushed" ]; then
        count=$(echo "$remote_unpushed" | wc -l | tr -d ' ')
        echo -e "  ${RED}⚠ $count unpushed commits on $OTHER — pull will be incomplete${RESET}"
      fi
    fi
  fi

  # Fetch (safe — never modifies working tree)
  fetch_output=$(git -C "$repo" fetch 2>&1)
  if [ $? -ne 0 ]; then
    echo -e "  ${RED}✗ Fetch failed:${RESET} $fetch_output"
    echo ""
    continue
  fi

  # Ahead/behind remote
  tracking=$(git -C "$repo" rev-parse --abbrev-ref '@{u}' 2>/dev/null)
  if [ -n "$tracking" ]; then
    ahead=$(git -C "$repo" rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)
    behind=$(git -C "$repo" rev-list --count 'HEAD..@{u}' 2>/dev/null || echo 0)

    if [ "$ahead" -eq 0 ] && [ "$behind" -eq 0 ]; then
      echo -e "  ${GREEN}✓ In sync with $tracking${RESET}"
    else
      [ "$ahead" -gt 0 ] && echo -e "  ${YELLOW}↑ $ahead commits ahead${RESET} (unpushed)"
      [ "$behind" -gt 0 ] && echo -e "  ${YELLOW}↓ $behind commits behind${RESET} (run: git -C $repo pull)"
    fi
  else
    echo -e "  ${YELLOW}⚠ No upstream tracking branch${RESET}"
  fi

  echo ""
done

echo "═══════════════════════════════════════"
echo "  Done."
echo "═══════════════════════════════════════"
