#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title PAI Quick Ask
# @raycast.mode silent
# @raycast.packageName PAI

# Optional parameters:
# @raycast.icon robot

# Documentation:
# @raycast.description Open new terminal with PAI inbox
# @raycast.author Lou

# Open Ghostty (or your preferred terminal) with ask-pai
if [[ -d "/Applications/Ghostty.app" ]]; then
    open -a "Ghostty" "$HOME/aia/inbox"
    sleep 0.3
    osascript -e 'tell application "System Events" to keystroke "ask-pai" & return'
else
    open -a "Terminal" "$HOME/aia/inbox"
    sleep 0.3
    osascript -e 'tell application "System Events" to keystroke "ask-pai" & return'
fi
