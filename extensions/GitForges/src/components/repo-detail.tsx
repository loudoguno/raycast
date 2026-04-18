import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { getProvider } from "../lib/providers";
import type { Repo } from "../lib/types";
import { CreateIssueForm } from "./create-issue";

dayjs.extend(relativeTime);

const PROVIDER_LABEL: Record<Repo["provider"], string> = {
  github: "GitHub",
  forgejo: "Forgejo",
};

export function RepoDetailView({ repo: initial }: { repo: Repo }) {
  const provider = getProvider(initial.provider);
  const { data: details, isLoading } = usePromise(
    (owner: string, name: string) => provider.fetchRepoDetails(owner, name),
    [initial.owner.login, initial.name],
  );

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
  const providerName = PROVIDER_LABEL[repo.provider];

  const badges: string[] = [`**${providerName}**`];
  if (repo.private) badges.push("\ud83d\udd12 Private");
  if (repo.fork) badges.push("\ud83c\udf74 Fork");
  if (repo.archived) badges.push("\ud83d\udce6 Archived");

  const md = [
    `# ${repo.fullName}`,
    "",
    repo.description ? `> ${repo.description}` : "",
    "",
    badges.join(" \u00b7 "),
    "",
    "---",
    "",
    "| Stat | Value |",
    "| --- | --- |",
    `| \u2605 Stars | **${repo.stargazersCount.toLocaleString()}** |`,
    `| \ud83c\udf74 Forks | **${repo.forksCount.toLocaleString()}** |`,
    `| \ud83d\udd00 Branches | **${branches}** |`,
    `| \ud83d\udccb Open PRs | **${openPRs}** |`,
    `| \u26a0\ufe0f Open Issues | **${repo.openIssuesCount}** |`,
    `| \ud83d\udce6 Releases | **${releases}** |`,
    `| \ud83d\udc65 Contributors | **${contributors}** |`,
    repo.language ? `| \ud83d\udcbb Language | **${repo.language}** |` : "",
    repo.license ? `| \ud83d\udcc4 License | **${repo.license}** |` : "",
    `| \ud83d\udccf Size | **${formatSize(repo.size)}** |`,
    `| \ud83d\udd50 Created | **${dayjs(repo.createdAt).format("MMM D, YYYY")}** |`,
    `| \ud83d\udd04 Last Push | **${dayjs(repo.pushedAt).fromNow()}** |`,
    "",
    latestCommit
      ? [
          "### Latest Commit",
          "",
          `\`${latestCommit.sha}\` ${latestCommit.message}`,
          `_by ${latestCommit.author} \u00b7 ${dayjs(latestCommit.date).fromNow()}_`,
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
      markdown={md}
      navigationTitle={`${repo.fullName} (${providerName})`}
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Open">
            <Action.OpenInBrowser
              title={`Open on ${providerName}`}
              url={repo.htmlUrl}
            />
            {repo.homepage && (
              <Action.OpenInBrowser
                title="Open Homepage"
                url={repo.homepage}
                icon={Icon.House}
                shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
              />
            )}
          </ActionPanel.Section>

          <ActionPanel.Section title="Actions">
            <Action.Push
              title="Create Issue"
              icon={Icon.Plus}
              shortcut={{ modifiers: ["cmd"], key: "i" }}
              target={<CreateIssueForm repo={repo} />}
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
