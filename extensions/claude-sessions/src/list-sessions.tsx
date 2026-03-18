import {
  List,
  ActionPanel,
  Action,
  Icon,
  Color,
  closeMainWindow,
} from "@raycast/api";
import { useEffect, useState, useCallback, useRef } from "react";
import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { basename, join } from "path";
import { homedir } from "os";

interface ClaudeSession {
  pid: number;
  tty: string;
  cwd: string;
  projectName: string;
  startedAt: Date;
  cpu: number;
  memMB: number;
  hasGit: boolean;
  hasGitRemote: boolean;
  branch: string | null;
  summary: string | null;
  sessionName: string | null;
  tabTitle: string | null;
  lastActivity: string | null;
  lastTool: string | null;
  isWaitingForUser: boolean;
  lastModified: number;
}

interface JsonlSessionInfo {
  filePath: string;
  cwd: string;
  birthEpoch: number;
  lastModified: number;
  summary: string | null;
  sessionName: string | null;
  lastActivity: string | null;
  lastTool: string | null;
  isWaitingForUser: boolean;
}

/**
 * Get terminal tab titles mapped by TTY path.
 */
function getTabTitles(): Record<string, string> {
  try {
    const output = execSync(
      `osascript -e '
tell application "Terminal"
    set output to ""
    repeat with w in windows
        set tabList to tabs of w
        repeat with t in tabList
            try
                set ttyPath to tty of t
                set tabCustom to custom title of t
                set output to output & ttyPath & "||" & tabCustom & "
"
            end try
        end repeat
    end repeat
    return output
end tell' 2>/dev/null`,
      { encoding: "utf-8", timeout: 3000 },
    ).trim();

    const titles: Record<string, string> = {};
    for (const line of output.split("\n")) {
      const [ttyPath, title] = line.split("||");
      if (ttyPath && title && title.trim()) {
        // /dev/ttys001 -> ttys001
        const tty = ttyPath.replace("/dev/", "");
        titles[tty] = title.trim();
      }
    }
    return titles;
  } catch {
    return {};
  }
}

/**
 * Scan all Claude project directories for active JSONL session files.
 */
function scanSessionFiles(): JsonlSessionInfo[] {
  const projectsDir = join(homedir(), ".claude", "projects");
  if (!existsSync(projectsDir)) return [];

  const results: JsonlSessionInfo[] = [];
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  try {
    for (const projectFolder of readdirSync(projectsDir)) {
      const projectPath = join(projectsDir, projectFolder);
      let entries: string[];
      try {
        entries = readdirSync(projectPath).filter((f) => f.endsWith(".jsonl"));
      } catch {
        continue;
      }

      for (const file of entries) {
        const filePath = join(projectPath, file);
        try {
          const stat = statSync(filePath);
          if (stat.mtimeMs < cutoff) continue;

          const birthEpoch = Math.floor(stat.birthtimeMs / 1000);
          const lastModified = stat.mtimeMs;
          const content = readFileSync(filePath, "utf-8");
          const lines = content.split("\n");

          // Get CWD from first line
          let cwd = "";
          try {
            const firstObj = JSON.parse(lines[0]);
            cwd = firstObj.cwd || "";
          } catch {
            continue;
          }
          if (!cwd) continue;

          // Extract first user message as summary
          let summary: string | null = null;
          let sessionName: string | null = null;

          // Extract last state
          let lastActivity: string | null = null;
          let lastTool: string | null = null;
          let isWaitingForUser = false;

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const obj = JSON.parse(line);
              const t = obj.type;

              // Extract session name from /rename commands
              if (t === "system" && obj.subtype === "local_command") {
                const content: string = obj.content || "";
                const renameMatch = content.match(
                  /<command-name>\/rename<\/command-name>[\s\S]*?<command-args>(.*?)<\/command-args>/,
                );
                if (renameMatch && renameMatch[1]) {
                  sessionName = renameMatch[1].trim();
                }
              }

              if (t === "user" && obj.message?.role === "user") {
                const text: string = obj.message.content;
                if (
                  text.includes("<command-name>") ||
                  text.includes("<local-command") ||
                  text.includes("<bash-input>")
                )
                  continue;
                const clean = text
                  .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
                  .trim();
                if (clean && !clean.includes("<task-notification>")) {
                  if (!summary)
                    summary =
                      clean.length > 120 ? clean.slice(0, 117) + "..." : clean;
                  isWaitingForUser = true;
                }
              } else if (t === "assistant") {
                const msg = obj.message || {};
                const blocks = msg.content;
                if (Array.isArray(blocks)) {
                  for (const block of blocks) {
                    if (block?.type === "text" && block.text?.trim()) {
                      lastActivity = block.text.trim();
                    } else if (block?.type === "tool_use") {
                      lastTool = block.name || null;
                    }
                  }
                }
                isWaitingForUser = false;
              }
            } catch {
              continue;
            }
          }

          // Trim last activity to reasonable length
          if (lastActivity && lastActivity.length > 200) {
            lastActivity = lastActivity.slice(-200);
          }

          results.push({
            filePath,
            cwd,
            birthEpoch,
            lastModified,
            summary,
            sessionName,
            lastActivity,
            lastTool,
            isWaitingForUser,
          });
        } catch {
          continue;
        }
      }
    }
  } catch {
    // ignore
  }

  return results;
}

