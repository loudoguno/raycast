# Visual Effects for Raycast 🎈✨🎆

Celebrate with **system-wide visual effects**! This extension uses a native macOS app to display beautiful animated effects across your entire screen.

![Platform](https://img.shields.io/badge/Platform-macOS-blue) ![Swift](https://img.shields.io/badge/Swift-5.0-orange) ![Raycast](https://img.shields.io/badge/Raycast-Extension-red)

## Available Effects

### 🎈 Balloons Fancy
- 50 colorful balloons with 24 vibrant colors
- Variable sizes (60% to 150%)
- Smooth falling animation with horizontal drift
- Duration: ~12 seconds

### 🎆 Fireworks
- 20-25 explosive firework bursts
- 80-120 particles per firework (BIG explosions!)
- 350px explosion radius
- Radiating particle animations with fade-out
- System sound effects (Pop & Funk sounds)
- Duration: ~8 seconds

**Future Improvements:**
- More impressive explosion patterns (chrysanthemum, willow, palm, etc.)
- Custom firework sound effects with realistic boom and crackle
- Varied explosion timing (rockets launching, then bursting)
- Trail effects as fireworks rise
- Multiple burst types per show

### ❄️ Snow (Blizzard Mode!)
- 500-700 snowflakes for complete whiteout conditions
- Beautiful 6-pointed snowflake design with branches
- Variable sizes (30% to 200%)
- Fast blizzard speed (3-7 second fall)
- Extreme wind drift (±400 pixels)
- Rapid rotation in wind gusts
- Duration: ~10 seconds

**Future Improvements:**
- Gentle snow mode option (slower, fewer flakes)
- Accumulation effect at bottom of screen
- Wind sound effects (howling, gusts)
- Different snowflake patterns

### 🧁 Cupcake Explosion
- Pastel-colored fireworks variant
- Soft pinks, mint greens, lavender, peach tones
- Sweet celebration effect
- Duration: ~8 seconds

### 🔥 Campfire Sparks
- 150-200 glowing embers rising from bottom
- Warm red-orange-yellow glow effect
- Covers 80% of screen width
- Duration: ~10 seconds

### 🪶 Feather Fall
- 35-50 large realistic feathers
- Gentle side-to-side swaying motion
- Very slow peaceful descent (12-20 seconds)
- Cream and tan colors with gradient fill
- Duration: ~25 seconds

### 🍺 Beer Pour
- Screen fills with golden beer from bottom up
- 200-300 rising bubbles through the beer
- Foam head with 100-150 foam bubbles
- Duration: ~6 seconds

**Future Improvements:**
- Foam texture improvements
- Better bubble physics
- Carbonation sparkle effects
- Pouring sound effects

### 🍁 Autumn Leaves
- 80-120 falling autumn leaves
- Red, orange, and brown colors
- Custom leaf shapes with spinning rotation (720°)
- Duration: ~12 seconds

### 🌈 Rainbow Arc
- Full 7-color ROYGBIV rainbow (red, orange, yellow, green, blue, indigo, violet)
- Large arc across top 30% of screen (90% width)
- Fade in → shimmer → fade out sequence
- Duration: ~8 seconds

### 👾 Space Invaders
- 40 alien invaders in 4 rows of 10
- Classic Space Invaders formation and movement
- Side-to-side marching while descending
- Dark space background for retro gaming feel
- Duration: ~8 seconds

### 🪐 Galaxy Warp
- 300 stars warping from center outward
- Long dramatic star streaks (300px) with blue gradient trails
- Stars rotate to point in travel direction
- Dark space background with motion blur for hyperspace effect
- Duration: ~8 seconds

## Features

- 🖥️ **System-wide overlay**: Effects appear on top of all windows
- 🎨 **11 unique effects**: From peaceful feathers to intense space warps!
- ✨ **Unique every time**: Each trigger creates a completely different pattern
- 🎭 **Transparent overlay**: Doesn't interfere with your work
- ⚡ **Native performance**: Built with Swift/SwiftUI for 60fps animation
- 🚀 **Auto-closes**: Disappears after animation completes
- 🔌 **Extensible**: Easy to add new visual effects

## What Makes It Special?

Unlike browser-based animations, this extension:
- Creates a native macOS overlay window (like the built-in Raycast confetti)
- Appears on top of ALL windows and spaces
- Uses native Swift/SwiftUI for buttery-smooth animations
- Supports multiple visual effects from a single app
- Provides true system-wide celebration effects

## Installation

> **📝 IMPORTANT FOR MULTI-MACHINE SETUP:**
> This project can be synced between machines via git. When you pull on a new machine, simply run the installation steps below. The app name stays as "BalloonsApp" for compatibility, but it supports multiple effects!

### Quick Setup (All-in-One)

```bash
# From the balloons-fancy directory:
cd BalloonsApp && ./build.sh && cp -r build/BalloonsApp.app /Applications/ && cd .. && npm install && npm run dev
```

### Step-by-Step

**1. Build the macOS App**
```bash
cd /Users/loudog/code/extensions/balloons-fancy/BalloonsApp
./build.sh
cp -r build/BalloonsApp.app /Applications/
```

**2. Install Raycast Extension**
```bash
cd /Users/loudog/code/extensions/balloons-fancy
npm install
npm run dev
```

## Usage

Simply open Raycast (⌘ + Space) and type the name of any effect:

- **balloons** or **balloons-fancy** - 🎈 Colorful balloons falling
- **fireworks** - 🎆 Explosive bursts
- **snow** - ❄️ Blizzard whiteout
- **cupcake** - 🧁 Pastel explosion
- **campfire** - 🔥 Rising embers
- **feather** - 🪶 Gentle feathers
- **beer** - 🍺 Beer pour
- **leaves** - 🍁 Autumn leaves
- **rainbow** - 🌈 Rainbow arc
- **pixels** - 👾 Space Invaders
- **galaxy** - 🪐 Hyperspace warp

**Pro tip**: Trigger effects multiple times for spectacular displays! Each effect has a unique icon in Raycast for easy identification.

## Animation Details

### Balloon Properties (All Randomized)
- **Color**: 24 colors (reds, oranges, yellows, greens, blues, purples, pinks)
- **Size**: 60% to 150% of base size (60x80 pixels)
- **Starting position**: Anywhere across screen width
- **Fall speed**: 5-10 seconds
- **Horizontal drift**: -150 to +150 pixels
- **Delay**: 0-2 seconds before starting

### Technical Details
- **Count**: 50 balloons per trigger
- **Duration**: 12 seconds total (ensures all balloons exit screen)
- **Animation**: Linear falling with horizontal drift
- **Window level**: Floating (appears above all apps)
- **Mouse events**: Ignored (doesn't block clicks)

## How It Works

### Architecture

This extension consists of two parts:

**1. BalloonsApp.app** - Native macOS App
- Built with Swift + SwiftUI
- Creates borderless, transparent overlay window
- Renders 50 animated balloons
- Runs as accessory app (no dock icon)
- Auto-terminates after animation

**2. Raycast Extension** - TypeScript Command
- No-view mode for instant execution
- Launches BalloonsApp via `open -a`
- Shows HUD confirmation

### File Structure

```
balloons-fancy/
├── BalloonsApp/
│   ├── BalloonsApp.swift       # Main app with effect routing (11 effects)
│   ├── BalloonsView.swift      # Balloons animation view
│   ├── FireworksView.swift     # Fireworks animation view
│   ├── SnowView.swift          # Snow/blizzard animation view
│   ├── CupcakeView.swift       # Cupcake explosion view
│   ├── CampfireView.swift      # Campfire sparks view
│   ├── FeatherView.swift       # Feather fall view
│   ├── BeerView.swift          # Beer pour view
│   ├── LeavesView.swift        # Autumn leaves view
│   ├── RainbowView.swift       # Rainbow arc view
│   ├── PixelsView.swift        # Space Invaders view
│   ├── GalaxyView.swift        # Galaxy warp view
│   ├── Info.plist              # App configuration
│   └── build.sh                # Build script (compiles all 11 views)
├── src/
│   ├── balloons-fancy.tsx      # Balloons Raycast command
│   ├── fireworks.tsx           # Fireworks Raycast command
│   ├── snow.tsx                # Snow Raycast command
│   ├── cupcake.tsx             # Cupcake Raycast command
│   ├── campfire.tsx            # Campfire Raycast command
│   ├── feather.tsx             # Feather Raycast command
│   ├── beer.tsx                # Beer Raycast command
│   ├── leaves.tsx              # Leaves Raycast command
│   ├── rainbow.tsx             # Rainbow Raycast command
│   ├── pixels.tsx              # Space Invaders Raycast command
│   └── galaxy.tsx              # Galaxy warp Raycast command
├── package.json                # Extension manifest with 11 commands
├── tsconfig.json
├── EFFECTS.md                  # Quick reference guide
└── README.md
```

## Comparison: Balloons vs Balloons Fancy

| Feature | Balloons | Balloons Fancy |
|---------|----------|----------------|
| Display | Browser tab | System overlay |
| Setup | None | Build macOS app |
| Performance | Good (CSS) | Excellent (native) |
| Balloon count | 30 | 50 |
| Colors | 8 | 24 |
| Sizes | Fixed | Variable |
| Integration | Opens tab | Seamless overlay |
| Animation | CSS keyframes | SwiftUI |
| Direction | Falls from top | Falls from top |
| Has strings | No | No |

## Development

### Rebuilding the App

If you make changes to the Swift code:

```bash
cd BalloonsApp
./build.sh
cp -r build/BalloonsApp.app /Applications/
xattr -cr /Applications/BalloonsApp.app  # Remove quarantine
```

### Debugging

To see console output:
```bash
/Applications/BalloonsApp.app/Contents/MacOS/BalloonsApp
```

### Customization

Want to tweak the animation? Edit `BalloonsView.swift`:
- **Balloon count**: Line 91 - Change `(0..<50)`
- **Colors**: Lines 53-85 - Add/remove colors
- **Size range**: Line 98 - Adjust `0.6...1.5`
- **Speed range**: Line 96 - Adjust `5...10`
- **Duration**: `BalloonsApp.swift` line 66 - Adjust `12`

## Troubleshooting

### App won't open?
```bash
# Remove quarantine flag
xattr -cr /Applications/BalloonsApp.app
```

Or go to **System Settings → Privacy & Security** and click "Open Anyway"

### Extension not showing?
Make sure dev server is running:
```bash
npm run dev
```

### Balloons not visible?
- Check that the app is installed: `ls /Applications/BalloonsApp.app`
- Run directly to see errors: `/Applications/BalloonsApp.app/Contents/MacOS/BalloonsApp`

## Adding New Effects

Want to add a new effect? Here's how:

1. **Create a new SwiftUI view** in `BalloonsApp/` (e.g., `ConfettiView.swift`)
2. **Add it to the enum** in `BalloonsApp.swift`:
   ```swift
   enum EffectType: String {
       case balloons
       case fireworks
       case confetti  // new!
   }
   ```
3. **Add the case to the switch** in `launchEffect()`:
   ```swift
   case .confetti:
       contentView = ConfettiView()
       duration = 10
   ```
4. **Update `build.sh`** to compile the new file
5. **Create a new Raycast command** in `src/confetti.tsx`
6. **Add to `package.json`** commands array
7. **Rebuild and reinstall**: `./build.sh && cp -r build/BalloonsApp.app /Applications/`

## Visual Effects Roadmap 🎯

We're building a comprehensive library of celebration and ambient effects! Here's our plan:

**Strategy:** Start with particle system variations (we already have the engine!), then add medium-complexity effects, and finally tackle character animations. This approach lets us rapidly build a diverse library while learning what works best.

### 🚀 Current Sprint (Next Up!)
**Phase 1: Quick Particle Variants** (~3-4 hours total)
- [ ] 🧁 Cupcake Explosion - Pastel fireworks variant (30min)
- [ ] 🔥 Campfire Sparks - Upward embers with glow (45min)
- [ ] 🪶 Feather Fall - Gentle falling with rotation (45min)
- [ ] 🌸 Cherry Blossom Drift - Pink petals drifting down (45min)
- [ ] 🍁 Autumn Leaves - Leaves with accumulation (1hr)

**Phase 2: High-Impact Effects** (~4-5 hours total)
- [ ] 🍾 Champagne Pop - Cork + rising bubbles (1.5hrs)
- [ ] 🌈 Rainbow Arc - Gradient arc with shimmer (1hr)
- [ ] 🦋 Butterflies - Organic flutter paths (1.5hrs)
- [ ] 🧨 Explosion - Shockwave + debris (1hr)

**Phase 3: Character Animations** (Proof of concept)
- [ ] 🐔 Chicken Run - First sprite animation test (2hrs)

### 📋 Full Effects Backlog

**Tier S - Easy Particle Systems:**
- [ ] 💝 Hearts Float Up
- [ ] ⭐ Shooting Stars
- [ ] 🎊 Confetti Cannon

**Tier A - Medium Complexity:**
- [ ] 🚀 Launch Sequence
- [ ] 💻 Matrix Rain
- [ ] 👾 8-Bit Pixels

**Tier B - Character Fun:**
- [ ] 🦆 Duck Crossing
- [ ] 🐶 Puppy Parade
- [ ] 🦜 Tropical Flight

**Tier C - Complex Multi-Element:**
- [ ] 🕺 Dance Party (lights + confetti)
- [ ] 🪐 Galaxy Warp
- [ ] 🦈 Shark Attack
- [ ] 🧙 Wizard Spell Gone Wrong

**Tier D - Challenging:**
- [ ] 🌪️ Tornado (with flying cow!)
- [ ] 🧻 Toilet Paper Storm
- [ ] 🤖 Robot Parade
- [ ] 🪩 Barbie Glitter Bomb

**Ambitious / Fun Ideas:**
- [ ] 🌊 Ocean Splash
- [ ] 🐮 Cowabunga
- [ ] 🐱 Cat Nap
- [ ] 🐒 Banana Chaos

### Effect Improvements
**Fireworks:**
- [ ] More realistic explosion patterns (chrysanthemum, willow, palm, peony)
- [ ] Custom high-quality sound effects (boom, crackle, whistle)
- [ ] Rocket launch trails before explosions
- [ ] Varied timing (launch → rise → burst)
- [ ] Different burst colors per explosion layer

**Snow:**
- [ ] Gentle snow mode option (slower, fewer flakes)
- [ ] Accumulation effect at bottom of screen
- [ ] Wind sound effects (howling, gusts)
- [ ] Different snowflake patterns

### General Features
- [ ] **Better sound effects for all animations** (HIGH PRIORITY after Phase 1!)
- [ ] Configurable settings (count, speed, colors)
- [ ] Multi-monitor support
- [ ] Keyboard shortcuts to trigger effects
- [ ] Custom color schemes
- [ ] Effect intensity modes (gentle/normal/extreme)

## Credits

Built with ❤️ using:
- Swift 5
- SwiftUI
- Raycast API
- macOS AppKit

---

**Enjoy celebrating with falling balloons!** 🎈✨

Try triggering it multiple times for spectacular rainbow effects!
