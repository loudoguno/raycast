import { Action, ActionPanel, Color, Icon, List, showHUD, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { discoverExtensions } from "./lib/extensions";
import { listIssues } from "./lib/github-client";
import { executeInTerminal } from "./lib/terminal";
import { ExtensionInfo, GitHubIssue } from "./lib/types";

const REPO_ROOT = "~/code/raycast";

/**
 * Build the claude command for the burndown agent.
 * All three burn levels use the same single-agent workflow — only scope differs.
 * Issue context is inlined in the prompt to avoid re-fetching.
 */
function buildBurnCommand(
  scope:
    | { mode: "issue"; issue: GitHubIssue; ext: ExtensionInfo }
    | { mode: "extension"; ext: ExtensionInfo }
    | { mode: "all" },
): string {
  let name: string;
  let prompt: string;

  switch (scope.mode) {
    case "issue": {
      name = `Burn #${scope.issue.number}`;
      const body = (scope.issue.body || "No description.").slice(0, 2000);
      prompt = [
        `Scope: single issue.`,
        `Extension: ${scope.ext.name} (dir: extensions/${scope.ext.dir})`,
        ``,
        `Issue #${scope.issue.number}: ${scope.issue.title}`,
        body,
        ``,
        `Labels: ${scope.issue.labels.map((l) => l.name).join(", ")}`,
        `Reference: gh issue view ${scope.issue.number} --repo loudoguno/raycast for comments/updates.`,
      ].join("\n");
      break;
    }
    case "extension": {
      name = `Burn ${scope.ext.title}`;
      prompt = [
        `Scope: all open feedback issues for one extension.`,
        `Extension: ${scope.ext.name} (dir: extensions/${scope.ext.dir})`,
        ``,
        `Fetch issues: gh issue list --repo loudoguno/raycast --label feedback --label ext:${scope.ext.name} --state open --json number,title,body,labels`,
      ].join("\n");
      break;
    }
    case "all": {
      name = `Burn all`;
      prompt = [
        `Scope: all open feedback issues across ALL extensions.`,
        ``,
        `Fetch issues: gh issue list --repo loudoguno/raycast --label feedback --state open --json number,title,body,labels`,
      ].join("\n");
      break;
    }
  }

  // Escape for shell single-quote wrapping
  const safePrompt = prompt.replace(/'/g, "'\\''");
  return `cd ${REPO_ROOT} && claude --agent raycast-burndown -n '${name}' $'${safePrompt}'`;
}

async function launchBurn(
  scope: Parameters<typeof buildBurnCommand>[0],
) {
  try {
    await executeInTerminal(buildBurnCommand(scope));
    const label =
      scope.mode === "all"
        ? "all extensions"
        : scope.mode === "extension"
          ? scope.ext.title
          : `#${scope.issue.number}`;
    await showHUD(`Burndown agent launched for ${label}`);
  } catch (err) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to launch agent",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

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

  return (
    <List isLoading={isLoading} navigationTitle={`${extension.title} Issues`}>
      {!isLoading && issues.length > 0 && (
        <List.Item
          title={`Burn All ${issues.length} Issues`}
          icon={{ source: Icon.Fire, tintColor: Color.Orange }}
          actions={
            <ActionPanel>
              <Action
                title="Burn All Issues"
                icon={Icon.Fire}
                onAction={() => launchBurn({ mode: "extension", ext: extension })}
              />
            </ActionPanel>
          }
        />
      )}
      {issues.length === 0 && !isLoading ? (
        <List.EmptyView title="No open feedback issues" description={`No issues labeled ext:${extension.name}`} />
      ) : (
        issues.map((issue) => (
          <List.Item
            key={issue.number}
            title={issue.title.replace(/^\[.*?\]\s*/, "")}
            subtitle={`#${issue.number}`}
            accessories={issue.labels.map((l) => ({ tag: { value: l.name, color: Color.SecondaryText } }))}
            actions={
              <ActionPanel>
                <Action
                  title="Burn This Issue"
                  icon={Icon.Terminal}
                  onAction={() => launchBurn({ mode: "issue", issue, ext: extension })}
                />
                <Action
                  title="Burn All Issues"
                  icon={Icon.Fire}
                  onAction={() => launchBurn({ mode: "extension", ext: extension })}
                />
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
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        setTotalCount(issues.length);
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
      {!isLoading && totalCount > 0 && (
        <List.Section title="Actions">
          <List.Item
            title={`Burn All Extensions (${totalCount} issues)`}
            icon={{ source: Icon.Fire, tintColor: Color.Red }}
            actions={
              <ActionPanel>
                <Action title="Burn All Extensions" icon={Icon.Fire} onAction={() => launchBurn({ mode: "all" })} />
              </ActionPanel>
            }
          />
        </List.Section>
      )}
      <List.Section title="Extensions">
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
      </List.Section>
    </List>
  );
}
