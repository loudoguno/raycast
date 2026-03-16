import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Icon,
  List,
  Clipboard,
  open,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState, useMemo } from "react";
import { getGraphOrPrimary } from "./lib/graph-config";
import {
  searchGraph,
  fetchBlocksByUids,
  fetchRecentEdits,
  fetchBackRefs,
} from "./lib/roam-api";
import { blockToMarkdown, blockSubtitle } from "./lib/markdown";
import type { GraphConfig, RoamBlock, Preferences } from "./lib/types";
import dayjs from "dayjs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roamUrl(graphName: string, uid: string, openIn: string): string {
  if (openIn === "app") return `roam://#/app/${graphName}/page/${uid}`;
  return `https://roamresearch.com/#/app/${graphName}/page/${uid}`;
}

function blockRef(uid: string): string {
  return `((${uid}))`;
}

function timeAgo(ms?: number): string {
  if (!ms) return "";
  return dayjs(ms).fromNow?.() ?? dayjs(ms).format("MMM D, HH:mm");
}

function formatEditTime(ms?: number): string {
  if (!ms) return "";
  const d = dayjs(ms);
  const now = dayjs();
  if (d.isSame(now, "day")) return `Today ${d.format("HH:mm")}`;
  if (d.isSame(now.subtract(1, "day"), "day"))
    return `Yesterday ${d.format("HH:mm")}`;
  return d.format("MMM D, HH:mm");
}

// ---------------------------------------------------------------------------
// Actions shared across all result items
// ---------------------------------------------------------------------------

