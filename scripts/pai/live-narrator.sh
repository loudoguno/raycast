#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Live Narrator
# @raycast.mode silent
# @raycast.packageName PAI

# Optional parameters:
# @raycast.icon 🎬
# @raycast.argument1 { "type": "dropdown", "placeholder": "Style", "data": [{"title": "Documentary (Attenborough)", "value": "documentary"}, {"title": "Sports Commentator", "value": "sports"}, {"title": "Nature Documentary", "value": "nature"}, {"title": "Comedy", "value": "comedy"}, {"title": "Film Noir", "value": "noir"}] }

# Documentation:
# @raycast.description AI narrates your camera feed in real-time
# @raycast.author Lou

STYLE="${1:-documentary}"
CMD="$HOME/aia/inbox/narration-app/run.sh --style $STYLE"

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
