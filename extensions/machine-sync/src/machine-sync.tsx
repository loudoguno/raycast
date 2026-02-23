import { List, ActionPanel, Action, showToast, Toast, Icon, Color } from "@raycast/api";
import { useEffect, useState } from "react";
import { execSync } from "child_process";
import * as os from "os";

interface RepoStatus {
  path: string;
  label: string;
  machine: string;
  isGitRepo: boolean;
  isDirty: boolean;
  dirtyCount: number;
  ahead: number;
  behind: number;
  lastCommitMessage: string;
  lastCommitDate: string;
  lastCommitAuthor: string;
  branch: string;
  recentCommits: string[];
  fullStatus: string;
  error: string | null;
}

const WATCHED_REPOS = [
  { path: "~/keybindings", label: "Keybindings" },
  { path: "~/code/raycast", label: "Raycast Extensions" },
];

const OTHER_MACHINE = "mxb";

function expandPath(p: string): string {
  return p.replace(/^~/, os.homedir());
}

function git(cwd: string, args: string, timeout = 5000): string {
  return execSync(`git -C "${cwd}" ${args}`, { encoding: "utf8", timeout }).trim();
}

function parseAuthor(email: string): string {
  // GitHub noreply: "11282385+loudoguno@users.noreply.github.com" → "loudoguno"
  const ghMatch = email.match(/^\d+\+(.+)@users\.noreply\.github\.com$/);
  if (ghMatch) return ghMatch[1];
  // Regular email: take the local part
  return email.split("@")[0] || "unknown";
}

function getLocalRepoStatus(path: string, label: string, hostname: string): RepoStatus {
  const expanded = expandPath(path);
  const status: RepoStatus = {
    path, label, machine: hostname,
    isGitRepo: false, isDirty: false, dirtyCount: 0,
    ahead: 0, behind: 0,
    lastCommitMessage: "", lastCommitDate: "", lastCommitAuthor: "",
    branch: "", recentCommits: [], fullStatus: "", error: null,
  };

  try { git(expanded, "rev-parse --git-dir"); status.isGitRepo = true; }
  catch { status.error = "Not a git repository"; return status; }

  try { status.branch = git(expanded, "rev-parse --abbrev-ref HEAD"); } catch { status.branch = "unknown"; }

  try {
    const porcelain = git(expanded, "status --porcelain");
    status.fullStatus = porcelain;
    const lines = porcelain ? porcelain.split("\n") : [];
    status.dirtyCount = lines.length;
    status.isDirty = lines.length > 0;
  } catch { /* ignore */ }

  // Fetch remote (best-effort, short timeout)
  try { execSync(`git -C "${expanded}" fetch --quiet 2>/dev/null`, { timeout: 4000 }); } catch { /* offline */ }

  try {
    const remote = git(expanded, "rev-parse --abbrev-ref --symbolic-full-name @{u}");
    if (remote) {
      const ab = git(expanded, `rev-list --left-right --count HEAD...${remote}`);
      const parts = ab.split(/\s+/);
      status.ahead = parseInt(parts[0] ?? "0", 10) || 0;
      status.behind = parseInt(parts[1] ?? "0", 10) || 0;
    }
  } catch { /* no remote tracking */ }

  try {
    status.lastCommitMessage = git(expanded, "log -1 --format=%s");
    status.lastCommitDate = git(expanded, "log -1 --format=%cr");
    status.lastCommitAuthor = parseAuthor(git(expanded, "log -1 --format=%ae"));
  } catch { status.lastCommitMessage = "No commits"; }

  try {
    const log = git(expanded, "log -5 --format=%s___%cr___%ae --no-merges");
    status.recentCommits = log.split("\n").filter(Boolean).map((line) => {
      const [msg, date, email] = line.split("___");
      return `${msg} (${date}, ${parseAuthor(email || "")})`;
    });
  } catch { /* ignore */ }

  return status;
}

