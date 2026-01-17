# Custom Claude Usage Tool - Plan

## Goal
Display Claude subscription usage limits (current session + weekly "All models" usage) in either:
1. **Raycast extension** (preferred for quick access)
2. **macOS menubar app** (always visible)

## The Challenge

Claude.ai has blocked non-browser traffic to their internal API, which means:
- Session cookie extraction alone won't work from scripts
- We need a browser-based approach or a workaround

## Approaches (Ranked by Feasibility)

### Option A: Raycast Extension with Browser Automation (Recommended)
**Pros:** Native Raycast integration, relatively simple
**Cons:** Requires browser to be open, slight delay

**How it works:**
1. Use AppleScript/JXA to interact with Safari/Chrome
2. Navigate to `claude.ai/settings/usage` or hit their internal API endpoint
3. Extract the usage data from the page/response
4. Display in Raycast

**Implementation:**
```
custom-cc-usage-tool/
├── raycast/
│   ├── package.json
│   ├── src/
│   │   └── claude-usage.tsx    # Main Raycast command
│   └── assets/
│       └── icon.png
```

### Option B: SwiftBar/xbar Menubar Script
**Pros:** Always visible in menubar, no app switching
**Cons:** Requires periodic refresh, same auth challenges

**How it works:**
1. Shell script or Swift that runs periodically
2. Uses browser automation to fetch data
3. Displays in menubar via SwiftBar/xbar format

### Option C: Native Swift Menubar App
**Pros:** Most polished, native macOS experience
**Cons:** More complex to build, same auth challenges

---

## Authentication Strategy

Since Claude blocks non-browser requests, we have a few options:

### 1. Browser Cookie + User-Agent Spoofing (May not work)
Extract cookies from browser keychain/storage and mimic browser requests.

### 2. AppleScript Browser Automation (Most reliable)
```applescript
tell application "Safari"
    open location "https://claude.ai/settings/usage"
    delay 2
    set pageSource to source of document 1
end tell
```

### 3. Headless Browser (Puppeteer/Playwright)
Run a headless Chrome instance that maintains a logged-in session.

---

## Recommended Implementation: Raycast + AppleScript

### Phase 1: Proof of Concept
1. Create AppleScript that opens Safari to usage page
2. Extract usage percentages from page content
3. Parse and display results

### Phase 2: Raycast Extension
1. Scaffold Raycast extension with TypeScript
2. Call AppleScript from Node.js
3. Parse HTML/JSON response
4. Display formatted usage info

### Phase 3: Polish
1. Add caching (don't hit the page every time)
2. Add refresh command
3. Show last updated timestamp
4. Handle errors gracefully

---

## Data to Extract

From the screenshot, we need:

| Metric | Display |
|--------|---------|
| Current session | "0% used" with progress bar |
| All models (weekly) | "12% used", resets Mon 3:00 AM |
| Sonnet only (weekly) | "2% used", resets Mon 3:00 AM |

---

## Quick Start Implementation

### Step 1: Test API Endpoint Discovery

First, we need to discover what API endpoint `claude.ai/settings/usage` calls.

Open Safari/Chrome DevTools on `https://claude.ai/settings/usage` and look for:
- XHR/Fetch requests to `/api/...` endpoints
- Look for responses containing usage percentages

Likely endpoints:
- `/api/organizations/{org_id}/usage`
- `/api/account/usage`
- `/api/billing/usage`

### Step 2: Create Simple Shell Script Test

```bash
#!/bin/bash
# test-fetch.sh

# This will use Safari's logged-in session
osascript <<'EOF'
tell application "Safari"
    activate
    open location "https://claude.ai/settings/usage"
    delay 3
    set pageContent to do JavaScript "document.body.innerText" in document 1
    return pageContent
end tell
EOF
```

### Step 3: Build Raycast Extension

```bash
cd raycast
npm init raycast-extension
# Select TypeScript template
```

---

## Alternative: Chrome Extension Approach

If browser automation proves unreliable, we could build a simple Chrome extension that:
1. Runs in the background
2. Periodically fetches usage from claude.ai (using the logged-in session)
3. Exposes data via native messaging to a local script
4. Raycast/menubar reads from that local data

This is what the [Claude Usage Monitor](https://chromewebstore.google.com/detail/claude-usage-monitor/jaadjbgpijajmhponmgggflfgmboknge) extension does.

---

## Next Steps

1. [ ] Manually inspect network requests on claude.ai/settings/usage to find the API endpoint
2. [ ] Test AppleScript browser automation approach
3. [ ] Decide: Raycast extension vs SwiftBar menubar
4. [ ] Scaffold the chosen solution
5. [ ] Implement data fetching
6. [ ] Add caching and error handling

---

## Resources

- [Raycast Extension Development](https://developers.raycast.com/)
- [SwiftBar](https://github.com/swiftbar/SwiftBar)
- [xbar (formerly BitBar)](https://xbarapp.com/)
- [Claude Usage Monitor Chrome Extension](https://chromewebstore.google.com/detail/claude-usage-monitor/jaadjbgpijajmhponmgggflfgmboknge)
- [claude-unofficial-api](https://github.com/Explosion-Scratch/claude-unofficial-api) (Note: Currently broken due to API blocking)
