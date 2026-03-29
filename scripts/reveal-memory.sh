#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Reveal Claude Memory
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🧠
# @raycast.packageName Claude Code
# @raycast.argument1 { "type": "text", "placeholder": "path (blank = Finder)", "optional": true }

# Documentation:
# @raycast.description Open the Claude Code project memory folder for a given directory
# @raycast.author loudog

resolve_slug() {
    # Claude Code slugs: replace all non-alphanumeric (except -) with -
    echo "-$(echo "$1" | sed 's/[^a-zA-Z0-9-]/-/g' | sed 's/^-//')"
}

TARGET="$1"

# If no argument, try Finder's front window
if [[ -z "$TARGET" ]]; then
    TARGET=$(osascript -e '
        tell application "Finder"
            if (count of windows) > 0 then
                set currentFolder to (target of front window) as alias
                return POSIX path of currentFolder
            else
                return ""
            end if
        end tell
    ' 2>/dev/null)
fi

# Still nothing? Use home
if [[ -z "$TARGET" ]]; then
    osascript -e 'display notification "No path provided and no Finder window open" with title "Reveal Memory"'
    exit 1
fi

# Strip trailing slash
TARGET="${TARGET%/}"

SLUG=$(resolve_slug "$TARGET")
MEMORY_DIR="$HOME/.claude/projects/$SLUG"

if [[ -d "$MEMORY_DIR" ]]; then
    open "$MEMORY_DIR"

    # Count what's there
    SESSION_COUNT=$(ls "$MEMORY_DIR"/*.jsonl 2>/dev/null | wc -l | tr -d ' ')
    MEMORY_COUNT=$(ls "$MEMORY_DIR/memory"/*.md 2>/dev/null | grep -v MEMORY.md | wc -l | tr -d ' ')

    osascript -e "display notification \"${SESSION_COUNT} sessions, ${MEMORY_COUNT} memories\" with title \"Claude Memory: $(basename "$TARGET")\""
else
    osascript -e "display notification \"No Claude Code memory found for $(basename "$TARGET")\" with title \"Reveal Memory\" subtitle \"Slug: $SLUG\""
fi
