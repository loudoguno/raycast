#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Push to Prompt · Q · quick
# @raycast.mode silent
# @raycast.argument1 { "type": "text", "placeholder": "hold Wispr, talk, release, ⏎", "percentEncoded": false }

# Optional parameters:
# @raycast.icon 🗼
# @raycast.packageName Push to Prompt

# Documentation:
# @raycast.description Fire a one-off question into a neutral low-effort Claude Code session that reads no files. Bind fn+shift+Q to this in Raycast. Backend: ~/.local/bin/push-to-prompt (repo: ~/code/raycast/scripts/push-to-prompt). See WORK#14.
# @raycast.author loudog

exec "$HOME/.local/bin/push-to-prompt" q "$1"
