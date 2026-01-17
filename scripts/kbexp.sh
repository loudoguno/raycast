#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title kbexp
# @raycast.mode silent

# Optional parameters:
# @raycast.icon keyboard
# @raycast.packageName Keybinding Explorer
# @raycast.argument1 { "type": "dropdown", "placeholder": "Action", "data": [{"title": "Open GUI", "value": "gui"}, {"title": "Health Check", "value": "health"}, {"title": "Search", "value": "search"}, {"title": "Conflicts", "value": "conflicts"}, {"title": "TUI", "value": "tui"}] }

# Documentation:
# @raycast.description Launch kbexp keybinding explorer
# @raycast.author loudog
# @raycast.authorURL https://github.com/loudog

ACTION="${1:-gui}"
KBEXP_PATH="$HOME/aia/kbexp"

# Ensure we're using the correct node
export PATH="/opt/homebrew/bin:$PATH"

case "$ACTION" in
  gui)
    cd "$KBEXP_PATH" && npm run gui &
    echo "Launching kbexp desktop overlay..."
    ;;
  health)
    osascript -e 'tell application "Terminal"
      activate
      do script "cd '"$KBEXP_PATH"' && npx tsx bin/cli.tsx health"
    end tell'
    echo "Running health checks..."
    ;;
  search)
    osascript -e 'tell application "Terminal"
      activate
      do script "cd '"$KBEXP_PATH"' && npx tsx bin/cli.tsx"
    end tell'
    echo "Opening kbexp TUI for search..."
    ;;
  conflicts)
    osascript -e 'tell application "Terminal"
      activate
      do script "cd '"$KBEXP_PATH"' && npx tsx bin/cli.tsx conflicts"
    end tell'
    echo "Checking for conflicts..."
    ;;
  tui)
    osascript -e 'tell application "Terminal"
      activate
      do script "cd '"$KBEXP_PATH"' && npx tsx bin/cli.tsx"
    end tell'
    echo "Opening kbexp TUI..."
    ;;
  *)
    echo "Unknown action: $ACTION"
    exit 1
    ;;
esac

# Installation instructions:
# 1. Copy this script to your Raycast scripts folder:
#    cp ~/aia/kbexp/scripts/raycast-kbexp.sh ~/code/raycast/scripts/kbexp.sh
# 2. Make it executable:
#    chmod +x ~/code/raycast/scripts/kbexp.sh
# 3. Refresh Raycast scripts