function getRemoteRepoStatus(host: string, path: string, label: string): RepoStatus {
  const status: RepoStatus = {
    path, label, machine: host,
    isGitRepo: false, isDirty: false, dirtyCount: 0,
    ahead: 0, behind: 0,
    lastCommitMessage: "", lastCommitDate: "", lastCommitAuthor: "",
    branch: "", recentCommits: [], fullStatus: "", error: null,
  };

  // Build script with escaped $() so expansion happens on remote, not local
  const script = [
    `cd ${path} 2>/dev/null || { echo NOTGIT; exit 0; }`,
    `git rev-parse --git-dir >/dev/null 2>&1 || { echo NOTGIT; exit 0; }`,
    `echo "BRANCH:\\$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"`,
    `echo "DIRTY:\\$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"`,
    `REMOTE=\\$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)`,
    `if [ -n "\\$REMOTE" ]; then AB=\\$(git rev-list --left-right --count HEAD...\\$REMOTE 2>/dev/null); echo "AHEAD:\\$(echo \\$AB | awk '{print \\$1}')"; echo "BEHIND:\\$(echo \\$AB | awk '{print \\$2}')"; fi`,
    `echo "MSG:\\$(git log -1 --format=%s 2>/dev/null)"`,
    `echo "DATE:\\$(git log -1 --format=%cr 2>/dev/null)"`,
    `echo "EMAIL:\\$(git log -1 --format=%ae 2>/dev/null)"`,
    `echo "STATUS:\\$(git status --porcelain 2>/dev/null | head -10)"`,
    `echo "RECENTLOG"`,
    `git log -5 --format=%s___%cr___%ae --no-merges 2>/dev/null`,
    `echo "ENDLOG"`,
  ].join("; ");

  try {
    const sshCmd = `ssh -o ConnectTimeout=5 -o BatchMode=yes ${host} "${script}"`;
    const raw = execSync(sshCmd, { encoding: "utf8", timeout: 12000 }).trim();

    let inLog = false;
    for (const line of raw.split("\n")) {
      if (line === "NOTGIT") { status.error = "Not a git repository"; return status; }
      if (line === "RECENTLOG") { inLog = true; continue; }
      if (line === "ENDLOG") { inLog = false; continue; }
      if (inLog && line.trim()) {
        const [msg, date, email] = line.split("___");
        status.recentCommits.push(`${msg} (${date}, ${parseAuthor(email || "")})`);
        continue;
      }
      if (line.startsWith("BRANCH:")) { status.isGitRepo = true; status.branch = line.slice(7); }
      else if (line.startsWith("DIRTY:")) { const n = parseInt(line.slice(6), 10) || 0; status.dirtyCount = n; status.isDirty = n > 0; }
      else if (line.startsWith("AHEAD:")) { status.ahead = parseInt(line.slice(6), 10) || 0; }
      else if (line.startsWith("BEHIND:")) { status.behind = parseInt(line.slice(7), 10) || 0; }
      else if (line.startsWith("MSG:")) { status.lastCommitMessage = line.slice(4); }
      else if (line.startsWith("DATE:")) { status.lastCommitDate = line.slice(5); }
      else if (line.startsWith("EMAIL:")) { status.lastCommitAuthor = parseAuthor(line.slice(6)); }
      else if (line.startsWith("STATUS:")) { status.fullStatus = line.slice(7); }
    }
  } catch (e) {
    const err = e as Error;
    status.error = err.message.includes("timed out") ? "SSH timeout" : "SSH failed";
  }

  return status;
}

function syncIcon(repo: RepoStatus): { icon: Icon; color: Color } {
  if (repo.error) return { icon: Icon.XMarkCircle, color: Color.Red };
  if (repo.isDirty) return { icon: Icon.Pencil, color: Color.Orange };
  if (repo.behind > 0) return { icon: Icon.ArrowDown, color: Color.Red };
  if (repo.ahead > 0) return { icon: Icon.ArrowUp, color: Color.Yellow };
  return { icon: Icon.Checkmark, color: Color.Green };
}

function statusText(repo: RepoStatus): string {
  if (repo.error) return repo.error;
  const parts: string[] = [];
  if (repo.branch) parts.push(repo.branch);
  if (repo.isDirty) parts.push(`${repo.dirtyCount} changed`);
  if (repo.ahead > 0) parts.push(`${repo.ahead} ahead`);
  if (repo.behind > 0) parts.push(`${repo.behind} behind`);
  if (!repo.isDirty && repo.ahead === 0 && repo.behind === 0) parts.push("clean");
  return parts.join(" · ");
}

