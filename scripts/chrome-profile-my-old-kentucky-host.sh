#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Switch to Chrome Profile: My Old Kentucky Host
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🏠

# Documentation:
# @raycast.description Opens Chrome profile "My Old Kentucky Host" via menu
# @raycast.author loudog
# @raycast.authorURL https://raycast.com/loudog

osascript <<'EOF'
tell application "Google Chrome"
    activate
end tell

tell application "System Events"
    tell process "Google Chrome"
        click menu item "My Old Kentucky Host" of menu "Profiles" of menu bar 1
    end tell
end tell

delay 1

tell application "Google Chrome"
    tell front window
        make new tab with properties {URL:"https://www.amazon.com/gp/css/order-history"}
    end tell
end tell
EOF
