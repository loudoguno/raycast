import { Detail, ActionPanel, Action, Icon, Color } from "@raycast/api";
import { useEffect, useState } from "react";
import { getStatus, formatTime, type MediaStatus } from "./loutools";

export default function Command() {
  const [status, setStatus] = useState<MediaStatus | null | "loading">("loading");

  useEffect(() => {
    setStatus(getStatus());
  }, []);

  if (status === "loading") {
    return <Detail isLoading markdown="Checking media status..." />;
  }

  if (!status) {
    return (
      <Detail
        markdown={`# No Active Media\n\nNo media target found. Open a YouTube or Suno tab in Chrome and try again.`}
        actions={
          <ActionPanel>
            <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={() => setStatus(getStatus())} />
          </ActionPanel>
        }
      />
    );
  }

  const playing = status.isPlaying ? "Playing" : "Paused";
  const playIcon = status.isPlaying ? "▶" : "⏸";
  const position = status.position != null ? formatTime(status.position) : "—";
  const duration = status.duration != null ? formatTime(status.duration) : "—";
  const speed = status.speed != null ? `${status.speed}x` : "—";
  const volume = status.volume != null ? `${status.volume}%` : "—";
  const title = status.title || "Unknown";

  // Progress bar
  let progressBar = "";
  if (status.position != null && status.duration != null && status.duration > 0) {
    const pct = Math.round((status.position / status.duration) * 100);
    const filled = Math.round(pct / 5);
    const empty = 20 - filled;
    progressBar = `${"█".repeat(filled)}${"░".repeat(empty)} ${pct}%`;
  }

  const md = [
    `# ${playIcon} ${title}`,
    "",
    `**${status.app}** — ${playing}`,
    "",
    progressBar ? `\`${progressBar}\`` : "",
    "",
    "| | |",
    "|---|---|",
    `| **Position** | ${position} / ${duration} |`,
    `| **Speed** | ${speed} |`,
    `| **Volume** | ${volume} |`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Detail
      markdown={md}
      actions={
        <ActionPanel>
          <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={() => setStatus(getStatus())} />
          {status.title && (
            <Action.CopyToClipboard title="Copy Title" content={status.title} shortcut={{ modifiers: ["cmd"], key: "c" }} />
          )}
        </ActionPanel>
      }
    />
  );
}
