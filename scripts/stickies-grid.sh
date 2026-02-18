#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Stickies Grid
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🔲
# @raycast.packageName Stickies Automation
# @raycast.argument1 { "type": "dropdown", "placeholder": "Mode", "optional": true, "data": [{"title": "Execute", "value": "run"}, {"title": "Dry Run", "value": "dry"}] }

# Documentation:
# @raycast.description Arrange stickies in a uniform grid pattern
# @raycast.author loudog
# @raycast.authorURL https://github.com/loudog

MODE="${1:-run}"

if [[ "$MODE" == "dry" ]]; then
    "$HOME/bin/stickies-grid" --dry-run 2>&1 | head -20
    echo "---"
    echo "(Dry run - no changes made)"
else
    "$HOME/bin/stickies-grid" 2>&1 | tail -5
fi
