# Search Status Menu — Raycast Extension PRD

**Version:** 0.1.0
**Author:** Lou DeSantis
**Status:** Draft
**Created:** 2026-03-22

---

## Summary

A Raycast extension that provides keyboard-centric access to macOS status menu (menubar) items. Opens as a Raycast List view where you can fuzzy-search status bar icons by name, then interact with them — Return to left-click (opening the dropdown), ⌘+Return to right-click (opening the context menu).

This is the lightweight alternative to the full LouTools Swift module. It trades the custom floating panel for Raycast's built-in UI, gaining immediate usability at the cost of some interaction depth (Raycast dismisses on action, so dropdown traversal happens natively after the click, not inside Raycast).

---

## Problem

macOS status menu icons are mouse-only. You can't search them, you can't access them by keyboard, and with crowded menubar or a MacBook notch hiding items, finding the right icon is friction. Bartender solved icon management but its future is uncertain after acquisition. No existing tool provides a pure keyboard search-and-activate flow.

---

## User Stories

1. **As a keyboard-centric user,** I want to press a hotkey, type a few letters to find a status menu item, and press Return to open its dropdown — without touching the mouse.

2. **As a MacBook user with a notch,** I want to access status items that are hidden behind the notch without manually rearranging my menubar.

3. **As a power user,** I want to right-click a status item (⌘+Return) to access its alternate/context menu when available.

---

## User Flow

```
1. User triggers "Search Status Menu" command (hotkey or Raycast search)
2. Raycast List view opens showing all discovered status menu items
   - Each item shows: app name, status item title (if any), icon
   - Items are fuzzy-searchable via Raycast's built-in filtering
3. User types to filter → list narrows in real-time
4. User selects an item:
   a. Return → left-click the status item → Raycast dismisses → dropdown menu opens
   b. ⌘+Return → right-click the status item → Raycast dismisses → context menu opens
5. User interacts with the now-open dropdown/context menu via arrow keys + Return
```

---

## Key Interactions

| Key | Action | Behavior |
|-----|--------|----------|
| **Return** | Left-click | Simulates left-click on the status item. Opens its dropdown menu. Raycast dismisses. User navigates dropdown with arrow keys. |
| **⌘+Return** | Right-click | Simulates right-click on the status item. Opens context/alternate menu if the app supports it. Raycast dismisses. |
| **Escape** | Cancel | Dismisses Raycast without action. |
| **Type** | Fuzzy search | Filters the list of status items in real-time. |

---

## Technical Implementation

### Core Mechanism: AppleScript via Raycast's `exec`

Raycast extensions run in Node.js and can shell out to `osascript` for macOS system interaction. The extension uses **two scripts**:

#### 1. Discovery — Enumerate Status Menu Items

```applescript
-- Uses System Events accessibility to list menu bar items
tell application "System Events"
    tell process 1 -- any process, we want the system menu bar
        set menuBarItems to menu bar items of menu bar 1
        -- menu bar 1 = the system (right-side) menu bar
        -- Returns: name, position, size of each item
    end tell
end tell
```

**More robust approach:** Use `AXUIElement` via a small Swift helper CLI. The extension would bundle a compiled Swift binary (`status-menu-helper`) that:
- Enumerates all menu bar extras via Accessibility API
- Outputs JSON: `[{"title": "Dropbox", "bundleId": "com.dropbox.client", "position": [1200, 11], "index": 0}, ...]`
- The Raycast extension calls this binary and parses the JSON

This Swift helper approach is preferred because:
- AppleScript's System Events has inconsistent access to status item metadata
- A compiled binary starts in <100ms
- It can be shared with the full LouTools module later

#### 2. Interaction — Click a Status Item

**Left-click (Return):**
```typescript
// In Raycast action handler:
import { exec } from "child_process";

// Option A: AppleScript + System Events
exec(`osascript -e '
  tell application "System Events"
    click menu bar item "${itemTitle}" of menu bar 1 of process "${processName}"
  end tell
'`);

