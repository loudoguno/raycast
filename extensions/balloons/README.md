# Balloons 🎈

Celebrate with rising balloons! A simple Raycast extension that displays colorful animated balloons in your browser.

## Features

- 🎨 **Colorful balloons**: 8 vibrant random colors
- 🌐 **Browser-based**: Opens a full-screen HTML page with CSS animations
- ✨ **Simple setup**: No additional apps needed
- 🎭 **30 balloons**: Beautiful animation with varied timing
- 🚀 **Auto-closes**: Page closes automatically after 8 seconds

## Installation

```bash
cd /Users/loudog/code/extensions/balloons
npm install
npm run dev
```

## Usage

1. Open Raycast (⌘ + Space)
2. Type "Balloons"
3. Press Enter
4. Watch balloons float up in your browser! 🎈

## How It Works

This extension creates a temporary HTML file with CSS animations and opens it in your default browser. The balloons:
- Rise from the bottom of the page
- Have random colors, positions, and timing
- Include highlights and swaying strings
- Feature smooth CSS keyframe animations

## Technical Details

- **Implementation**: HTML/CSS/JavaScript
- **Display**: Opens in default browser
- **Count**: 30 balloons
- **Duration**: 8 seconds
- **Colors**: 8 vibrant colors
- **Animation**: CSS keyframes with transforms

## Comparison

Want a more advanced experience? Check out **[Balloons Fancy](../balloons-fancy/)** which provides:
- System-wide overlay (no browser window)
- 50 balloons with 24 colors
- Variable balloon sizes
- Native Swift/SwiftUI performance
- True confetti-style experience

| Feature | Balloons | Balloons Fancy |
|---------|----------|----------------|
| Setup | None | Build macOS app |
| Display | Browser tab | System overlay |
| Balloon count | 30 | 50 |
| Colors | 8 | 24 |
| Performance | Good | Excellent |

## Credits

Built with ❤️ for Raycast
