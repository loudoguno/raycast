#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title PAI Dashboard
# @raycast.mode inline
# @raycast.packageName PAI

# Optional parameters:
# @raycast.icon robot
# @raycast.refreshTime 5m

# Documentation:
# @raycast.description Show PAI status in menu bar
# @raycast.author Lou

PAI_DIR="${PAI_DIR:-$HOME/.claude}"
MEMORY_DIR="$PAI_DIR/MEMORY"

# Count today's sessions
TODAY=$(date +%Y-%m-%d)
SESSIONS_TODAY=$(find "$MEMORY_DIR/sessions" -name "${TODAY}*.json" 2>/dev/null | wc -l | tr -d ' ')

# Count active Claude sessions
ACTIVE=$(ps aux | grep -E "claude\s*$" | grep -v grep | wc -l | tr -d ' ')

echo "PAI: ${SESSIONS_TODAY} sessions today | ${ACTIVE} active"
