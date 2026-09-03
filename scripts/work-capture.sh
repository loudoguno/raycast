#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Work Add
# @raycast.mode compact
# @raycast.argument1 { "type": "text", "placeholder": "title #life #p1 #reminder due:2026-09-09", "percentEncoded": false }

# Optional parameters:
# @raycast.icon 💼
# @raycast.packageName LifeOS

# Documentation:
# @raycast.description One-keystroke capture into the WORK tracker (GitHub loudoguno/WORK + Project board). Inline tokens: #life/#pai/#site, #p0-#p3, #reminder/#feature/#problem/#project/#research/#decision, due:YYYY-MM-DD, parent:N. Bind a hotkey in Raycast.
# @raycast.author loudog

export PATH="$HOME/.local/bin:/opt/homebrew/bin:$PATH"
exec "$HOME/.local/bin/work" add "$1"
