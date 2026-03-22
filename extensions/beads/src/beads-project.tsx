import {
  List,
  Detail,
  Icon,
  Color,
  ActionPanel,
  Action,
  showToast,
  Toast,
} from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import {
  isBdInstalled,
  statusSummary,
  listIssues,
  readyIssues,
  blockedIssues,
} from "./lib/bd-client";
import { discoverProjects } from "./lib/project-scanner";
import { formatHealthStatus, landingChecklist } from "./lib/education";
import type { BeadsProject, BeadIssue, BeadStatusSummary } from "./lib/types";
import { PRIORITY_LABELS } from "./lib/types";

/**
 * Project deep-dive — pick a project, then see its full beads landscape.
 *
 * 📿 This view gives you the "big picture" that Steve Yegge talks about:
 * how much work is open, what's blocked, what's ready, and the overall
 * health of your beads database. Think of it as `bd status` on steroids.
 */
export default function BeadsProject() {
  const [projects, setProjects] = useState<BeadsProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<BeadsProject | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isBdInstalled()) {
      showToast({
        style: Toast.Style.Failure,
        title: "Beads not installed",
        message: "Install with: brew install beads",
      });
      setIsLoading(false);
      return;
    }

    const discovered = discoverProjects();
    setProjects(discovered);
    setIsLoading(false);
  }, []);

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Select a project...">
      {projects.map((p) => (
        <List.Item
          key={p.path}
          title={p.name}
          subtitle={p.path}
          icon={{
            source: p.healthy ? Icon.CheckCircle : Icon.ExclamationMark,
            tintColor: p.healthy ? Color.Green : Color.Red,
          }}
          accessories={[
            {
              text: p.healthy
                ? "Healthy"
                : formatHealthStatus(p.healthy, p.error),
            },
          ]}
          actions={
            <ActionPanel>
              <Action
                title="View Project"
                icon={Icon.Eye}
                onAction={() => setSelectedProject(p)}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && projects.length === 0 && (
        <List.EmptyView
          icon={Icon.Tray}
          title="No beads-enabled projects found"
          description="Run `bd init` in a project to get started."
        />
      )}
    </List>
  );
}

function ProjectDetail({
  project,
  onBack,
}: {
  project: BeadsProject;
  onBack: () => void;
}) {
  const [status, setStatus] = useState<BeadStatusSummary | null>(null);
  const [ready, setReady] = useState<BeadIssue[]>([]);
  const [blocked, setBlocked] = useState<BeadIssue[]>([]);
  const [epics, setEpics] = useState<BeadIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const s = statusSummary(project.path);
      setStatus(s);

      const r = readyIssues(project.path);
      setReady(Array.isArray(r) ? r : []);

      const b = blockedIssues(project.path);
      setBlocked(Array.isArray(b) ? b : []);

      try {
        const e = listIssues(project.path, { type: "epic" });
        setEpics(Array.isArray(e) ? e : []);
      } catch {
        setEpics([]);
      }
    } catch {
      // Project might be unhealthy
    }
    setIsLoading(false);
  }, [project.path]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!status) {
    return (
      <Detail
        isLoading={isLoading}
        markdown={`# ${project.name}\n\n${formatHealthStatus(project.healthy, project.error)}`}
        actions={
          <ActionPanel>
            <Action title="Back" icon={Icon.ArrowLeft} onAction={onBack} />
          </ActionPanel>
        }
      />
    );
  }

  const s = status.summary;
  const completionRate =
    s.total_issues > 0
      ? Math.round((s.closed_issues / s.total_issues) * 100)
      : 0;

  const topReady = ready
    .slice(0, 5)
    .map(
      (i) =>
        `| \`${i.id}\` | ${i.title} | ${PRIORITY_LABELS[i.priority] || "P" + i.priority} |`,
    )
    .join("\n");

  const blockedList = blocked
    .slice(0, 5)
    .map((i) => `| \`${i.id}\` | ${i.title} | ${i.dependency_count} deps |`)
    .join("\n");

  const epicList = epics
    .map((i) => `| \`${i.id}\` | ${i.title} | ${i.status} |`)
    .join("\n");

  const markdown = `# ${project.name}

## Status Overview

| Metric | Count |
|--------|-------|
| **Total Issues** | ${s.total_issues} |
| **Open** | ${s.open_issues} |
| **In Progress** | ${s.in_progress_issues} |
| **Closed** | ${s.closed_issues} |
| **Blocked** | ${s.blocked_issues} |
| **Ready** | ${s.ready_issues} |
| **Deferred** | ${s.deferred_issues} |
| **Completion Rate** | ${completionRate}% |
${s.average_lead_time_hours > 0 ? `| **Avg Lead Time** | ${Math.round(s.average_lead_time_hours)}h |` : ""}

---

## Top Ready Work

${
  topReady
    ? `| ID | Title | Priority |\n|---|---|---|\n${topReady}`
    : "*No ready work — all clear!*"
}

${
  blockedList
    ? `---\n\n## Blocked Issues\n\n| ID | Title | Dependencies |\n|---|---|---|\n${blockedList}`
    : ""
}

${
  epicList
    ? `---\n\n## Epics\n\n| ID | Title | Status |\n|---|---|---|\n${epicList}`
    : ""
}

---

## About This View 📿

This is your **project health dashboard**. Use it to get the big picture before starting a coding session.

**Pro tips:**
- Start sessions with \`bd ready\` to see what's unblocked
- Use \`bd doctor\` if things look off
- Run \`bd cleanup\` periodically to prune old closed issues
- File issues generously — agents work better with granular tasks
`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Project" text={project.name} />
          <Detail.Metadata.Label title="Path" text={project.path} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Total" text={String(s.total_issues)} />
          <Detail.Metadata.TagList title="Status Breakdown">
            <Detail.Metadata.TagList.Item
              text={`${s.open_issues} open`}
              color="#3B82F6"
            />
            <Detail.Metadata.TagList.Item
              text={`${s.in_progress_issues} active`}
              color="#F59E0B"
            />
            <Detail.Metadata.TagList.Item
              text={`${s.closed_issues} closed`}
              color="#10B981"
            />
            <Detail.Metadata.TagList.Item
              text={`${s.blocked_issues} blocked`}
              color="#EF4444"
            />
          </Detail.Metadata.TagList>
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Ready" text={String(s.ready_issues)} />
          <Detail.Metadata.Label
            title="Completion"
            text={`${completionRate}%`}
          />
          <Detail.Metadata.Label
            title="Health"
            text={project.healthy ? "Healthy" : "Unhealthy"}
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action
            title="Back to Projects"
            icon={Icon.ArrowLeft}
            onAction={onBack}
          />
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={loadData}
          />
          <Action.Push
            title="Landing Checklist"
            icon={Icon.List}
            shortcut={{ modifiers: ["cmd"], key: "l" }}
            target={
              <Detail
                markdown={landingChecklist(project.name)}
                actions={
                  <ActionPanel>
                    <Action
                      title="Back"
                      icon={Icon.ArrowLeft}
                      onAction={onBack}
                    />
                  </ActionPanel>
                }
              />
            }
          />
        </ActionPanel>
      }
    />
  );
}
