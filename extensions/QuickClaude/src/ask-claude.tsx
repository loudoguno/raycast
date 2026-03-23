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
import { useState, useRef } from "react";
import { exec } from "child_process";
import { homedir } from "os";
import path from "path";
import fs from "fs";
import { findClaudePath, expandTilde, shortenPath, projectName } from "./lib/utils";
import { loadProjects, touchProject, addProject, StoredProject } from "./lib/project-store";

interface Preferences {
  defaultModel?: string;
  claudeCodePath?: string;
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
            <Action title="Open Preferences" icon={Icon.Gear} onAction={openCommandPreferences} />
            <Action.CopyToClipboard title="Copy Install Command" content="npm install -g @anthropic-ai/claude-code" />
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
  const filePickerPaths = useRef<string[]>([]);

  const { data: projects, revalidate: reloadProjects } = usePromise(loadProjects);

  async function handleAddFromPicker(paths: string[]) {
    filePickerPaths.current = paths;
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
      await showToast({ style: Toast.Style.Failure, title: "Path does not exist", message: expanded });
      return;
    }
    if (!fs.statSync(expanded).isDirectory()) {
      await showToast({ style: Toast.Style.Failure, title: "Not a directory", message: expanded });
      return;
    }
    await addProject(expanded);
    reloadProjects();
    setSelectedProject(expanded);
    setManualPath("");
    setShowManualPath(false);
    await showToast({ style: Toast.Style.Success, title: "Project added", message: shortenPath(expanded) });
  }

  async function handleSubmit() {
    if (!prompt.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Please enter a prompt" });
      return;
    }

    const projectPath = selectedProject ? expandTilde(selectedProject) : path.join(homedir(), ".claude");

    // Record this project access
    await touchProject(projectPath);

    setIsSubmitting(true);
    await showToast({ style: Toast.Style.Animated, title: "Asking Claude...", message: `Model: ${model}` });

    try {
      const response = await runClaude(claudePath, prompt, model, projectPath);
      await showToast({ style: Toast.Style.Success, title: "Response received" });
      push(<ResponseView response={response} prompt={prompt} model={model} projectPath={projectPath} claudePath={claudePath} />);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Claude error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleProjectChange(value: string) {
    if (value === ADD_NEW_VALUE) {
      setShowManualPath(true);
      // Don't change selectedProject — keep current selection
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
          <Action.SubmitForm title="Ask Claude" icon={Icon.Message} onSubmit={handleSubmit} />
          {showManualPath && (
            <Action title="Add Manual Path" icon={Icon.Plus} onAction={handleAddManualPath} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          )}
          <Action title="Open Full Session in Terminal" icon={Icon.Terminal} shortcut={{ modifiers: ["cmd", "shift"], key: "return" }} onAction={async () => {
            const projectPath = selectedProject ? expandTilde(selectedProject) : path.join(homedir(), ".claude");
            await touchProject(projectPath);
            await launchInTerminal(claudePath, projectPath, prompt || undefined);
          }} />
        </ActionPanel>
      }
    >
      <Form.TextArea id="prompt" title="Prompt" placeholder="Ask Claude anything..." value={prompt} onChange={setPrompt} autoFocus />

      <Form.Dropdown id="model" title="Model" value={model} onChange={setModel}>
        <Form.Dropdown.Item value="sonnet" title="Sonnet (Balanced)" icon={Icon.Circle} />
        <Form.Dropdown.Item value="opus" title="Opus (Most Capable)" icon={Icon.Star} />
        <Form.Dropdown.Item value="haiku" title="Haiku (Fastest)" icon={Icon.Bolt} />
      </Form.Dropdown>

      <Form.Separator />

      <Form.Dropdown id="project" title="Project" value={selectedProject} onChange={handleProjectChange}>
        {projects?.map((p) => (
          <Form.Dropdown.Item
            key={p.path}
            value={p.path}
            title={projectName(p.path)}
            icon={Icon.Folder}
          />
        ))}
        <Form.Dropdown.Item value={ADD_NEW_VALUE} title="+ Add New..." icon={Icon.Plus} />
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
            placeholder="~/code/my-project (supports ~)"
            value={manualPath}
            onChange={setManualPath}
            info="Press ⌘+Enter to add this path"
          />
        </>
      )}
    </Form>
  );
}

// ─── Response View ───────────────────────────────────────────────────────────

interface ResponseViewProps {
  response: ClaudeResponse;
  prompt: string;
  model: string;
  projectPath: string;
  claudePath: string;
}

