#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title IKDB Cheatsheet
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📋
# @raycast.packageName IKDB

# Documentation:
# @raycast.description Open IKDB Cheatsheet to view all shortcuts
# @raycast.author loudog

# Send the Hyper+/ keystroke to trigger Cheatsheet
osascript -e 'tell application "System Events" to key code 44 using {control down, option down, shift down, command down}'
