import { List, Icon, Color, showToast, Toast } from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import {
  isBdInstalled,
  readyIssues,
  listIssues,
  blockedIssues,
  getBdVersion,
} from "./lib/bd-client";
import { discoverProjects } from "./lib/project-scanner";
import { DASHBOARD_TIPS, formatHealthStatus } from "./lib/education";
import type { BeadsProject, ProjectIssue } from "./lib/types";
import IssueListItem from "./components/IssueListItem";

type ViewFilter = "ready" | "in_progress" | "blocked" | "closed";

export default function BeadsDashboard() {
  const [filter, setFilter] = useState<ViewFilter>("ready");
  const [projects, setProjects] = useState<BeadsProject[]>([]);
  const [items, setItems] = useState<ProjectIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);

    // Check if bd is installed
    if (!isBdInstalled()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Beads not installed",
        message: "Install with: brew install beads",
      });
      setIsLoading(false);
      return;
    }

    // Discover projects
    const discovered = discoverProjects();
    setProjects(discovered);

    if (discovered.length === 0) {
      setIsLoading(false);
      return;
    }

    // Load issues from all healthy projects based on filter
    const allItems: ProjectIssue[] = [];

    for (const project of discovered) {
      if (!project.healthy) continue;

      try {
        let issues;
        switch (filter) {
          case "ready":
            issues = readyIssues(project.path);
            break;
          case "in_progress":
            issues = listIssues(project.path, { status: "in_progress" });
            break;
          case "blocked":
            issues = blockedIssues(project.path);
            break;
          case "closed":
            issues = listIssues(project.path, { status: "closed" });
            break;
        }

        if (Array.isArray(issues)) {
          for (const issue of issues) {
            allItems.push({ issue, project });
          }
        }
      } catch {
        // Skip projects with errors — they'll show in the unhealthy section
      }
    }

    // Sort: highest priority first, then by updated date
    allItems.sort((a, b) => {
      if (b.issue.priority !== a.issue.priority)
        return b.issue.priority - a.issue.priority;
      return (
        new Date(b.issue.updated_at).getTime() -
        new Date(a.issue.updated_at).getTime()
      );
    });

    setItems(allItems);
    setIsLoading(false);
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter by search text
  const filteredItems = searchText
    ? items.filter(
        (item) =>
          item.issue.title.toLowerCase().includes(searchText.toLowerCase()) ||
          item.issue.id.toLowerCase().includes(searchText.toLowerCase()) ||
          item.project.name.toLowerCase().includes(searchText.toLowerCase()),
      )
    : items;

  const unhealthyProjects = projects.filter((p) => !p.healthy);
  const healthyCount = projects.filter((p) => p.healthy).length;

  // Empty state with educational content
  if (!isLoading && projects.length === 0) {
    return (
      <List.EmptyView
        icon={Icon.Tray}
        title="No beads-enabled projects found"
        description="Run `bd init` in a project to get started. Check that your scan directory is set correctly in preferences."
      />
    );
  }

  const filterLabels: Record<ViewFilter, string> = {
    ready: "Ready Work",
    in_progress: "In Progress",
    blocked: "Blocked",
    closed: "Recently Closed",
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Filter issues by title, ID, or project..."
      onSearchTextChange={setSearchText}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter by status"
          value={filter}
          onChange={(value) => setFilter(value as ViewFilter)}
        >
          <List.Dropdown.Item
            title="Ready Work"
            value="ready"
            icon={Icon.Play}
          />
          <List.Dropdown.Item
            title="In Progress"
            value="in_progress"
            icon={Icon.Clock}
          />
          <List.Dropdown.Item
            title="Blocked"
            value="blocked"
            icon={Icon.XMarkCircle}
          />
          <List.Dropdown.Item
            title="Recently Closed"
            value="closed"
            icon={Icon.CheckCircle}
          />
        </List.Dropdown>
      }
    >
      {/* Status bar section */}
      <List.Section
        title={`${filterLabels[filter]} — ${filteredItems.length} issues across ${healthyCount} projects`}
        subtitle={`bd ${getBdVersion()}`}
      >
        {filteredItems.map((item) => (
          <IssueListItem
            key={`${item.project.name}:${item.issue.id}`}
            item={item}
            onRefresh={loadData}
          />
        ))}
      </List.Section>

      {/* Show unhealthy projects */}
      {unhealthyProjects.length > 0 && (
        <List.Section
          title="Unhealthy Projects"
          subtitle="These projects have beads issues"
        >
          {unhealthyProjects.map((p) => (
            <List.Item
              key={p.path}
              title={p.name}
              subtitle={p.path}
              icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
              accessories={[{ text: formatHealthStatus(p.healthy, p.error) }]}
            />
          ))}
        </List.Section>
      )}

      {/* Empty state per filter */}
      {!isLoading && filteredItems.length === 0 && projects.length > 0 && (
        <List.EmptyView
          icon={filter === "ready" ? Icon.CheckCircle : Icon.Tray}
          title={
            filter === "ready"
              ? "All clear!"
              : `No ${filterLabels[filter].toLowerCase()} issues`
          }
          description={DASHBOARD_TIPS[filter]}
        />
      )}
    </List>
  );
}
