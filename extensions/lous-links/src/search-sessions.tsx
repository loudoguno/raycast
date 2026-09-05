/**
 * Search Sessions — every Claude, Codex and Hermes session in one list.
 *
 * Reads the index at ~/.local/share/lous-links/sessions.json, which is produced
 * by sessions/collect.ts (owned separately). If the index is missing this shows
 * a single actionable row rather than an empty view.
 */
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  Action,
  ActionPanel,
  Icon,
  List,
  Toast,
  showToast,
  Keyboard,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useMemo, useState } from "react";
import {
  AGENT_KINDS,
  SESSIONS_INDEX_PATH,
  readSessionsIndex,
  type AgentSession,
} from "./lib/sessions";
import { getPrefs, webUrl } from "./lib/prefs";

const run = promisify(execFile);

const AGENT_ICON: Record<string, Icon> = {
  "claude-code": Icon.Terminal,
  "claude-code-bg": Icon.Clock,
  "claude-ai": Icon.Message,
  "codex-cli": Icon.Code,
  "codex-desktop": Icon.Desktop,
  hermes: Icon.Envelope,
  cowork: Icon.TwoPeople,
  other: Icon.Circle,
};

export default function Command() {
  const prefs = useMemo(() => getPrefs(), []);
  const [agent, setAgent] = useState<string>("all");

  const { data, isLoading, revalidate } = useCachedPromise(
    async () => readSessionsIndex(),
    [],
    {
      keepPreviousData: true,
      onError: (error) =>
        showToast({
          style: Toast.Style.Failure,
          title: "Could not read the session index",
          message: error.message,
        }),
    },
  );

  const sessions = useMemo(() => {
    const all = data?.sessions ?? [];
    return agent === "all" ? all : all.filter((s) => s.agent === agent);
  }, [data, agent]);

  async function rebuild() {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Rebuilding the session index…",
    });
    try {
      await runCollector(prefs.repoPath);
      toast.style = Toast.Style.Success;
      toast.title = "Session index rebuilt";
      revalidate();
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Collector failed";
      toast.message = error instanceof Error ? error.message : String(error);
    }
  }

  const rebuildAction = (
    <Action
      title="Rebuild Index"
      icon={Icon.ArrowClockwise}
      shortcut={Keyboard.Shortcut.Common.Refresh}
      onAction={rebuild}
    />
  );

  if (!isLoading && !data) {
    return (
      <List>
        <List.Item
          icon={Icon.ExclamationMark}
          title="Index not built yet"
          subtitle={SESSIONS_INDEX_PATH}
          actions={<ActionPanel>{rebuildAction}</ActionPanel>}
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search sessions by title, goal, summary, cwd, project…"
      searchBarAccessory={
        <List.Dropdown tooltip="Agent" value={agent} onChange={setAgent}>
          <List.Dropdown.Item title="All agents" value="all" />
          {AGENT_KINDS.map((kind) => (
            <List.Dropdown.Item key={kind} title={kind} value={kind} />
          ))}
        </List.Dropdown>
      }
    >
      <List.EmptyView
        icon={Icon.MagnifyingGlass}
        title="No sessions"
        description="Rebuild the index with ⌘R, or run `ll sessions collect`."
      />
      {sessions.map((session) => (
        <List.Item
          key={`${session.machine}:${session.id}`}
          icon={AGENT_ICON[session.agent] ?? Icon.Circle}
          title={session.title || session.id}
          subtitle={session.goal ?? session.cwd ?? ""}
          keywords={keywordsFor(session)}
          accessories={accessoriesFor(session)}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                {session.url ? (
                  <Action.OpenInBrowser
                    title="Open Session"
                    url={session.url}
                  />
                ) : null}
                {session.resume ? (
                  <Action.CopyToClipboard
                    title="Copy Resume Command"
                    content={session.resume}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                ) : null}
                {session.cwd ? (
                  <Action.CopyToClipboard
                    title="Copy Working Directory"
                    content={session.cwd}
                    shortcut={Keyboard.Shortcut.Common.Copy}
                  />
                ) : null}
                {session.source ? (
                  <Action.ShowInFinder
                    title="Open Source File in Finder"
                    path={session.source}
                    shortcut={{ modifiers: ["cmd"], key: "f" }}
                  />
                ) : null}
              </ActionPanel.Section>

              <ActionPanel.Section>
                <Action.OpenInBrowser
                  title="Reveal in Lous-Links Web"
                  url={webUrl(prefs.baseUrl)}
                  shortcut={{ modifiers: ["cmd"], key: "l" }}
                />
                {rebuildAction}
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

/** Run the collector out of the checkout, with a PATH that can find bun. */
async function runCollector(repoPath: string): Promise<string> {
  const root = repoPath.replace(/^~(?=$|\/)/, homedir());
  const script = join(
    root,
    "extensions",
    "lous-links",
    "sessions",
    "collect.ts",
  );
  const home = homedir();
  const { stdout } = await run("bun", [script], {
    env: {
      ...process.env,
      PATH: [
        join(home, ".bun", "bin"),
        "/opt/homebrew/bin",
        "/usr/local/bin",
        process.env.PATH ?? "",
      ].join(":"),
    },
  });
  return stdout;
}

function keywordsFor(session: AgentSession): string[] {
  return [
    session.goal ?? "",
    session.summary ?? "",
    session.cwd ?? "",
    (session.projects ?? []).join(" "),
    (session.tags ?? []).join(" "),
    session.agent,
    session.machine,
    session.id,
  ]
    .join(" ")
    .split(/[\s,/]+/)
    .filter(Boolean);
}

function accessoriesFor(session: AgentSession): List.Item.Accessory[] {
  const out: List.Item.Accessory[] = [{ tag: session.agent }];
  if (session.machine) out.push({ text: session.machine });
  if (session.turns) out.push({ text: `${session.turns} turns` });
  const started = new Date(session.started);
  if (!Number.isNaN(started.getTime())) out.push({ date: started });
  return out;
}
