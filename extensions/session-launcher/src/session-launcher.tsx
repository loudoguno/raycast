import { List, ActionPanel, Action, showToast, Toast, Icon, Color } from "@raycast/api";
import { useEffect, useState } from "react";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const HOME = os.homedir();
const LOGS_DIR = path.join(HOME, "logs");
const CODE_DIR = path.join(HOME, "code");

interface SessionItem {
  id: string;
  date: string;
  time: string;
  machine: string;
  filename: string;
  filepath: string;
  projectPath: string | null;
  subtitle: string;
  isActive: boolean;
}

interface HandoffItem {
  id: string;
  projectName: string;
  projectPath: string;
  handoffPath: string;
  subtitle: string;
  content: string;
}

function parseSessionFilename(filename: string): { date: string; time: string; machine: string; isActive: boolean } {
  // Pattern: 2026-01-31-1456__mx3-active-claude-session.md or 2026-01-31-2013__mx3-session.md
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(\d{4})__([^-]+)(-active-claude-session|-session)\.md$/);
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

function getFirstMeaningfulLine(content: string): string {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("---") && !trimmed.startsWith("**Machine:**")) {
      // Truncate long lines
      return trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed;
    }
  }
  return "No description";
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
    if (sessions.length >= 20) break;

    const datePath = path.join(LOGS_DIR, dateDir);
    let files: string[] = [];
    try {
      files = fs
        .readdirSync(datePath)
        .filter((f) => f.endsWith("-session.md") || f.endsWith("-active-claude-session.md"))
        .sort()
        .reverse();
    } catch {
      continue;
    }

    for (const filename of files) {
      if (sessions.length >= 20) break;

      const filepath = path.join(datePath, filename);
      let content = "";
      try {
        content = fs.readFileSync(filepath, "utf8");
      } catch {
        continue;
      }

      const { date, time, machine, isActive } = parseSessionFilename(filename);
      const subtitle = getFirstMeaningfulLine(content);
      const projectPath = extractProjectPath(content);

      sessions.push({
        id: filepath,
        date,
        time,
        machine,
        filename,
        filepath,
        projectPath,
        subtitle,
        isActive,
      });
    }
  }

  return sessions;
}

function loadHandoffs(): HandoffItem[] {
  const handoffs: HandoffItem[] = [];

  if (!fs.existsSync(CODE_DIR)) return handoffs;

  let projects: string[] = [];
  try {
    projects = fs.readdirSync(CODE_DIR).filter((name) => {
      const fullPath = path.join(CODE_DIR, name);
      try {
        return fs.statSync(fullPath).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return handoffs;
  }

  for (const project of projects) {
    const projectPath = path.join(CODE_DIR, project);
    const handoffPath = path.join(projectPath, "HANDOFF.md");

    if (!fs.existsSync(handoffPath)) continue;

    let content = "";
    try {
      content = fs.readFileSync(handoffPath, "utf8");
    } catch {
      continue;
    }

    const subtitle = getFirstMeaningfulLine(content);

    handoffs.push({
      id: handoffPath,
      projectName: project,
      projectPath,
      handoffPath,
      subtitle,
      content,
    });
  }

  // Sort by modification time (most recently modified first)
  handoffs.sort((a, b) => {
    try {
      const statA = fs.statSync(a.handoffPath).mtime.getTime();
      const statB = fs.statSync(b.handoffPath).mtime.getTime();
      return statB - statA;
    } catch {
      return 0;
    }
  });

  return handoffs;
}

function SessionActions({ session }: { session: SessionItem }) {
  return (
    <ActionPanel>
      <Action.Open title="Open Session Log" target={session.filepath} />
      {session.projectPath && (
        <Action.Open
          title="Open Project in Terminal"
          target={session.projectPath}
          application="Terminal"
          icon={Icon.Terminal}
        />
      )}
      {session.projectPath && (
        <Action.CopyToClipboard title="Copy Project Path" content={session.projectPath} icon={Icon.Clipboard} />
      )}
      <Action.CopyToClipboard title="Copy Session Path" content={session.filepath} icon={Icon.Clipboard} />
    </ActionPanel>
  );
}

function HandoffActions({ handoff }: { handoff: HandoffItem }) {
  return (
    <ActionPanel>
      <Action.Open title="Open Project in Terminal" target={handoff.projectPath} application="Terminal" icon={Icon.Terminal} />
      <Action.Open title="Open HANDOFF.md" target={handoff.handoffPath} icon={Icon.Document} />
      <Action.CopyToClipboard title="Copy Project Path" content={handoff.projectPath} icon={Icon.Clipboard} />
    </ActionPanel>
  );
}

export default function SessionLauncher() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [handoffs, setHandoffs] = useState<HandoffItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHandoff, setSelectedHandoff] = useState<HandoffItem | null>(null);

  useEffect(() => {
    try {
      const loadedSessions = loadSessions();
      const loadedHandoffs = loadHandoffs();
      setSessions(loadedSessions);
      setHandoffs(loadedHandoffs);
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

  const handoffDetail = selectedHandoff ? (
    <List.Item.Detail
      markdown={selectedHandoff.content}
    />
  ) : undefined;

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={handoffs.length > 0}
      searchBarPlaceholder="Search sessions and handoffs..."
    >
      {handoffs.length > 0 && (
        <List.Section title="Project Handoffs" subtitle={`${handoffs.length} projects`}>
          {handoffs.map((handoff) => (
            <List.Item
              key={handoff.id}
              title={handoff.projectName}
              subtitle={handoff.subtitle}
              icon={{ source: Icon.Folder, tintColor: Color.Blue }}
              detail={
                <List.Item.Detail
                  markdown={handoff.content}
                />
              }
              actions={<HandoffActions handoff={handoff} />}
              onAction={() => setSelectedHandoff(handoff)}
            />
          ))}
        </List.Section>
      )}

      {sessions.length > 0 && (
        <List.Section title="Recent Sessions" subtitle={`${sessions.length} sessions`}>
          {sessions.map((session) => {
            const accessory = session.isActive
              ? { icon: { source: Icon.Circle, tintColor: Color.Green }, tooltip: "Active session" }
              : { text: session.machine, tooltip: "Machine" };

            return (
              <List.Item
                key={session.id}
                title={`${session.date} ${session.time}`}
                subtitle={session.subtitle}
                accessories={[accessory]}
                icon={{ source: Icon.Clock, tintColor: session.isActive ? Color.Green : Color.SecondaryText }}
                detail={undefined}
                actions={<SessionActions session={session} />}
              />
            );
          })}
        </List.Section>
      )}

      {!isLoading && sessions.length === 0 && handoffs.length === 0 && (
        <List.EmptyView
          title="No Sessions or Handoffs Found"
          description={`Looking in ${LOGS_DIR} and ${CODE_DIR}`}
          icon={Icon.MagnifyingGlass}
        />
      )}
    </List>
  );
}
