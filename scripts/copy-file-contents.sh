#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Copy file contents
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🤖

# Documentation:
# @raycast.author loudog
# @raycast.authorURL https://raycast.com/loudog
osascript -e '
tell application "Finder"
    set selectedFiles to selection
    set fileContents to ""
    repeat with aFile in selectedFiles
        set filePath to POSIX path of (aFile as text)
        try
            set fileContents to fileContents & (read file filePath) & linefeed
        end try
    end repeat
end tell
set the clipboard to fileContents
'
