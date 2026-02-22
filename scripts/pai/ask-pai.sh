#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Ask PAI
# @raycast.mode fullOutput
# @raycast.packageName PAI

# Optional parameters:
# @raycast.icon robot
# @raycast.argument1 { "type": "text", "placeholder": "Question (optional)", "optional": true }

# Documentation:
# @raycast.description Open PAI inbox for quick questions
# @raycast.author Lou
# @raycast.authorURL https://github.com/loudog

QUESTION="${1:-}"
INBOX_DIR="$HOME/aia/inbox"

# Determine terminal app (prefer Ghostty, fall back to Terminal)
if [[ -d "/Applications/Ghostty.app" ]]; then
    TERMINAL="Ghostty"
elif [[ -d "/Applications/iTerm.app" ]]; then
    TERMINAL="iTerm"
else
    TERMINAL="Terminal"
fi

if [[ -n "$QUESTION" ]]; then
    # Quick question mode - run in terminal
    osascript <<EOF
        tell application "$TERMINAL"
            activate
            if "$TERMINAL" is "Ghostty" then
                do shell script "open -a Ghostty"
                delay 0.5
            end if
        end tell
        tell application "System Events"
            keystroke "cd $INBOX_DIR && claude -p \"$QUESTION\""
            keystroke return
        end tell
EOF
    echo "Sent question to PAI: $QUESTION"
else
    # Interactive mode - open terminal with ask-pai
    osascript <<EOF
        tell application "$TERMINAL"
            activate
            if "$TERMINAL" is "Ghostty" then
                do shell script "open -a Ghostty"
                delay 0.5
            end if
        end tell
        tell application "System Events"
            keystroke "$HOME/aia/bin/ask-pai"
            keystroke return
        end tell
EOF
    echo "Opening PAI inbox..."
fi
