import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { fetchRepoDetails } from "../lib/github-client";
import { CreateIssueForm } from "./create-issue";

dayjs.extend(relativeTime);

export function RepoDetailView({
  owner,
  name,
}: {
  owner: string;
  name: string;
}) {
  const { data: details, isLoading } = usePromise(fetchRepoDetails, [
    owner,
    name,
  ]);

  if (isLoading || !details) {
    return <Detail isLoading={true} />;
  }

  const {
    repo,
    readme,
    latestCommit,
    branches,
    releases,
    contributors,
    openPRs,
  } = details;

  const badges: string[] = [];
  if (repo.private) badges.push("🔒 Private");
  if (repo.fork) badges.push("🍴 Fork");
  if (repo.archived) badges.push("📦 Archived");

  const metadataMarkdown = [
    `# ${repo.fullName}`,
    "",
    repo.description ? `> ${repo.description}` : "",
    "",
    badges.length > 0 ? badges.join(" · ") : "",
    "",
    "---",
    "",
    "| Stat | Value |",
    "| --- | --- |",
    `| ★ Stars | **${repo.stargazersCount.toLocaleString()}** |`,
    `| 🍴 Forks | **${repo.forksCount.toLocaleString()}** |`,
    `| 👁 Watchers | **${repo.watchersCount.toLocaleString()}** |`,
    `| 🔀 Branches | **${branches}** |`,
    `| 📋 Open PRs | **${openPRs}** |`,
    `| ⚠️ Open Issues | **${repo.openIssuesCount}** |`,
    `| 📦 Releases | **${releases}** |`,
    `| 👥 Contributors | **${contributors}** |`,
    repo.language ? `| 💻 Language | **${repo.language}** |` : "",
    repo.license ? `| 📄 License | **${repo.license}** |` : "",
    `| 📏 Size | **${formatSize(repo.size)}** |`,
    `| 🕐 Created | **${dayjs(repo.createdAt).format("MMM D, YYYY")}** |`,
    `| 🔄 Last Push | **${dayjs(repo.pushedAt).fromNow()}** |`,
    "",
    latestCommit
      ? [
          "### Latest Commit",
          "",
          `\`${latestCommit.sha}\` ${latestCommit.message}`,
          `_by ${latestCommit.author} · ${dayjs(latestCommit.date).fromNow()}_`,
        ].join("\n")
      : "",
    "",
    repo.topics.length > 0
      ? `**Topics:** ${repo.topics.map((t) => `\`${t}\``).join(" ")}`
      : "",
    "",
    repo.homepage ? `**Homepage:** ${repo.homepage}` : "",
    "",
    "---",
    "",
    readme ? "## README\n\n" + readme : "_No README found._",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return (
    <Detail
      markdown={metadataMarkdown}
      navigationTitle={repo.fullName}
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Open">
            <Action.OpenInBrowser title="Open on GitHub" url={repo.htmlUrl} />
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
              target={<CreateIssueForm owner={owner} repo={name} />}
            />
          </ActionPanel.Section>

          <ActionPanel.Section title="Quick Links">
            <Action.OpenInBrowser
              title="Issues"
              url={`${repo.htmlUrl}/issues`}
              icon={Icon.ExclamationMark}
            />
            <Action.OpenInBrowser
              title="Pull Requests"
              url={`${repo.htmlUrl}/pulls`}
              icon={Icon.ArrowRight}
            />
            <Action.OpenInBrowser
              title="Actions"
              url={`${repo.htmlUrl}/actions`}
              icon={Icon.Play}
            />
            <Action.OpenInBrowser
              title="Settings"
              url={`${repo.htmlUrl}/settings`}
              icon={Icon.Gear}
            />
          </ActionPanel.Section>

          <ActionPanel.Section title="Copy">
            <Action.CopyToClipboard
              title="Copy URL"
              content={repo.htmlUrl}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
            <Action.CopyToClipboard
              title="Copy Clone URL (SSH)"
              content={repo.sshUrl}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function formatSize(kb: number): string {
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(1)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}
