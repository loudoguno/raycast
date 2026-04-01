import {
  Action,
  ActionPanel,
  Detail,
  Form,
  Icon,
  showToast,
  Toast,
  getPreferenceValues,
  openCommandPreferences,
  useNavigation,
  environment,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";
import { exec } from "child_process";
import { homedir } from "os";
import path from "path";
import fs from "fs";
import {
  findClaudePath,
  expandTilde,
  shortenPath,
  projectName,
} from "./lib/utils";
import {
  loadProjects,
  touchProject,
  addProject,
  removeProject,
} from "./lib/project-store";

interface Preferences {
  defaultModel?: string;
  terminalApp?: string;
}

// ─── Main entry point ────────────────────────────────────────────────────────

export default function AskClaude() {
  const claudePath = findClaudePath();

  if (!claudePath) {
    return (
      <Detail
        markdown={`# Claude Code CLI Not Found

QuickClaude uses the \`claude\` CLI with your existing Claude Max subscription — **no API key needed**.

## Install Claude Code

\`\`\`bash
npm install -g @anthropic-ai/claude-code
\`\`\`

Then run \`claude\` once in your terminal to authenticate with your Claude account.

## Already installed?

Set the path manually in extension preferences.`}
        actions={
          <ActionPanel>
            <Action
              title="Open Preferences"
              icon={Icon.Gear}
              onAction={openCommandPreferences}
            />
            <Action.CopyToClipboard
              title="Copy Install Command"
              content="npm install -g @anthropic-ai/claude-code"
            />
          </ActionPanel>
        }
      />
    );
  }

  return <AskClaudeForm claudePath={claudePath} />;
}

// ─── Form ────────────────────────────────────────────────────────────────────

const ADD_NEW_VALUE = "__add_new__";

function AskClaudeForm({ claudePath }: { claudePath: string }) {
  const { push } = useNavigation();
  const prefs = getPreferenceValues<Preferences>();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(prefs.defaultModel || "sonnet");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualPath, setManualPath] = useState("");
  const [showManualPath, setShowManualPath] = useState(false);

  const { data: projects, revalidate: reloadProjects } =
    usePromise(loadProjects);

  // Detect duplicate basenames to show parent path for disambiguation
  const nameCount = new Map<string, number>();
  for (const p of projects || []) {
    const name = projectName(p.path);
    nameCount.set(name, (nameCount.get(name) || 0) + 1);
  }

  function displayTitle(projectPath: string): string {
    const name = projectName(projectPath);
    if ((nameCount.get(name) || 0) > 1) {
      return `${name}  —  ${shortenPath(projectPath)}`;
    }
    return name;
  }

  async function handleAddFromPicker(paths: string[]) {
    if (paths.length > 0) {
      const picked = paths[0];
      await addProject(picked);
      reloadProjects();
      setSelectedProject(picked);
      setShowManualPath(false);
    }
  }

  async function handleAddManualPath() {
    if (!manualPath.trim()) return;
    const expanded = expandTilde(manualPath.trim());
    if (!fs.existsSync(expanded)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Path does not exist",
        message: expanded,
      });
      return;
    }
    if (!fs.statSync(expanded).isDirectory()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Not a directory",
        message: expanded,
      });
      return;
    }
    await addProject(expanded);
    reloadProjects();
    setSelectedProject(expanded);
    setManualPath("");
    setShowManualPath(false);
    await showToast({
      style: Toast.Style.Success,
      title: "Project added",
      message: shortenPath(expanded),
    });
  }

  async function handleRemoveProject() {
    if (!selectedProject) return;
    await removeProject(selectedProject);
    setSelectedProject("");
    reloadProjects();
    await showToast({
      style: Toast.Style.Success,
      title: "Project removed",
    });
  }

  async function handleSubmit() {
    if (!prompt.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Please enter a prompt",
      });
      return;
    }

    const projectPath = selectedProject
      ? expandTilde(selectedProject)
      : homedir();

    await touchProject(projectPath);
    setIsSubmitting(true);
    await showToast({
      style: Toast.Style.Animated,
      title: "Asking Claude...",
      message: `Model: ${model}`,
    });

    try {
      const response = await runClaude(claudePath, prompt, model, projectPath);
      await showToast({
        style: Toast.Style.Success,
        title: "Response received",
      });
      push(
        <ResponseView
          response={response}
          model={model}
          projectPath={projectPath}
          claudePath={claudePath}
        />,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Claude error",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleProjectChange(value: string) {
    if (value === ADD_NEW_VALUE) {
      setShowManualPath(true);
    } else {
      setSelectedProject(value);
      setShowManualPath(false);
    }
  }

  return (
    <Form
      isLoading={!projects || isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Ask Claude"
            icon={Icon.Message}
            onSubmit={handleSubmit}
          />
          {showManualPath && (
            <Action
              title="Add Manual Path"
              icon={Icon.Plus}
              onAction={handleAddManualPath}
              shortcut={{ modifiers: ["cmd"], key: "return" }}
            />
          )}
          <Action
            title="Open in Terminal"
            icon={Icon.Terminal}
            shortcut={{ modifiers: ["cmd", "shift"], key: "return" }}
            onAction={async () => {
              const projectPath = selectedProject
                ? expandTilde(selectedProject)
                : homedir();
              await touchProject(projectPath);
              await launchInTerminal(
                claudePath,
                projectPath,
                prompt || undefined,
              );
            }}
          />
          {selectedProject && (
            <Action
              title="Remove Project"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["ctrl"], key: "x" }}
              onAction={handleRemoveProject}
            />
          )}
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="prompt"
        title="Prompt"
        placeholder="Ask Claude anything..."
        value={prompt}
        onChange={setPrompt}
        autoFocus
      />

      <Form.Dropdown id="model" title="Model" value={model} onChange={setModel}>
        <Form.Dropdown.Item
          value="sonnet"
          title="Sonnet (Balanced)"
          icon={Icon.Circle}
        />
        <Form.Dropdown.Item
          value="opus"
          title="Opus (Most Capable)"
          icon={Icon.Star}
        />
        <Form.Dropdown.Item
          value="haiku"
          title="Haiku (Fastest)"
          icon={Icon.Bolt}
        />
      </Form.Dropdown>

      <Form.Separator />

      <Form.Dropdown
        id="project"
        title="Project"
        value={selectedProject}
        onChange={handleProjectChange}
      >
        {projects?.map((p) => (
          <Form.Dropdown.Item
            key={p.path}
            value={p.path}
            title={displayTitle(p.path)}
            icon={Icon.Folder}
          />
        ))}
        <Form.Dropdown.Item
          value={ADD_NEW_VALUE}
          title="+ Add New..."
          icon={Icon.Plus}
        />
      </Form.Dropdown>

      {showManualPath && (
        <>
          <Form.FilePicker
            id="projectPicker"
            title="Browse"
            allowMultipleSelection={false}
            canChooseDirectories
            canChooseFiles={false}
            onChange={handleAddFromPicker}
          />
          <Form.TextField
            id="manualPath"
            title="Or Type Path"
            placeholder="~/code/my-project"
            value={manualPath}
            onChange={setManualPath}
            info="Press Cmd+Enter to add this path"
          />
        </>
      )}
    </Form>
  );
}

