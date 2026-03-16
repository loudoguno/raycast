omnifocus_id: kkCqnBms5-P  # ~/code/raycast/extensions/omnifocus

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a personal collection of custom Raycast extensions for macOS. The repository contains five distinct extensions:

1. **Balloons** - Browser-based celebration extension with HTML/CSS animations
2. **Balloons Fancy** - Native macOS system overlay extension with 11 visual effects (balloons, fireworks, snow, etc.)
3. **Claude Usage** - Utility to monitor Claude AI subscription usage limits via Safari automation
4. **OmniFocus** - Custom OmniFocus integration with "Quick Add Anywhere" task creation
5. **RoamResearch** - Zero-friction search and preview for Roam Research knowledge graphs (custom, not a fork)

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
│   ├── tools/        # AI tool entry points (optional, for Raycast AI integration)
│   ├── components/   # Shared React components
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Shared utilities (or helpers/, lib/, api/)
├── assets/           # Icons and images
├── package.json      # Extension metadata, commands, and tools
├── eslint.config.mjs # ESLint 9 flat config (extends @raycast)
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

#### 4. OmniFocus Extension
- Uses JXA (JavaScript for Automation) via `@raycast/utils` `runAppleScript` with `language: "JavaScript"`
- Requires OmniFocus Pro (for automation/scripting access)
- Single JXA call fetches all projects and tasks with breadcrumb hierarchy
- Task creation supports inbox, project, or subtask destinations
- Repeat rules set via Omni Automation bridge (`evaluateJavascript`) since JXA's `repetitionRule` setter crashes

**Commands**:
- `quick-add-anywhere` - Fuzzy search projects/tasks, then create a task or subtask with name, tags, due, repeat, flag, note

**Key Architecture**:
- `src/lib/api/` - JXA scripts as TypeScript template literals
- `src/lib/utils/execute-script.ts` - Core JXA runner wrapping `runAppleScript`
- `src/lib/utils/escape-jxa.ts` - String escaping to prevent injection
- `usePromise` (not `useCachedPromise`) for data fetching — avoids stale cache issues
- `humanReadableOutput: true` in `runAppleScript` — `-ss` flag causes double-quoting issues

**Known Gotchas**:
- OmniFocus status enum must be compared via `String()` coercion, not direct equality
- `whose()` clauses can throw type conversion errors — prefer JS-side filtering
- `effectivelyDropped()` may not exist in all OmniFocus versions — wrap in try/catch

