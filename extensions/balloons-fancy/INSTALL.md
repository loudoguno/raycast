# Installation Guide for Visual Effects 🎈✨🎆

## Quick Start

> **📝 Multi-Machine Setup:** If you're setting this up on a new machine, just follow these steps. The git repo contains everything you need!

### All-in-One Command

```bash
# From the balloons-fancy directory:
cd BalloonsApp && ./build.sh && cp -r build/BalloonsApp.app /Applications/ && cd .. && npm install && npm run dev
```

### Step-by-Step

**Step 1: Build and Install the macOS App**

```bash
cd /Users/loudog/code/extensions/balloons-fancy/BalloonsApp
./build.sh
cp -r build/BalloonsApp.app /Applications/
```

**Step 2: Install Extension Dependencies**

```bash
cd /Users/loudog/code/extensions/balloons-fancy
npm install
npm run dev
```

**Step 3: Open Raycast and Try It!**

1. Open Raycast (⌘ + Space or your configured hotkey)
2. Type "Balloons Fancy", "Fireworks", or "Snow"
3. Press Enter

### Success! 🎉

Effects will appear as a system-wide overlay across your entire screen and automatically disappear after completion.

## Troubleshooting

### App not launching?

If you get an error that the app can't be opened:

1. Go to **System Settings → Privacy & Security**
2. Look for a message about "BalloonsApp" being blocked
3. Click "Open Anyway"

Or run this command to remove the quarantine flag:
```bash
xattr -cr /Applications/BalloonsApp.app
```

### Extension not showing in Raycast?

Make sure the dev server is running:
```bash
cd /Users/loudog/code/extensions/balloons-fancy
npm run dev
```

## Testing the App Directly

You can also test the app directly without Raycast:

```bash
open /Applications/BalloonsApp.app
```

Or run it from the command line to see debug output:
```bash
/Applications/BalloonsApp.app/Contents/MacOS/BalloonsApp
```

## Available Effects

### 🎈 Balloons Fancy
- 50 colorful balloons
- Smooth falling animation with drift
- Duration: ~12 seconds

### 🎆 Fireworks
- 20-25 explosive bursts
- 80-120 particles per burst
- System sound effects
- Duration: ~8 seconds

### ❄️ Snow (Blizzard!)
- 500-700 snowflakes
- Extreme wind and speed
- Complete whiteout conditions
- Duration: ~10 seconds

## Features

- ✨ Transparent system-wide overlay
- 🎨 Multiple visual effects
- 🎭 Unique every time
- ⚡ Native Swift performance
- 🚀 Auto-closes after animation

## Architecture

This extension has two parts:

1. **BalloonsApp.app** - Native macOS app that handles all visual effects
2. **Raycast Extension** - TypeScript commands that trigger the app with different arguments

The app accepts command-line arguments to determine which effect to show:
- No args or `balloons` → Balloons animation
- `fireworks` → Fireworks animation
- `snow` → Snow/blizzard animation

## Next Steps

Try it out! Open Raycast and type:
- "Balloons Fancy" for balloons 🎈
- "Fireworks" for fireworks 🎆
- "Snow" for blizzard ❄️

**Note:** Sound effects are currently using macOS system sounds. Better custom sound effects coming soon!
