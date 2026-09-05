/**
 * Search Links — the library view.
 *
 * Raycast's built-in list filtering does the fuzzy matching; we feed it
 * keywords (url, note, tags, host) so a search over any of those hits.
 */
import {
  Action,
  ActionPanel,
  Alert,
  Color,
  confirmAlert,
  Icon,
  List,
  Toast,
  open,
  showToast,
  Keyboard,
} from "@raycast/api";
import { useCachedPromise, type MutatePromise } from "@raycast/utils";
import { useMemo } from "react";
import {
  createClient,
  hostOf,
  toMarkdown,
  type LousLink,
  type LousLinksClient,
} from "./lib/api";
import { getConfig, getPrefs, webUrl } from "./lib/prefs";

export default function Command() {
  const prefs = useMemo(() => getPrefs(), []);
  const client = useMemo(() => createClient(getConfig(prefs)), [prefs]);

  const { data, isLoading, mutate } = useCachedPromise(
    async (c: LousLinksClient) => {
      const links = await c.list();
      return links.filter((l) => !truthy(l.hide)).sort(byPinThenRecent);
    },
    [client],
    {
      initialData: [] as LousLink[],
      keepPreviousData: true,
      onError: (error) =>
        showToast({
          style: Toast.Style.Failure,
          title: "Could not load links",
          message: error.message,
        }),
    },
  );

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search your links…">
      <List.EmptyView
        icon={Icon.Link}
        title="No links"
        description="Save one with the Save Front Link hotkey, or `ll save <url>`."
      />
      {data.map((link) => (
        <List.Item
          key={link.handle}
          icon={truthy(link.pin) ? Icon.Pin : Icon.Link}
          title={link.title || link.url}
          subtitle={hostOf(link)}
          keywords={keywordsFor(link)}
          accessories={accessoriesFor(link)}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <Action
                  title="Open Link"
                  icon={Icon.ArrowNe}
                  onAction={async () => {
                    await client.open(link.handle).catch(() => undefined);
                    await open(link.url);
                  }}
                />
                <Action.CopyToClipboard
                  title="Copy URL"
                  content={link.url}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <Action.CopyToClipboard
                  title="Copy Markdown Link"
                  content={toMarkdown(link)}
                  shortcut={Keyboard.Shortcut.Common.Copy}
                />
              </ActionPanel.Section>

              <ActionPanel.Section>
                <Action
                  title={truthy(link.star) ? "Unfavorite" : "Favorite"}
                  icon={Icon.Star}
                  shortcut={Keyboard.Shortcut.Common.Save}
                  onAction={() =>
                    toggle(mutate, client, link, "star", !truthy(link.star))
                  }
                />
                <Action
                  title={truthy(link.pin) ? "Unpin" : "Pin"}
                  icon={Icon.Pin}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
                  onAction={() =>
                    toggle(mutate, client, link, "pin", !truthy(link.pin))
                  }
                />
              </ActionPanel.Section>

              <ActionPanel.Section>
                <Action.OpenInBrowser
                  title="Open in Lous-Links Web"
                  url={webUrl(prefs.baseUrl)}
                  shortcut={{ modifiers: ["cmd"], key: "l" }}
                />
                <Action
                  title="Delete Link"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["ctrl"], key: "x" }}
                  onAction={async () => {
                    const confirmed = await confirmAlert({
                      title: "Delete this link?",
                      message: link.title || link.url,
                      primaryAction: {
                        title: "Delete",
                        style: Alert.ActionStyle.Destructive,
                      },
                    });
                    if (!confirmed) return;
                    try {
                      await mutate(client.remove(link.handle), {
                        optimisticUpdate: (current) =>
                          (current ?? []).filter(
                            (l) => l.handle !== link.handle,
                          ),
                      });
                      await showToast({
                        style: Toast.Style.Success,
                        title: "Deleted",
                      });
                    } catch (error) {
                      await showToast({
                        style: Toast.Style.Failure,
                        title: "Delete failed",
                        message: messageOf(error),
                      });
                    }
                  }}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

async function toggle(
  mutate: MutatePromise<LousLink[]>,
  client: LousLinksClient,
  link: LousLink,
  field: "star" | "pin",
  next: boolean,
) {
  const patch = field === "star" ? { star: next } : { pin: next };
  const applied = (l: LousLink): LousLink =>
    field === "star" ? { ...l, star: next } : { ...l, pin: next };

  try {
    await mutate(client.patch(link.handle, patch), {
      optimisticUpdate: (current) =>
        (current ?? [])
          .map((l) => (l.handle === link.handle ? applied(l) : l))
          .sort(byPinThenRecent),
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: `Could not ${next ? "set" : "clear"} ${field}`,
      message: messageOf(error),
    });
  }
}

function byPinThenRecent(a: LousLink, b: LousLink): number {
  const pin = Number(truthy(b.pin)) - Number(truthy(a.pin));
  return pin !== 0 ? pin : b.created_at - a.created_at;
}

function keywordsFor(link: LousLink): string[] {
  return [link.url, link.note ?? "", link.tags ?? "", hostOf(link)]
    .join(" ")
    .split(/[\s,/]+/)
    .filter(Boolean);
}

function accessoriesFor(link: LousLink): List.Item.Accessory[] {
  const out: List.Item.Accessory[] = [];
  if (link.tags) {
    for (const tag of link.tags.split(",").filter(Boolean)) {
      out.push({ tag: tag.trim() });
    }
  }
  if (link.note) out.push({ icon: Icon.SpeechBubble, tooltip: link.note });
  if (link.open_count) out.push({ text: `${link.open_count}×` });
  if (truthy(link.star)) {
    out.push({ icon: { source: Icon.Star, tintColor: Color.Yellow } });
  }
  out.push({ date: new Date(link.created_at) });
  return out;
}

function truthy(value: number | boolean | null | undefined): boolean {
  return value === true || value === 1;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
