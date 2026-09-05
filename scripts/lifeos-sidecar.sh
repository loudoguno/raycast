#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title LifeOS Sidecar
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🎙️
# @raycast.packageName LifeOS

# Documentation:
# @raycast.description Open the LifeOS sidecar folder in Codex Desktop (realtime voice) to ask questions about Claude sessions, the activity graph, the WORK board and LifeOS infrastructure. Read-only by default. Contract: ~/code/lifeos-sidecar/AGENTS.md
# @raycast.author loudog

export PATH="$HOME/.local/bin:$HOME/.bun/bin:/opt/homebrew/bin:$PATH"
exec "$HOME/.local/bin/lifeos-sidecar"
