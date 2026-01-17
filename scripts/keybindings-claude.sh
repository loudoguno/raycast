#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Keybindings Claude
# @raycast.mode silent

# Optional parameters:
# @raycast.icon ⌨️
# @raycast.packageName Keybinding Workspace
# @raycast.alias kb
# @raycast.alias keybindings

# Documentation:
# @raycast.description Open Claude Code in keybinding workspace
# @raycast.author loudog
# @raycast.authorURL https://github.com/loudog

WORKSPACE="$HOME/keybindings"

# Run health check in Terminal.app
osascript -e 'tell application "Terminal"
  activate
  do script "cd ~/keybindings && ./scripts/healthcheck.sh"
end tell'

# Open Ghostty with Claude session
sleep 0.5
osascript <<EOF
tell application "Ghostty"
  activate
end tell
delay 0.3
tell application "System Events"
  tell process "Ghostty"
    keystroke "n" using command down
  end tell
end tell
delay 0.2
tell application "System Events"
  tell process "Ghostty"
    keystroke "cd '$WORKSPACE' && claude"
    key code 36
  end tell
end tell
EOF

echo "Opening keybinding workspace with Claude in Ghostty..."
