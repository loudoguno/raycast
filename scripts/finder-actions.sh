#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Finder Actions
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📂
# @raycast.packageName Finder Actions
# @raycast.argument1 { "type": "dropdown", "placeholder": "Action", "data": [{"title": "Open in Terminal", "value": "terminal"}, {"title": "Open in Ghostty", "value": "ghostty"}, {"title": "Open in iTerm", "value": "iterm"}, {"title": "Open in Warp", "value": "warp"}] }

# Documentation:
# @raycast.description Open the frontmost Finder directory in a terminal app
# @raycast.author loudog
# @raycast.authorURL https://github.com/loudog

ACTION="${1:-terminal}"

# Get frontmost Finder window directory (falls back to home)
dir=$(osascript -e '
tell application "Finder"
    try
        if (count of windows) > 0 then
            return POSIX path of (target of front window as alias)
        end if
    end try
end tell
return POSIX path of (path to home folder)
')

case "$ACTION" in
    terminal)
        open -a Terminal "$dir"
        ;;
    ghostty)
        open -n -a Ghostty --args --working-directory="$dir"
        ;;
    iterm)
        osascript -e "
tell application \"iTerm\"
    activate
    create window with default profile
    tell current session of current window
        write text \"cd \" & quoted form of \"$dir\"
    end tell
end tell"
        ;;
    warp)
        open -a Warp "$dir"
        ;;
esac
