import {
  List,
  ActionPanel,
  Action,
  Icon,
  Color,
  showToast,
  Toast,
  Clipboard,
} from "@raycast/api";
import { useState, useEffect, useMemo } from "react";
import {
  loadRegistry,
  sortByRecency,
  loadFavorites,
  addFavorite,
  removeFavorite,
  getRelativeTime,
  findDocumentation,
  itemToMarkdown,
  expandPath,
  getFolderPath,
} from "./registry";
import {
  executeItem,
  openFolderInTerminal,
  openInClaudeCode,
  viewGitHistory,
  openInEditor,
  openDocumentation,
} from "./execute";
import { RegistryItem, ItemType } from "./types";

// Icons and colors for each item type
const TYPE_CONFIG: Record<ItemType, { icon: Icon; color: Color; label: string }> = {
  skill: { icon: Icon.Stars, color: Color.Purple, label: "Skill" },
  cli: { icon: Icon.Terminal, color: Color.Green, label: "CLI" },
  raycast: { icon: Icon.RaycastLogoNeg, color: Color.Orange, label: "Raycast" },
  alias: { icon: Icon.Link, color: Color.Blue, label: "Alias" },
  tool: { icon: Icon.Hammer, color: Color.Yellow, label: "Tool" },
};

// Filter options
const FILTER_OPTIONS = [
  { id: "all", name: "All Items", icon: Icon.List },
  { id: "favorites", name: "Favorites", icon: Icon.Star },
  { id: "skill", name: "Skills", icon: Icon.Stars },
  { id: "cli", name: "CLI Tools", icon: Icon.Terminal },
  { id: "raycast", name: "Raycast Scripts", icon: Icon.RaycastLogoNeg },
  { id: "alias", name: "Aliases", icon: Icon.Link },
  { id: "tool", name: "AIA Tools", icon: Icon.Hammer },
];