#### 5. RoamResearch Extension
- **Fresh build** inspired by the official Roam Research Store extension, not a fork
- Uses Roam Research API via user-generated API tokens (graph owner required)
- Vendored minimal API client (`src/lib/roam-client.ts`) — strongly typed, no `any`
- `LocalStorage` for graph config (replaces the Store extension's broken `usePersistentState`)
- Datalog queries for recent edits (`:edit/time` attribute, last 48h)
- Directory naming convention: `RoamResearch` (PascalCase) indicates custom spin-off vs lowercase store extensions

**Commands**:
- `search` - Zero-friction search: skips graph picker, shows recent edits on open, search on first keystroke, rich block previews with clickable `[[links]]` and linked references
- `quick-capture` - Append to daily note or any page
- `daily-note` - One-keystroke open of today's daily note (no-view)
- `add-graph` - Connect a Roam graph with API token (validates connection)

**Key Architecture**:
- `src/lib/roam-client.ts` - Minimal Roam API client (q, pull, search, createBlock, batchActions) with peer URL caching
- `src/lib/roam-api.ts` - High-level operations (searchGraph, fetchRecentEdits, fetchBackRefs, getAllPages)
- `src/lib/graph-config.ts` - Graph config management via Raycast `LocalStorage`
- `src/lib/markdown.ts` - Roam → Raycast markdown rendering: `[[page links]]` as deeplinks, `((block refs))` resolution, `{{[[TODO]]}}` checkboxes, search term highlighting, nested children, linked references section
- `src/lib/types.ts` - Shared TypeScript interfaces

**Search UX Design**:
- No graph selection step — defaults to Primary Graph preference
- Empty state shows recently edited blocks (Datalog `:edit/time` query, last 48h)
- No 2-character minimum — search fires on first keystroke
- Rich Detail preview: page title + child blocks (3 levels) + linked references with clickable deeplinks
- Full action panel: Open in Browser/App, Copy block ref/content/URL/UID, View back-references, Paste block ref

**Known Limitations**:
- Encrypted Roam graphs not supported (Roam backend limitation)
- Roam API rate limits undocumented — uses exponential backoff
- Graph owner must generate API tokens (collaborators cannot)
- ESLint 9 + `@raycast/eslint-config` has upstream `@rushstack/eslint-patch` compatibility issue (lint errors are dev-only, don't affect build)

### Technology Stack

- **TypeScript**: All extension logic
- **React 19**: UI components via Raycast API
- **Node.js 22+**: Runtime environment (required by Raycast)
- **Swift 5 + SwiftUI**: Native macOS animations (balloons-fancy only)
- **AppleScript**: Safari automation (claude-usage only)
- **JXA (JavaScript for Automation)**: OmniFocus automation (omnifocus only)

**Note**: Some extensions in this repo use older dependency versions (e.g., `@raycast/api` ^1.83, `@raycast/utils` ^1.17). Current latest is `@raycast/api` ^1.104 and `@raycast/utils` ^2.2. Update when convenient but test after upgrading — `@raycast/utils` v2 requires React 19.

## Important Notes

### Raycast Extension Specifics

- **Hot Reload**: When running `npm run dev`, extensions remain loaded in Raycast even after stopping the dev server. Changes to code automatically reload (toggleable in Preferences > Advanced).
- **Command Modes**:
  - `"no-view"` - Background command with no UI (e.g., balloons)
  - `"view"` - Full UI component (e.g., show-usage)
  - `"menu-bar"` - Menu bar extra with optional interval polling
- **AI Tools**: Extensions can declare `tools` in package.json (separate from `commands`). Tools live in `src/tools/` and are callable by Raycast AI when the extension is @mentioned. Not shown in root search.
- **ESLint**: Current standard is ESLint 9 flat config via `eslint.config.mjs` (not `.eslintrc.json`). Older extensions in this repo still use the legacy format.
- **Platforms**: Extensions can declare `"platforms": ["macOS", "Windows"]` in package.json. Default is `["macOS"]`.

### Development Workflow

1. Extensions are developed in this local repository, not the official Raycast extensions repo
2. Some older extensions have a `prepublishOnly` script to prevent accidental `npm publish` — this is optional and no longer scaffolded into new extensions
3. Publishing via `ray publish` (or `npm run publish`) creates a PR to the official Raycast extensions repository

### Customizing Store Extensions

Three approaches, depending on how much you want to change:

**1. Fork (built-in Raycast action)** — Best when the existing extension is mostly good and you want to add commands.
- Raycast → select extension → Actions → Fork Extension
- Downloads full source to a local directory, **replaces** the store version
- You inherit all commands + bugs + tech debt. No more auto-updates.
- Workflow: Fork → move source into this repo at `extensions/{name}/` → add commands → `npm run dev`

**2. Clone from GitHub** — Same as fork but manual. Copy files from `github.com/raycast/extensions/tree/main/extensions/{name}/`.
- Can coexist with the store version (different extension name/identifier)
- Same inherited tech debt as forking

**3. Fresh start (reference only)** — Best when you want to fundamentally redesign the UX.
- Scaffold a new extension, cherry-pick only the valuable parts (API integration, queries)
- Clean architecture, modern deps, no bug baggage
- More upfront work, but no fighting someone else's broken patterns
- Use PascalCase directory name (e.g., `RoamResearch`) to distinguish from lowercase store extensions
- Example: `extensions/RoamResearch/` was built fresh, referencing the store extension's Roam API patterns only

Trade-off for all approaches: you own the code from that point — no store auto-updates.

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

### OmniFocus Automation (OmniFocus Extension)

The omnifocus extension requires OmniFocus Pro for scripting access:
- **OmniFocus Pro**: Required for AppleScript/JXA automation
- **Accessibility permissions**: System Settings > Privacy & Security > Accessibility > Raycast

### Roam Research API (RoamResearch Extension)

The RoamResearch extension requires a Roam Research account with API access:
- **Graph ownership**: Must be the graph owner to generate API tokens
- **API token**: Roam → Settings → Graph → API Tokens → + New API Token (scope: "edit")
- **Primary Graph preference**: Set in extension preferences to skip graph picker on search
- **Encrypted graphs**: Not supported (Roam backend limitation)

## Testing

- Test extensions by opening Raycast and searching for command names
- For balloons-fancy, test each effect individually (11 total commands)
- For claude-usage, ensure Safari can access claude.ai and permissions are granted
- For omnifocus, ensure OmniFocus Pro is installed and Raycast has accessibility permissions
- For RoamResearch, ensure API token is configured via "Add Graph" command and Primary Graph is set in preferences

## Machine Setup Checks

**On session start, check the hostname.** If the machine is `mxb`, verify the following setup is complete:

### Git post-merge hook (auto-rebuilds extensions after `git pull`)

Check if the symlink exists:
```bash
ls -la .git/hooks/post-merge
```
If missing or not a symlink to `../../hooks/post-merge`, set it up:
```bash
ln -sf ../../hooks/post-merge .git/hooks/post-merge
```

### Beads issue tracker

Check if `bd` is installed:
```bash
command -v bd >/dev/null && echo "OK" || echo "MISSING — run: brew install beads"
```
Then verify the database is detected:
```bash
bd info
```
If `bd info` fails, the `.beads/` directory may not have been pulled yet — run `git pull`.

### OmniFocus extension registration

Check if the OmniFocus extension is registered with Raycast:
```bash
ls extensions/omnifocus/dist/
```
If `dist/` is missing or empty, the extension needs a first-time build + registration:
```bash
cd extensions/omnifocus && npm install && npm run build && npm run dev
# Stop dev server (⌃+C) once Raycast loads the extension — it persists after that
```

## Issue Tracking with Beads

This repo uses **[beads](https://github.com/steveyegge/beads)** (`bd` CLI) for issue tracking. Issues live in `.beads/` and sync via git.

### Setup on a new machine

```bash
# Install beads (requires Homebrew)
brew install beads

# After cloning/pulling, beads auto-discovers the .beads/ directory — no init needed.
# Verify it works:
bd info
bd ready    # Show actionable issues
```

### Key commands

```bash
bd ready                  # Unblocked issues sorted by priority
bd children <epic-id>     # Show issue tree under an epic
bd show <id>              # Full issue details
bd create "title" --priority 2 --type task --labels health,health:smell --description "..."
bd update <id> --claim    # Claim work
bd close <id> --reason "Fixed in commit abc123"
bd sync                   # Sync with git
```

### Health check system

The `/health-check` skill runs periodic code health sweeps and files findings as beads:
- Creates an **epic** per run (labeled `health,health-run`)
- Individual findings become children of the epic
- KV metadata tracks run history: `bd kv get health-check.last-run`
- Deduplicates against prior runs before creating new beads

See `AGENTS.md` for full agent workflow instructions.

## File Locations

- Extensions: `/Users/loudog/code/raycast/extensions/`
- Templates: `extensions/templates/` (hello-world examples)
- Documentation: `extensions/docs/` and `extensions/instructions.md`
