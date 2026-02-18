#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Claude Review File
# @raycast.mode silent

# Optional parameters:
# @raycast.icon ✳︎
# @raycast.packageName Claude Code

# Documentation:
# @raycast.description Review the currently focused file with Claude Code (auto-research + suggestions)
# @raycast.author loudog

exec "$HOME/.claude/scripts/claude-review"
