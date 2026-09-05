#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Save Front Link
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🔗
# @raycast.packageName LifeOS

# Documentation:
# @raycast.description One keystroke: save the frontmost window's title + URL to lous-links. Resolves Chrome/Chromium/Brave/Arc/Safari/Finder via AppleScript, falls back to a URL on the clipboard. Bind a hotkey in Raycast.
# @raycast.author loudog

# PURPOSE   Hotkey-bindable Raycast script command wrapping `ll save-front`.
# SCOPE     Delegates everything to the CLI; no logic lives here.
# CREATED   2026-09-04 by sai-mx3, session "mx3: work-board first-principles sweep".
# RELATED   ~/.local/bin/ll -> ~/code/raycast/extensions/lous-links/cli/ll.ts
#           ~/code/raycast/extensions/lous-links/README.md
# REQUIRED  Optional — the lous-links Raycast extension offers the same command.
#           This exists so the hotkey works without the extension loaded.

export PATH="$HOME/.local/bin:/opt/homebrew/bin:$PATH"
exec "$HOME/.local/bin/ll" save-front
