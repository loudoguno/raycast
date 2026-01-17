# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a personal collection of custom Raycast extensions for macOS. The repository contains three distinct extensions:

1. **Balloons** - Browser-based celebration extension with HTML/CSS animations
2. **Balloons Fancy** - Native macOS system overlay extension with 11 visual effects (balloons, fireworks, snow, etc.)
3. **Claude Usage** - Utility to monitor Claude AI subscription usage limits via Safari automation

## Common Development Commands

### Standard Extension Development

For most extensions (balloons, claude-usage):

```bash
# Navigate to extension directory
cd extensions/{extension-name}

# Install dependencies
npm install

# Start development mode (hot reload enabled)
npm run dev

# Build and validate extension
npm run build

# Lint code
npm run lint

# Auto-fix linting issues
npm run fix-lint

# Publish to Raycast Store
npm run publish
```

### Balloons Fancy (Advanced Setup)

The `balloons-fancy` extension requires building a native macOS app first:

```bash
# Full setup in one command
cd extensions/balloons-fancy/BalloonsApp && ./build.sh && cp -r build/BalloonsApp.app /Applications/ && cd .. && npm install && npm run dev

# Or step by step:
cd extensions/balloons-fancy/BalloonsApp
./build.sh                           # Compiles Swift files using swiftc
cp -r build/BalloonsApp.app /Applications/  # Install to Applications
cd ..
npm install
npm run dev
```

**Important**: After modifying any Swift files in `BalloonsApp/`, you must rebuild and reinstall the app to see changes.

## Architecture

### Extension Structure

Each extension follows Raycast's standard structure:

```
extension-name/
├── src/              # TypeScript/React source files
│   ├── *.tsx         # Command entry points (one per command)
│   └── utils/        # Shared utilities
├── assets/           # Icons and images
├── package.json      # Extension metadata and commands
└── tsconfig.json     # TypeScript configuration
```

### Key Architectural Patterns

#### 1. Balloons Extension
- Uses `mode: "no-view"` (background command, no UI)
- Generates temporary HTML file with inline CSS/JavaScript
- Opens in default browser, auto-closes after 8 seconds
- Creates 30 balloons with randomized colors, delays, and drift
- All animation logic is self-contained in the generated HTML

#### 2. Balloons Fancy Extension
- **Hybrid architecture**: TypeScript extension + native Swift app
- TypeScript commands act as launchers that shell out to macOS app
- Native app (`BalloonsApp.app`) contains 11 SwiftUI view implementations
- Each command opens the app with a specific effect name
- Swift app uses `NSWindow` overlays at screen level for system-wide display
- Build script (`build.sh`) uses `swiftc` to compile all Swift files together

**Swift View Files**:
- `BalloonsView.swift` - 50 balloons with 24 colors
- `FireworksView.swift` - Explosive bursts with sound effects
- `SnowView.swift` - 500-700 snowflakes
- `CupcakeView.swift`, `CampfireView.swift`, `FeatherView.swift`, `BeerView.swift`, `LeavesView.swift`, `RainbowView.swift`, `PixelsView.swift`, `GalaxyView.swift` - Additional visual effects

**Command Pattern**: Each TypeScript command file (`balloons-fancy.tsx`, `fireworks.tsx`, etc.) executes `open -a /Applications/BalloonsApp.app --args {effectName}`

#### 3. Claude Usage Extension
- Uses Safari automation via AppleScript to scrape usage data
- Requires: Safari > Develop > Allow JavaScript from Apple Events
- Creates/finds a Safari tab for `https://claude.ai/settings/usage`
- Extracts text using `document.body.innerText` and parses with regex
- Displays data using `Detail` component with custom timeline visualizations
- Menu bar command (`mode: "menu-bar"`) uses "quiet mode" to avoid opening Safari windows on background refresh

**Commands**:
- `show-usage` - Usage dashboard with pacing indicators
- `menu-bar` - Persistent menu bar display (auto-refresh every 10m)
- `daily-summary` - Today's Claude Code productivity
- `weekly-summary` - Past 7 days productivity
- `monthly-summary` - Past 30 days productivity

**Key Features**:
- Timeline visualizations showing usage vs. time elapsed
- "Pacing" indicator (e.g., "15% ahead" or "10% behind")
- Week calendar showing current day and reset day
- Session (5-hour) and weekly limits tracked separately
- Git status indicators on projects: `⑃` (git repo) or `⑃☁️` (GitHub)
- Activity heatmaps and peak hours charts for summaries

**AppleScript Modes**:
- `APPLESCRIPT_QUIET` - Only reads from existing Safari tabs, never opens windows (used by menu bar background refresh)
- `APPLESCRIPT_INTERACTIVE` - Opens Safari and creates tabs if needed (used by manual refresh)

### Technology Stack

- **TypeScript**: All extension logic
- **React**: UI components via Raycast API
- **Swift 5 + SwiftUI**: Native macOS animations (balloons-fancy only)
- **AppleScript**: Safari automation (claude-usage only)
- **Node.js**: Runtime environment

## Important Notes

### Raycast Extension Specifics

- **Hot Reload**: When running `npm run dev`, extensions remain loaded in Raycast even after stopping the dev server. Changes to code automatically reload.
- **Command Modes**:
  - `"no-view"` - Background command with no UI (e.g., balloons)
  - `"view"` - Full UI component (e.g., show-usage)
  - `"menu-bar"` - Menu bar extra with optional interval polling

### Development Workflow

1. Use Raycast's "Create Extension" command for new extensions
2. Extensions are developed in this local repository, not the official Raycast extensions repo
3. The `prepublishOnly` script prevents accidental npm publishes
4. Publishing creates a PR to the official Raycast extensions repository

### Safari Automation (Claude Usage)

The claude-usage extension requires specific Safari permissions:
- **Develop menu must be enabled**: Safari > Preferences > Advanced > "Show Develop menu"
- **JavaScript from Apple Events**: Develop > Allow JavaScript from Apple Events
- **Accessibility permissions**: System Settings > Privacy & Security > Accessibility > Raycast

### Building Native Apps (Balloons Fancy)

- The `build.sh` script compiles all Swift files using `swiftc`
- Must link against SwiftUI and AppKit frameworks
- Info.plist is modified during build to set bundle identifier
- App must be installed to `/Applications/` for the extension to find it
- Each effect has its own Swift view file but all are compiled into one app bundle

## Testing

- Test extensions by opening Raycast and searching for command names
- For balloons-fancy, test each effect individually (11 total commands)
- For claude-usage, ensure Safari can access claude.ai and permissions are granted

## File Locations

- Extensions: `/Users/loudog/code/raycast/extensions/`
- Templates: `extensions/templates/` (hello-world examples)
- Documentation: `extensions/docs/` and `extensions/instructions.md`
