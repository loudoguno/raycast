import { List, Icon, showToast, Toast } from "@raycast/api";
import { useState, useCallback } from "react";
import { isBdInstalled, searchIssues } from "./lib/bd-client";
import { discoverProjectPaths } from "./lib/project-scanner";
import type { ProjectIssue } from "./lib/types";
import IssueListItem from "./components/IssueListItem";

/**
 * Search across all beads-enabled projects.
 *
 * 📿 Beads search uses `bd search` which does full-text matching
 * against issue titles, descriptions, and comments. This is much
 * faster than grepping through markdown files — one of the key
 * advantages of having a real database backing your issues.
 */
export default function BeadsSearch() {
  const [items, setItems] = useState<ProjectIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setItems([]);
      return;
    }

    if (!isBdInstalled()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Beads not installed",
        message: "Install with: brew install beads",
      });
      return;
    }

    setIsLoading(true);
    const projects = discoverProjectPaths();
    const allItems: ProjectIssue[] = [];

    for (const project of projects) {
      try {
        const results = searchIssues(project.path, query);
        if (Array.isArray(results)) {
          for (const issue of results) {
            allItems.push({
              issue,
              project: { ...project, healthy: true },
            });
          }
        }
      } catch {
        // Skip projects with errors
      }
    }

    // Sort by priority, then updated date
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
  }, []);

  const refresh = useCallback(() => {
    // Re-run last search — items will be stale but this triggers a visual refresh
    setItems([...items]);
  }, [items]);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search beads across all projects..."
      onSearchTextChange={doSearch}
      throttle
    >
      {items.length > 0 ? (
        <List.Section
          title={`${items.length} results`}
          subtitle="across all projects"
        >
          {items.map((item) => (
            <IssueListItem
              key={`${item.project.name}:${item.issue.id}`}
              item={item}
              onRefresh={refresh}
            />
          ))}
        </List.Section>
      ) : (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Search your beads"
          description="Type at least 2 characters to search across all beads-enabled projects. Searches titles, descriptions, and comments."
        />
      )}
    </List>
  );
}
