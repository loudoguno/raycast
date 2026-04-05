import { Action, ActionPanel, Color, Icon, List, showHUD, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { discoverExtensions, findExtensionByName } from "./lib/extensions";
import { listIssues } from "./lib/github-client";
import { executeInTerminal } from "./lib/terminal";
import { ExtensionInfo, GitHubIssue } from "./lib/types";

function IssueList({ extension }: { extension: ExtensionInfo }) {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listIssues(["feedback", `ext:${extension.name}`])
      .then(setIssues)
      .catch(async (err) => {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch issues",
          message: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => setIsLoading(false));
  }, [extension.name]);

  async function burnIssue(issue: GitHubIssue) {
    const prompt = `Fix GitHub issue #${issue.number}: ${issue.title}\n\n${issue.body || "No description."}`;
    // Escape backticks and dollar signs for shell safety
    const safePrompt = prompt.replace(/`/g, "\\`").replace(/\$/g, "\\$").replace(/"/g, '\\"');
    const command = `cd ~/code/raycast/extensions/${extension.dir} && claude -p "${safePrompt}"`;

    try {
      await executeInTerminal(command);
      await showHUD(`Agent spawned for #${issue.number}`);
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to spawn agent",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <List isLoading={isLoading} navigationTitle={`${extension.title} Issues`}>
      {issues.length === 0 && !isLoading ? (
        <List.EmptyView title="No open feedback issues" description={`No issues labeled ext:${extension.name}`} />
      ) : (
        issues.map((issue) => (
          <List.Item
            key={issue.number}
            title={issue.title}
            subtitle={`#${issue.number}`}
            accessories={issue.labels.map((l) => ({ tag: { value: l.name, color: Color.SecondaryText } }))}
            actions={
              <ActionPanel>
                <Action title="Burn" icon={Icon.Terminal} onAction={() => burnIssue(issue)} />
                <Action.OpenInBrowser title="View on GitHub" url={issue.html_url} />
                <Action.CopyToClipboard title="Copy Issue URL" content={issue.html_url} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}

export default function BurnBacklog() {
  const extensions = discoverExtensions();
  const [issueCounts, setIssueCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch all feedback issues once, then count by extension label
    listIssues(["feedback"])
      .then((issues) => {
        const counts: Record<string, number> = {};
        for (const issue of issues) {
          for (const label of issue.labels) {
            if (label.name.startsWith("ext:")) {
              const extName = label.name.slice(4);
              counts[extName] = (counts[extName] || 0) + 1;
            }
          }
        }
        setIssueCounts(counts);
      })
      .catch(async (err) => {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch issues",
          message: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter extensions...">
      {extensions.map((ext) => {
        const count = issueCounts[ext.name] || 0;
        return (
          <List.Item
            key={ext.name}
            title={ext.title}
            subtitle={ext.dir}
            accessories={
              count > 0 ? [{ tag: { value: `${count}`, color: Color.Red }, icon: Icon.Exclamationmark }] : []
            }
            actions={
              <ActionPanel>
                <Action.Push title="View Issues" icon={Icon.List} target={<IssueList extension={ext} />} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
