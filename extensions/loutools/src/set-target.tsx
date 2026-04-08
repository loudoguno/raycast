import { List, ActionPanel, Action, Icon, Color, showHUD, closeMainWindow } from "@raycast/api";
import { execSync } from "child_process";
import { isDisabled, setDisabled } from "./loutools";

const LOUTOOLS_PATH = "/usr/local/bin/loutools";

interface Target {
  name: string;
  description: string;
  icon: string;
}

const TARGETS: Target[] = [
  { name: "Disabled", description: "Do nothing — let shortcut reach other apps", icon: "⛔" },
  { name: "auto", description: "Auto-detect — prefer playing, then available", icon: "🔄" },
  { name: "YouTube", description: "Chrome tab — youtube.com", icon: "🎬" },
  { name: "Suno", description: "Chrome tab — suno.com", icon: "🎵" },
  { name: "Spotify", description: "Native app — AppleScript", icon: "🎧" },
  { name: "Apple Music", description: "Native app — AppleScript", icon: "🎶" },
  { name: "QuickTime", description: "Native app — local video/audio files", icon: "🎞️" },
  { name: "Web Player", description: "Any Chrome tab with audio/video", icon: "🌐" },
];

function getCurrentTarget(): string {
  if (isDisabled()) return "Disabled";
  try {
    const output = execSync(`${LOUTOOLS_PATH} remote target`, {
      encoding: "utf-8",
      timeout: 3000,
    });
    const match = output.match(/locked to: (.+)/);
    if (match) return match[1].trim();
    return "auto";
  } catch {
    return "auto";
  }
}

function setTarget(name: string): void {
  if (name === "Disabled") {
    setDisabled(true);
    return;
  }
  setDisabled(false);
  execSync(`${LOUTOOLS_PATH} remote target ${name}`, {
    encoding: "utf-8",
    timeout: 3000,
  });
}

export default function Command() {
  const current = getCurrentTarget();

  return (
    <List searchBarPlaceholder="Select remote target...">
      {TARGETS.map((t) => {
        const isCurrent = t.name.toLowerCase() === current.toLowerCase();
        return (
          <List.Item
            key={t.name}
            icon={t.icon}
            title={t.name}
            subtitle={t.description}
            accessories={isCurrent ? [{ tag: { value: "Active", color: Color.Green } }] : []}
            actions={
              <ActionPanel>
                <Action
                  title={`Set Target to ${t.name}`}
                  icon={Icon.Checkmark}
                  onAction={async () => {
                    setTarget(t.name);
                    await closeMainWindow();
                    const hudMsg =
                      t.name === "Disabled"
                        ? "Remote: Disabled — shortcuts pass through"
                        : t.name === "auto"
                          ? "Remote: Auto-detect"
                          : `Remote: ${t.name}`;
                    await showHUD(hudMsg);
                  }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
