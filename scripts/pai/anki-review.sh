#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Anki Review
# @raycast.mode silent
# @raycast.packageName PAI

# Optional parameters:
# @raycast.icon 🧠

# Documentation:
# @raycast.description Review due Anki flashcards
# @raycast.author Lou

# Open Ghostty and run Anki review TUI
CMD="bun run $HOME/.claude/skills/Anki/Tools/tui.ts"

if [[ -d "/Applications/Ghostty.app" ]]; then
    open -a "Ghostty"
    sleep 0.5
    osascript -e "tell application \"System Events\" to keystroke \"$CMD\" & return"
elif [[ -d "/Applications/iTerm.app" ]]; then
    osascript <<EOF
tell application "iTerm"
    activate
    tell current window
        create tab with default profile command "$CMD"
    end tell
end tell
EOF
else
    open -a "Terminal"
    sleep 0.5
    osascript -e "tell application \"System Events\" to keystroke \"$CMD\" & return"
fi
