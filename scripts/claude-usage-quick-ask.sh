#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Quick Claude Code Usage
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon ✳︎
# @raycast.packageName Claude

# Documentation:
# @raycast.description Check Claude Code usage stats
# @raycast.author loudog
# @raycast.authorURL https://github.com/loudog

STATS_FILE="$HOME/.claude/stats-cache.json"

if [[ ! -f "$STATS_FILE" ]]; then
  echo "No usage stats found"
  exit 1
fi

echo "Claude Code Usage Stats"
echo "========================"
echo ""

# Parse and display daily activity
jq -r '
  .dailyActivity | sort_by(.date) | reverse | .[0:7] | reverse |
  "Last 7 days:",
  "",
  "Date       | Messages | Sessions | Tools",
  "-----------|----------|----------|------",
  (.[] | "\(.date) |     \(.messageCount | tostring | .[0:4] | . + "    "[0:4-length]) |       \(.sessionCount)  |   \(.toolCallCount)")
' "$STATS_FILE"

echo ""
echo "Totals:"
jq -r '
  .dailyActivity |
  "  Messages: \(map(.messageCount) | add)",
  "  Sessions: \(map(.sessionCount) | add)",
  "  Tool calls: \(map(.toolCallCount) | add)"
' "$STATS_FILE"