function compareMachines(local: RepoStatus, remote: RepoStatus, localName: string): { icon: Icon; color: Color; text: string } {
  if (remote.error) return { icon: Icon.Wifi, color: Color.Red, text: `${OTHER_MACHINE}: ${remote.error}` };
  if (local.error) return { icon: Icon.XMarkCircle, color: Color.Red, text: `${localName}: ${local.error}` };

  const sameBranch = local.branch === remote.branch;
  const sameCommit = local.lastCommitMessage === remote.lastCommitMessage;

  if (sameBranch && sameCommit && !local.isDirty && !remote.isDirty) {
    return { icon: Icon.CheckCircle, color: Color.Green, text: "In sync" };
  }
  if (!sameBranch) {
    return { icon: Icon.ExclamationMark, color: Color.Orange, text: `${localName}: ${local.branch} — ${OTHER_MACHINE}: ${remote.branch}` };
  }
  if (local.isDirty || remote.isDirty) {
    const dirtyOn: string[] = [];
    if (local.isDirty) dirtyOn.push(`${localName} (${local.dirtyCount})`);
    if (remote.isDirty) dirtyOn.push(`${OTHER_MACHINE} (${remote.dirtyCount})`);
    return { icon: Icon.Pencil, color: Color.Orange, text: `Uncommitted on ${dirtyOn.join(" & ")}` };
  }
  return { icon: Icon.ExclamationMark, color: Color.Yellow, text: "Commits differ" };
}

function detailMarkdown(local: RepoStatus, remote: RepoStatus | undefined, localName: string): string {
  let md = `## ${local.label}\n\n`;

  // Comparison summary
  if (remote && !remote.error && !local.error) {
    const cmp = compareMachines(local, remote, localName);
    md += `**Status:** ${cmp.text}\n\n---\n\n`;
  }

  // Local
  md += `### ${localName}\n`;
  md += `- **Branch:** ${local.branch || "n/a"}\n`;
  md += `- **Status:** ${local.isDirty ? `${local.dirtyCount} uncommitted changes` : "Clean"}\n`;
  if (local.ahead > 0 || local.behind > 0) md += `- **Remote:** ${local.ahead} ahead, ${local.behind} behind\n`;
  if (local.fullStatus) md += `\n\`\`\`\n${local.fullStatus}\n\`\`\`\n`;
  if (local.recentCommits.length > 0) {
    md += `\n**Recent commits:**\n`;
    for (const c of local.recentCommits) md += `- ${c}\n`;
  }

  // Remote
  if (remote) {
    md += `\n---\n\n### ${OTHER_MACHINE}\n`;
    if (remote.error) {
      md += `- **Error:** ${remote.error}\n`;
    } else {
      md += `- **Branch:** ${remote.branch || "n/a"}\n`;
      md += `- **Status:** ${remote.isDirty ? `${remote.dirtyCount} uncommitted changes` : "Clean"}\n`;
      if (remote.ahead > 0 || remote.behind > 0) md += `- **Remote:** ${remote.ahead} ahead, ${remote.behind} behind\n`;
      if (remote.recentCommits.length > 0) {
        md += `\n**Recent commits:**\n`;
        for (const c of remote.recentCommits) md += `- ${c}\n`;
      }
    }
  }

  return md;
}

