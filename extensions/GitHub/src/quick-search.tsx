import {
  Action,
  ActionPanel,
  Color,
  Icon,
  Image,
  List,
  Keyboard,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { fetchRepos } from "./lib/github-client";
import { findLocalRepo } from "./lib/local-repos";
import type { RepoItem, LocalRepoInfo } from "./lib/types";
import { RepoDetailView } from "./components/repo-detail";
import { CreateIssueForm } from "./components/create-issue";

dayjs.extend(relativeTime);

export default function QuickSearch() {
  const { data: repos, isLoading } = usePromise(fetchRepos);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search repositories..."
      throttle
    >
      {repos?.map((repo) => (
        <RepoListItem key={repo.id} repo={repo} />
      ))}
    </List>
  );
}

function RepoListItem({ repo }: { repo: RepoItem }) {
  const localInfo = findLocalRepoMemo(repo.fullName);

  const accessories: List.Item.Accessory[] = [];

  // Local repo indicators
  if (localInfo) {
    if (localInfo.ahead > 0 || localInfo.behind > 0) {
      accessories.push({
        tag: {
          value: `↑${localInfo.ahead} ↓${localInfo.behind}`,
          color:
            localInfo.ahead > 0 && localInfo.behind > 0
              ? Color.Orange
              : Color.Yellow,
        },
        tooltip: `${localInfo.ahead} ahead, ${localInfo.behind} behind remote`,
      });
    }
    if (localInfo.hasUncommittedChanges) {
      accessories.push({
        tag: { value: "●", color: Color.Orange },
        tooltip: "Uncommitted changes",
      });
    }
    accessories.push({
      icon: { source: Icon.HardDrive, tintColor: Color.Green },
      tooltip: `Local: ${localInfo.path} (${localInfo.currentBranch})`,
    });
  }

  // Language
  if (repo.language) {
    accessories.push({ tag: repo.language });
  }

  // Stars (if any)
  if (repo.stargazersCount > 0) {
    accessories.push({
      text: `★ ${formatCount(repo.stargazersCount)}`,
      tooltip: `${repo.stargazersCount} stars`,
    });
  }

  // Open issues + PRs
  if (repo.openIssuesCount > 0) {
    accessories.push({
      icon: Icon.Circle,
      text: String(repo.openIssuesCount),
      tooltip: `${repo.openIssuesCount} open issues/PRs`,
    });
  }

  // Last pushed
  accessories.push({
    date: new Date(repo.pushedAt),
    tooltip: `Last pushed ${dayjs(repo.pushedAt).fromNow()}`,
  });

  const subtitle = repo.owner.login;
  const keywords = [
    repo.owner.login,
    repo.language ?? "",
    ...repo.topics,
    repo.private ? "private" : "public",
    repo.fork ? "fork" : "",
    repo.archived ? "archived" : "",
  ].filter(Boolean);

  return (
    <List.Item
      id={String(repo.id)}
      title={repo.name}
      subtitle={subtitle}
      icon={{
        source: repo.owner.avatarUrl,
        mask: Image.Mask.Circle,
        fallback: Icon.Person,
      }}
      accessories={accessories}
      keywords={keywords}
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Open">
            <Action.OpenInBrowser title="Open on GitHub" url={repo.htmlUrl} />
            <Action.Push
              title="More Info"
              icon={Icon.Info}
              shortcut={Keyboard.Shortcut.Common.Open}
              target={
                <RepoDetailView owner={repo.owner.login} name={repo.name} />
              }
            />
            {repo.homepage && (
              <Action.OpenInBrowser
                title="Open Homepage"
                url={repo.homepage}
                icon={Icon.Globe}
                shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
              />
            )}
          </ActionPanel.Section>

          <ActionPanel.Section title="Actions">
            <Action.Push
              title="Create Issue"
              icon={Icon.Plus}
              shortcut={{ modifiers: ["cmd"], key: "i" }}
              target={
                <CreateIssueForm owner={repo.owner.login} repo={repo.name} />
              }
            />
            {localInfo && (
              <Action.Open
                title={`Open in Finder`}
                target={localInfo.path}
                icon={Icon.Finder}
                shortcut={{ modifiers: ["cmd"], key: "f" }}
              />
            )}
            {localInfo && (
              <Action.Open
                title="Open in Terminal"
                target={localInfo.path}
                application="com.apple.Terminal"
                icon={Icon.Terminal}
                shortcut={{ modifiers: ["cmd"], key: "t" }}
              />
            )}
          </ActionPanel.Section>

          <ActionPanel.Section title="Copy">
            <Action.CopyToClipboard
              title="Copy URL"
              content={repo.htmlUrl}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
            <Action.CopyToClipboard
              title="Copy Clone URL (HTTPS)"
              content={repo.cloneUrl}
              shortcut={{ modifiers: ["cmd", "shift"], key: "h" }}
            />
            <Action.CopyToClipboard
              title="Copy Clone URL (SSH)"
              content={repo.sshUrl}
              shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
            />
            {localInfo && (
              <Action.CopyToClipboard
                title="Copy Local Path"
                content={localInfo.path}
              />
            )}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

// Simple memoization to avoid re-scanning filesystem on every render
const localRepoCache = new Map<string, LocalRepoInfo | null>();
function findLocalRepoMemo(fullName: string): LocalRepoInfo | null {
  if (!localRepoCache.has(fullName)) {
    try {
      localRepoCache.set(fullName, findLocalRepo(fullName));
    } catch {
      localRepoCache.set(fullName, null);
    }
  }
  return localRepoCache.get(fullName) ?? null;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
