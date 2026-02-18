#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Claude Code Open
# @raycast.mode silent

# Optional parameters:
# @raycast.icon ✳︎
# @raycast.packageName Claude Code
# @raycast.argument1 { "type": "text", "placeholder": "# or path" }

# Documentation:
# @raycast.description Open Claude Code in a project (by number from Recent list, or path)
# @raycast.author loudog

HISTORY_FILE="$HOME/.claude/history.jsonl"
INPUT="$1"

get_projects() {
    if [[ -f "$HISTORY_FILE" ]]; then
        tac "$HISTORY_FILE" 2>/dev/null | \
            jq -r '.project // empty' 2>/dev/null | \
            awk '!seen[$0]++' | \
            head -n 25
    fi
}

# Determine target
if [[ "$INPUT" =~ ^[0-9]+$ ]]; then
    # It's a number - get that project from the list
    TARGET=$(get_projects | sed -n "${INPUT}p")
    if [[ -z "$TARGET" ]]; then
        echo "Invalid project number: $INPUT"
        exit 1
    fi
elif [[ -d "$INPUT" ]]; then
    # It's a path
    TARGET="$INPUT"
elif [[ -d "$HOME/$INPUT" ]]; then
    # Relative to home
    TARGET="$HOME/$INPUT"
else
    # Try fuzzy match on recent projects
    TARGET=$(get_projects | grep -i "$INPUT" | head -1)
    if [[ -z "$TARGET" ]]; then
        echo "Could not find project: $INPUT"
        exit 1
    fi
fi

# Open in iTerm (preferred) or Terminal
osascript -e "
    tell application \"iTerm\"
        activate
        set newWindow to (create window with default profile)
        tell current session of newWindow
            write text \"cd '$TARGET' && claude\"
        end tell
    end tell
" 2>/dev/null || \
osascript -e "
    tell application \"Terminal\"
        activate
        do script \"cd '$TARGET' && claude\"
    end tell
"