export default function MachineSyncDashboard() {
  const hostname = os.hostname().replace(".local", "");
  const [localRepos, setLocalRepos] = useState<RepoStatus[]>([]);
  const [remoteRepos, setRemoteRepos] = useState<RepoStatus[]>([]);
  const [remoteReachable, setRemoteReachable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);
    try {
      const locals = WATCHED_REPOS.map((r) => getLocalRepoStatus(r.path, r.label, hostname));
      setLocalRepos(locals);

      try {
        execSync(`ssh -o ConnectTimeout=5 -o BatchMode=yes ${OTHER_MACHINE} echo ok`, { encoding: "utf8", timeout: 8000 });
        setRemoteReachable(true);
        const remotes = WATCHED_REPOS.map((r) => getRemoteRepoStatus(OTHER_MACHINE, r.path, r.label));
        setRemoteRepos(remotes);
      } catch {
        setRemoteReachable(false);
        setRemoteRepos([]);
      }

      await showToast({ style: Toast.Style.Success, title: "Sync data loaded" });
    } catch (e) {
      const err = e as Error;
      await showToast({ style: Toast.Style.Failure, title: "Error loading sync data", message: err.message });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function handleGitAction(path: string, action: "push" | "pull") {
    const expanded = expandPath(path);
    try {
      execSync(`git -C "${expanded}" ${action}`, { encoding: "utf8", timeout: 15000 });
      showToast({ style: Toast.Style.Success, title: `Git ${action} complete` });
      loadData();
    } catch (e) {
      const err = e as Error;
      showToast({ style: Toast.Style.Failure, title: `Git ${action} failed`, message: err.message });
    }
  }

  function handleRemoteGitAction(path: string, action: "push" | "pull") {
    try {
      execSync(`ssh -o ConnectTimeout=5 -o BatchMode=yes ${OTHER_MACHINE} "cd ${path} && git ${action}"`, { encoding: "utf8", timeout: 15000 });
      showToast({ style: Toast.Style.Success, title: `${OTHER_MACHINE}: git ${action} complete` });
      loadData();
    } catch (e) {
      const err = e as Error;
      showToast({ style: Toast.Style.Failure, title: `${OTHER_MACHINE}: git ${action} failed`, message: err.message });
    }
  }

  function quickSync(localPath: string, remotePath: string) {
    showToast({ style: Toast.Style.Animated, title: "Quick Sync: pulling on both machines..." });
    const expanded = expandPath(localPath);
    let ok = true;
    try { execSync(`git -C "${expanded}" pull`, { encoding: "utf8", timeout: 15000 }); }
    catch { ok = false; showToast({ style: Toast.Style.Failure, title: `Local pull failed` }); }
    try { execSync(`ssh -o ConnectTimeout=5 -o BatchMode=yes ${OTHER_MACHINE} "cd ${remotePath} && git pull"`, { encoding: "utf8", timeout: 15000 }); }
    catch { ok = false; showToast({ style: Toast.Style.Failure, title: `${OTHER_MACHINE} pull failed` }); }
    if (ok) showToast({ style: Toast.Style.Success, title: "Both machines pulled successfully" });
    loadData();
  }

  function openInTerminal(path: string) {
    try { execSync(`open -a Terminal "${expandPath(path)}"`); } catch { /* ignore */ }
  }

  function sshToRemote() {
    try {
      execSync(`osascript -e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "ssh ${OTHER_MACHINE}"'`);
    } catch { /* ignore */ }
  }

  return (
    <List isLoading={isLoading} navigationTitle={`Machine Sync — ${hostname}`} isShowingDetail>
      {/* Sync Comparison */}
      <List.Section title="Sync Status">
        {localRepos.map((local, i) => {
          const remote = remoteRepos[i];
          if (!remote) {
            const si = syncIcon(local);
            return (
              <List.Item
                key={`sync-${local.path}`}
                icon={{ source: si.icon, tintColor: si.color }}
                title={local.label}
                accessories={[{ tag: remoteReachable === false ? "mxb offline" : "checking..." }]}
                detail={<List.Item.Detail markdown={detailMarkdown(local, undefined, hostname)} />}
                actions={
                  <ActionPanel>
                    <Action title="Refresh" icon={Icon.ArrowClockwise} shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={loadData} />
                  </ActionPanel>
                }
              />
            );
          }

          const cmp = compareMachines(local, remote, hostname);
          return (
            <List.Item
              key={`sync-${local.path}`}
              icon={{ source: cmp.icon, tintColor: cmp.color }}
              title={local.label}
              subtitle={cmp.text}
              accessories={[
                { tag: { value: `${hostname}: ${local.branch}`, color: local.isDirty ? Color.Orange : Color.Green } },
                { tag: { value: `${OTHER_MACHINE}: ${remote.branch || "?"}`, color: remote.isDirty ? Color.Orange : Color.Green } },
              ]}
              detail={<List.Item.Detail markdown={detailMarkdown(local, remote, hostname)} />}
              actions={
                <ActionPanel>
                  <Action title="Refresh" icon={Icon.ArrowClockwise} shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={loadData} />
                  <Action title="Quick Sync (Pull Both)" icon={Icon.Download} shortcut={{ modifiers: ["cmd"], key: "s" }} onAction={() => quickSync(local.path, remote.path)} />
                  <Action title={`Push (${hostname})`} icon={Icon.ArrowUp} onAction={() => handleGitAction(local.path, "push")} />
                  <Action title={`Pull (${hostname})`} icon={Icon.ArrowDown} onAction={() => handleGitAction(local.path, "pull")} />
                  <Action title={`Push (${OTHER_MACHINE})`} icon={Icon.ArrowUp} onAction={() => handleRemoteGitAction(remote.path, "push")} />
                  <Action title={`Pull (${OTHER_MACHINE})`} icon={Icon.ArrowDown} onAction={() => handleRemoteGitAction(remote.path, "pull")} />
                  <Action title="Open in Terminal" icon={Icon.Terminal} onAction={() => openInTerminal(local.path)} />
                  <Action title={`SSH to ${OTHER_MACHINE}`} icon={Icon.Terminal} onAction={sshToRemote} />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>

      {/* Local Machine */}
      <List.Section title={`${hostname} (this machine)`}>
        {localRepos.map((repo) => {
          const si = syncIcon(repo);
          return (
            <List.Item
              key={`local-${repo.path}`}
              icon={{ source: si.icon, tintColor: si.color }}
              title={repo.label}
              subtitle={repo.lastCommitMessage || "No commits"}
              accessories={[
                { text: statusText(repo) },
                ...(repo.lastCommitDate ? [{ text: repo.lastCommitDate }] : []),
                ...(repo.lastCommitAuthor ? [{ tag: { value: repo.lastCommitAuthor, color: Color.Blue } }] : []),
              ]}
              detail={<List.Item.Detail markdown={detailMarkdown(repo, remoteRepos.find((r) => r.path === repo.path), hostname)} />}
              actions={
                <ActionPanel>
                  <Action title="Refresh" icon={Icon.ArrowClockwise} shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={loadData} />
                  <Action title="Git Push" icon={Icon.ArrowUp} onAction={() => handleGitAction(repo.path, "push")} />
                  <Action title="Git Pull" icon={Icon.ArrowDown} onAction={() => handleGitAction(repo.path, "pull")} />
                  <Action title="Open in Terminal" icon={Icon.Terminal} onAction={() => openInTerminal(repo.path)} />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>

      {/* Remote Machine */}
      <List.Section title={`${OTHER_MACHINE} (via SSH)`}>
        {remoteReachable === false && (
          <List.Item
            key="remote-offline"
            icon={{ source: Icon.Wifi, tintColor: Color.Red }}
            title={`${OTHER_MACHINE} is unreachable`}
            subtitle="Check Tailscale connection"
            detail={<List.Item.Detail markdown={`## ${OTHER_MACHINE} Offline\n\nCould not connect via SSH. Check:\n- Tailscale is running on both machines\n- \`ssh mxb\` works from terminal`} />}
            actions={
              <ActionPanel>
                <Action title="Refresh" icon={Icon.ArrowClockwise} shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={loadData} />
                <Action title={`SSH to ${OTHER_MACHINE}`} icon={Icon.Terminal} onAction={sshToRemote} />
              </ActionPanel>
            }
          />
        )}
        {remoteRepos.map((repo) => {
          const si = syncIcon(repo);
          return (
            <List.Item
              key={`remote-${repo.path}`}
              icon={{ source: si.icon, tintColor: si.color }}
              title={repo.label}
              subtitle={repo.lastCommitMessage || "No commits"}
              accessories={[
                { text: statusText(repo) },
                ...(repo.lastCommitDate ? [{ text: repo.lastCommitDate }] : []),
                ...(repo.lastCommitAuthor ? [{ tag: { value: repo.lastCommitAuthor, color: Color.Blue } }] : []),
              ]}
              detail={<List.Item.Detail markdown={detailMarkdown(repo, localRepos.find((r) => r.path === repo.path), OTHER_MACHINE)} />}
              actions={
                <ActionPanel>
                  <Action title="Refresh" icon={Icon.ArrowClockwise} shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={loadData} />
                  <Action title={`Push (${OTHER_MACHINE})`} icon={Icon.ArrowUp} onAction={() => handleRemoteGitAction(repo.path, "push")} />
                  <Action title={`Pull (${OTHER_MACHINE})`} icon={Icon.ArrowDown} onAction={() => handleRemoteGitAction(repo.path, "pull")} />
                  <Action title={`SSH to ${OTHER_MACHINE}`} icon={Icon.Terminal} onAction={sshToRemote} />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}
