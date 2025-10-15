# Raycast Extensions 🚀

A collection of custom Raycast extensions for enhanced productivity and fun!

## Extensions

### 🎈 Balloons
A simple celebration extension that displays colorful animated balloons in your browser.

**Features:**
- Browser-based HTML/CSS animations
- 30 balloons with 8 vibrant colors
- Zero setup required
- Auto-closes after animation

[View Documentation →](./balloons/)

---

### 🎈✨🎆❄️ Visual Effects (Balloons Fancy)
An advanced celebration extension with native macOS system-wide overlay effects.

**Available Effects:**
- 🎈 Balloons: 50 balloons with 24 vibrant colors, falling animation
- 🎆 Fireworks: 20-25 explosive bursts with sound effects
- ❄️ Snow: 500-700 snowflakes in complete whiteout blizzard

**Features:**
- System-wide overlay (appears over all apps)
- Multiple visual effects from one app
- Variable sizes and colors
- Native Swift/SwiftUI performance
- Sound effects (system sounds, custom sounds coming soon!)
- Unique random pattern each time
- Easy to extend with new effects

[View Documentation →](./balloons-fancy/)

---

## Quick Comparison

| Feature | Balloons | Visual Effects (Balloons Fancy) |
|---------|----------|----------------------------------|
| **Setup** | None | Build macOS app |
| **Display** | Browser tab | System overlay |
| **Effects** | Balloons only | Balloons + Fireworks + Snow! |
| **Balloon Count** | 30 | 50 |
| **Colors** | 8 | 24 |
| **Sizes** | Fixed | Variable |
| **Performance** | Good | Excellent |
| **Animation** | CSS | Swift/SwiftUI |
| **Sound** | None | System sounds |
| **Extensible** | No | Yes |

## Installation

### Balloons (Simple)
```bash
cd balloons
npm install
npm run dev
```

### Visual Effects / Balloons Fancy (Advanced)
```bash
# Quick setup - all in one line:
cd balloons-fancy/BalloonsApp && ./build.sh && cp -r build/BalloonsApp.app /Applications/ && cd .. && npm install && npm run dev

# Or step by step:
# 1. Build the native macOS app
cd balloons-fancy/BalloonsApp
./build.sh
cp -r build/BalloonsApp.app /Applications/

# 2. Install the extension
cd ..
npm install
npm run dev
```

## Usage

Once installed, open Raycast and type:
- **"Balloons"** - for the simple browser-based version
- **"Balloons Fancy"** - for native overlay balloons
- **"Fireworks"** - for explosive fireworks with sound
- **"Snow"** - for an intense whiteout blizzard

## Development

Both extensions are built with:
- TypeScript
- Raycast API
- Node.js

**Balloons Fancy** additionally uses:
- Swift 5
- SwiftUI
- macOS AppKit

## Future Extensions

Have ideas for more extensions? Check out the ideas file for inspiration!

## Credits

Built with ❤️ by loudog

---

🎈 **Enjoy celebrating your achievements!** 🎈
