import { Detail } from "@raycast/api";
import type { ProjectIssue } from "../lib/types";
import { PRIORITY_LABELS } from "../lib/types";
import { ISSUE_DETAIL_TIPS } from "../lib/education";
import IssueActions from "./IssueActions";

interface Props {
  item: ProjectIssue;
  onRefresh: () => void;
}

export default function IssueDetail({ item, onRefresh }: Props) {
  const { issue, project } = item;
  const created = new Date(issue.created_at).toLocaleDateString();
  const updated = new Date(issue.updated_at).toLocaleDateString();
  const priorityLabel = PRIORITY_LABELS[issue.priority] || `P${issue.priority}`;

  const markdown = `# ${issue.title}

| Field | Value |
|-------|-------|
| **ID** | \`${issue.id}\` |
| **Project** | ${project.name} |
| **Status** | ${issue.status} |
| **Type** | ${issue.issue_type} |
| **Priority** | ${priorityLabel} (${issue.priority}) |
| **Owner** | ${issue.owner || "Unassigned"} |
| **Created** | ${created} by ${issue.created_by} |
| **Updated** | ${updated} |
| **Dependencies** | ${issue.dependency_count} blocking / ${issue.dependent_count} dependents |
| **Comments** | ${issue.comment_count} |
${issue.labels ? `| **Labels** | ${issue.labels} |` : ""}
${issue.parent_id ? `| **Parent** | ${issue.parent_id} |` : ""}

---

## Description

${issue.description || "*No description provided.*"}

---

## Learn About Beads 📿

${issue.dependency_count > 0 ? ISSUE_DETAIL_TIPS.dependencies + "\n\n" : ""}${issue.issue_type === "epic" ? ISSUE_DETAIL_TIPS.types + "\n\n" : ""}${ISSUE_DETAIL_TIPS.discovery}

---

*Quick actions: Use \`Cmd+K\` to claim, close, or comment on this issue.*
`;

  return (
    <Detail
      markdown={markdown}
      actions={<IssueActions item={item} onRefresh={onRefresh} />}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Issue ID" text={issue.id} />
          <Detail.Metadata.Label title="Project" text={project.name} />
          <Detail.Metadata.TagList title="Status">
            <Detail.Metadata.TagList.Item
              text={issue.status}
              color={
                issue.status === "open"
                  ? "#3B82F6"
                  : issue.status === "in_progress"
                    ? "#F59E0B"
                    : "#10B981"
              }
            />
          </Detail.Metadata.TagList>
          <Detail.Metadata.Label title="Type" text={issue.issue_type} />
          <Detail.Metadata.Label title="Priority" text={priorityLabel} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Created" text={created} />
          <Detail.Metadata.Label title="Updated" text={updated} />
          <Detail.Metadata.Label title="Created By" text={issue.created_by} />
          {issue.owner ? (
            <Detail.Metadata.Label title="Owner" text={issue.owner} />
          ) : null}
        </Detail.Metadata>
      }
    />
  );
}