/**
 * Get working directories for a list of PIDs using lsof.
 */
function getProcessCwds(pids: number[]): Record<number, string> {
  if (pids.length === 0) return {};
  try {
    const output = execSync(
      `lsof -a -p ${pids.join(",")} -d cwd -F pn 2>/dev/null; true`,
      { encoding: "utf-8", timeout: 5000 },
    ).trim();
    const cwds: Record<number, string> = {};
    let currentPid = 0;
    for (const line of output.split("\n")) {
      if (line.startsWith("p")) currentPid = parseInt(line.slice(1));
      else if (line.startsWith("n") && currentPid)
        cwds[currentPid] = line.slice(1);
    }
    return cwds;
  } catch {
    return {};
  }
}

/**
 * Match a process to a JSONL session by CWD (primary) and start time (tiebreaker).
 */
function matchSession(
  processCwd: string,
  startEpoch: number,
  sessions: JsonlSessionInfo[],
): JsonlSessionInfo | null {
  // First try: match by CWD, pick most recently modified
  const cwdMatches = sessions.filter((s) => s.cwd === processCwd);
  if (cwdMatches.length === 1) return cwdMatches[0];
  if (cwdMatches.length > 1) {
    // Multiple sessions in same CWD — pick closest birth time to process start
    let best: JsonlSessionInfo | null = null;
    let bestDiff = Infinity;
    for (const s of cwdMatches) {
      const diff = Math.abs(s.birthEpoch - startEpoch);
      if (diff < bestDiff) {
        best = s;
        bestDiff = diff;
      }
    }
    return best;
  }

  // Fallback: time-based matching with wider window (JSONL created after process starts)
  let best: JsonlSessionInfo | null = null;
  let bestDiff = Infinity;
  for (const s of sessions) {
    const diff = s.birthEpoch - startEpoch;
    if (diff >= 0 && diff < 300 && diff < bestDiff) {
      best = s;
      bestDiff = diff;
    }
  }
  return best;
}

async function switchToSession(tty: string): Promise<void> {
  await closeMainWindow();
  const script = `
    tell application "Terminal"
      activate
      set targetTTY to "${tty}"
      repeat with w in windows
        repeat with t in tabs of w
          if tty of t contains targetTTY then
            set selected tab of w to t
            set index of w to 1
            return
          end if
        end repeat
      end repeat
    end tell
  `;
  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 3000,
    });
  } catch {
    execSync(`open -a Terminal`, { timeout: 2000 });
  }
}

