import { useState, useCallback } from "react";
import {
  List,
  ActionPanel,
  Action,
  showToast,
  Toast,
  useNavigation,
  Detail,
  Icon,
  Color,
} from "@raycast/api";
import { execSync } from "child_process";
import { getWatchedRepos, getRepoStatus, sortRepos, statusIcon, formatRelativeDate, RepoStatus } from "./utils/git";

function runGitCommand(cmd: string, repoPath: string): { success: boolean; output: string } {
  try {
    const output = execSync(`git ${cmd}`, {
      cwd: repoPath,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 15000,
    }).trim();
    return { success: true, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, output: message };
  }
}

function openInTerminal(repoPath: string) {
  execSync(
    `osascript -e 'tell application "Terminal" to do script "cd \\"${repoPath}\\""'`,
  );
}

function getFullStatus(repo: RepoStatus): string {
  if (repo.error) return `Error: ${repo.error}`;

  const lines: string[] = [];

  lines.push(`Branch: ${repo.branch}`);
  lines.push(`Last commit: ${repo.lastCommitMsg} (${formatRelativeDate(repo.lastCommitDate)})`);
  lines.push("");

  const { output: statusOutput } = runGitCommand("status --short", repo.path);
  if (statusOutput) {
    lines.push("Changed files:");
    lines.push("```");
    lines.push(statusOutput);
    lines.push("```");
    lines.push("");
  } else {
    lines.push("Working tree clean");
    lines.push("");
  }

  const { output: logOutput } = runGitCommand(
    "log -5 --pretty=format:'%h %s (%cr)' --no-merges",
    repo.path,
  );
  if (logOutput) {
    lines.push("Recent commits:");
    lines.push("```");
    lines.push(logOutput);
    lines.push("```");
  }

  return lines.join("\n");
}

function RepoDetail({ repo, onRefresh }: { repo: RepoStatus; onRefresh: () => void }) {
  const markdown = getFullStatus(repo);

  return (
    <Detail
      markdown={`# ${repo.name}\n\n${markdown}`}
      actions={
        <ActionPanel>
          <Action
            title="Open in Terminal"
            icon={Icon.Terminal}
            onAction={() => {
              openInTerminal(repo.path);
            }}
          />
          <Action
            title="Git Pull"
            icon={Icon.ArrowDown}
            onAction={async () => {
              const toast = await showToast({ style: Toast.Style.Animated, title: "Pulling..." });
              const result = runGitCommand("pull", repo.path);
              if (result.success) {
                toast.style = Toast.Style.Success;
                toast.title = "Pulled successfully";
                toast.message = result.output || "Already up to date";
              } else {
                toast.style = Toast.Style.Failure;
                toast.title = "Pull failed";
                toast.message = result.output;
              }
              onRefresh();
            }}
          />
          <Action
            title="Git Push"
            icon={Icon.ArrowUp}
            onAction={async () => {
              const toast = await showToast({ style: Toast.Style.Animated, title: "Pushing..." });
              const result = runGitCommand("push", repo.path);
              if (result.success) {
                toast.style = Toast.Style.Success;
                toast.title = "Pushed successfully";
                toast.message = result.output;
              } else {
                toast.style = Toast.Style.Failure;
                toast.title = "Push failed";
                toast.message = result.output;
              }
              onRefresh();
            }}
          />
          <Action.CopyToClipboard title="Copy Path" content={repo.path} />
        </ActionPanel>
      }
    />
  );
}

function getListIcon(repo: RepoStatus): { source: string; tintColor?: Color } {
  if (repo.error) return { source: Icon.ExclamationMark, tintColor: Color.Red };
  if (repo.isDirty && repo.unpushedCount > 0) return { source: Icon.ArrowUp, tintColor: Color.Orange };
  if (repo.unpushedCount > 0) return { source: Icon.ArrowUp, tintColor: Color.Yellow };
  if (repo.isDirty) return { source: Icon.Dot, tintColor: Color.Orange };
  return { source: Icon.Checkmark, tintColor: Color.Green };
}

