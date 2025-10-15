#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Toggle Microphone
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🤖

# Documentation:
# @raycast.description T
# @raycast.author loudog
# @raycast.authorURL https://raycast.com/loudog
set inputVolume to input volume of (get volume settings)
if inputVolume = 0 then
	set inputVolume to 100
else
	set inputVolume to 0
end if
set volume input volume inputVolume