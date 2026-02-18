#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Claude Code HERE
# @raycast.mode silent

# Optional parameters:
# @raycast.icon ✳︎
# @raycast.packageName Claude Code

# Documentation:
# @raycast.description Open the current focused document or directory with Claude Code
# @raycast.author loudog

# Get the frontmost Finder window's path
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

if [[ -z "$TARGET" ]]; then
    # No Finder window - try to get selected folder
    TARGET=$(osascript -e '
        tell application "Finder"
            set theSelection to selection
            if (count of theSelection) > 0 then
                set firstItem to item 1 of theSelection
                if kind of firstItem is "Folder" then
                    return POSIX path of (firstItem as alias)
                else
                    return POSIX path of ((container of firstItem) as alias)
                end if
            else
                return ""
            end if
        end tell
    ' 2>/dev/null)
fi

if [[ -z "$TARGET" ]]; then
    osascript -e 'display notification "No Finder window or folder selected" with title "Claude Code"'
    exit 1
fi

# Open in iTerm
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
