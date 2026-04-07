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
use framework "AppKit"

-- Close existing Claude windows in the background to prevent space-switching.
-- Uses "Close All" menu command which works without making Claude frontmost.
tell application "System Events"
    if exists (processes whose name is "Claude") then
        tell process "Claude"
            if (count of windows) > 0 then
                try
                    click menu item "Close All" of menu "Window" of menu bar 1
                end try
                delay 0.3
            end if
        end tell
    end if
end tell

-- Get the screen where the mouse currently is
set mouseScreen to missing value
set screenFrame to missing value
try
    set mouseLoc to current application's NSEvent's mouseLocation()
    set allScreens to current application's NSScreen's screens()
    repeat with scr in allScreens
        set scrFrame to scr's frame()
        set scrOrigin to item 1 of scrFrame
        set scrSize to item 2 of scrFrame
        set scrX to (item 1 of scrOrigin) as integer
        set scrY to (item 2 of scrOrigin) as integer
        set scrW to (item 1 of scrSize) as integer
        set scrH to (item 2 of scrSize) as integer
        set mx to (mouseLoc's x) as integer
        set my to (mouseLoc's y) as integer
        if mx >= scrX and mx < (scrX + scrW) and my >= scrY and my < (scrY + scrH) then
            set screenFrame to {scrX, scrY, scrW, scrH}
            exit repeat
        end if
    end repeat
end try

-- Use "Show Main Window" to bring Claude up on the current space
tell application "Claude" to activate
delay 0.2
tell application "System Events"
    tell process "Claude"
        try
            click menu item "Show Main Window" of menu "Window" of menu bar 1
        end try
    end tell
end tell

-- Wait for window to appear (up to 2 seconds)
repeat 20 times
    delay 0.1
    tell application "System Events"
        if (count of windows of process "Claude") > 0 then exit repeat
    end tell
end repeat

-- Center the window on the mouse's screen at a comfortable size
tell application "System Events"
    tell process "Claude"
        if (count of windows) > 0 then
            set w to window 1
            -- Target: 900x700, centered on the mouse's screen
            set winW to 900
            set winH to 700
            if screenFrame is not missing value then
                set sX to item 1 of screenFrame
                set sY to item 2 of screenFrame
                set sW to item 3 of screenFrame
                set sH to item 4 of screenFrame
                -- Center on that screen (Y is flipped: AppKit 0=bottom, System Events 0=top)
                -- Convert AppKit bottom-left Y to System Events top-left Y
                set totalHeight to 0
                try
                    set mainScreen to (item 1 of (current application's NSScreen's screens()))
                    set mainFrame to mainScreen's frame()
                    set totalHeight to (item 2 of (item 2 of mainFrame)) as integer
                end try
                -- System Events uses top-left origin
                set posX to sX + ((sW - winW) / 2) as integer
                -- For System Events Y: convert from AppKit coordinates
                if totalHeight > 0 then
                    set flippedSY to totalHeight - sY - sH
                    set posY to flippedSY + ((sH - winH) / 2) as integer
                else
                    set posY to ((sH - winH) / 2) as integer
                end if
                set position of w to {posX, posY}
            end if
            set size of w to {winW, winH}
        end if
    end tell
end tell

delay 0.2

-- Send ⌘K to open the conversation search bar
tell application "System Events"
    tell process "Claude"
        set frontmost to true
        keystroke "k" using command down
    end tell
end tell
APPLESCRIPT
