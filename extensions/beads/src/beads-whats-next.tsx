import { Clipboard, showHUD, showToast, Toast } from "@raycast/api";
import { isBdInstalled, readyIssues } from "./lib/bd-client";
import { discoverProjectPaths } from "./lib/project-scanner";

/**
 * "What's Next?" — the fastest possible beads command.
 *
 * 📿 This embodies the core Beads philosophy:
 * Instead of explaining to your agent what to work on,
 * or reading through markdown plans, just ask: "What's next?"
 *
 * This command scans all beads-enabled projects, finds the single
 * highest-priority ready (unblocked) issue, shows it as a HUD
 * notification, and copies the issue ID to your clipboard.
 *
 * One keystroke. Instant answer. Zero friction.
 */
export default async function WhatsNext() {
  if (!isBdInstalled()) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Beads not installed",
      message: "Install with: brew install beads",
    });
    return;
  }

  const projects = discoverProjectPaths();

  if (projects.length === 0) {
    await showHUD("No beads-enabled projects found");
    return;
  }

  // Find the highest priority ready issue across all projects
  let bestIssue: {
    id: string;
    title: string;
    priority: number;
    project: string;
  } | null = null;

  for (const project of projects) {
    try {
      const ready = readyIssues(project.path);
      if (!Array.isArray(ready)) continue;

      for (const issue of ready) {
        if (!bestIssue || issue.priority > bestIssue.priority) {
          bestIssue = {
            id: issue.id,
            title: issue.title,
            priority: issue.priority,
            project: project.name,
          };
        }
      }
    } catch {
      // Skip projects with errors
    }
  }

  if (!bestIssue) {
    await showHUD("All clear! No ready work across any project.");
    return;
  }

  // Copy issue ID to clipboard and show HUD
  await Clipboard.copy(bestIssue.id);
  await showHUD(
    `Next: [${bestIssue.id}] ${bestIssue.title} (${bestIssue.project})`,
  );
}
