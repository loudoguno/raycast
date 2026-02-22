#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Live Narrator (Quick)
# @raycast.mode silent
# @raycast.packageName PAI

# Optional parameters:
# @raycast.icon 🎙️

# Documentation:
# @raycast.description Start AI narrator immediately (documentary style)
# @raycast.author Lou

CMD="$HOME/aia/inbox/narration-app/run.sh --style documentary"

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
