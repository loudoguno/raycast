/**
 * Educational content about Beads, embedded throughout the extension.
 *
 * Beads (https://github.com/steveyegge/beads) is an issue tracker designed
 * specifically for AI coding agents. Created by Steve Yegge in Oct 2025,
 * it replaces the "Great Pacific Garbage Patch of Markdown files" that
 * agents create when using TodoWrite and markdown-based planning.
 *
 * Key insight: Agents have ~10-minute lifetimes. They need structured,
 * queryable memory — not flat text files. Beads gives them that via
 * git-backed JSONL + a fast database cache.
 */

/** Contextual tips shown in the dashboard based on what the user is viewing */
export const DASHBOARD_TIPS: Record<string, string> = {
  ready: `📿 **Ready Work** shows issues with no blockers — these are your "What's next?" items.\n\nBeads tracks dependency chains so agents always know what's unblocked. When you start a session, just ask your agent: "What's next?"`,

  in_progress: `📿 **In Progress** issues have been claimed by someone (human or agent).\n\nUse \`bd update <id> --claim\` to claim work. This prevents agents on different machines from duplicating effort — the \`--assignee\` filter makes coordination trivial.`,

  blocked: `📿 **Blocked** issues are waiting on other issues to be completed first.\n\nBeads supports four dependency types:\n- **blocks/blocked-by** — hard prerequisite\n- **parent/child** — epic decomposition\n- **discovered-from** — work found while doing other work\n- **relates-to** — soft relationship`,

  closed: `📿 **Recently Closed** issues are your dopamine feed.\n\nPro tip from Steve Yegge: periodically delete old closed issues to keep your beads database "sprightly and tractable." They'll stay in Git history forever.`,
};

/** Tips shown when viewing a single issue's detail */
export const ISSUE_DETAIL_TIPS: Record<string, string> = {
  priority: `**Priority levels:** 4=Critical, 3=High, 2=Medium, 1=Low, 0=Backlog.\n\nFine-grained tasks at higher priority = cheaper sessions. Each agent does one small task near the top of its context window, making better decisions overall.`,

  types: `**Issue types:** task (general), bug (defect), feature (new capability), chore (maintenance), epic (container for children), decision (ADR).\n\nEpics are powerful — break big work into child issues and let agents pick them off one by one. This is how Beads solves the "Descent Into Madness" where agents create nested markdown plans.`,

  dependencies: `**Dependency tracking** is what makes Beads special vs markdown TODO lists.\n\nAgents can query \`bd ready\` to get only unblocked work — no more parsing prose like "TODO: fix auth (blocked on bd-3)". Structured data > text interpretation.`,

  discovery: `**Work discovery** is a game-changer. When agents notice problems while working, they file new beads instead of ignoring them.\n\nWith markdown, agents under context pressure would say "Those test failures aren't mine" and move on. With Beads, they say "I filed issue #397 for those broken tests" and keep working.`,
};

/** Short tips for the empty state / first-run experience */
export const GETTING_STARTED = `# Welcome to Beads 📿

**Beads** is an issue tracker built for AI coding agents. It replaces markdown TODO files with structured, queryable, git-backed issues that survive between agent sessions.

## Quick Setup

1. Install: \`brew install beads\`
2. In any project: \`bd init\`
3. Tell your agent: add \`bd quickstart\` to your AGENTS.md or CLAUDE.md
4. Start every session with: **"What's next?"**

## Core Commands

| Command | What it does |
|---------|-------------|
| \`bd ready\` | Show unblocked work |
| \`bd create "title"\` | File a new issue |
| \`bd update <id> --claim\` | Claim work |
| \`bd close <id>\` | Complete an issue |
| \`bd status\` | Project overview |
| \`bd search "query"\` | Find issues |
| \`bd blocked\` | See what's stuck |
| \`bd doctor\` | Health check |

## Why Not Markdown?

Agents with 10-minute lifetimes create hundreds of markdown plans that contradict each other. Beads gives them structured memory with dependency tracking, so they always know where they left off and what to do next.

*Learn more: [github.com/steveyegge/beads](https://github.com/steveyegge/beads)*
`;

/** Tips for the create form */
export const CREATE_TIPS = {
  title:
    "Keep titles short and actionable — agents will read these to decide what to work on",
  type: "Use 'epic' for big work that will have child issues. Use 'decision' for architecture decision records (ADRs)",
  priority:
    "Higher priority = picked first by `bd ready`. Critical (4) items surface above everything else",
  description:
    "Markdown supported. Include acceptance criteria so agents know when they're done",
  parent:
    "Nest under an epic to create a hierarchy. Agents can then work through child issues systematically",
  labels:
    "Comma-separated. Labels help filter views — e.g., 'health,health:smell' for code health findings",
};

/** Format a project health status into a human-readable message */
export function formatHealthStatus(healthy: boolean, error?: string): string {
  if (healthy) return "Healthy — database connected and responsive";

  if (error?.includes("not found")) {
    return "Database not found — Dolt server may need restarting. Try `bd doctor --fix` in this project.";
  }
  if (error?.includes("server")) {
    return "Cannot connect to Dolt server. The beads database server may not be running for this project.";
  }
  return error || "Unknown issue — try running `bd doctor` in this project";
}

/** Generate the "Landing the Plane" checklist for a project */
export function landingChecklist(projectName: string): string {
  return `# Landing the Plane — ${projectName}

Session hygiene checklist (from Steve Yegge's best practices):

- [ ] Run \`bd status\` — check open/blocked/ready counts
- [ ] Close any completed issues: \`bd close <id>\`
- [ ] File new issues for discovered work
- [ ] Run \`bd sync\` to push changes to git
- [ ] Check \`git status\` for uncommitted code changes
- [ ] Update issue descriptions with context for the next session
- [ ] Run \`bd ready\` — what should the next agent pick up?

*"Landing the Plane" prevents agents from stuffing everything out of sight when they're low on context. It ensures clean handoffs between sessions.*
`;
}
