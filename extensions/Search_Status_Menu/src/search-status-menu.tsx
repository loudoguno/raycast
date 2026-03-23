import {
  List,
  Action,
  ActionPanel,
  showHUD,
  closeMainWindow,
  Icon,
  getApplications,
  Color,
  open,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useMemo } from "react";
import { scanMenuBarItems } from "./lib/scanner";
import { clickAtPosition } from "./lib/clicker";
import type { MenuBarItem } from "./lib/types";

// Map bundleId → app icon path via Raycast's getApplications
function useAppIcons() {
  const { data: apps } = useCachedPromise(getApplications);
  return useMemo(() => {
    const map = new Map<string, string>();
    if (apps) {
      for (const app of apps) {
        if (app.bundleId) {
          map.set(app.bundleId, app.path);
        }
      }
    }
    return map;
  }, [apps]);
}

// Deduplicate items with identical title + bundleId, keeping the one with highest X position (most visible)
function deduplicateItems(items: MenuBarItem[]): MenuBarItem[] {
  const seen = new Map<string, MenuBarItem>();
  for (const item of items) {
    const key = `${item.title}::${item.bundleId}`;
    const existing = seen.get(key);
    if (!existing || item.position[0] > existing.position[0]) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.position[0] - b.position[0]);
}

// Clean up display title — trim whitespace, replace empty with app name
function displayTitle(item: MenuBarItem): string {
  const trimmed = item.title.trim();
  if (trimmed.length === 0) {
    return item.processName || (item.bundleId
      ? item.bundleId.split(".").pop()!.replace(/-/g, " ")
      : `PID ${item.pid}`);
  }
  return trimmed;
}

// Get a subtitle showing the process name (when title differs)
function subtitle(item: MenuBarItem): string | undefined {
  const title = displayTitle(item);
  if (!item.processName) return undefined;
  if (title.toLowerCase() === item.processName.toLowerCase()) return undefined;
  return item.processName;
}

async function performClick(item: MenuBarItem, button: "left" | "right") {
  // Use cached position — click immediately after Raycast dismisses
  const cx = item.position[0] + item.size[0] / 2;
  const cy = item.position[1] + item.size[1] / 2;
  await closeMainWindow();
  // Brief delay to let Raycast dismiss before clicking
  await new Promise((r) => setTimeout(r, 150));
  try {
    await clickAtPosition(cx, cy, button);
  } catch {
    await showHUD(`Failed to ${button}-click status item`);
  }
}

export default function SearchStatusMenu() {
  const {
    data: scanResult,
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(scanMenuBarItems, [], {
    keepPreviousData: true,
  });

  const appIcons = useAppIcons();

  // Handle accessibility permission denied
  if (scanResult && !scanResult.permitted) {
    return (
      <List>
        <List.EmptyView
          icon={{ source: Icon.Lock, tintColor: Color.Red }}
          title="Accessibility Permission Required"
          description={
            "Search Status Menu needs Accessibility access to read menu bar items.\n\n" +
            "Open System Settings → Privacy & Security → Accessibility → Enable Raycast"
          }
          actions={
            <ActionPanel>
              <Action
                title="Open Accessibility Settings"
                icon={Icon.Gear}
                onAction={async () => {
                  await open(
                    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
                  );
                }}
              />
              <Action
                title="Retry"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={revalidate}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  // Handle errors
  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
          title="Failed to scan menu bar"
          description={error.message}
          actions={
            <ActionPanel>
              <Action
                title="Retry"
                icon={Icon.ArrowClockwise}
                onAction={revalidate}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const items = scanResult ? deduplicateItems(scanResult.items) : [];

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search status menu items...">
      {items.map((item, idx) => {
        const title = displayTitle(item);
        const appPath = item.bundleId ? appIcons.get(item.bundleId) : undefined;

        return (
          <List.Item
            key={`${item.bundleId}-${idx}-${item.position[0]}`}
            title={title}
            subtitle={subtitle(item)}
            icon={
              appPath
                ? { fileIcon: appPath }
                : { source: Icon.CircleFilled, tintColor: Color.SecondaryText }
            }
            accessories={[
              {
                text: item.processName || undefined,
                tooltip: item.bundleId ?? undefined,
              },
            ]}
            actions={
              <ActionPanel>
                <Action
                  title="Open Menu (Left Click)"
                  icon={Icon.Mouse}
                  onAction={() => performClick(item, "left")}
                />
                <Action
                  title="Open Context Menu (Right Click)"
                  icon={Icon.List}
                  shortcut={{ modifiers: ["cmd"], key: "return" }}
                  onAction={() => performClick(item, "right")}
                />
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                  onAction={revalidate}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
