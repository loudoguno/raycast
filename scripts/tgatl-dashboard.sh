#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.title TGATL Dashboard
# @raycast.mode silent
# @raycast.icon 🎛️
# @raycast.packageName TGATL
# @raycast.description Start the Tavily × ElevenLabs demo dashboard (auto-opens in browser)

PORT=4242
if ! lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  nohup /Users/loudog/.bun/bin/bun /Users/loudog/code/tgatl-brief/server.ts > /tmp/tgatl-dashboard.log 2>&1 &
  sleep 1
fi
open "http://localhost:$PORT/"
