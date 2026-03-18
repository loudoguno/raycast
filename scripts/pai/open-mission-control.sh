#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Open Mission Control
# @raycast.mode compact
# @raycast.packageName PAI

# Optional parameters:
# @raycast.icon 🎛️
# @raycast.argument1 { "type": "text", "placeholder": "mode (dev/prod)", "optional": true }

# Documentation:
# @raycast.description Open PAI Mission Control — auto-starts server if needed
# @raycast.author Lou

PROJECT_DIR="$HOME/Projects/pai-mission-control"
PORT=3333
DEV_PORT=5173
MODE="${1:-dev}"

# Check if server is already running on port 3333
if ! lsof -i :$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Starting PAI Mission Control server..."

  if [ "$MODE" = "prod" ]; then
    # Production: build frontend then start server
    cd "$PROJECT_DIR" || exit 1
    cd packages/web && bunx vite build --logLevel error 2>/dev/null
    cd "$PROJECT_DIR" || exit 1
    nohup bun start >/tmp/pmc-server.log 2>&1 &
  else
    # Dev: start backend server (frontend dev server started separately if needed)
    cd "$PROJECT_DIR" || exit 1
    nohup bun run dev:server >/tmp/pmc-server.log 2>&1 &
  fi

  # Wait for server to be ready (up to 10 seconds)
  for i in $(seq 1 20); do
    if lsof -i :$PORT -sTCP:LISTEN >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done
fi

if [ "$MODE" = "dev" ]; then
  # Also start Vite dev server if not running
  if ! lsof -i :$DEV_PORT -sTCP:LISTEN >/dev/null 2>&1; then
    cd "$PROJECT_DIR" || exit 1
    nohup bun run dev:web >/tmp/pmc-vite.log 2>&1 &
    # Wait for Vite to be ready
    for i in $(seq 1 20); do
      if lsof -i :$DEV_PORT -sTCP:LISTEN >/dev/null 2>&1; then
        break
      fi
      sleep 0.5
    done
  fi
  open "http://localhost:$DEV_PORT"
  echo "PAI Mission Control opened (dev mode)"
else
  open "http://localhost:$PORT"
  echo "PAI Mission Control opened (production)"
fi