function getClaudeSessions(): ClaudeSession[] {
  const jsonlSessions = scanSessionFiles();
  const tabTitles = getTabTitles();

  let psOutput: string;
  try {
    psOutput = execSync(
      `ps -eo pid,tty,%cpu,rss,lstart,args | grep -E " claude( |$)" | grep -v grep | grep -v "Claude.app" | grep -v "Claude Helper" | grep -v "ray develop" | grep -v esbuild`,
      { encoding: "utf-8", timeout: 5000 },
    ).trim();
  } catch {
    return [];
  }

  if (!psOutput) return [];

  // First pass: collect all PIDs to batch-fetch CWDs
  const parsedProcesses: {
    pid: number;
    tty: string;
    cpu: number;
    rssKB: number;
    startedAt: Date;
    startEpoch: number;
  }[] = [];

  for (const line of psOutput.split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 10) continue;

    const pid = parseInt(parts[0]);
    const tty = parts[1];
    const cpu = parseFloat(parts[2]);
    const rssKB = parseInt(parts[3]);
    const startStr = parts.slice(4, 9).join(" ");
    const args = parts.slice(9).join(" ");

    if (!args.match(/^(\/.*\/)?claude(-code)?(\s|$)/)) continue;
    if (tty === "??" || tty === "?") continue; // Skip non-interactive processes (subagents, -p one-shots)

    const startedAt = new Date(startStr);
    if (isNaN(startedAt.getTime())) continue;
    const startEpoch = Math.floor(startedAt.getTime() / 1000);

    parsedProcesses.push({ pid, tty, cpu, rssKB, startedAt, startEpoch });
  }

  const processCwds = getProcessCwds(parsedProcesses.map((p) => p.pid));
  const sessions: ClaudeSession[] = [];

  for (const {
    pid,
    tty,
    cpu,
    rssKB,
    startedAt,
    startEpoch,
  } of parsedProcesses) {
    const processCwd = processCwds[pid] || "";
    const matched = matchSession(processCwd, startEpoch, jsonlSessions);
    const cwd = matched?.cwd || processCwd || "unknown";
    const summary = matched?.summary || null;
    const sessionName = matched?.sessionName || null;
    const lastActivity = matched?.lastActivity || null;
    const lastTool = matched?.lastTool || null;
    const isWaitingForUser = matched?.isWaitingForUser ?? false;
    const lastModified = matched?.lastModified ?? 0;

    // Tab title from Terminal.app
    const tabTitle = tabTitles[tty] || null;

    // Git info
    let hasGit = false;
    let hasGitRemote = false;
    let branch: string | null = null;

    if (cwd !== "unknown") {
      hasGit = existsSync(`${cwd}/.git`);
      if (hasGit) {
        try {
          branch =
            execSync(`git -C "${cwd}" branch --show-current 2>/dev/null`, {
              encoding: "utf-8",
              timeout: 2000,
            }).trim() || null;
        } catch {
          /* ignore */
        }
        try {
          const remotes = execSync(`git -C "${cwd}" remote 2>/dev/null`, {
            encoding: "utf-8",
            timeout: 2000,
          }).trim();
          hasGitRemote = remotes.length > 0;
        } catch {
          /* ignore */
        }
      }
    }

    const projectName = cwd !== "unknown" ? basename(cwd) : `claude (${tty})`;

    sessions.push({
      pid,
      tty,
      cwd,
      projectName,
      startedAt,
      cpu,
      memMB: Math.round(rssKB / 1024),
      hasGit,
      hasGitRemote,
      branch,
      summary,
      sessionName,
      tabTitle,
      lastActivity,
      lastTool,
      isWaitingForUser,
      lastModified,
    });
  }

  // Sort by most recently active, fallback to process start time
  sessions.sort(
    (a, b) =>
      (b.lastModified || b.startedAt.getTime()) -
      (a.lastModified || a.startedAt.getTime()),
  );

  return sessions;
}

