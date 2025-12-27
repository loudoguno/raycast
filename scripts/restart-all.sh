#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Restart Keybinding Apps
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🔄
# @raycast.packageName Keybindings

# Documentation:
# @raycast.description Reload Goku, Karabiner, Slate, Raycast, Slidepad
# @raycast.author loudoguno

# Also triggered by: r+s+t simultaneous keys

echo "🔄 Restarting keybinding system..."

# Goku - recompile karabiner.edn → karabiner.json
echo "  → Compiling Goku..."
goku

# Karabiner - reload config
echo "  → Reloading Karabiner..."
'/Library/Application Support/org.pqrs/Karabiner-Elements/bin/karabiner_cli' --reload

# Slate - restart
echo "  → Restarting Slate..."
killall Slate 2>/dev/null
sleep 0.3
open -a Slate

# Raycast - restart (optional, usually not needed)
echo "  → Restarting Raycast..."
killall Raycast 2>/dev/null
sleep 0.3
open -a Raycast

# Slidepad - restart
echo "  → Restarting Slidepad..."
killall Slidepad 2>/dev/null
sleep 0.3
open -a Slidepad

echo "✅ All systems reloaded!"

# Play completion sound
afplay /System/Library/Sounds/Glass.aiff &
