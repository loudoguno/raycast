import { List, ActionPanel, Action, showToast, Toast, Icon, confirmAlert } from "@raycast/api";
import { useEffect, useState } from "react";
import { loadConfigs, removeCheatsheet, CheatsheetConfig } from "./cheatsheet-store";

export default function ManageCheatsheets() {
  const [configs, setConfigs] = useState<CheatsheetConfig>({});
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    setIsLoading(true);
    const c = await loadConfigs();
    setConfigs(c);
    setIsLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const entries = Object.entries(configs);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter configured apps...">
      {entries.length === 0 ? (
        <List.EmptyView
          title="No Custom Cheatsheets"
          description="Use 'Set Cheatsheet URL' on a focused app to add one. Apps with vault notes work automatically."
          icon={Icon.Book}
        />
      ) : (
        entries.map(([bundleId, config]) => (
          <List.Item
            key={bundleId}
            title={config.appName}
            subtitle={config.url ?? config.vaultNote ?? "vault default"}
            accessories={[{ text: bundleId }]}
            icon={Icon.AppWindow}
            actions={
              <ActionPanel>
                {config.url?.startsWith("http") && (
                  <Action.OpenInBrowser title="Open URL" url={config.url} />
                )}
                <Action.CopyToClipboard title="Copy URL" content={config.url ?? ""} />
                <Action
                  title="Remove"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={async () => {
                    if (
                      await confirmAlert({
                        title: `Remove cheatsheet for ${config.appName}?`,
                        message: "This will revert to the vault note if one exists.",
                      })
                    ) {
                      await removeCheatsheet(bundleId);
                      await showToast({ style: Toast.Style.Success, title: "Removed" });
                      await refresh();
                    }
                  }}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
