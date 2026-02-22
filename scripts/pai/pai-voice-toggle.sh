#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title PAI Voice Toggle
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🔊
# @raycast.packageName PAI
# @raycast.argument1 { "type": "dropdown", "placeholder": "Voice", "data": [{"title": "Edward", "value": "edward"}, {"title": "Off", "value": "off"}, {"title": "Status", "value": "status"}] }

PAI_DIR="${HOME}/.claude"

case "$1" in
  edward)
    bun run "${PAI_DIR}/tools/pai-voice" edward
    echo "Voice: Edward enabled"
    ;;
  off)
    bun run "${PAI_DIR}/tools/pai-voice" off
    echo "Voice: Disabled"
    ;;
  status|*)
    bun run "${PAI_DIR}/tools/pai-voice" status 2>&1 | head -10
    ;;
esac