// Option B: Swift helper with position-based CGEvent click
exec(`./status-menu-helper click --position ${x},${y} --button left`);
```

**Right-click (⌘+Return):**
```typescript
// Same as above but with right-click
exec(`./status-menu-helper click --position ${x},${y} --button right`);
```

### Extension Structure

```
Search_Status_Menu/
├── package.json              # Raycast extension manifest
├── tsconfig.json
├── PRD.md                    # This document
├── src/
│   ├── search-status-menu.tsx    # Main command — List view with items
│   ├── lib/
│   │   ├── scanner.ts            # Call Swift helper, parse JSON output
│   │   ├── clicker.ts            # Execute click actions via helper
│   │   └── types.ts              # StatusMenuItem interface
│   └── assets/
│       └── status-menu-helper    # Compiled Swift binary (bundled)
├── swift-helper/
│   └── main.swift                # Swift source for the helper binary
└── README.md
```

### Raycast API Components Used

| Component | Usage |
|-----------|-------|
| `List` | Main view — displays status menu items |
| `List.Item` | Each status menu item row |
| `ActionPanel` | Houses the Return and ⌘+Return actions |
| `Action` | "Open Menu" (Return = left-click) |
| `Action` | "Open Context Menu" (⌘+Return = right-click) |
| `Icon` | App icon for each status item (via bundleId → app icon) |
| `showHUD` | Feedback toast if click fails |
| `getApplications` | Resolve bundleId to app icon |

### Key Raycast Command Config (package.json)

```json
{
  "commands": [
    {
      "name": "search-status-menu",
      "title": "Search Status Menu",
      "description": "Fuzzy search and interact with macOS status menu items",
      "mode": "view"
    }
  ]
}
```

---

## Permissions

**Required:** macOS Accessibility permission. On first run, the extension should:
1. Attempt to enumerate status items
2. If permission denied, show an informative error with a button to open System Settings → Privacy & Security → Accessibility
3. Guide the user to add Raycast to the Accessibility allow list

This is the same permission Bartender, Ice, and Hidden Bar require.

---

## Edge Cases & Limitations

| Issue | Mitigation |
|-------|------------|
| **Control Center aggregate** | macOS Ventura+ bundles Wi-Fi, Bluetooth, Sound, etc. into one "Control Center" item. Clicking it opens the panel; individual sub-items aren't separately addressable. Show it as one item labeled "Control Center". |
| **Icon-only items** | Many status items have no title text. Use the owning app's name (from bundleId) as the label. |
| **Hidden/collapsed items** | Items hidden by macOS or third-party hiders may not be enumerable. Document this limitation. |
| **Notch overlap** | Items behind the MacBook notch are still in the AX tree. They'll appear in the list and can be clicked even if not visible. |
| **Raycast dismisses on action** | After Return/⌘+Return, Raycast closes. The dropdown menu opens natively. User navigates it with arrow keys + Return. This is expected — not a bug. |
| **Position drift** | Status item positions can change between scan and click (e.g., if another item appears). Re-scan position immediately before clicking. |

---

## Scope — What This Is NOT

- **Not a status bar manager.** No hiding/showing/reordering items (that's Ice/Bartender territory).
- **Not a menu bar replacement.** The native menu bar stays as-is.
- **Not a persistent background process.** Only activates when the Raycast command is invoked. Scans fresh each time.

---

## Success Criteria

1. User can invoke the command and see all visible status menu items within 500ms
2. Fuzzy search narrows the list accurately
3. Return opens the item's dropdown menu reliably for common apps (Dropbox, 1Password, Docker, iStat, etc.)
4. ⌘+Return opens the context menu where supported
5. Works on both Intel and Apple Silicon Macs
6. Works on macOS Ventura, Sonoma, and Sequoia
7. No focus stealing — the status item dropdown appears naturally as if the user clicked it

---

## Development Phases

### Phase 1: Foundation (MVP)
- Swift helper binary that enumerates status items as JSON
- Raycast List view displaying items
- Return action: left-click via CGEvent at item position
- Basic error handling for missing Accessibility permission

### Phase 2: Polish
- App icon resolution for each item
- ⌘+Return action: right-click
- Better labels for icon-only items
- Position refresh before click to avoid drift

### Phase 3: Enhancement
- Frecency sorting (most-used items bubble to top)
- Keyboard shortcut hints for items you click often
- Integration with LouTools CLI (`loutools status-menu list` as data source)

---

## Relationship to LouTools

This Raycast extension is the **lightweight, immediately usable** version. The full LouTools Swift module (see `~/code/LouTools/Research/status-menu-search/`) will eventually provide:

- Custom floating panel UI (doesn't require Raycast)
- Integration with LouTools' Karabiner simlayer system
- Deeper dropdown menu traversal (stay in the custom UI)
- Integration with Fuzzy Fast Search module

The Swift helper binary built for this Raycast extension can be reused directly in the LouTools module.
