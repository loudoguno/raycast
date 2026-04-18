import { Action, ActionPanel, Color, Icon, Image, List } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo, useState } from "react";
import { mergeRepos } from "./lib/merge";
import { getEnabledProviders } from "./lib/providers";
import { findLocalRepo } from "./lib/local-repos";
import type { LocalRepoInfo, MergedRepo, ProviderId, Repo } from "./lib/types";
import { RepoDetailView } from "./components/repo-detail";
import { CreateIssueForm } from "./components/create-issue";

dayjs.extend(relativeTime);

const PROVIDER_COLOR: Record<ProviderId, Color> = {
  github: Color.Blue,
  forgejo: Color.Green,
};

const PROVIDER_LABEL: Record<ProviderId, string> = {
  github: "GitHub",
  forgejo: "Forgejo",
};

export default function QuickSearch() {
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const { data: mergedRepos, isLoading } = usePromise(async () => {
    const providers = getEnabledProviders();
    if (providers.length === 0) return [];

    const results = await Promise.all(
      providers.map(async (p) => {
        try {
          return await p.fetchRepos();
        } catch (err) {
          console.error(`Failed to fetch from ${p.id}:`, err);
          return [];
        }
      }),
    );
    return mergeRepos(results.flat());
  });

  const filtered = useMemo(() => {
    if (!mergedRepos) return [];
    if (providerFilter === "all") return mergedRepos;
    return mergedRepos.filter((m) =>
      m.variants.some((v: Repo) => v.provider === providerFilter),
    );
  }, [mergedRepos, providerFilter]);

  const enabledProviders = getEnabledProviders();
  const noProvidersConfigured = !isLoading && enabledProviders.length === 0;

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search repositories..."
      throttle
      searchBarAccessory={
        enabledProviders.length > 1 ? (
          <List.Dropdown
            tooltip="Filter by Provider"
            value={providerFilter}
            onChange={setProviderFilter}
            storeValue
          >
            <List.Dropdown.Item
              title="All Forges"
              value="all"
              icon={Icon.List}
            />
            {enabledProviders.map((p) => (
              <List.Dropdown.Item
                key={p.id}
                title={p.displayName}
                value={p.id}
                icon={{ source: Icon.Dot, tintColor: PROVIDER_COLOR[p.id] }}
              />
            ))}
          </List.Dropdown>
        ) : undefined
      }
    >
      {noProvidersConfigured ? (
        <List.EmptyView
          title="No Providers Configured"
          description="Add a GitHub token or Forgejo URL + token in extension preferences"
          icon={Icon.Gear}
        />
      ) : (
        filtered.map((merged) => (
          <RepoListItem key={merged.key} merged={merged} />
        ))
      )}
    </List>
  );
}

function RepoListItem({ merged }: { merged: MergedRepo }) {
  const primary = merged.variants[0];
  const local = findLocalRepoMemo(merged);

  const accessories: List.Item.Accessory[] = [];

  // Provider badges (one per forge this repo lives on)
  for (const variant of merged.variants) {
    accessories.push({
      tag: {
        value: PROVIDER_LABEL[variant.provider],
        color: PROVIDER_COLOR[variant.provider],
      },
      tooltip: `${variant.fullName} on ${PROVIDER_LABEL[variant.provider]}`,
    });
  }

  // Local repo indicators
  if (local) {
    if (local.ahead > 0 || local.behind > 0) {
      accessories.push({
        tag: {
          value: `\u2191${local.ahead} \u2193${local.behind}`,
          color:
            local.ahead > 0 && local.behind > 0 ? Color.Orange : Color.Yellow,
        },
        tooltip: `${local.ahead} ahead, ${local.behind} behind remote`,
      });
    }
    if (local.hasUncommittedChanges) {
      accessories.push({
        tag: { value: "\u25cf", color: Color.Orange },
        tooltip: "Uncommitted changes",
      });
    }
    accessories.push({
      icon: { source: Icon.HardDrive, tintColor: Color.Green },
      tooltip: `Local: ${local.path} (${local.currentBranch})`,
    });
  }

  if (primary.language) accessories.push({ tag: primary.language });

  if (primary.stargazersCount > 0) {
    accessories.push({
      text: `\u2605 ${formatCount(primary.stargazersCount)}`,
      tooltip: `${primary.stargazersCount} stars`,
    });
  }

  if (primary.openIssuesCount > 0) {
    accessories.push({
      icon: Icon.Circle,
      text: String(primary.openIssuesCount),
      tooltip: `${primary.openIssuesCount} open issues/PRs`,
    });
  }

  accessories.push({
    date: new Date(primary.pushedAt),
    tooltip: `Last pushed ${dayjs(primary.pushedAt).fromNow()}`,
  });

  const subtitle =
    merged.variants.length > 1
      ? merged.variants.map((v) => v.owner.login).join(" \u00b7 ")
      : primary.owner.login;

  const keywords = Array.from(
    new Set([
      ...merged.variants.flatMap((v) => [
        v.owner.login,
        v.fullName,
        v.language ?? "",
      ]),
      ...primary.topics,
      primary.private ? "private" : "public",
      primary.fork ? "fork" : "",
      primary.archived ? "archived" : "",
      ...merged.variants.map((v) => PROVIDER_LABEL[v.provider]),
    ]),
  ).filter(Boolean);

  return (
    <List.Item
      id={merged.key}
      title={merged.displayName}
      subtitle={subtitle}
      icon={{
        source: primary.owner.avatarUrl,
        mask: Image.Mask.Circle,
        fallback: Icon.Person,
      }}
      accessories={accessories}
      keywords={keywords}
      actions={<RepoActions merged={merged} local={local} />}
    />
  );
}

