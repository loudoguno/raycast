import {
  Action,
  ActionPanel,
  Color,
  Detail,
  Icon,
  List,
  showToast,
  Toast,
  getPreferenceValues,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { exec, execSync } from "child_process";
import { homedir } from "os";
import path from "path";
import fs from "fs";
import { shortenPath } from "./lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClaudeProcess {
  pid: number;
  tty: string;
  cpu: string;
  mem: string;
  startTime: string;
  command: string;
  cwd?: string;
}

interface SessionInfo {
  process: ClaudeProcess;
  sessionName?: string;
  sessionId?: string;
  summary?: string;
  lastActivity?: string;
  lastTool?: string;
  isWaitingForUser: boolean;
  gitBranch?: string;
  hasRemote: boolean;
  tabTitle?: string;
  remoteControlUrl?: string;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ActiveSessions() {
  const { data: sessions, isLoading, revalidate } = usePromise(discoverSessions);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search active Claude sessions...">
      {!sessions || sessions.length === 0 ? (
        <List.EmptyView
          title="No Active Claude Sessions"
          description="Start a Claude Code session in your terminal to see it here"
          icon={Icon.Terminal}
        />
      ) : (
        sessions.map((s) => (
          <List.Item
            key={s.process.pid}
            title={getSessionTitle(s)}
            subtitle={s.summary || s.process.cwd ? shortenPath(s.process.cwd || "") : undefined}
            icon={getStatusIcon(s)}
            accessories={getAccessories(s)}
            actions={
              <ActionPanel>
                <Action title="Switch to Session" icon={Icon.Terminal} onAction={() => switchToSession(s)} />
                <Action.Push title="View Details" icon={Icon.Eye} target={<SessionDetail session={s} />} />
                {s.sessionId && (
                  <Action.CopyToClipboard title="Copy Session ID" content={s.sessionId} shortcut={{ modifiers: ["cmd"], key: "i" }} />
                )}
                {s.sessionName && (
                  <Action.CopyToClipboard title="Copy Session Name" content={s.sessionName} shortcut={{ modifiers: ["cmd"], key: "n" }} />
                )}
                {s.remoteControlUrl && (
                  <Action.CopyToClipboard title="Copy Remote Control URL" content={s.remoteControlUrl} shortcut={{ modifiers: ["cmd"], key: "u" }} />
                )}
                {s.process.cwd && (
                  <Action.CopyToClipboard title="Copy Working Directory" content={s.process.cwd} shortcut={{ modifiers: ["cmd", "shift"], key: "c" }} />
                )}
                <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={revalidate} shortcut={{ modifiers: ["cmd"], key: "r" }} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}

// ─── Session Detail View ─────────────────────────────────────────────────────

function SessionDetail({ session: s }: { session: SessionInfo }) {
  const lines: string[] = [];
  lines.push(`# ${getSessionTitle(s)}`);
  lines.push("");

  if (s.summary) {
    lines.push(`> ${s.summary}`);
    lines.push("");
  }

  if (s.lastActivity) {
    lines.push("## Last Activity");
    lines.push(s.lastActivity);
    lines.push("");
  }

  lines.push("## Details");
  lines.push("");
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| PID | \`${s.process.pid}\` |`);
  if (s.sessionId) lines.push(`| Session ID | \`${s.sessionId}\` |`);
  if (s.sessionName) lines.push(`| Session Name | ${s.sessionName} |`);
  if (s.process.cwd) lines.push(`| Directory | \`${shortenPath(s.process.cwd)}\` |`);
  if (s.gitBranch) lines.push(`| Branch | \`${s.gitBranch}\` ${s.hasRemote ? "☁️" : ""} |`);
  lines.push(`| CPU | ${s.process.cpu}% |`);
  lines.push(`| Memory | ${s.process.mem} KB |`);
  lines.push(`| Started | ${s.process.startTime} |`);
  lines.push(`| Status | ${s.isWaitingForUser ? "⏳ Waiting for input" : "🔄 Working"} |`);
  if (s.lastTool) lines.push(`| Last Tool | \`${s.lastTool}\` |`);
  if (s.remoteControlUrl) lines.push(`| Remote Control | \`${s.remoteControlUrl}\` |`);

  return (
    <Detail
      markdown={lines.join("\n")}
      actions={
        <ActionPanel>
          <Action title="Switch to Session" icon={Icon.Terminal} onAction={() => switchToSession(s)} />
          {s.sessionId && <Action.CopyToClipboard title="Copy Session ID" content={s.sessionId} />}
          {s.sessionName && <Action.CopyToClipboard title="Copy Session Name" content={s.sessionName} />}
          {s.remoteControlUrl && <Action.CopyToClipboard title="Copy Remote Control URL" content={s.remoteControlUrl} />}
        </ActionPanel>
      }
    />
  );
}

// ─── Discovery ───────────────────────────────────────────────────────────────

async function discoverSessions(): Promise<SessionInfo[]> {
  // 1. Find running claude processes
  const processes = await findClaudeProcesses();
  if (processes.length === 0) return [];

  // 2. Get working directories for all processes
  await resolveWorkingDirs(processes);

  // 3. Get terminal tab titles
  const tabMap = await getTerminalTabTitles();

  // 4. Match processes to JSONL session data
  const sessions: SessionInfo[] = [];
  for (const proc of processes) {
    const session = await buildSessionInfo(proc, tabMap);
    sessions.push(session);
  }

  return sessions;
}

async function findClaudeProcesses(): Promise<ClaudeProcess[]> {
  try {
    const output = await runCmd("ps -eo pid,tty,pcpu,rss,lstart,args | grep -E '[c]laude' | grep -v 'Claude.app\\|Claude Helper\\|ray develop\\|esbuild\\|grep'");
    const lines = output.split("\n").filter(Boolean);
    const processes: ClaudeProcess[] = [];

    for (const line of lines) {
      const match = line.match(/^\s*(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(.{24})\s+(.+)$/);
      if (!match) continue;

      const tty = match[2];
      // Skip non-interactive processes (background daemons)
      if (tty === "??" || tty === "?") continue;

      processes.push({
        pid: parseInt(match[1]),
        tty: match[2],
        cpu: match[3],
        mem: match[4],
        startTime: match[5].trim(),
        command: match[6].trim(),
      });
    }

    return processes;
  } catch {
    return [];
  }
}

async function resolveWorkingDirs(processes: ClaudeProcess[]): Promise<void> {
  if (processes.length === 0) return;
  const pids = processes.map((p) => p.pid).join(",");
  try {
    const output = await runCmd(`lsof -a -p ${pids} -d cwd -Fn 2>/dev/null`);
    let currentPid: number | null = null;
    for (const line of output.split("\n")) {
      if (line.startsWith("p")) {
        currentPid = parseInt(line.slice(1));
      } else if (line.startsWith("n") && currentPid) {
        const proc = processes.find((p) => p.pid === currentPid);
        if (proc) proc.cwd = line.slice(1);
      }
    }
  } catch {
    // lsof may fail for some processes
  }
}

async function getTerminalTabTitles(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const script = `tell application "Terminal"
  set tabList to {}
  repeat with w in windows
    repeat with t in tabs of w
      set ttyName to tty of t
      set tabName to custom title of t
      if tabName is "" then set tabName to name of t
      set end of tabList to ttyName & "|||" & tabName
    end repeat
  end repeat
  return tabList as text
end tell`;
    const output = await runCmd(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
    for (const entry of output.split(", ")) {
      const [tty, title] = entry.split("|||");
      if (tty && title) {
        // Strip Claude status prefixes (braille chars, spinner chars)
        const cleanTitle = title.replace(/^[⠀-⣿✳⠿⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]+\s*/, "").trim();
        map.set(tty, cleanTitle);
      }
    }
  } catch {
    // Terminal may not be running or AppleScript may fail
  }
  return map;
}

async function buildSessionInfo(proc: ClaudeProcess, tabMap: Map<string, string>): Promise<SessionInfo> {
  const session: SessionInfo = {
    process: proc,
    isWaitingForUser: false,
    hasRemote: false,
    tabTitle: tabMap.get(proc.tty) || tabMap.get(`/dev/${proc.tty}`),
  };

  // Get git info
  if (proc.cwd) {
    try {
      const gitDir = path.join(proc.cwd, ".git");
      if (fs.existsSync(gitDir)) {
        session.gitBranch = execSync(`git -C "${proc.cwd}" branch --show-current 2>/dev/null`, { encoding: "utf-8" }).trim();
        const remote = execSync(`git -C "${proc.cwd}" remote 2>/dev/null`, { encoding: "utf-8" }).trim();
        session.hasRemote = !!remote;
      }
    } catch { /* ignore */ }
  }

  // Match to JSONL session file
  if (proc.cwd) {
    await matchSessionData(proc, session);
  }

  return session;
}

async function matchSessionData(proc: ClaudeProcess, session: SessionInfo): Promise<void> {
  const claudeProjectsDir = path.join(homedir(), ".claude", "projects");
  if (!fs.existsSync(claudeProjectsDir)) return;

  try {
    const projectDirs = fs.readdirSync(claudeProjectsDir);
    const candidates: { file: string; mtime: number }[] = [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    for (const dir of projectDirs) {
      const dirPath = path.join(claudeProjectsDir, dir);
      if (!fs.statSync(dirPath).isDirectory()) continue;

      const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".jsonl"));
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs > cutoff) {
          candidates.push({ file: filePath, mtime: stat.mtimeMs });
        }
      }
    }

    // Sort by most recent
    candidates.sort((a, b) => b.mtime - a.mtime);

    // Find best match by CWD
    for (const { file } of candidates) {
      const info = parseJsonlSession(file, proc.cwd!);
      if (info) {
        session.sessionId = path.basename(file, ".jsonl");
        session.sessionName = info.sessionName;
        session.summary = info.summary;
        session.lastActivity = info.lastActivity;
        session.lastTool = info.lastTool;
        session.isWaitingForUser = info.isWaitingForUser;
        session.remoteControlUrl = info.remoteControlUrl;
        return;
      }
    }
  } catch { /* ignore */ }
}

interface ParsedSession {
  sessionName?: string;
  summary?: string;
  lastActivity?: string;
  lastTool?: string;
  isWaitingForUser: boolean;
  remoteControlUrl?: string;
}

function parseJsonlSession(filePath: string, expectedCwd: string): ParsedSession | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    if (lines.length === 0) return null;

    let cwd: string | undefined;
    let sessionName: string | undefined;
    let summary: string | undefined;
    let lastActivity: string | undefined;
    let lastTool: string | undefined;
    let isWaitingForUser = false;
    let remoteControlUrl: string | undefined;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        // Get CWD from first entry
        if (!cwd && entry.cwd) {
          cwd = entry.cwd;
        }

        // Check CWD match
        if (cwd && cwd !== expectedCwd) return null;

        // Session name from /rename command
        if (entry.type === "system" && entry.subtype === "local_command") {
          const content = entry.content || "";
          if (content.includes("/rename")) {
            const argsMatch = content.match(/<command-args>(.*?)<\/command-args>/);
            if (argsMatch) sessionName = argsMatch[1];
          }
        }

        // First user message as summary
        if (!summary && entry.type === "user" && entry.message?.content) {
          const text = typeof entry.message.content === "string"
            ? entry.message.content
            : Array.isArray(entry.message.content)
              ? entry.message.content.find((b: { type: string }) => b.type === "text")?.text
              : undefined;
          if (text) {
            summary = text.slice(0, 120);
          }
        }

        // Last assistant activity
        if (entry.type === "assistant" && entry.message?.content) {
          const blocks = Array.isArray(entry.message.content) ? entry.message.content : [];
          for (const block of blocks) {
            if (block.type === "text" && block.text) {
              lastActivity = block.text.slice(0, 200);
            }
            if (block.type === "tool_use") {
              lastTool = block.name;
            }
          }
          isWaitingForUser = false;
        }

        if (entry.type === "user") {
          isWaitingForUser = false;
        }

        // Detect waiting state - last entry is assistant with result
        if (entry.type === "result") {
          isWaitingForUser = true;
        }

        // Remote control URL
        if (entry.remoteControlUrl) {
          remoteControlUrl = entry.remoteControlUrl;
        }
      } catch { /* skip malformed lines */ }
    }

