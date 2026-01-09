# Raycast Extension Suggestions for Lou

Based on your tools, workflow, and interests, here's a comprehensive analysis of extensions you should use, fork, and improve.

---

## Your Profile Summary

**Core Tools**: Claude Code, Ghostty, Raycast, Git/GitHub, Chezmoi, Karabiner/Goku
**Knowledge Management**: Roam Research, Obsidian, Linear
**Development**: TypeScript, React, Swift, Node.js, AppleScript
**Style**: Planning-first, documentation-heavy, no-IDE workflow, automation enthusiast
**Projects**: kbexp, cctimeline, claude-usage, balloons-fancy

---

## TIER 1: Must-Have Extensions (Fork All)

These are extensions you definitely use or should use. Fork them all with submit-feedback for iterative improvement.

### 1. GitHub
**Store**: https://www.raycast.com/raycast/github
**Why Fork**:
- Your workflow is heavily Git-based
- Quick PR reviews, issue creation, repo search

**Improvement Ideas**:
- [ ] Quick clone to specific directory (`~/code/` by default)
- [ ] "Open in Claude Code" action for repos
- [ ] PR template based on repo conventions
- [ ] Show CI status prominently in list view
- [ ] Quick "Create branch from issue" action
- [ ] Integrate with Linear (link issues to PRs)
- [ ] Keyboard shortcut to copy repo clone URL

---

### 2. Linear *(already planned)*
**Store**: https://www.raycast.com/linear/linear
**Status**: Template ready in `forked/linear-custom/`

**Additional Ideas from your workflow**:
- [ ] Link Linear issues to GitHub PRs
- [ ] Quick capture from clipboard (paste error → create bug)
- [ ] "What I worked on today" summary command
- [ ] Integration with your cctimeline project

---

### 3. Obsidian *(already planned)*
**Store**: https://www.raycast.com/marcjulian/obsidian
**Status**: Template ready in `forked/obsidian-custom/`

**Additional Ideas**:
- [ ] Quick append to daily note with timestamp
- [ ] Search across ALL vaults simultaneously
- [ ] "Open in Obsidian" + "Open in Claude Code" actions
- [ ] Template: Meeting notes with date prefix
- [ ] Backlinks preview in search results

---

### 4. Roam Research *(already planned - your flagship)*
**Store**: https://www.raycast.com/roamresearch/roam-research
**Status**: Template ready in `forked/roam-custom/` with full RAG architecture

**This is your most ambitious fork** - semantic search, graph traversal, AI Q&A

---

### 5. Brew (Homebrew)
**Store**: https://www.raycast.com/nhojb/brew
**Why Fork**:
- You use Chezmoi + Homebrew for system setup
- Package management is core to your workflow

**Improvement Ideas**:
- [ ] "Dump to Brewfile" command (for Chezmoi sync)
- [ ] Show which packages are outdated prominently
- [ ] Quick upgrade all with confirmation
- [ ] Integration with Chezmoi (mark as managed)
- [ ] Cask search with screenshots
- [ ] "Recently installed" list
- [ ] Dependency tree visualization

---

### 6. 1Password
**Store**: https://www.raycast.com/khasbilegt/1password
**Why Fork**:
- Security is important for API tokens (Roam, GitHub, OpenAI)
- Quick access to credentials when setting up projects

**Improvement Ideas**:
- [ ] Quick copy specific field (not just password)
- [ ] "Copy as environment variable" format
- [ ] Recently used items pinned
- [ ] Vault-specific search
- [ ] Generate password with custom rules
- [ ] SSH key management integration

---

### 7. Clipboard History (Built-in, but...)
**Why Fork/Extend**:
- You copy lots of code snippets, block refs, links

**Improvement Ideas** (via custom extension):
- [ ] Smart paste: detect Roam block ref, offer to resolve
- [ ] Code snippet detection + syntax highlighting
- [ ] "Save to Obsidian" action for clipboard items
- [ ] Clipboard → Linear issue (paste error trace)
- [ ] Filter by content type (URLs, code, text)

---

### 8. Spotify (if you use it)
**Store**: https://www.raycast.com/mattisssa/spotify-player
**Why Fork**:
- Background music while coding
- Quick controls without context switch

**Improvement Ideas**:
- [ ] "Focus playlist" quick start
- [ ] Pomodoro integration (pause on break)
- [ ] Now playing in menu bar (minimal)
- [ ] Quick add to "Coding" playlist

---

## TIER 2: Productivity Boosters (High Value)

