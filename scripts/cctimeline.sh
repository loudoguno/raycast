#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title cctimeline
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📅
# @raycast.packageName Claude Session Timeline
# @raycast.argument1 { "type": "dropdown", "placeholder": "Action", "data": [{"title": "Calendar TUI", "value": "tui"}, {"title": "Today's Sessions", "value": "today"}, {"title": "Stats", "value": "stats"}, {"title": "Search", "value": "search"}] }

# Documentation:
# @raycast.description View Claude Code session timeline
# @raycast.author loudog
# @raycast.authorURL https://github.com/loudog

ACTION="${1:-tui}"
CCTIMELINE_PATH="$HOME/aia/cctimeline"

# Ensure we're using the correct node
export PATH="/opt/homebrew/bin:$PATH"

case "$ACTION" in
  tui)
    osascript -e 'tell application "Terminal"
      activate
      do script "node '"$CCTIMELINE_PATH"'/packages/tui/dist/cli.js"
    end tell'
    echo "Opening cctimeline TUI..."
    ;;
  today)
    osascript -e 'tell application "Terminal"
      activate
      do script "node '"$CCTIMELINE_PATH"'/packages/tui/dist/cli.js today"
    end tell'
    echo "Showing today's sessions..."
    ;;
  stats)
    osascript -e 'tell application "Terminal"
      activate
      do script "node '"$CCTIMELINE_PATH"'/packages/tui/dist/cli.js stats"
    end tell'
    echo "Showing stats..."
    ;;
  search)
    osascript -e 'tell application "Terminal"
      activate
      do script "echo \"Enter search query:\" && read q && node '"$CCTIMELINE_PATH"'/packages/tui/dist/cli.js search \"\$q\""
    end tell'
    echo "Opening search..."
    ;;
  *)
    echo "Unknown action: $ACTION"
    exit 1
    ;;
esac
