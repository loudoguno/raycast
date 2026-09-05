#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Push to Prompt · K · keybindings
# @raycast.mode silent
# @raycast.argument1 { "type": "text", "placeholder": "hold Wispr, talk, release, ⏎", "percentEncoded": false }

# Optional parameters:
# @raycast.icon 🗼
# @raycast.packageName Push to Prompt

# Documentation:
# @raycast.description Fire dictated text into a Claude Code session in ~/keybindings. Bind fn+shift+K to this in Raycast. Backend: ~/.local/bin/push-to-prompt (repo: ~/code/raycast/scripts/push-to-prompt). See WORK#14.
# @raycast.author loudog

exec "$HOME/.local/bin/push-to-prompt" k "$1"