    // Only return if CWD matched (or wasn't set)
    if (cwd && cwd !== expectedCwd) return null;

    return { sessionName, summary, lastActivity, lastTool, isWaitingForUser, remoteControlUrl };
  } catch {
    return null;
  }
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────

function getSessionTitle(s: SessionInfo): string {
  if (s.sessionName) return s.sessionName;
  if (s.tabTitle) return s.tabTitle;
  if (s.process.cwd) return path.basename(s.process.cwd);
  return `Claude (PID ${s.process.pid})`;
}

function getStatusIcon(s: SessionInfo): { source: Icon; tintColor: Color } {
  const cpuVal = parseFloat(s.process.cpu);
  if (cpuVal > 50) return { source: Icon.CircleFilled, tintColor: Color.Orange };
  if (s.isWaitingForUser) return { source: Icon.CircleFilled, tintColor: Color.Blue };
  return { source: Icon.CircleFilled, tintColor: Color.Green };
}

function getAccessories(s: SessionInfo): List.Item.Accessory[] {
  const accessories: List.Item.Accessory[] = [];

  const cpuVal = parseFloat(s.process.cpu);
  if (cpuVal > 50) {
    accessories.push({ tag: { value: "Working", color: Color.Orange } });
  } else if (s.isWaitingForUser) {
    accessories.push({ tag: { value: "Waiting", color: Color.Blue } });
  } else {
    accessories.push({ tag: { value: "Idle", color: Color.Green } });
  }

  if (s.gitBranch) {
    accessories.push({ text: `⑃ ${s.gitBranch}${s.hasRemote ? " ☁️" : ""}` });
  }

  if (s.lastTool) {
    accessories.push({ text: s.lastTool, icon: Icon.Hammer });
  }

  return accessories;
}

// ─── Terminal Navigation ─────────────────────────────────────────────────────

async function switchToSession(session: SessionInfo) {
  const tty = session.process.tty;

  try {
    // Try Terminal.app first
    const script = `tell application "Terminal"
  activate
  set targetTTY to "${tty}"
  if targetTTY does not start with "/dev/" then set targetTTY to "/dev/" & targetTTY
  repeat with w in windows
    repeat with t in tabs of w
      if tty of t is targetTTY then
        set selected of t to true
        set index of w to 1
        return "found"
      end if
    end repeat
  end repeat
  return "not found"
end tell`;

    const result = await runCmd(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
    if (result.includes("found")) {
      return;
    }

    // Fallback: just activate Terminal
    await runCmd(`osascript -e 'tell application "Terminal" to activate'`);
  } catch {
    await showToast({ style: Toast.Style.Failure, title: "Could not switch to session" });
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function runCmd(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 10000, maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
}
