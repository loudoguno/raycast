#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title LifeOS Capture
# @raycast.mode silent
# @raycast.argument1 { "type": "text", "placeholder": "request / thought / fix-me", "percentEncoded": false }

# Optional parameters:
# @raycast.icon ⚡️
# @raycast.packageName LifeOS

# Documentation:
# @raycast.description Global quick capture into the Synapse ledger (cap). Bind a hotkey to this in Raycast → one keystroke, type, enter, done. Review queue: `promote --list`.
# @raycast.author loudog

exec "$HOME/.local/bin/cap" --source raycast "$1"
