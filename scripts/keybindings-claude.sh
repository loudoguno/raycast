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

# Open Ghostty with a new Claude session in the keybindings directory
# Use Ghostty CLI to open a new window with the command directly
/Applications/Ghostty.app/Contents/MacOS/ghostty --working-directory="$WORKSPACE" -e bash -c './scripts/health-check.sh; claude' &

echo "Opening keybinding workspace with Claude in Ghostty..."