export default function Command() {
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  // Load registry and favorites
  useEffect(() => {
    const registry = loadRegistry();
    if (registry) {
      setItems(sortByRecency(registry.items));
    } else {
      showToast({
        style: Toast.Style.Failure,
        title: "Registry not found",
        message: "Run generate-claude-built-registry first",
      });
    }
    setFavorites(loadFavorites());
    setIsLoading(false);
  }, []);

  // Filter items based on selection
  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "favorites") return items.filter((item) => favorites.has(item.id));
    return items.filter((item) => item.type === filter);
  }, [items, filter, favorites]);

  // Sort with favorites first
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aFav = favorites.has(a.id) ? 1 : 0;
      const bFav = favorites.has(b.id) ? 1 : 0;
      if (bFav !== aFav) return bFav - aFav;

      // Then by updated_at
      const updatedA = new Date(a.updated_at || a.created_at).getTime();
      const updatedB = new Date(b.updated_at || b.created_at).getTime();
      return updatedB - updatedA;
    });
  }, [filteredItems, favorites]);

  const handleExecute = async (item: RegistryItem) => {
    await executeItem(item);
  };

  const handleToggleFavorite = (item: RegistryItem) => {
    if (favorites.has(item.id)) {
      const newFavorites = removeFavorite(item.id);
      setFavorites(new Set(newFavorites));
      showToast({ style: Toast.Style.Success, title: `Removed ${item.name} from favorites` });
    } else {
      const newFavorites = addFavorite(item.id);
      setFavorites(new Set(newFavorites));
      showToast({ style: Toast.Style.Success, title: `Added ${item.name} to favorites` });
    }
  };

  const regenerateRegistry = () => {
    showToast({ style: Toast.Style.Animated, title: "Regenerating registry..." });
    const { exec } = require("child_process");
    exec(
      "~/.claude/bin/generate-claude-built-registry",
      { shell: "/bin/bash" },
      (error: Error | null) => {
        if (error) {
          showToast({
            style: Toast.Style.Failure,
            title: "Failed to regenerate",
            message: error.message,
          });
        } else {
          const registry = loadRegistry();
          if (registry) {
            setItems(sortByRecency(registry.items));
          }
          showToast({ style: Toast.Style.Success, title: "Registry regenerated" });
        }
      }
    );
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search Claude-built items..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter by Type"
          storeValue={true}
          onChange={(value) => setFilter(value)}
        >
          {FILTER_OPTIONS.map((option) => (
            <List.Dropdown.Item
              key={option.id}
              title={option.name}
              value={option.id}
              icon={option.icon}
            />
          ))}
        </List.Dropdown>
      }
    >
      {sortedItems.length === 0 && !isLoading ? (
        <List.EmptyView
          title={filter === "favorites" ? "No favorites yet" : "No items found"}
          description={
            filter === "favorites"
              ? "Star items to add them to favorites"
              : "Run generate-claude-built-registry to populate"
          }
          icon={filter === "favorites" ? Icon.Star : Icon.MagnifyingGlass}
        />
      ) : (
        sortedItems.map((item) => {
          const config = TYPE_CONFIG[item.type];
          const isFav = favorites.has(item.id);
          const docPath = findDocumentation(item.path);
          const relativeTime = getRelativeTime(item.updated_at || item.created_at);
          const lastUsedTime = item.last_used ? getRelativeTime(item.last_used) : null;

          return (
            <List.Item
              key={item.id}
              icon={
                isFav
                  ? { source: Icon.Star, tintColor: Color.Yellow }
                  : { source: config.icon, tintColor: config.color }
              }
              title={item.name}
              subtitle={item.description}
              accessories={[
                { tag: { value: config.label, color: config.color } },
                { text: relativeTime, tooltip: `Modified: ${item.updated_at || item.created_at}` },
                item.use_count > 0
                  ? { text: `${item.use_count}x`, tooltip: lastUsedTime ? `Last used: ${lastUsedTime}` : "Times used" }
                  : {},
              ]}
              keywords={[...item.tags, item.type, item.trigger || "", item.name]}
              actions={
                <ActionPanel>
                  {/* Primary Actions */}
                  <ActionPanel.Section title="Execute">
                    <Action
                      title="Execute"
                      icon={Icon.Play}
                      onAction={() => handleExecute(item)}
                    />
                  </ActionPanel.Section>

                  {/* Navigation Actions */}
                  <ActionPanel.Section title="Open">
                    <Action
                      title="View Source"
                      icon={Icon.Code}
                      shortcut={{ modifiers: ["cmd"], key: "e" }}
                      onAction={() => openInEditor(item.path)}
                    />
                    {docPath && (
                      <Action
                        title="View Documentation"
                        icon={Icon.Document}
                        shortcut={{ modifiers: ["cmd"], key: "d" }}
                        onAction={() => openDocumentation(docPath)}
                      />
                    )}
                    <Action.ShowInFinder
                      title="Open Folder in Finder"
                      path={getFolderPath(item.path)}
                      shortcut={{ modifiers: ["cmd"], key: "o" }}
                    />
                    <Action
                      title="Open Folder in Terminal"
                      icon={Icon.Terminal}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "t" }}
                      onAction={() => openFolderInTerminal(item.path)}
                    />
                    <Action
                      title="Open in Claude Code"
                      icon={Icon.Stars}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                      onAction={() => openInClaudeCode(item.path)}
                    />
                  </ActionPanel.Section>

                  {/* Management Actions */}
                  <ActionPanel.Section title="Manage">
                    <Action
                      title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                      icon={isFav ? Icon.StarDisabled : Icon.Star}
                      shortcut={{ modifiers: ["cmd"], key: "f" }}
                      onAction={() => handleToggleFavorite(item)}
                    />
                    <Action
                      title="Edit Source File"
                      icon={Icon.Pencil}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
                      onAction={() => openInEditor(item.path)}
                    />
                    <Action
                      title="View Git History"
                      icon={Icon.Clock}
                      shortcut={{ modifiers: ["cmd"], key: "g" }}
                      onAction={() => viewGitHistory(item.path)}
                    />
                  </ActionPanel.Section>

                  {/* Copy Actions */}
                  <ActionPanel.Section title="Copy">
                    <Action.CopyToClipboard
                      title="Copy as Markdown"
                      content={itemToMarkdown(item)}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
                    />
                    <Action.CopyToClipboard
                      title="Copy Path"
                      content={item.path}
                      shortcut={{ modifiers: ["cmd"], key: "c" }}
                    />
                    {item.trigger && (
                      <Action.CopyToClipboard
                        title="Copy Trigger"
                        content={item.trigger}
                      />
                    )}
                    {item.execution.command && (
                      <Action.CopyToClipboard
                        title="Copy Command"
                        content={item.execution.command}
                      />
                    )}
                  </ActionPanel.Section>

                  {/* Utility Actions */}
                  <ActionPanel.Section title="Utilities">
                    <Action
                      title="Regenerate Registry"
                      icon={Icon.RotateClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={regenerateRegistry}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
