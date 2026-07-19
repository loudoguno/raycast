#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Install Page as App
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📲
# @raycast.packageName PWA Forge
# @raycast.argument1 { "type": "text", "placeholder": "App name (optional)", "optional": true }

# Documentation:
# @raycast.description Turn the focused Chrome tab into an installed app - no three-dot menu digging
# @raycast.author loudog
# @raycast.authorURL https://github.com/loudog

set -uo pipefail

HELPER="$(dirname "$0")/pwa-forge/pwa-forge"

if [[ ! -x "$HELPER" ]]; then
  echo "Helper not built - run scripts/pwa-forge/build.sh"
  exit 1
fi

NAME="${1:-}"

if [[ -n "$NAME" ]]; then
  OUT=$("$HELPER" install --name "$NAME" 2>&1)
else
  OUT=$("$HELPER" install 2>&1)
fi

echo "$OUT" | /usr/bin/python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    print("pwa-forge returned unreadable output")
    sys.exit(1)
if d.get("ok"):
    print("Installed: " + d.get("installed", "?"))
else:
    msg = d.get("error", "install failed")
    if d.get("hint"):
        msg += " - " + d["hint"]
    print(msg)
    sys.exit(1)
'
