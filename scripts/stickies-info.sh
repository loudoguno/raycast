#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Stickies Info
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon 📝
# @raycast.packageName Stickies Automation
# @raycast.argument1 { "type": "dropdown", "placeholder": "Format", "optional": true, "data": [{"title": "Summary", "value": "summary"}, {"title": "Verbose", "value": "verbose"}, {"title": "JSON", "value": "json"}] }

# Documentation:
# @raycast.description Display information about all stickies
# @raycast.author loudog
# @raycast.authorURL https://github.com/loudog

FORMAT="${1:-summary}"

case "$FORMAT" in
    verbose)
        "$HOME/bin/stickies-info" --verbose
        ;;
    json)
        "$HOME/bin/stickies-info" --json
        ;;
    *)
        "$HOME/bin/stickies-info"
        ;;
esac
