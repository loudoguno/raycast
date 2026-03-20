import { Form, ActionPanel, Action, showToast, Toast, popToRoot } from "@raycast/api";
import { useEffect, useState } from "react";
import { getCurrentApp, setCheatsheetUrl, loadConfigs, AppInfo } from "./cheatsheet-store";

export default function SetCheatsheet() {
  const [app, setApp] = useState<AppInfo | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const currentApp = await getCurrentApp();
        setApp(currentApp);

        const configs = await loadConfigs();
        const existing = configs[currentApp.bundleId];
        if (existing?.url) {
          setCurrentUrl(existing.url);
        }
      } catch {
        await showToast({ style: Toast.Style.Failure, title: "Could not detect app" });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <Form
      isLoading={isLoading}
      navigationTitle={app ? `Set Cheatsheet for ${app.name}` : "Set Cheatsheet"}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save Cheatsheet URL"
            onSubmit={async (values: { url: string }) => {
              if (!app) return;
              await setCheatsheetUrl(app.bundleId, app.name, values.url);
              await showToast({
                style: Toast.Style.Success,
                title: `Cheatsheet saved for ${app.name}`,
              });
              await popToRoot();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Current App"
        text={app ? `${app.name} (${app.bundleId})` : "Detecting..."}
      />
      <Form.TextField
        id="url"
        title="Cheatsheet URL"
        placeholder="https://docs.example.com/shortcuts or file:///path/to/cheatsheet.md"
        defaultValue={currentUrl}
        info="Web URL opens in browser. file:// path renders markdown inline. Leave empty to use the vault note."
      />
    </Form>
  );
}
