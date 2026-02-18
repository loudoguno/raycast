#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title IKDB Quick Add
# @raycast.mode silent

# Optional parameters:
# @raycast.icon ⌨️
# @raycast.packageName IKDB

# Documentation:
# @raycast.description Open IKDB Quick Add to capture a new keybinding
# @raycast.author loudog

# Send the Hyper+A keystroke to trigger QuickAdd
osascript -e 'tell application "System Events" to key code 0 using {control down, option down, shift down, command down}'