function ResponseView({ response, prompt, model, projectPath, claudePath }: ResponseViewProps) {
  const markdown = `${response.text}

---
*Model: ${model} · Project: ${shortenPath(projectPath)}${response.sessionId ? ` · Session: \`${response.sessionId}\`` : ""}*`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Response" content={response.text} />
          <Action.Paste title="Paste Response" content={response.text} />
          {response.sessionId && (
            <Action.CopyToClipboard title="Copy Session ID" content={response.sessionId} shortcut={{ modifiers: ["cmd", "shift"], key: "c" }} />
          )}
          <Action
            title="Continue in Terminal"
            icon={Icon.Terminal}
            shortcut={{ modifiers: ["cmd"], key: "t" }}
            onAction={() => launchInTerminal(claudePath, projectPath, undefined, response.sessionId)}
          />
        </ActionPanel>
      }
    />
  );
}

// ─── Claude CLI Integration ──────────────────────────────────────────────────

interface ClaudeResponse {
  text: string;
  sessionId?: string;
}

function runClaude(claudePath: string, prompt: string, model: string, cwd: string): Promise<ClaudeResponse> {
  return new Promise((resolve, reject) => {
    // Write prompt to temp file to avoid shell escaping issues
    const tmpFile = path.join(environment.supportPath, "prompt.txt");
    fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    fs.writeFileSync(tmpFile, prompt, "utf-8");

    // Use --print for non-interactive mode (uses Max subscription, no API key needed)
    const args = [
      "--print",
      "--model", model,
      "--output-format", "json",
    ];

    const cmd = `cat "${tmpFile}" | "${claudePath}" ${args.join(" ")}`;

    exec(cmd, {
      cwd,
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        PATH: `${process.env.PATH}:/usr/local/bin:/opt/homebrew/bin`,
      },
    }, (err, stdout, stderr) => {
      // Clean up temp file
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }

      if (err) {
        // Check if it's an auth issue
        if (stderr?.includes("not authenticated") || stderr?.includes("login")) {
          reject(new Error("Not authenticated. Run `claude` in your terminal first to log in with your Claude account."));
          return;
        }
        reject(new Error(stderr || err.message));
        return;
      }

      try {
        // Try to parse JSON output
        const parsed = JSON.parse(stdout);
        resolve({
          text: parsed.result || parsed.text || parsed.content || stdout,
          sessionId: parsed.session_id || parsed.sessionId,
        });
      } catch {
        // Fallback to raw text output
        resolve({ text: stdout.trim() });
      }
    });
  });
}

// ─── Terminal Launch ─────────────────────────────────────────────────────────

async function launchInTerminal(claudePath: string, cwd: string, prompt?: string, sessionId?: string) {
  const prefs = getPreferenceValues<{ terminalApp?: string }>();
  const terminal = prefs.terminalApp || "Terminal";

  let cmd = `cd "${cwd}" && "${claudePath}"`;
  if (sessionId) {
    cmd += ` --resume "${sessionId}"`;
  } else if (prompt) {
    // Write prompt to temp file for complex prompts
    const tmpFile = path.join(environment.supportPath, "launch-prompt.txt");
    fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    fs.writeFileSync(tmpFile, prompt, "utf-8");
    cmd += ` --prompt-file "${tmpFile}"`;
  }

  const appleScript = getTerminalLaunchScript(terminal, cmd);

  exec(`osascript -e '${appleScript.replace(/'/g, "'\"'\"'")}'`, (err) => {
    if (err) {
      showToast({ style: Toast.Style.Failure, title: "Failed to open terminal", message: err.message });
    }
  });
}

function getTerminalLaunchScript(terminal: string, cmd: string): string {
  const escapedCmd = cmd.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  switch (terminal) {
    case "iTerm":
      return `tell application "iTerm"
  activate
  set newWindow to (create window with default profile command "${escapedCmd}")
end tell`;

    case "Warp":
      return `tell application "Warp" to activate
delay 0.5
tell application "System Events" to tell process "Warp" to keystroke "t" using command down
delay 0.3
tell application "System Events" to tell process "Warp" to keystroke "${escapedCmd}"
tell application "System Events" to tell process "Warp" to key code 36`;

    case "kitty":
      return `do shell script "open -a kitty --args sh -c '${escapedCmd}'"`;

    case "Ghostty":
      return `tell application "Ghostty" to activate
delay 0.5
tell application "System Events" to tell process "Ghostty" to keystroke "t" using command down
delay 0.3
tell application "System Events" to tell process "Ghostty" to keystroke "${escapedCmd}"
tell application "System Events" to tell process "Ghostty" to key code 36`;

    default: // Terminal
      return `tell application "Terminal"
  activate
  do script "${escapedCmd}"
end tell`;
  }
}
