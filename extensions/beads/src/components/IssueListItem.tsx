import { List, Icon, Color } from "@raycast/api";
import type { ProjectIssue, BeadType } from "../lib/types";
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_COLORS } from "../lib/types";
import IssueActions from "./IssueActions";

/** Map issue type to a Raycast Icon */
function typeIcon(type: BeadType): Icon {
  switch (type) {
    case "bug":
      return Icon.Bug;
    case "feature":
      return Icon.Star;
    case "epic":
      return Icon.Folder;
    case "chore":
      return Icon.Hammer;
    case "decision":
      return Icon.LightBulb;
    case "task":
    default:
      return Icon.CheckCircle;
  }
}

/** Map status to a Raycast Color */
function statusColor(status: string): Color {
  return (STATUS_COLORS[status] as Color) || Color.SecondaryText;
}

interface Props {
  item: ProjectIssue;
  onRefresh: () => void;
}

export default function IssueListItem({ item, onRefresh }: Props) {
  const { issue, project } = item;
  const priorityLabel = PRIORITY_LABELS[issue.priority] || `P${issue.priority}`;
  const priorityColor = PRIORITY_COLORS[issue.priority] || "#6B7280";

  return (
    <List.Item
      id={`${project.name}:${issue.id}`}
      title={issue.title}
      subtitle={issue.id}
      icon={{
        source: typeIcon(issue.issue_type),
        tintColor: statusColor(issue.status),
      }}
      accessories={[
        // Project badge
        { tag: { value: project.name, color: Color.Blue } },
        // Priority
        { tag: { value: priorityLabel, color: priorityColor as Color } },
        // Dependency count if any
        ...(issue.dependency_count > 0
          ? [
              {
                icon: Icon.Link,
                tooltip: `${issue.dependency_count} dependencies`,
              },
            ]
          : []),
        // Comment count if any
        ...(issue.comment_count > 0
          ? [{ icon: Icon.Bubble, tooltip: `${issue.comment_count} comments` }]
          : []),
        // Type label
        { text: issue.issue_type },
      ]}
      actions={<IssueActions item={item} onRefresh={onRefresh} />}
    />
  );
}