function RepoActions({
  merged,
  local,
}: {
  merged: MergedRepo;
  local: LocalRepoInfo | null;
}) {
  const primary = merged.variants[0];
  const secondary = merged.variants[1];

  return (
    <ActionPanel>
      <ActionPanel.Section title="Open">
        <Action.OpenInBrowser
          title={`Open on ${PROVIDER_LABEL[primary.provider]}`}
          url={primary.htmlUrl}
          icon={Icon.Globe}
        />
        {secondary && (
          <Action.OpenInBrowser
            title={`Open on ${PROVIDER_LABEL[secondary.provider]}`}
            url={secondary.htmlUrl}
            icon={Icon.Globe}
            shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
          />
        )}
        <Action.Push
          title={`More Info \u2014 ${PROVIDER_LABEL[primary.provider]}`}
          icon={Icon.Info}
          shortcut={{ modifiers: ["cmd"], key: "return" }}
          target={<RepoDetailView repo={primary} />}
        />
        {secondary && (
          <Action.Push
            title={`More Info \u2014 ${PROVIDER_LABEL[secondary.provider]}`}
            icon={Icon.Info}
            shortcut={{ modifiers: ["cmd", "shift"], key: "return" }}
            target={<RepoDetailView repo={secondary} />}
          />
        )}
        {primary.homepage && (
          <Action.OpenInBrowser
            title="Open Homepage"
            url={primary.homepage}
            icon={Icon.House}
          />
        )}
      </ActionPanel.Section>

      <ActionPanel.Section title="Issues">
        {merged.variants.map((v, idx) => (
          <Action.Push
            key={v.provider}
            title={`Create Issue on ${PROVIDER_LABEL[v.provider]}`}
            icon={Icon.Plus}
            shortcut={
              idx === 0
                ? { modifiers: ["cmd"], key: "i" }
                : { modifiers: ["cmd", "shift"], key: "i" }
            }
            target={<CreateIssueForm repo={v} />}
          />
        ))}
      </ActionPanel.Section>

      {local && (
        <ActionPanel.Section title="Local">
          <Action.Open
            title="Open in Finder"
            target={local.path}
            icon={Icon.Finder}
            shortcut={{ modifiers: ["cmd"], key: "f" }}
          />
          <Action.Open
            title="Open in Terminal"
            target={local.path}
            application="com.apple.Terminal"
            icon={Icon.Terminal}
            shortcut={{ modifiers: ["cmd"], key: "t" }}
          />
          <Action.CopyToClipboard
            title="Copy Local Path"
            content={local.path}
          />
        </ActionPanel.Section>
      )}

      <ActionPanel.Section title="Copy">
        {merged.variants.map((v) => (
          <CopyVariant key={v.provider} variant={v} />
        ))}
      </ActionPanel.Section>
    </ActionPanel>
  );
}

function CopyVariant({ variant }: { variant: Repo }) {
  const label = PROVIDER_LABEL[variant.provider];
  return (
    <>
      <Action.CopyToClipboard
        title={`Copy ${label} URL`}
        content={variant.htmlUrl}
        shortcut={
          variant.provider === "github"
            ? { modifiers: ["cmd", "shift"], key: "c" }
            : undefined
        }
      />
      <Action.CopyToClipboard
        title={`Copy ${label} Clone URL (SSH)`}
        content={variant.sshUrl}
      />
    </>
  );
}

const localCache = new Map<string, LocalRepoInfo | null>();
function findLocalRepoMemo(merged: MergedRepo): LocalRepoInfo | null {
  if (!localCache.has(merged.key)) {
    try {
      localCache.set(merged.key, findLocalRepo(merged));
    } catch {
      localCache.set(merged.key, null);
    }
  }
  return localCache.get(merged.key) ?? null;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
