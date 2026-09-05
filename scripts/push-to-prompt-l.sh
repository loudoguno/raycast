#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Push to Prompt · L · LifeOS
# @raycast.mode silent
# @raycast.argument1 { "type": "text", "placeholder": "hold Wispr, talk, release, ⏎", "percentEncoded": false }

# Optional parameters:
# @raycast.icon 🗼
# @raycast.packageName Push to Prompt

# Documentation:
# @raycast.description Fire dictated text into a LifeOS Claude Code session in ~/.claude at high effort. Bind fn+shift+L to this in Raycast. Backend: ~/.local/bin/push-to-prompt (repo: ~/code/raycast/scripts/push-to-prompt). See WORK#14.
# @raycast.author loudog

exec "$HOME/.local/bin/push-to-prompt" l "$1"