### 9. Apple Reminders
**Store**: https://www.raycast.com/raycast/apple-reminders
**Why Fork**:
- Quick task capture that syncs everywhere
- Natural language input

**Improvement Ideas**:
- [ ] "Remind me about this Linear issue"
- [ ] Quick capture from selected text
- [ ] Recurring reminder templates
- [ ] Location-based reminders for common places
- [ ] Integration with Calendar for time blocking

---

### 10. Calendar
**Built-in, but fork for**:
- Meeting joining from Raycast
- Schedule visualization

**Improvement Ideas**:
- [ ] "What's my next meeting?" always accessible
- [ ] Quick "Block focus time" command
- [ ] Show travel time between meetings
- [ ] Auto-generate meeting notes template in Obsidian
- [ ] Calendar + Pomodoro integration

---

### 11. Timers / Pomodoro
**Store**: https://www.raycast.com/asubbotin/pomodoro
**Why Fork**:
- You track sessions with cctimeline
- Focus time is important for deep work

**Improvement Ideas**:
- [ ] Integration with cctimeline (log focus sessions)
- [ ] Auto-enable Do Not Disturb
- [ ] Custom intervals (not just 25/5)
- [ ] Session notes: "What did I accomplish?"
- [ ] Daily/weekly focus time stats
- [ ] Integration with Linear (mark issue as "in focus")

---

### 12. Window Management (Built-in)
**Why Extend**:
- You use Slate, but Raycast has native window management

**Improvement Ideas**:
- [ ] Workspace presets: "Coding" (Ghostty + Browser)
- [ ] Quick switch between layouts
- [ ] Per-app default positions
- [ ] Multi-monitor support improvements

---

## TIER 3: Developer Workflow

### 13. npm/Node Version Manager
**Store**: https://www.raycast.com/andresmorelos/node-version-manager
**Why Fork**:
- You work with Node.js projects constantly

**Improvement Ideas**:
- [ ] Auto-switch based on `.nvmrc` in current project
- [ ] Show Node version in menu bar
- [ ] Quick "npm run" for current project
- [ ] Package.json script runner
- [ ] Dependency vulnerability check

---

### 14. Docker (if you use it)
**Store**: https://www.raycast.com/priithaamer/docker
**Why Fork**:
- Container management for dev environments

**Improvement Ideas**:
- [ ] Quick start/stop dev containers
- [ ] Log viewer with search
- [ ] Resource usage monitor
- [ ] docker-compose project management

---

### 15. VSCode/Cursor (if you use them)
**Store**: https://www.raycast.com/thomas/visual-studio-code
**Why Fork**:
- Even if you prefer Claude Code, sometimes you need an IDE

**Improvement Ideas**:
- [ ] "Open in Claude Code" as alternative action
- [ ] Recent projects with Git status
- [ ] Workspace presets

---

### 16. Tailwind CSS / DevDocs
**Store**: https://www.raycast.com/vimtor/tailwindcss
**Why Fork**:
- Quick reference while coding

**Improvement Ideas**:
- [ ] Offline documentation cache
- [ ] Copy as className vs copy as CSS
- [ ] Color palette quick picker
- [ ] Custom snippets library

---

## TIER 4: AI & Automation

### 17. ChatGPT / Claude Extension
**Stores**:
- https://www.raycast.com/abielzulio/chatgpt
- https://www.raycast.com/florisdobber/claude

**Why Fork**:
- You already use Claude heavily
- Quick questions without opening browser

**Improvement Ideas**:
- [ ] System prompts for common tasks
- [ ] "Ask about selected text"
- [ ] Integration with your claude-usage tracking
- [ ] Context from current project (read package.json, README)
- [ ] Quick "explain this error" from clipboard
- [ ] Conversation history search

---

### 18. PromptLab
**Store**: https://www.raycast.com/HelloImSteven/promptlab
**Why Fork**:
- Create custom AI commands with context

**Improvement Ideas**:
- [ ] Prompts that read from Roam/Obsidian
- [ ] Code review prompt with project context
- [ ] Commit message generator
- [ ] Documentation writer

---

### 19. OpenAI Translator
**Store**: https://www.raycast.com/douo/openai-translator
**Why Fork**:
- Quick translation + explanation

**Improvement Ideas**:
- [ ] Technical term explanation mode
- [ ] Save translations to Obsidian
- [ ] Code comment translation

---

## TIER 5: System Utilities

### 20. System Monitor
**Store**: https://www.raycast.com/royanger/system-monitor
**Why Fork**:
- Keep eye on resources during heavy tasks

