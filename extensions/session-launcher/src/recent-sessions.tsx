import {
  List,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Icon,
  Color,
} from "@raycast/api";
import { useEffect, useState } from "react";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const HOME = os.homedir();
const LOGS_DIR = path.join(HOME, "logs");

interface SessionItem {
  id: string;
  date: string;
  time: string;
  machine: string;
  filename: string;
  filepath: string;
  projectPath: string | null;
  content: string;
  isActive: boolean;
}

function parseSessionFilename(filename: string): {
  date: string;
  time: string;
  machine: string;
  isActive: boolean;
} {
  const match = filename.match(
    /^(\d{4}-\d{2}-\d{2})-(\d{4})__([^-]+)(-active-claude-session|-session)\.md$/,
  );
  if (match) {
    const [, date, rawTime, machine, suffix] = match;
    const hours = rawTime.slice(0, 2);
    const minutes = rawTime.slice(2, 4);
    const time = `${hours}:${minutes}`;
    const isActive = suffix === "-active-claude-session";
    return { date, time, machine, isActive };
  }
  return { date: "", time: "", machine: "", isActive: false };
}

function extractProjectPath(content: string): string | null {
  const match = content.match(/\*\*Working Directory:\*\*\s*(.+)/);
  return match ? match[1].trim() : null;
}

function loadSessions(): SessionItem[] {
  const sessions: SessionItem[] = [];

  if (!fs.existsSync(LOGS_DIR)) return sessions;

  let dateDirs: string[] = [];
  try {
    dateDirs = fs
      .readdirSync(LOGS_DIR)
      .filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name))
      .sort()
      .reverse();
  } catch {
    return sessions;
  }

  for (const dateDir of dateDirs) {
    if (sessions.length >= 30) break;

    const datePath = path.join(LOGS_DIR, dateDir);
    let files: string[] = [];
    try {
      files = fs
        .readdirSync(datePath)
        .filter(
          (f) =>
            f.endsWith("-session.md") ||
            f.endsWith("-active-claude-session.md"),
        )
        .sort()
        .reverse();
    } catch {
      continue;
    }

    for (const filename of files) {
      if (sessions.length >= 30) break;

      const filepath = path.join(datePath, filename);
      let content = "";
      try {
        content = fs.readFileSync(filepath, "utf8");
      } catch {
        continue;
      }

      const { date, time, machine, isActive } = parseSessionFilename(filename);
      const projectPath = extractProjectPath(content);

      sessions.push({
        id: filepath,
        date,
        time,
        machine,
        filename,
        filepath,
        projectPath,
        content,
        isActive,
      });
    }
  }

  return sessions;
}

export default function RecentSessions() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const loaded = loadSessions();
      setSessions(loaded);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load sessions",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Group sessions by date for section headers
  const sessionsByDate = sessions.reduce<Record<string, SessionItem[]>>(
    (acc, session) => {
      const key = session.date || "Unknown Date";
      if (!acc[key]) acc[key] = [];
      acc[key].push(session);
      return acc;
    },
    {},
  );

  const dates = Object.keys(sessionsByDate).sort().reverse();

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder="Search recent sessions..."
    >
      {dates.map((date) => (
        <List.Section
          key={date}
          title={date}
          subtitle={`${sessionsByDate[date].length} sessions`}
        >
          {sessionsByDate[date].map((session) => {
            const titleParts = [`${session.time}`];
            if (session.machine) titleParts.push(`[${session.machine}]`);
            const title = titleParts.join(" ");

            const accessories = [];
            if (session.isActive) {
              accessories.push({
                icon: { source: Icon.Circle, tintColor: Color.Green },
                tooltip: "Active session",
              });
            }
            if (session.projectPath) {
              const shortPath = session.projectPath.replace(HOME, "~");
              accessories.push({ text: shortPath, tooltip: "Project path" });
            }

            return (
              <List.Item
                key={session.id}
                title={title}
                icon={{
                  source: Icon.Clock,
                  tintColor: session.isActive
                    ? Color.Green
                    : Color.SecondaryText,
                }}
                accessories={accessories}
                detail={
                  <List.Item.Detail
                    markdown={session.content}
                    metadata={
                      <List.Item.Detail.Metadata>
                        <List.Item.Detail.Metadata.Label
                          title="Date"
                          text={session.date}
                        />
                        <List.Item.Detail.Metadata.Label
                          title="Time"
                          text={session.time}
                        />
                        <List.Item.Detail.Metadata.Label
                          title="Machine"
                          text={session.machine}
                        />
                        {session.projectPath && (
                          <List.Item.Detail.Metadata.Label
                            title="Project"
                            text={session.projectPath.replace(HOME, "~")}
                          />
                        )}
                        <List.Item.Detail.Metadata.Label
                          title="Status"
                          text={session.isActive ? "Active" : "Completed"}
                          icon={
                            session.isActive
                              ? { source: Icon.Circle, tintColor: Color.Green }
                              : {
                                  source: Icon.CheckCircle,
                                  tintColor: Color.SecondaryText,
                                }
                          }
                        />
                      </List.Item.Detail.Metadata>
                    }
                  />
                }
                actions={
                  <ActionPanel>
                    <Action.Open
                      title="Open Session Log"
                      target={session.filepath}
                    />
                    {session.projectPath && (
                      <Action.Open
                        title="Open Project in Terminal"
                        target={session.projectPath}
                        application="Terminal"
                        icon={Icon.Terminal}
                      />
                    )}
                    {session.projectPath && (
                      <Action.CopyToClipboard
                        title="Copy Project Path"
                        content={session.projectPath}
                        icon={Icon.Clipboard}
                      />
                    )}
                    <Action.CopyToClipboard
                      title="Copy Session Path"
                      content={session.filepath}
                      icon={Icon.Clipboard}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      ))}

      {!isLoading && sessions.length === 0 && (
        <List.EmptyView
          title="No Sessions Found"
          description={`Looking in ${LOGS_DIR}`}
          icon={Icon.Clock}
        />
      )}
    </List>
  );
}
