#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Push to Prompt · C · here
# @raycast.mode silent
# @raycast.argument1 { "type": "text", "placeholder": "hold Wispr, talk, release, ⏎", "percentEncoded": false }

# Optional parameters:
# @raycast.icon 🗼
# @raycast.packageName Push to Prompt

# Documentation:
# @raycast.description Fire dictated text into a Claude Code session in the frontmost kitty cwd, else the frontmost Finder folder, else ~/code. The resolved path is always shown in the notification. Bind fn+shift+C to this in Raycast. See WORK#14.
# @raycast.author loudog

exec "$HOME/.local/bin/push-to-prompt" c "$1"
