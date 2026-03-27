---
date: "2026-01-15"
started_at: "18:36"
logged_at: "18:36"
duration: "estimated"
session_id: "reconstructed-from-git"
machine: "mx3"
commits:
  - "eaa7a9c — Add Chrome profile switcher for My Old Kentucky Host"
tags: [scripts, chrome]
---

# Session: Chrome Profile Switcher

> [!info] Reconstructed from git history — no live session notes exist for this date.

## Summary

Added a Raycast script command to switch to a specific Chrome profile ("My Old Kentucky Host") and navigate to Amazon order history. A small, focused utility script.

## What was accomplished

### chrome-profile-my-old-kentucky-host.sh

A 34-line script that opens Chrome with a specific profile via menu navigation and navigates to Amazon order history. Purpose-built for a specific workflow — likely managing orders for a property or business called "My Old Kentucky Host."

## Files created

- `scripts/chrome-profile-my-old-kentucky-host.sh` — Chrome profile switcher (34 lines)
- `scripts/README.md` — updated index

## What a future agent needs to know

- Co-authored with Claude Opus 4.5.
- This script uses Chrome's menu-based profile switching rather than command-line flags, which can be fragile if Chrome's menu structure changes.
- The "My Old Kentucky Host" name suggests an Airbnb or rental property management workflow.
