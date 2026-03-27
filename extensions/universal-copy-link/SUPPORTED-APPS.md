# Supported Apps Reference

Complete reference of all apps with registered handlers in Universal Copy Link. Apps are grouped by the same tiers used in `src/handlers.ts`.

> **Any app not listed here** still works via the [accessibility fallback](./README.md#the-accessibility-fallback) — you'll get at least a window title, and potentially a file URL if the app exposes `AXDocument`.

---

## Table of Contents

- [Browsers](#browsers) (8 apps)
- [Tier 1: Daily Use](#tier-1-daily-use) (11 apps)
- [Tier 2: Regular Use](#tier-2-regular-use) (11 apps)
- [Tier 3: Carried from KM](#tier-3-carried-from-km) (20 apps)
- [Hookmark-Inspired Additions](#hookmark-inspired-additions) (6 apps)
- [Terminal Apps](#terminal-apps) (1 app)
- [Link Quality Legend](#link-quality-legend)
- [Bundle ID Aliases](#bundle-id-aliases)

---

## Browsers

All browsers use the `browser` strategy, which queries the active/current tab for its title and URL via AppleScript.

| App | Bundle ID | Tab Accessor | Link Quality | Example Link |
|-----|-----------|-------------|--------------|--------------|
| **Safari** | `com.apple.Safari` | `currentTab` | Web URL | `[Apple](https://apple.com)` |
| **Google Chrome** | `com.google.Chrome` | `activeTab` | Web URL | `[Google](https://google.com)` |
| **Microsoft Edge** | `com.microsoft.edgemac` | `activeTab` | Web URL | `[Bing](https://bing.com)` |
| **Vivaldi** | `com.vivaldi.Vivaldi` | `activeTab` | Web URL | `[Vivaldi](https://vivaldi.com)` |
| **Kagi (Orion)** | `com.kagi.kagimacOS` | `currentTab` | Web URL | `[Kagi Search](https://kagi.com)` |
| **Opera** | `com.operasoftware.Opera` | `activeTab` | Web URL | `[Opera](https://opera.com)` |
| **Firefox** | `org.mozilla.firefox` | `activeTab`* | Web URL | `[Mozilla](https://mozilla.org)` |
| **Arc** | `company.thebrowser.Browser` | `activeTab` | Web URL | `[Arc](https://arc.net)` |

*\*Firefox uses special handling — UI scripting for the window title and a separate AppleScript call for the URL, because Firefox's scripting model differs from Chromium-based browsers.*

**Notes:**
- `currentTab` is used by Safari-engine browsers; `activeTab` is used by Chromium-engine browsers
- All browsers return the full page title and URL from the address bar

---

## Tier 1: Daily Use

Apps used most frequently, with the richest link integrations.

| App | Bundle ID | Strategy | Link Quality | URL Type | Example Link |
|-----|-----------|----------|--------------|----------|--------------|
| **Finder** | `com.apple.finder` | `applescript` | File path | `file://` | `[report.pdf](file:///Users/loudog/Documents/report.pdf)` |
| **Obsidian** | `md.obsidian` | `applescript` | Deep link | `obsidian://` | `[My Note](obsidian://open?vault=Work&file=My%20Note)` |
| **OmniFocus** | `com.omnigroup.OmniFocus4` | `applescript` | Deep link | `omnifocus:///` | `[Buy groceries](omnifocus:///task/aBcDeFgH)` |
| **Bear** | `net.shinyfrog.bear` | `applescript` | Deep link | `bear://` | `[Meeting Notes](bear://x-callback-url/open-note?id=xxx)` |
| **Drafts** | `com.agiletortoise.Drafts-OSX` | `applescript` | Deep link | `drafts://` | `[Shopping List](drafts://open?uuid=ABCD-1234)` |
| **Things 3** | `com.culturedcode.ThingsMac` | `menu-command` | Deep link | `things:///` | `[Buy groceries](things:///show?id=abc123)` |
| **Mail** | `com.apple.mail` | `applescript` | Deep link | `message://` | `[Re: Project Update](message://%3cmsg-id%3e)` |
| **TextEdit** | `com.apple.TextEdit` | `applescript` | File path | `file://` | `[notes.txt](file:///Users/loudog/Desktop/notes.txt)` |
| **Ghostty** | `com.mitchellh.ghostty` | `accessibility` | Title / Claude session | Varies | `[Session Name](https://claude.ai/code/session_xxx)` |
| **VS Code** | `com.microsoft.VSCode` | `accessibility` | Title + file | `file://` (if AXDocument) | `[main.ts — project](file:///path/to/main.ts)` |
| **Claude Desktop** | `com.anthropic.claudefordesktop` | `accessibility` | Title only | — | `Claude Desktop` |

**Finder details:**
- If files are selected → returns the first selected file's name and `file://` URL
- If nothing is selected → returns the current folder's path and URL

**Obsidian details:**
- Parses window title (format: `Note Name - Vault Name`) to construct an `obsidian://open` URI
- Handles URI encoding for spaces and special characters

**Bear details:**
- Uses the `Note → Copy Link to Note` menu item via AppleScript to get Bear's internal link
- Falls back to `Edit → Copy Link to Note` if the menu structure differs

**Things 3 details:**
- Uses the menu-command strategy to click `Edit → Share → Copy Link`
- 300ms delay to wait for Things to put the URL on the clipboard
- The URL is a `things:///` deep link

**Mail details:**
- Gets the selected message's subject and message ID
- Constructs a `message://` URI that opens the specific email in Mail

---

## Tier 2: Regular Use

Apps used regularly with varying levels of link richness.

| App | Bundle ID | Strategy | Link Quality | URL Type | Example Link |
|-----|-----------|----------|--------------|----------|--------------|
| **Calendar** | `com.apple.iCal` | `applescript` | Title only | — | `Calendar Event Name` |
| **Contacts** | `com.apple.AddressBook` | `applescript` | Deep link | `addressbook://` | `[John Smith](addressbook://person-id)` |
| **Fantastical** | `com.flexibits.fantastical2.mac` | `applescript` | Title only | — | `Meeting with Team` |
| **Spotify** | `com.spotify.client` | `applescript` | Web URL | `https://` | `[Bohemian Rhapsody — Queen](https://open.spotify.com/track/xxx)` |
| **DEVONthink** | `com.devon-technologies.think3` | `applescript` | Deep link | `x-devonthink-item://` | `[Research Paper](x-devonthink-item://UUID)` |
| **Bike** | `com.hogbaysoftware.Bike` | `applescript` | File path | `file://` | `[outline.bike](file:///path/to/outline.bike)` |
| **Notes** | `com.apple.Notes` | `applescript` | Title only | — | `My Quick Note` |
| **Preview** | `com.apple.Preview` | `applescript` | File path | `file://` | `[document.pdf](file:///path/to/document.pdf)` |
| **Terminal** | `com.apple.Terminal` | `accessibility` | Title / Claude session | Varies | Window title or Claude session link |
| **SideNotes** | `com.apptorium.SideNotes` | `accessibility` | Title + file | Varies | Window title + AXDocument if available |
| **Notion** | `com.notion.id` / `notion.id` | `accessibility` | Title + URL | Varies | Window title + AXDocument if available |

**Spotify details:**
- Gets the currently playing track's name, artist, and Spotify ID
- Constructs a standard Spotify web URL: `https://open.spotify.com/track/{id}`
- Title format: `Track Name — Artist Name`

**DEVONthink details:**
- Gets the selected record's name and UUID
- Constructs an `x-devonthink-item://` deep link that opens the specific record

**Notion notes:**
- Two bundle IDs are registered (`com.notion.id` and `notion.id`) to handle both the Mac App Store and direct download versions
- Uses accessibility strategy — link quality depends on what Notion exposes via AXDocument

---

## Tier 3: Carried from KM

These apps were supported in the original Keyboard Maestro macro and carried forward. Many use System Events to read the window title since they lack rich scripting dictionaries. Some have been enhanced with app-specific scripting.

| App | Bundle ID | Strategy | Link Quality | URL Type | Example Link |
|-----|-----------|----------|--------------|----------|--------------|
| **Scrivener** | `com.literatureandlatte.scrivener3` | `applescript` | Title + file | `file://` (via AXDocument) | `[Chapter 1 — My Novel](file:///path/to/novel.scriv)` |
| **Ulysses** | `com.ulyssesapp.mac` | `applescript` | Title only | — | `Blog Post Draft` |
| **Nova** | `com.panic.Nova` | `applescript` | File path | `file://` | `[index.html](file:///path/to/index.html)` |
| **Transmit** | `com.panic.Transmit` | `applescript` | Title only | — | `server.example.com — Transmit` |
| **Reeder** | `com.reederapp.macOS` | `applescript` | Title only | — | `RSS Feed Article Title` |
| **Bookends** | `com.sonnysoftware.bookends` | `applescript` | Title only | — | `Smith 2024 — Research Paper` |
| **The Archive** | `de.zettelkasten.TheArchive` | `applescript` | Title only | — | `202401151234 Zettel Title` |
| **nvUltra** | `com.multimarkdown.nvUltra` | `applescript` | Title only | — | `Note Title — nvUltra` |
| **Kindle** | `com.amazon.Kindle` | `applescript` | Title only | — | `Book Title — Kindle` |
| **HoudahSpot** | `com.houdah.HoudahSpot4` | `applescript` | Title only | — | `Search Results — HoudahSpot` |
| **Accordance** | `com.OakTree.Accordance` | `applescript` | Title only | — | `John 3:16 — Accordance` |
| **Keyboard Maestro** | `com.stairways.keyboardmaestro.editor` | `applescript` | Title only | — | `My Macro — Keyboard Maestro Editor` |
| **iThoughts** | `com.toketaware.ithoughtsx` | `applescript` | Title only | — | `Mind Map Title` |
| **Soulver** | `app.soulver.mac` | `applescript` | Title + file | `file://` (via AXDocument) | `[calculations.soulver](file:///path/to/file)` |
| **Evernote** | `com.evernote.Evernote` | `applescript` | Title only | — | `Meeting Notes — Evernote` |
| **OmniOutliner** | `com.omnigroup.OmniOutliner5` | `applescript` | File path | `file://` | `[outline.ooutline](file:///path/to/outline)` |
| **OmniPlan** | `com.omnigroup.OmniPlan4` | `applescript` | Title + file | `file://` (via AXDocument) | `[Project Plan](file:///path/to/plan)` |
| **MarginNote** | `QReader.MarginStudyMac` | `applescript` | Title only | — | `Research Paper — MarginNote` |
| **Luki** | `com.lukilabs.lukiapp` | `accessibility` | Title + file | Varies | Window title + AXDocument if available |
| **Path Finder** | `com.cocoatech.PathFinder` | `applescript` | File path | `file://` | `[document.pdf](file:///path/to/document.pdf)` |

**Apps with richer integrations in this tier:**
- **Scrivener, Soulver, OmniPlan** — Use `AXDocument` via System Events to get a file URL when available
- **Nova, OmniOutliner, Path Finder** — Query the app's own scripting dictionary for document path
- **Finder selection in Path Finder** — Like Finder, returns the selected item's name and `file://` URL

---

## Hookmark-Inspired Additions

These apps were added based on Hookmark's app support list, expanding coverage for common macOS productivity apps.

| App | Bundle ID | Strategy | Link Quality | URL Type | Example Link |
|-----|-----------|----------|--------------|----------|--------------|
| **Reminders** | `com.apple.reminders` | `applescript` | Title only | — | `Grocery List — Reminders` |
| **Slack** | `com.tinyspeck.slackmacgap` | `accessibility` | Title only | — | `#general — Slack` |
| **Zoom** | `us.zoom.xos` | `accessibility` | Title only | — | `Team Meeting — Zoom` |
| **Day One** | `com.bloombuilt.dayone-mac` | `applescript` | Title only | — | `Journal Entry Title` |
| **Skim** | `net.sourceforge.skim-app.skim` | `applescript` | File path + page | `file://` with `#page=` | `[paper.pdf (p. 42)](file:///path/to/paper.pdf#page=42)` |
| **Books** | `com.apple.iBooksX` | `applescript` | Title only | — | `Book Title — Books` |

**Skim details:**
- Gets the document name, file path, AND current page number
- Constructs a `file://` URL with a `#page=N` fragment
- Title includes the page number: `document.pdf (p. 42)`
- This is one of the most useful integrations — you get a link to the exact page you're reading

---

## Terminal Apps

Terminal apps get special treatment — before using the accessibility strategy, the extension checks for an active Claude Code session.

| App | Bundle ID | Strategy | Link Quality | Notes |
|-----|-----------|----------|--------------|-------|
| **iTerm2** | `com.googlecode.iterm2` | `accessibility` | Title / Claude session | Also listed as a recognized terminal for Claude session detection |

**Note:** Ghostty (`com.mitchellh.ghostty`) and Terminal.app (`com.apple.Terminal`) are listed in Tier 1 above. All three terminals support Claude Code session detection — see [Claude Code Session Detection](./README.md#claude-code-session-detection) for details.

---

## Link Quality Legend

| Quality | Icon | Meaning | Examples |
|---------|------|---------|----------|
| **Deep link** | 🔗 | URI scheme that opens the specific item in the app | `omnifocus:///task/id`, `bear://note`, `drafts://open?uuid=` |
| **Web URL** | 🌐 | Standard HTTPS URL | `https://open.spotify.com/track/...`, any browser URL |
| **File path** | 📄 | `file://` URL to a document on disk | `file:///Users/loudog/Documents/report.pdf` |
| **Title + file** | 📝 | Window title + file path from AXDocument (when available) | Scrivener, Soulver, VS Code |
| **Title only** | 💬 | Window title with no URL — still useful for reference | Calendar, Notes, Kindle |

---

## Bundle ID Aliases

These aliases map variant bundle IDs to canonical ones. You don't need to register handlers for these — the alias system resolves them automatically before the handler lookup.

| Variant | Canonical | Reason |
|---------|-----------|--------|
| `com.hogbaysoftware.Bike-setapp` | `com.hogbaysoftware.Bike` | Setapp |
| `com.soulmen.ulysses-setapp` | `com.ulyssesapp.mac` | Setapp |
| `com.houdah.HoudahSpot-setapp` | `com.houdah.HoudahSpot4` | Setapp |
| `com.apptorium.SideNotes-setapp` | `com.apptorium.SideNotes` | Setapp |
| `com.omnigroup.OmniFocus3` | `com.omnigroup.OmniFocus4` | Version upgrade |
| `com.omnigroup.OmniFocus3.MacAppStore` | `com.omnigroup.OmniFocus4` | MAS + version |
| `com.omnigroup.OmniPlan3` | `com.omnigroup.OmniPlan4` | Version upgrade |
| `com.reederapp.5.macOS` | `com.reederapp.macOS` | Version upgrade |
| `com.sonnysoftware.bookends2` | `com.sonnysoftware.bookends` | Version upgrade |
| `com.panic.transmit.mas` | `com.panic.Transmit` | MAS variant |

---

## Stats

- **Total registered handlers:** 58 (including 2 for Notion's dual bundle IDs)
- **Unique apps:** 57
- **Strategies used:** browser (8), applescript (38), accessibility (11), menu-command (1), shell (0)
- **Apps with deep links:** ~12 (OmniFocus, Bear, Drafts, Things, Mail, Contacts, DEVONthink, Obsidian, Spotify, plus browsers)
- **Apps with file paths:** ~10 (Finder, TextEdit, Preview, Bike, Nova, OmniOutliner, Path Finder, Skim, plus several via AXDocument)
- **Title-only apps:** ~20 (Calendar, Notes, Fantastical, Ulysses, and most Tier 3 apps)
- **Bundle ID aliases:** 10

---

*This reference is generated from `src/handlers.ts`, `src/aliases.ts`, and `src/scripts/index.ts`. If you add a new handler, please update this document.*
