---
date: "2026-03-20"
started_at: "22:58"
logged_at: "13:14"
duration: "estimated 4h (split across API outage)"
session_id: "0fee56fa-5fb0-4bfe-942d-c890df357501"
machine: "mxb"
commits:
  - "32ea09d — Add contextual-cheatsheet and loutools Raycast extensions"
tags: [omnifocus, agents, triage, copy-link-research]
---

# Session: OmniFocus Brain Dump Triage + Copy Link Research

## Summary

Lou had been aggressively brain-dumping into OmniFocus for days and felt overwhelmed. Deployed 6 parallel research agents to triage ~90 recent OmniFocus items, answer questions, and do preliminary research. One agent produced a 682-line technical doc on per-app URL extraction methods for 9 apps -- this directly informed the later Universal Copy Link extension build.

## What was accomplished

### Agent Triage of OmniFocus Items
Pulled all ~90 OmniFocus items from the last 3 days via JXA, launched 6 parallel agents:

1. **PAI/Claude Code Questions Agent** -- answered 12 questions by reading PAI source files
2. **Memory System Deep Dive** -- resolved 7 questions about Claude memory behavior
3. **Wispr Flow Research** -- found Wispr Flow has no API/SDK (recommended Raycast extension approach)
4. **Agentic Knowledge Base** -- compared Obsidian vs Logseq for agent-managed KBs (winner: Obsidian in git)
5. **Copy Link Everywhere** -- documented per-app URL extraction for 9 apps (OmniFocus, Finder, Obsidian, VS Code, Bear, Notion, Roam, Terminal). This 682-line doc became the blueprint for Universal Copy Link.
6. **OmniFocus Extension Review** -- code reviewed the omnifocus extension, scoped 4 improvements

Produced an HTML triage report at `lous-workspace/outputs/omnifocus-triage-report.html`.

### Also committed on this date
The contextual-cheatsheet and loutools Raycast extensions were committed from mx3 (commit 32ea09d), catching up previously untracked work from the 03-21 sync session.

## Key decisions

- **OmniFocus inbox convention established** -- `Inbox for Claude` (folder + project) in OmniFocus for actionable work. Items elsewhere are input/research only.
- **Read-only triage** -- agents only read from OmniFocus, never wrote back. Biggest gap identified for future improvement.

## Files created

- `lous-workspace/outputs/omnifocus-triage-report.html` -- full triage report (print-ready)
- `lous-workspace/outputs/copy-link-research.md` -- per-app Copy Link technical approaches (682 lines)

## What a future agent needs to know

### Copy Link research output informed Universal Copy Link
The 682-line `copy-link-research.md` doc documented how to extract URLs and titles from 9+ macOS apps. This became the foundation for the Universal Copy Link extension built on 03-23. Key finding: most apps either have AppleScript dictionaries for getting document URLs, or you can use Accessibility API (AXTitle + AXDocument) as a universal fallback.

### Working directory warning
This session started in the iCloud parent folder instead of the `agentic-inbox/` subdirectory. Future triage sessions should run from `agentic-inbox/` to get correct project context.

### API crash resilience lesson
The Anthropic API went down mid-session before the HTML report could be generated. Agent output was ephemeral (in `/private/tmp/`). Lesson: produce durable artifacts (HTML, written files) EARLY and incrementally, not as a final step.

### OmniFocus screenshot limitation
Tasks with image attachments showed as `&#xFFFC;` in JSON output. The Omni Automation base64 extraction method exists (`att.contents.toBase64()`) but wasn't used in the triage flow. Would need explicit handling for image-bearing tasks.
