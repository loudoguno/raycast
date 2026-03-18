#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Summarize & Speak
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🔊
# @raycast.packageName PAI

# Documentation:
# @raycast.description Summarize selected text and speak it aloud via PAI voice server
# @raycast.author Lou DeSantis

# summarize-selected-text-and-speak.sh — Grab selected text, summarize it, speak it aloud
#
# Trigger: s+m (Karabiner s-mode → Raycast deeplink) or directly from Raycast
# Re-trigger while speaking = STOP (kills previous instance + any TTS audio)
#
# Lives in: ~/code/raycast/scripts/ (tracked in raycast repo)
# Dependencies: jq, curl, pbcopy/pbpaste, osascript
# Runtime: PAI voice server (localhost:8888), Anthropic API key (~/.private/env/shared.env)
# Docs: ~/keybindings/docs/summarize-selected-text-and-speak.md

PIDFILE="/tmp/pai-summarize-speak.pid"
VOICE_ID="kPtEHAvRnjUJFv7SK9WI"  # ElevenLabs "Glitch (Digital Prankster)" voice
VOICE_SERVER="http://localhost:8888/notify"
MAX_CHARS=2000
MAX_SUMMARY_WAIT=8
LOG="/tmp/pai-summarize-speak.log"

log() {
  echo "[$(date '+%H:%M:%S')] $1" >> "$LOG" 2>/dev/null
}

# Redirect all stderr to log
exec 2>>"$LOG"

log "=== script started (PID $$) ==="

# Load API key
ANTHROPIC_API_KEY=""
for ENV_FILE in "$HOME/.private/env/shared.env" "$HOME/.env"; do
  if [[ -f "$ENV_FILE" ]]; then
    ANTHROPIC_API_KEY=$(grep '^ANTHROPIC_API_KEY=' "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
    [[ -n "$ANTHROPIC_API_KEY" ]] && break
  fi
done

if [[ -z "$ANTHROPIC_API_KEY" ]]; then
  log "ERROR: no Anthropic API key found in ~/.private/env/shared.env or ~/.env"
  speak "No API key found. Can't summarize."
  exit 1
fi

speak() {
  curl -s -m 5 -X POST "$VOICE_SERVER" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg msg "$1" --arg vid "$VOICE_ID" \
      '{message: $msg, voice_id: $vid, voice_enabled: true}')" \
    > /dev/null 2>&1 || log "WARN: speak() failed — voice server may be down"
}

# STOP logic: if already running, kill previous instance and any TTS audio
if [[ -f "$PIDFILE" ]]; then
  OLD_PID=$(cat "$PIDFILE" 2>/dev/null || true)
  if [[ -n "$OLD_PID" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    log "STOP: killing previous instance $OLD_PID"
    kill "$OLD_PID" 2>/dev/null || true
    pkill afplay 2>/dev/null || true
    rm -f "$PIDFILE"
    speak "Stopped."
    exit 0
  else
    log "stale pidfile (process $OLD_PID gone), cleaning"
    rm -f "$PIDFILE"
  fi
fi

# Write our PID
echo $$ > "$PIDFILE"
trap 'rm -f "$PIDFILE"' EXIT

# --- Step 1: Read clipboard ---
# Assumes user has already copied text (⌘C). No simulated keystrokes needed.
TEXT=$(pbpaste 2>/dev/null || true)

if [[ -z "$TEXT" ]]; then
  log "FAIL: clipboard is empty"
  speak "Clipboard is empty."
  exit 0
fi

CHAR_COUNT=${#TEXT}
log "read $CHAR_COUNT chars from clipboard"

# --- Step 2: Immediate feedback with char count ---
speak "Summarizing $CHAR_COUNT characters."

# --- Step 3: Truncate if too long ---
if [[ $CHAR_COUNT -gt $MAX_CHARS ]]; then
  TEXT="${TEXT:0:$MAX_CHARS}"
  log "truncated to $MAX_CHARS chars"
fi

# --- Step 4: Summarize via Claude Haiku ---
SUMMARY=""
log "calling Haiku ($CHAR_COUNT chars input)..."

RESPONSE=$(curl -s -m "$MAX_SUMMARY_WAIT" https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d "$(jq -n \
    --arg text "$TEXT" \
    '{
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: ("TL;DR this in 1-2 short sentences. Max 40 words. Spoken aloud, so be punchy and direct. No preamble:\n\n" + $text)
      }]
    }')" 2>>"$LOG") || {
  log "API timed out or failed (exit $?)"
  RESPONSE=""
}

if [[ -n "$RESPONSE" ]]; then
  SUMMARY=$(echo "$RESPONSE" | jq -r '.content[0].text // empty' 2>/dev/null || true)
  if [[ -n "$SUMMARY" ]]; then
    log "Haiku returned ${#SUMMARY} chars"
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.error.message // empty' 2>/dev/null || true)
    log "API error: ${ERROR:-no content in response}. Raw: ${RESPONSE:0:300}"
  fi
fi

# --- Step 5: Fallback if API failed ---
if [[ -z "$SUMMARY" ]]; then
  log "FALLBACK: speaking raw text (first 400 chars)"
  speak "Summary failed. Reading raw text."
  SUMMARY="${TEXT:0:400}"
fi

# --- Step 6: Speak result (summary replaces clipboard) ---
echo -n "$SUMMARY" | pbcopy 2>/dev/null
log "speaking ${#SUMMARY} chars (copied to clipboard)"
speak "$SUMMARY"
log "done"
