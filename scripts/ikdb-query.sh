#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title IKDB Query
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🔍
# @raycast.packageName IKDB

# Documentation:
# @raycast.description Open IKDB Query Widget to check if a key combo is taken
# @raycast.author loudog

# Send the Hyper+K keystroke to trigger Query Widget
osascript -e 'tell application "System Events" to key code 40 using {control down, option down, shift down, command down}'
