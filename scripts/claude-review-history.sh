#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Claude Review History
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon ✳︎
# @raycast.packageName Claude Code

# Documentation:
# @raycast.description Show chronological list of past Claude review sessions
# @raycast.author loudog

exec "$HOME/.claude/scripts/claude-review-history" list
