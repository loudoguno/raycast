#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Claude Code Recent
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon ✳︎
# @raycast.packageName Claude Code
# @raycast.argument1 { "type": "text", "placeholder": "filter (optional)", "optional": true }

# Documentation:
# @raycast.description Open Claude Code in a recent project directory
# @raycast.author loudog
# @raycast.authorURL https://github.com/loudog

HISTORY_FILE="$HOME/.claude/history.jsonl"
FILTER="${1:-}"

# Get recent unique projects
get_projects() {
    if [[ -f "$HISTORY_FILE" ]]; then
        tac "$HISTORY_FILE" 2>/dev/null | \
            jq -r '.project // empty' 2>/dev/null | \
            awk '!seen[$0]++' | \
            head -n 25
    fi
}

PROJECTS=$(get_projects)

if [[ -z "$PROJECTS" ]]; then
    echo "No recent Claude Code projects found."
    exit 0
fi

# Filter if argument provided
if [[ -n "$FILTER" ]]; then
    PROJECTS=$(echo "$PROJECTS" | grep -i "$FILTER" || true)
    if [[ -z "$PROJECTS" ]]; then
        echo "No projects matching '$FILTER'"
        exit 0
    fi
fi

# Display numbered list
echo "Recent Claude Code Projects:"
echo "=============================="
echo "$PROJECTS" | nl -w2 -s'. '
echo ""
echo "Tip: Use 'Claude Code Open #' command with a number to open"
echo "Or use 'Claude Code Here' from Finder"
