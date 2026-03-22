import {
  Action,
  ActionPanel,
  Icon,
  Clipboard,
  showToast,
  Toast,
  open,
  getPreferenceValues,
} from "@raycast/api";
import { claimIssue, closeIssue } from "../lib/bd-client";
import type { ProjectIssue } from "../lib/types";
import IssueDetail from "./IssueDetail";

interface Preferences {
  defaultEditor: string;
}

interface Props {
  item: ProjectIssue;
  onRefresh: () => void;
}

export default function IssueActions({ item, onRefresh }: Props) {
  const { issue, project } = item;
  const prefs = getPreferenceValues<Preferences>();

  return (
    <ActionPanel>
      <ActionPanel.Section title="View">
        <Action.Push
          title="View Details"
          icon={Icon.Eye}
          target={<IssueDetail item={item} onRefresh={onRefresh} />}
        />
      </ActionPanel.Section>

      <ActionPanel.Section title="Actions">
        {issue.status === "open" && (
          <Action
            title="Claim Issue"
            icon={Icon.PersonCircle}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
            onAction={async () => {
              try {
                claimIssue(project.path, issue.id);
                await showToast({
                  style: Toast.Style.Success,
                  title: "Claimed",
                  message: `${issue.id} is now in progress`,
                });
                onRefresh();
              } catch (error) {
                await showToast({
                  style: Toast.Style.Failure,
                  title: "Failed to claim",
                  message: String(error),
                });
              }
            }}
          />
        )}
        {issue.status !== "closed" && (
          <Action
            title="Close Issue"
            icon={Icon.CheckCircle}
            shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
            onAction={async () => {
              try {
                closeIssue(project.path, issue.id);
                await showToast({
                  style: Toast.Style.Success,
                  title: "Closed",
                  message: `${issue.id} is now closed`,
                });
                onRefresh();
              } catch (error) {
                await showToast({
                  style: Toast.Style.Failure,
                  title: "Failed to close",
                  message: String(error),
                });
              }
            }}
          />
        )}
      </ActionPanel.Section>

      <ActionPanel.Section title="Copy">
        <Action
          title="Copy Issue ID"
          icon={Icon.Clipboard}
          shortcut={{ modifiers: ["cmd"], key: "c" }}
          onAction={async () => {
            await Clipboard.copy(issue.id);
            await showToast({
              style: Toast.Style.Success,
              title: "Copied",
              message: issue.id,
            });
          }}
        />
        <Action
          title="Copy Issue Title"
          icon={Icon.Text}
          shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          onAction={async () => {
            await Clipboard.copy(`${issue.id}: ${issue.title}`);
            await showToast({
              style: Toast.Style.Success,
              title: "Copied",
              message: issue.title,
            });
          }}
        />
      </ActionPanel.Section>

      <ActionPanel.Section title="Refresh">
        <Action
          title="Refresh"
          icon={Icon.ArrowClockwise}
          shortcut={{ modifiers: ["cmd"], key: "r" }}
          onAction={onRefresh}
        />
      </ActionPanel.Section>

      <ActionPanel.Section title="Open">
        <Action
          title="Open Project in Editor"
          icon={Icon.Code}
          shortcut={{ modifiers: ["cmd"], key: "o" }}
          onAction={async () => {
            const editor = prefs.defaultEditor || "cursor";
            if (editor === "finder") {
              await open(project.path);
            } else if (editor === "terminal") {
              await open(project.path, "Terminal");
            } else {
              await open(
                project.path,
                editor === "code" ? "Visual Studio Code" : "Cursor",
              );
            }
          }}
        />
        <Action
          title="Open Terminal Here"
          icon={Icon.Terminal}
          shortcut={{ modifiers: ["cmd"], key: "t" }}
          onAction={async () => {
            await open(project.path, "Terminal");
          }}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}