function BlockActions({
  block,
  graph,
  openIn,
}: {
  block: RoamBlock;
  graph: GraphConfig;
  openIn: string;
}) {
  const uid = block[":block/uid"];
  const url = roamUrl(graph.name, uid, openIn);
  const webUrl = roamUrl(graph.name, uid, "web");

  return (
    <ActionPanel>
      <ActionPanel.Section title="Open">
        {openIn === "app" ? (
          <Action.Open
            title="Open in Roam"
            target={url}
            icon={Icon.AppWindow}
          />
        ) : (
          <Action.OpenInBrowser title="Open in Browser" url={url} />
        )}
        {openIn === "app" ? (
          <Action.OpenInBrowser
            title="Open in Browser"
            url={roamUrl(graph.name, uid, "web")}
            shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
          />
        ) : (
          <Action.Open
            title="Open in Roam App"
            target={roamUrl(graph.name, uid, "app")}
            icon={Icon.AppWindow}
            shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
          />
        )}
      </ActionPanel.Section>

      <ActionPanel.Section title="Copy">
        <Action.CopyToClipboard
          title="Copy Block Reference"
          content={blockRef(uid)}
          shortcut={{ modifiers: ["cmd"], key: "." }}
        />
        <Action.CopyToClipboard
          title="Copy Block Content"
          content={block[":block/string"] || block[":node/title"] || ""}
          shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
        />
        <Action.CopyToClipboard
          title="Copy Roam URL"
          content={webUrl}
          shortcut={{ modifiers: ["cmd", "shift"], key: "u" }}
        />
        <Action.CopyToClipboard
          title="Copy Block UID"
          content={uid}
          shortcut={{ modifiers: ["cmd", "shift"], key: "." }}
        />
      </ActionPanel.Section>

      <ActionPanel.Section title="Navigate">
        <Action.Push
          title="View Back-References"
          icon={Icon.Link}
          shortcut={{ modifiers: ["cmd"], key: "b" }}
          target={<BackRefsView block={block} graph={graph} openIn={openIn} />}
        />
      </ActionPanel.Section>

      <ActionPanel.Section title="Quick Actions">
        <Action
          title="Paste Block Reference"
          icon={Icon.Clipboard}
          shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
          onAction={async () => {
            await Clipboard.paste(blockRef(uid));
          }}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}

// ---------------------------------------------------------------------------
// Back-references sub-view
// ---------------------------------------------------------------------------

function BackRefsView({
  block,
  graph,
  openIn,
}: {
  block: RoamBlock;
  graph: GraphConfig;
  openIn: string;
}) {
  const title =
    block[":node/title"] || block[":block/string"] || block[":block/uid"];
  const { isLoading, data: backRefs } = usePromise(
    (g: GraphConfig, uid: string) => fetchBackRefs(g, uid),
    [graph, block[":block/uid"]],
  );

  return (
    <List
      navigationTitle={`Back-references: ${title}`}
      isShowingDetail
      isLoading={isLoading}
    >
      {backRefs?.map((ref) => (
        <List.Item
          key={ref[":block/uid"]}
          title={ref[":node/title"] || blockSubtitle(ref) || ref[":block/uid"]}
          icon={ref[":node/title"] ? Icon.Document : Icon.TextCursor}
          accessories={[{ text: formatEditTime(ref[":edit/time"]) }]}
          detail={<List.Item.Detail markdown={blockToMarkdown(ref)} />}
          actions={<BlockActions block={ref} graph={graph} openIn={openIn} />}
        />
      ))}
      {!isLoading && (!backRefs || backRefs.length === 0) && (
        <List.EmptyView
          title="No back-references"
          description="Nothing links to this block yet"
          icon={Icon.MagnifyingGlass}
        />
      )}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Main search command
// ---------------------------------------------------------------------------

export default function SearchCommand() {
  const prefs = getPreferenceValues<Preferences>();
  const openIn = prefs.openIn ?? "web";

  const [searchText, setSearchText] = useState("");

  // Load primary graph config — runs once
  const { isLoading: isGraphLoading, data: graph } = usePromise(
    () => getGraphOrPrimary(prefs.primaryGraph),
    [],
  );

  // Fetch recent edits — shown when search is empty
  const { isLoading: isRecentsLoading, data: recentEdits } = usePromise(
    async (g: GraphConfig | null) => {
      if (!g) return [];
      return fetchRecentEdits(g, 48);
    },
    [graph],
  );

  // Search — triggers on every keystroke (no minimum character gate)
  const { isLoading: isSearching, data: searchResults } = usePromise(
    async (g: GraphConfig | null, query: string) => {
      if (!g || !query.trim()) return null;
      return searchGraph(g, query.trim());
    },
    [graph, searchText],
    { keepPreviousData: true },
  );

  // Fetch full block data for search results
  const searchUids = useMemo(
    () => searchResults?.map((r) => r[":block/uid"]) ?? [],
    [searchResults],
  );
  const { isLoading: isBlocksLoading, data: fullBlocks } = usePromise(
    async (g: GraphConfig | null, uids: string[]) => {
      if (!g || uids.length === 0) return new Map<string, RoamBlock>();
      const blocks = await fetchBlocksByUids(g, uids);
      const map = new Map<string, RoamBlock>();
      for (const b of blocks) map.set(b[":block/uid"], b);
      return map;
    },
    [graph, searchUids],
    { keepPreviousData: true },
  );

  // Determine what to show
  const hasQuery = searchText.trim().length > 0;
  const isLoading =
    isGraphLoading ||
    (hasQuery ? isSearching || isBlocksLoading : isRecentsLoading);

  // No graph configured
  if (!isGraphLoading && !graph) {
    return (
      <List>
        <List.EmptyView
          title="No Graph Connected"
          description="Add a Roam graph first with the 'Add Graph' command, then set it as your Primary Graph in extension preferences."
          icon={Icon.ExclamationMark}
          actions={
            <ActionPanel>
              <Action
                title="Open Extension Preferences"
                icon={Icon.Gear}
                onAction={() =>
                  open(
                    "raycast://extensions/loudog/roam-research-custom/add-graph",
                  )
                }
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isShowingDetail
      filtering={false}
      searchBarPlaceholder={graph ? `Search ${graph.name}…` : "Search Roam…"}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      isLoading={isLoading}
      throttle
    >
      {hasQuery && searchResults ? (
        <List.Section
          title="Search Results"
          subtitle={`${searchResults.length} results`}
        >
          {searchResults.map((result) => {
            const uid = result[":block/uid"];
            const fullBlock = fullBlocks?.get(uid);
            const block = fullBlock ?? (result as unknown as RoamBlock);
            const isPage = !!result[":node/title"];

            return (
              <List.Item
                key={uid}
                title={result[":node/title"] || blockSubtitle(block) || uid}
                subtitle={
                  isPage
                    ? undefined
                    : result[":node/title"]
                      ? undefined
                      : undefined
                }
                icon={isPage ? Icon.Document : Icon.TextCursor}
                accessories={[
                  { text: formatEditTime(fullBlock?.[":edit/time"]) },
                ]}
                detail={
                  <List.Item.Detail
                    markdown={blockToMarkdown(block, searchText)}
                  />
                }
                actions={
                  graph && (
                    <BlockActions block={block} graph={graph} openIn={openIn} />
                  )
                }
              />
            );
          })}
        </List.Section>
      ) : !hasQuery && recentEdits && recentEdits.length > 0 ? (
        <List.Section title="Recently Edited" subtitle={`Last 48 hours`}>
          {recentEdits.map((block) => {
            const uid = block[":block/uid"];
            const isPage = !!block[":node/title"];

            return (
              <List.Item
                key={uid}
                title={block[":node/title"] || blockSubtitle(block) || uid}
                icon={isPage ? Icon.Document : Icon.TextCursor}
                accessories={[{ text: formatEditTime(block[":edit/time"]) }]}
                detail={<List.Item.Detail markdown={blockToMarkdown(block)} />}
                actions={
                  graph && (
                    <BlockActions block={block} graph={graph} openIn={openIn} />
                  )
                }
              />
            );
          })}
        </List.Section>
      ) : !hasQuery && !isLoading ? (
        <List.EmptyView
          title="Start Typing to Search"
          description="Or check back after your graph loads recent edits"
          icon={Icon.MagnifyingGlass}
        />
      ) : null}
    </List>
  );
}