**Improvement Ideas**:
- [ ] Alert when CPU/Memory high
- [ ] Kill process by name quickly
- [ ] Menu bar mini-monitor

---

### 21. Kill Process
**Store**: https://www.raycast.com/rolandleth/kill-process
**Why Fork**:
- Quick kill hung processes

**Improvement Ideas**:
- [ ] Recent kills for quick re-kill
- [ ] Force kill option prominent
- [ ] Process tree view

---

### 22. Caffeinate
**Store**: https://www.raycast.com/mooxl/caffeinate
**Why Fork**:
- Prevent sleep during long tasks

**Improvement Ideas**:
- [ ] Auto-caffeinate during Pomodoro sessions
- [ ] Menu bar indicator
- [ ] Timer-based caffeinate

---

## TIER 6: Lou-Specific Custom Extensions

These don't exist yet but would be valuable for YOUR workflow:

### 23. **Keybindings Explorer** (kbexp integration)
- Search your Karabiner/Goku bindings from Raycast
- Show conflicts
- Quick edit binding

### 24. **Chezmoi Manager**
- Apply changes
- Diff current vs managed
- Add file to management
- Re-apply from source

### 25. **Claude Code Sessions** (cctimeline integration)
- View recent sessions
- Session stats
- Quick resume session
- Daily/weekly activity

### 26. **Ghostty Manager**
- Quick SSH connections
- Theme switcher
- Split/tab management
- Session restore

### 27. **Project Launcher**
- List all projects in ~/code/
- Show Git status
- "Open in Claude Code" action
- "Open in Ghostty" action
- Recent projects

---

## The Master Plan: Self-Developing Extension Ecosystem

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR RAYCAST ECOSYSTEM                        │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   GitHub     │ │   Linear     │ │   Obsidian   │            │
│  │   (forked)   │ │   (forked)   │ │   (forked)   │            │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘            │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                          ▼                                      │
│              ┌─────────────────────┐                           │
│              │  Submit Feedback    │──────┐                    │
│              │  (in every fork)    │      │                    │
│              └─────────────────────┘      │                    │
│                                           ▼                    │
│                               ┌─────────────────────┐          │
│                               │   GitHub Issues     │          │
│                               │   (your repo)       │          │
│                               └──────────┬──────────┘          │
│                                          │                     │
│                                          ▼                     │
│                               ┌─────────────────────┐          │
│                               │   Claude Code       │          │
│                               │   (implements)      │          │
│                               └──────────┬──────────┘          │
│                                          │                     │
│                                          ▼                     │
│                               ┌─────────────────────┐          │
│                               │   PR → Merge →      │          │
│                               │   npm run dev       │          │
│                               └─────────────────────┘          │
│                                          │                     │
│                                          ▼                     │
│                               ┌─────────────────────┐          │
│                               │   You enjoy the     │          │
│                               │   improvement!      │──────────┘
│                               └─────────────────────┘   (iterate)
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Priority

**Phase 1: Core Productivity** (Week 1-2)
1. GitHub
2. Linear (already templated)
3. Brew
4. Clipboard enhancements

**Phase 2: Knowledge & AI** (Week 2-3)
5. Obsidian (already templated)
6. Claude/ChatGPT
7. PromptLab

**Phase 3: Roam Agent** (Week 3-5)
8. Roam Research with full RAG (already architected)

**Phase 4: System & Dev Tools** (Week 5-6)
9. 1Password
10. Timers/Pomodoro + cctimeline integration
11. npm/Node Version Manager
12. System Monitor

**Phase 5: Custom Extensions** (Ongoing)
13. Keybindings Explorer (kbexp)
14. Chezmoi Manager
15. Claude Code Sessions (cctimeline)
16. Project Launcher

---

## Estimated Scope

| Category | Extensions | Est. Time |
|----------|-----------|-----------|
| Must-Have Forks | 8 | 4-6 hours setup |
| Productivity | 4 | 2-3 hours setup |
| Developer | 4 | 2-3 hours setup |
| AI | 3 | 2-3 hours setup |
| System | 3 | 1-2 hours setup |
| Custom | 5 | 10-15 hours build |

**Total**: ~25-30 extensions in your ecosystem
**Setup time**: ~1 weekend for basic forks
**Ongoing**: Iterative improvement via submit-feedback

---

## Next Steps

1. **Run the fork script** for each Tier 1 extension
2. **Add submit-feedback** to all forks
3. **Use the extensions** - improvements will come naturally
4. **Submit feedback** when you notice something
5. **Claude Code implements** → you enjoy the improvement

This is genuinely self-developing software!
