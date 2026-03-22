import {
  MenuBarExtra,
  Icon,
  open,
  LaunchType,
  launchCommand,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { isBdInstalled, readyIssues, statusSummary } from "./lib/bd-client";
import { discoverProjectPaths } from "./lib/project-scanner";

/**
 * Menu bar indicator showing beads status at a glance.
 *
 * 📿 This gives you a persistent count of ready work across all projects,
 * right in your menu bar. Click to see per-project breakdown and jump
 * to any project or the full dashboard.
 *
 * Auto-refreshes every 10 minutes (configurable in package.json interval).
 */
export default function BeadsMenuBar() {
  const [totalReady, setTotalReady] = useState(0);
  const [projectStats, setProjectStats] = useState<
    { name: string; path: string; ready: number; total: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isBdInstalled()) {
      setIsLoading(false);
      return;
    }

    const projects = discoverProjectPaths();
    const stats: {
      name: string;
      path: string;
      ready: number;
      total: number;
    }[] = [];
    let total = 0;

    for (const project of projects) {
      try {
        const ready = readyIssues(project.path);
        const readyCount = Array.isArray(ready) ? ready.length : 0;

        let totalCount = readyCount;
        try {
          const status = statusSummary(project.path);
          totalCount = status.summary.total_issues;
        } catch {
          // Use ready count as fallback
        }

        stats.push({
          name: project.name,
          path: project.path,
          ready: readyCount,
          total: totalCount,
        });
        total += readyCount;
      } catch {
        // Skip unhealthy projects
      }
    }

    setProjectStats(stats);
    setTotalReady(total);
    setIsLoading(false);
  }, []);

  const icon = totalReady > 0 ? "📿" : "✅";
  const title = totalReady > 0 ? `${totalReady}` : "";

  return (
    <MenuBarExtra
      icon={icon}
      title={title}
      tooltip={`${totalReady} ready beads across ${projectStats.length} projects`}
      isLoading={isLoading}
    >
      <MenuBarExtra.Section title="Ready Work by Project">
        {projectStats.map((p) => (
          <MenuBarExtra.Item
            key={p.path}
            title={p.name}
            subtitle={`${p.ready} ready / ${p.total} total`}
            icon={p.ready > 0 ? Icon.Circle : Icon.CheckCircle}
            onAction={() => open(p.path, "Cursor")}
          />
        ))}
        {projectStats.length === 0 && (
          <MenuBarExtra.Item title="No beads projects found" />
        )}
      </MenuBarExtra.Section>

      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Open Dashboard"
          icon={Icon.AppWindowList}
          shortcut={{ modifiers: ["cmd"], key: "d" }}
          onAction={() =>
            launchCommand({
              name: "beads-dashboard",
              type: LaunchType.UserInitiated,
            })
          }
        />
        <MenuBarExtra.Item
          title="Create Bead"
          icon={Icon.Plus}
          shortcut={{ modifiers: ["cmd"], key: "n" }}
          onAction={() =>
            launchCommand({
              name: "beads-create",
              type: LaunchType.UserInitiated,
            })
          }
        />
        <MenuBarExtra.Item
          title="What's Next?"
          icon={Icon.ArrowRight}
          onAction={() =>
            launchCommand({
              name: "beads-whats-next",
              type: LaunchType.UserInitiated,
            })
          }
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