// ─── Response View ───────────────────────────────────────────────────────────

function ResponseView({
  response,
  model,
  projectPath,
  claudePath,
}: {
  response: ClaudeResponse;
  model: string;
  projectPath: string;
  claudePath: string;
}) {
  const markdown = `${response.text}

---
*Model: ${model} · Project: ${shortenPath(projectPath)}${response.sessionId ? ` · Session: \`${response.sessionId}\`` : ""}*`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Response"
            content={response.text}
          />
          <Action.Paste title="Paste Response" content={response.text} />
          {response.sessionId && (
            <Action.CopyToClipboard
              title="Copy Session ID"
              content={response.sessionId}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
          )}
          <Action
            title="Continue in Terminal"
            icon={Icon.Terminal}
            shortcut={{ modifiers: ["cmd"], key: "t" }}
            onAction={() =>
              launchInTerminal(
                claudePath,
                projectPath,
                undefined,
                response.sessionId,
              )
            }
          />
        </ActionPanel>
      }
    />
  );
}

// ─── Claude CLI ─────────────────────────────────────────────────────────────

interface ClaudeResponse {
  text: string;
  sessionId?: string;
}

function runClaude(
  claudePath: string,
  prompt: string,
  model: string,
  cwd: string,
): Promise<ClaudeResponse> {
  return new Promise((resolve, reject) => {
    // Write prompt to temp file to avoid shell escaping issues
    const tmpFile = path.join(environment.supportPath, "prompt.txt");
    fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    fs.writeFileSync(tmpFile, prompt, "utf-8");

    const cmd = `cat "${tmpFile}" | "${claudePath}" --print --model ${model} --output-format json`;

    exec(
      cmd,
      {
        cwd,
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          PATH: `${process.env.PATH}:/usr/local/bin:/opt/homebrew/bin`,
        },
      },
      (err, stdout, stderr) => {
        try {
          fs.unlinkSync(tmpFile);
        } catch {
          /* ignore */
        }

        if (err) {
          if (
            stderr?.includes("not authenticated") ||
            stderr?.includes("login")
          ) {
            reject(
              new Error(
                "Not authenticated. Run `claude` in your terminal first to log in.",
              ),
            );
            return;
          }
          reject(new Error(stderr || err.message));
          return;
        }

        try {
          const parsed = JSON.parse(stdout);
          resolve({
            text: parsed.result || parsed.text || parsed.content || stdout,
            sessionId: parsed.session_id || parsed.sessionId,
          });
        } catch {
          resolve({ text: stdout.trim() });
        }
      },
    );
  });
}

// ─── Terminal Launch ─────────────────────────────────────────────────────────

async function launchInTerminal(
  claudePath: string,
  cwd: string,
  prompt?: string,
  sessionId?: string,
) {
  const prefs = getPreferenceValues<Preferences>();
  const terminal = prefs.terminalApp || "Terminal";

  let cmd = `cd "${cwd}" && "${claudePath}"`;
  if (sessionId) {
    cmd += ` -r "${sessionId}"`;
  } else if (prompt) {
    // Write prompt to temp file, pipe it to claude, then clean up
    const tmpFile = path.join(environment.supportPath, "launch-prompt.txt");
    fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    fs.writeFileSync(tmpFile, prompt, "utf-8");
    cmd = `cd "${cwd}" && cat "${tmpFile}" | "${claudePath}"; rm -f "${tmpFile}"`;
  }

  const script = terminalScript(terminal, cmd);
  exec(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, (err) => {
    if (err) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to open terminal",
        message: err.message,
      });
    }
  });
}

function terminalScript(terminal: string, cmd: string): string {
  const escaped = cmd.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  switch (terminal) {
    case "iTerm":
      return `tell application "iTerm"
  activate
  set newWindow to (create window with default profile command "${escaped}")
end tell`;

    case "Warp":
      return `tell application "Warp" to activate
delay 0.5
tell application "System Events" to tell process "Warp" to keystroke "t" using command down
delay 0.3
tell application "System Events" to tell process "Warp" to keystroke "${escaped}"
tell application "System Events" to tell process "Warp" to key code 36`;

    case "kitty":
      return `do shell script "open -a kitty --args sh -c '${escaped}'"`;

    case "Ghostty":
      return `tell application "Ghostty" to activate
delay 0.5
tell application "System Events" to tell process "Ghostty" to keystroke "t" using command down
delay 0.3
tell application "System Events" to tell process "Ghostty" to keystroke "${escaped}"
tell application "System Events" to tell process "Ghostty" to key code 36`;

    default:
      return `tell application "Terminal"
  activate
  do script "${escaped}"
end tell`;
  }
}
