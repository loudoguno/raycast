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

WORKSPACE="$HOME/aia/keybinding-workspace"

if [ -d "/Applications/iTerm.app" ]; then
  osascript <<APPLESCRIPT
tell application "iTerm"
  activate
  set newWindow to (create window with default profile)
  tell current session of newWindow
    write text "cd '$WORKSPACE' && claude"
  end tell
end tell
APPLESCRIPT
else
  osascript -e 'tell application "Terminal"
    activate
    do script "cd '"$WORKSPACE"' && claude"
  end tell'
fi

echo "Opening keybinding workspace with Claude..."
