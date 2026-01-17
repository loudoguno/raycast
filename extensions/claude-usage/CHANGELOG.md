# Changelog

All notable changes to the Claude Usage extension will be documented in this file.

## [Unreleased]

### Added
- **Weekly Summary Command** - New dedicated command that opens directly to the past 7 days view
- **Monthly Summary Command** - New dedicated command that opens directly to the past 30 days view
- **Git Repository Detection** - Projects now display version control status:
  - `⑃` indicates the directory is a git repository (local only)
  - `⑃☁️` indicates the directory has been published to GitHub
- **Quiet Mode for Menu Bar** - Background refreshes no longer open Safari windows unexpectedly

### Changed
- Menu bar command now uses "quiet mode" by default - only reads from existing Safari tabs
- Manual refresh (Cmd+R) in menu bar uses "interactive mode" which will open Safari if needed
- Refactored summary component to support different initial time ranges

### Fixed
- Safari windows no longer pop up every 10 minutes from background menu bar refreshes

## [1.0.0] - 2024-12-11

### Added
- **Show Claude Usage** - Visual dashboard with pacing indicators
  - Current session usage with time remaining
  - Weekly usage for all models and Sonnet-only
  - Timeline visualization showing usage vs. time elapsed
  - Pacing status (ahead/behind schedule)
- **Claude Usage Menu Bar** - Persistent menu bar display
  - Shows current session percentage
  - Auto-refreshes every 10 minutes
  - Quick access to full view and usage page
- **Claude Code Daily Summary** - Productivity tracker
  - Scans local Claude Code sessions from `~/.claude/projects/`
  - Time range selection: Today, Yesterday, Past 7 Days, Past 30 Days
  - Activity heatmap visualization
  - Peak hours chart
  - Tool usage breakdown
  - Copy for standup feature

### Technical
- Safari automation via AppleScript for usage data
- Local JSONL parsing for Claude Code session history
- React-based Raycast UI components