function getAccessories(repo: RepoStatus): List.Item.Accessory[] {
  if (repo.error) return [{ text: "error", tooltip: repo.error }];

  const accessories: List.Item.Accessory[] = [];

  accessories.push({ text: repo.branch, icon: Icon.CodeBlock });

  if (repo.isDirty) accessories.push({ text: `${repo.dirtyCount} changed`, icon: Icon.Dot });
  if (repo.unpushedCount > 0) accessories.push({ text: `${repo.unpushedCount} unpushed`, icon: Icon.ArrowUp });
  if (repo.isStale) accessories.push({ text: "stale", icon: Icon.Clock, tooltip: "Last commit > 7 days ago" });

  accessories.push({ text: formatRelativeDate(repo.lastCommitDate), tooltip: repo.lastCommitDate.toLocaleString() });

  return accessories;
}

export default function Command() {
  const { push } = useNavigation();
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const repoPaths = getWatchedRepos();
  const allRepos = sortRepos(repoPaths.map(getRepoStatus));

  const needsAttention = allRepos.filter((r) => !r.error && (r.isDirty || r.unpushedCount > 0));
  const clean = allRepos.filter((r) => !r.error && !r.isDirty && r.unpushedCount === 0);
  const errored = allRepos.filter((r) => !!r.error);

  function renderRepo(repo: RepoStatus) {
    const icon = getListIcon(repo);
    const accessories = getAccessories(repo);
    const subtitle = repo.error ? "" : repo.lastCommitMsg;

    return (
      <List.Item
        key={repo.path}
        icon={icon}
        title={repo.name}
        subtitle={subtitle}
        accessories={accessories}
        actions={
          <ActionPanel>
            <Action
              title="View Details"
              icon={Icon.Eye}
              onAction={() => push(<RepoDetail repo={repo} onRefresh={refresh} />)}
            />
            <Action
              title="Open in Terminal"
              icon={Icon.Terminal}
              onAction={() => openInTerminal(repo.path)}
            />
            <Action
              title="Git Pull"
              icon={Icon.ArrowDown}
              shortcut={{ modifiers: ["cmd"], key: "p" }}
              onAction={async () => {
                const toast = await showToast({ style: Toast.Style.Animated, title: "Pulling..." });
                const result = runGitCommand("pull", repo.path);
                if (result.success) {
                  toast.style = Toast.Style.Success;
                  toast.title = "Pulled successfully";
                  toast.message = result.output || "Already up to date";
                } else {
                  toast.style = Toast.Style.Failure;
                  toast.title = "Pull failed";
                  toast.message = result.output;
                }
                refresh();
              }}
            />
            <Action
              title="Git Push"
              icon={Icon.ArrowUp}
              shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
              onAction={async () => {
                const toast = await showToast({ style: Toast.Style.Animated, title: "Pushing..." });
                const result = runGitCommand("push", repo.path);
                if (result.success) {
                  toast.style = Toast.Style.Success;
                  toast.title = "Pushed successfully";
                } else {
                  toast.style = Toast.Style.Failure;
                  toast.title = "Push failed";
                  toast.message = result.output;
                }
                refresh();
              }}
            />
            <Action.CopyToClipboard
              title="Copy Path"
              content={repo.path}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
            <Action
              title="Refresh"
              icon={Icon.ArrowClockwise}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
              onAction={refresh}
            />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <List isLoading={false}>
      {needsAttention.length > 0 && (
        <List.Section title="Needs Attention" subtitle={`${needsAttention.length} repos`}>
          {needsAttention.map(renderRepo)}
        </List.Section>
      )}
      {clean.length > 0 && (
        <List.Section title="Clean" subtitle={`${clean.length} repos`}>
          {clean.map(renderRepo)}
        </List.Section>
      )}
      {errored.length > 0 && (
        <List.Section title="Errors" subtitle={`${errored.length} repos`}>
          {errored.map(renderRepo)}
        </List.Section>
      )}
    </List>
  );
}
