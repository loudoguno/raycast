import { List, ActionPanel, Action, Icon, closeMainWindow } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";
import { useEffect, useState } from "react";
import { exec } from "child_process";

interface Terminal {
  name: string;
  icon: Icon;
  subtitle: string;
}

const terminals: Terminal[] = [
  { name: "Terminal", icon: Icon.Terminal, subtitle: "macOS built-in" },
  { name: "Ghostty", icon: Icon.Monitor, subtitle: "GPU-accelerated" },
  { name: "iTerm", icon: Icon.Window, subtitle: "Feature-rich" },
  { name: "Warp", icon: Icon.Bolt, subtitle: "AI-powered" },
];

function getFinderPath(): Promise<string> {
  return runAppleScript(`
    tell application "Finder"
      try
        if (count of windows) > 0 then
          return POSIX path of (target of front window as alias)
        end if
      end try
    end tell
    return POSIX path of (path to home folder)
  `);
}

function openTerminal(terminal: string, dir: string): void {
  closeMainWindow();

  switch (terminal) {
    case "Terminal":
      exec(`open -a Terminal ${JSON.stringify(dir)}`);
      break;
    case "Ghostty":
      exec(`open -n -a Ghostty --args --working-directory=${JSON.stringify(dir)}`);
      break;
    case "iTerm":
      runAppleScript(`
        tell application "iTerm"
          activate
          create window with default profile
          tell current session of current window
            write text "cd " & quoted form of "${dir}"
          end tell
        end tell
      `);
      break;
    case "Warp":
      exec(`open -a Warp ${JSON.stringify(dir)}`);
      break;
  }
}

export default function Command() {
  const [finderPath, setFinderPath] = useState<string | null>(null);

  useEffect(() => {
    getFinderPath().then(setFinderPath);
  }, []);

  const shortPath = finderPath ? finderPath.replace(/^\/Users\/[^/]+/, "~") : "";

  return (
    <List isLoading={!finderPath} searchBarPlaceholder="Search Finder actions...">
      <List.Section title="Open in Terminal" subtitle={shortPath}>
        {terminals.map((t) => (
          <List.Item
            key={t.name}
            title={t.name}
            subtitle={t.subtitle}
            icon={t.icon}
            actions={
              <ActionPanel>
                <Action
                  title={`Open in ${t.name}`}
                  icon={t.icon}
                  onAction={() => finderPath && openTerminal(t.name, finderPath)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
