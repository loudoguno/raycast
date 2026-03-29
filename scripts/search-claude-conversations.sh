#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Search Claude Conversations
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🔍
# @raycast.packageName Claude Desktop

# Documentation:
# @raycast.description Open Claude Desktop's ⌘K search on the current space — avoids space-switching disruption
# @raycast.author loudog
# @raycast.authorURL https://raycast.com/loudog

osascript <<'APPLESCRIPT'
-- Close any existing Claude windows WITHOUT activating the app.
-- This is the key trick: AXPress on the close button works in the background,
-- so macOS never switches you to Claude's space. When Claude is then activated
-- with no windows, it creates a fresh window on YOUR current space.
tell application "System Events"
    if exists (processes whose name is "Claude") then
        tell process "Claude"
            repeat with w in windows
                try
                    perform action "AXPress" of (first button of w whose subrole is "AXCloseButton")
                end try
            end repeat
        end tell
    end if
end tell

delay 0.4

-- Activate Claude — no existing windows means new window opens on current space/screen
tell application "Claude" to activate

-- Wait for the new window to appear (poll up to 2 seconds)
repeat 20 times
    delay 0.1
    tell application "System Events"
        if (count of windows of process "Claude") > 0 then exit repeat
    end tell
end repeat

delay 0.2

-- Send ⌘K to open the conversation search bar
tell application "System Events"
    tell process "Claude"
        set frontmost to true
        keystroke "k" using command down
    end tell
end tell
APPLESCRIPT
