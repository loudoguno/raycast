import { open, showHUD, showToast, Toast, popToRoot, Form, ActionPanel, Action } from "@raycast/api";
import { useEffect, useState } from "react";
import { getCurrentApp, resolveCheatsheet, setCheatsheetUrl, AppInfo } from "./cheatsheet-store";

export default function ShowCheatsheet() {
  const [app, setApp] = useState<AppInfo | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const currentApp = await getCurrentApp();
        setApp(currentApp);

        const result = await resolveCheatsheet(currentApp);

        if (result.source === "none") {
          setNeedsSetup(true);
          setIsLoading(false);
          return;
        }

        // Open the cheatsheet
        await open(result.url);
        await showHUD(`📖 ${currentApp.name} cheatsheet`);
        await popToRoot();
      } catch (error) {
        await showToast({ style: Toast.Style.Failure, title: "Failed to load cheatsheet" });
        setIsLoading(false);
      }
    })();
  }, []);

  if (needsSetup && app) {
    return (
      <Form
        navigationTitle={`Set Cheatsheet for ${app.name}`}
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title="Save and Open"
              onSubmit={async (values: { url: string }) => {
                if (!values.url.trim()) {
                  await showToast({ style: Toast.Style.Failure, title: "URL is required" });
                  return;
                }
                const url = values.url.trim();
                await setCheatsheetUrl(app.bundleId, app.name, url);
                await open(url);
                await showHUD(`📖 Cheatsheet saved for ${app.name}`);
                await popToRoot();
              }}
            />
          </ActionPanel>
        }
      >
        <Form.Description
          title="No cheatsheet found"
          text={`No cheatsheet configured for ${app.name} (${app.bundleId}).\n\nYou can also run sync-sidenotes-cheatsheets.sh to pull from SideNotes, or create a vault note at ~/vaults/flote-vault/apps/${app.name}.md`}
        />
        <Form.TextField
          id="url"
          title="Cheatsheet URL"
          placeholder="https://docs.example.com/shortcuts"
          info="Enter a URL to open when you trigger this app's cheatsheet"
        />
      </Form>
    );
  }

  return null;
}
