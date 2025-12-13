# Claude Tools - Raycast Extension

A Raycast extension for Claude power users. Track your usage limits, see pacing indicators, and get daily summaries of your Claude Code productivity.

## Commands

### 1. Show Claude Usage
Visual dashboard showing your Claude subscription usage with pacing indicators.

- **Current Session**: Usage % with time remaining
- **Weekly All Models**: Usage across all Claude models
- **Weekly Sonnet Only**: Sonnet-specific usage
- **Pacing Indicators**: Shows if you're ahead/behind schedule (e.g., "20% ahead")
- **Timeline visualization**: See usage vs. time elapsed at a glance

### 2. Claude Usage Menu Bar
Displays current session usage percentage in your macOS menu bar (auto-refreshes every 10 minutes).

### 3. Claude Code Daily Summary
Comprehensive productivity tracker that scans your Claude Code sessions.

**Features:**
- **Time Ranges**: Today, Yesterday, Past 7 Days, Past 30 Days
- **Stats**: Prompts, projects, files created/modified, lines written
- **Activity Heatmap**: GitHub-style visualization of your coding activity
- **Peak Hours Chart**: See when you're most productive
- **Tool Usage Breakdown**: Visual bars showing which tools you use most
- **Git Status Indicators**: Shows version control status for each project
  - `⑃` - Git repository (local only)
  - `⑃☁️` - Published to GitHub
- **Copy for Standup**: One-click copy a markdown summary for team standups

**Keyboard Shortcuts:**
- `⌘R` - Refresh
- `⌘C` - Copy summary for standup
- `Tab` - Access time range options

### 4. Claude Code Weekly Summary
Opens directly to the past 7 days view with all the same features as Daily Summary.

### 5. Claude Code Monthly Summary
Opens directly to the past 30 days view with all the same features as Daily Summary.

---

## Quick Start

```bash
# 1. Clone or download this extension
git clone <your-repo-url> ~/code/claude-tools
cd ~/code/claude-tools

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run dev

# 4. Open Raycast and search for any command:
#    - "Show Claude Usage"
#    - "Claude Usage Menu Bar"
#    - "Claude Code Daily Summary"
#    - "Claude Code Weekly Summary"
#    - "Claude Code Monthly Summary"
```

---

## Setup on Multiple Computers

### Prerequisites (Required on EACH computer)

1. **Node.js** installed (v18+)

2. **Safari JavaScript from Apple Events** enabled:
   - Open Safari
   - Go to **Safari > Settings > Advanced**
   - Check **"Show features for web developers"**
   - Then go to **Develop menu > Allow JavaScript from Apple Events**

3. **Logged into claude.ai** in Safari

### Option A: Git Repository (Recommended)

**First time setup (on your main computer):**
```bash
cd /path/to/custom-cc-usage-tool
git init
git add .
git commit -m "Initial commit: Claude Tools Raycast extension"
git remote add origin https://github.com/YOUR_USERNAME/claude-tools.git
git push -u origin main
```

**On each additional computer:**
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/claude-tools.git ~/code/claude-tools
cd ~/code/claude-tools

# Install and run
npm install
npm run dev
```

**To update on any computer:**
```bash
cd ~/code/claude-tools
git pull
npm install  # if dependencies changed
npm run dev
```

### Option B: iCloud Sync

**Move to iCloud:**
```bash
mv /path/to/custom-cc-usage-tool ~/Library/Mobile\ Documents/com~apple~CloudDocs/claude-tools
```

**On each computer:**
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/claude-tools
npm install
npm run dev
```

> Note: You'll need to run `npm run dev` on each computer after syncing.

### Option C: Manual Copy

Simply copy the entire folder to each computer via AirDrop, USB drive, or any file transfer method, then:

```bash
cd /path/to/claude-tools
npm install
npm run dev
```

---

## Important Notes

- **Safari is required** for the usage tracking commands (it reads from claude.ai)
- **Each computer fetches its own data** - usage comes from your local Safari session
- **Keep `npm run dev` running** or the extension won't appear in Raycast
- **Daily Summary reads local Claude Code data** from `~/.claude/projects/`

---

## Troubleshooting

### Extension not appearing in Raycast
```bash
# Make sure dev server is running
npm run dev

# Restart Raycast if needed
killall Raycast && open -a Raycast
```

### Usage data not loading
1. Open Safari and go to https://claude.ai/settings/usage
2. Make sure you're logged in
3. Enable **Develop > Allow JavaScript from Apple Events**
4. Try `⌘R` to refresh in the extension

### Daily Summary shows no activity
- Claude Code stores sessions in `~/.claude/projects/`
- Make sure you've used Claude Code (the CLI) on this machine
- Try selecting "Past 7 Days" to see older activity

---

## Project Structure

```
claude-tools/
├── package.json            # Extension config & commands
├── tsconfig.json           # TypeScript config
├── CHANGELOG.md            # Version history
├── src/
│   ├── show-usage.tsx      # Usage dashboard with pacing
│   ├── menu-bar.tsx        # Menu bar command
│   ├── daily-summary.tsx   # Daily productivity summary
│   ├── weekly-summary.tsx  # Weekly productivity summary
│   ├── monthly-summary.tsx # Monthly productivity summary
│   └── utils/
│       ├── applescript.ts  # Safari automation
│       └── git.ts          # Git/GitHub status detection
├── assets/                 # Icons
└── dist/                   # Built extension
```

---

## License

MIT