function formatDuration(start: Date): string {
  const diffMs = Date.now() - start.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return "just started";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getStatusIcon(session: ClaudeSession): {
  source: Icon;
  tintColor: Color;
} {
  if (session.cpu > 20)
    return { source: Icon.CircleProgress50, tintColor: Color.Orange };
  if (session.isWaitingForUser)
    return { source: Icon.Circle, tintColor: Color.Blue };
  return { source: Icon.CheckCircle, tintColor: Color.Green };
}

function getStatusText(session: ClaudeSession): string {
  if (session.cpu > 20) return "Working";
  if (session.isWaitingForUser) return "Waiting for input";
  return "Idle";
}

function buildDetail(session: ClaudeSession): string {
  const lines: string[] = [];

  // Title section
  const detailTitle = session.sessionName || session.projectName;
  lines.push(`# ${detailTitle}`);
  lines.push("");

  // Status
  const status = getStatusText(session);
  const statusEmoji =
    session.cpu > 20
      ? "\u{1F7E0}"
      : session.isWaitingForUser
        ? "\u{1F535}"
        : "\u{1F7E2}";
  lines.push(
    `${statusEmoji} **${status}**${session.lastTool ? ` \u00B7 Last tool: \`${session.lastTool}\`` : ""}`,
  );
  lines.push("");

  // Initial prompt
  if (session.summary) {
    lines.push("---");
    lines.push("### Initial Prompt");
    lines.push(`> ${session.summary}`);
    lines.push("");
  }

  // Last activity
  if (session.lastActivity) {
    lines.push("---");
    lines.push("### Last Activity");
    // Take last ~300 chars and show as a block
    const activity =
      session.lastActivity.length > 300
        ? "..." + session.lastActivity.slice(-300)
        : session.lastActivity;
    lines.push(activity);
    lines.push("");
  }

  // Session details
  lines.push("---");
  lines.push("### Details");
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| **Path** | \`${session.cwd}\` |`);
  if (session.branch) {
    const gitIcon = session.hasGitRemote ? "\u2443\u2601\uFE0F" : "\u2443";
    lines.push(`| **Branch** | ${gitIcon} \`${session.branch}\` |`);
  }
  lines.push(
    `| **Started** | ${formatTime(session.startedAt)} (${formatDuration(session.startedAt)} ago) |`,
  );
  lines.push(`| **CPU** | ${session.cpu.toFixed(1)}% |`);
  lines.push(`| **Memory** | ${session.memMB} MB |`);
  lines.push(`| **PID** | ${session.pid} |`);
  lines.push(`| **TTY** | ${session.tty} |`);

  return lines.join("\n");
}

export default function ListSessions() {
  const [sessions, setSessions] = useState<ClaudeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    const result = getClaudeSessions();
    setSessions(result);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // Auto-refresh every 5 seconds
    intervalRef.current = setInterval(refresh, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder="Filter sessions..."
    >
      {sessions.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Terminal}
          title="No Active Claude Sessions"
          description="No Claude Code terminal sessions found running"
        />
      ) : (
        sessions.map((session) => {
          const statusIcon = getStatusIcon(session);
          // Strip Claude status prefix (braille chars like ⠐, ✳, etc.) from tab title
          const cleanTabTitle =
            session.tabTitle
              ?.replace(
                /^[\u2800-\u28FF\u2733\u2734\u2735\u25CF\u25CB\u25A0\u25A1]\s*/,
                "",
              )
              ?.trim() || null;
          const displayTitle =
            session.sessionName ||
            cleanTabTitle ||
            session.summary ||
            session.projectName;
          return (
            <List.Item
              key={session.pid}
              icon={statusIcon}
              title={displayTitle}
              accessories={[
                {
                  tag: {
                    value: getStatusText(session),
                    color: statusIcon.tintColor,
                  },
                },
              ]}
              detail={<List.Item.Detail markdown={buildDetail(session)} />}
              actions={
                <ActionPanel>
                  <ActionPanel.Section title="Session">
                    <Action
                      title="Switch to Session"
                      icon={Icon.Terminal}
                      onAction={() => switchToSession(session.tty)}
                    />
                  </ActionPanel.Section>
                  {session.cwd !== "unknown" && (
                    <ActionPanel.Section title="Open">
                      <Action.ShowInFinder
                        path={session.cwd}
                        shortcut={{ modifiers: ["cmd"], key: "f" }}
                      />
                      <Action.Open
                        title="Open in VS Code"
                        target={session.cwd}
                        application="com.microsoft.VSCode"
                        icon={Icon.Code}
                        shortcut={{ modifiers: ["cmd"], key: "o" }}
                      />
                    </ActionPanel.Section>
                  )}
                  <ActionPanel.Section title="Copy">
                    <Action.CopyToClipboard
                      title="Copy Path"
                      content={session.cwd}
                      shortcut={{ modifiers: ["cmd"], key: "c" }}
                    />
                    <Action.CopyToClipboard
                      title="Copy Pid"
                      content={String(session.pid)}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                    />
                    {session.lastActivity && (
                      <Action.CopyToClipboard
                        title="Copy Last Activity"
                        content={session.lastActivity}
                        shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
                      />
                    )}
                  </ActionPanel.Section>
                  <ActionPanel.Section>
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={refresh}
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
