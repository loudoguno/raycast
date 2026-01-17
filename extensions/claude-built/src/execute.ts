import { open, showHUD, Clipboard } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { RegistryItem } from "./types";
import { updateUsage, getFolderPath, expandPath } from "./registry";

const execAsync = promisify(exec);
const HOME = process.env.HOME || "";

// Detect terminal app (matching existing pattern from ask-pai.sh)
function getTerminalApp(): string {
  const apps = ["Ghostty", "iTerm", "Terminal"];
  for (const app of apps) {
    try {
      fs.accessSync(`/Applications/${app}.app`);
      return app;
    } catch {
      // Continue to next app
    }
  }
  return "Terminal";
}

export async function executeItem(item: RegistryItem): Promise<void> {
  updateUsage(item.id);

  const { execution } = item;

  switch (execution.type) {
    case "terminal":
      await executeInTerminal(execution.command || "");
      await showHUD(`Launched ${item.name}`);
      break;

    case "raycast-deeplink":
      if (execution.deeplink) {
        await open(execution.deeplink);
      }
      break;

    case "shell":
      // Copy to clipboard since we can't inject into current shell
      if (execution.command) {
        await Clipboard.copy(execution.command);
        await showHUD(`Copied: ${execution.command}`);
      }
      break;

    case "open":
      const expandedPath = item.path.replace(/~/g, HOME);
      await execAsync(`open "${expandedPath}"`);
      await showHUD(`Opened ${item.name}`);
      break;
  }
}

async function executeInTerminal(command: string): Promise<void> {
  const terminal = getTerminalApp();
  const expandedCommand = command.replace(/~/g, HOME);

  // Escape single quotes in the command for AppleScript
  const escapedCommand = expandedCommand.replace(/'/g, "'\\''");

  // Use osascript to open terminal and run command (matching existing pattern)
  const script = `
    tell application "${terminal}"
      activate
    end tell
    delay 0.3
    tell application "System Events"
      keystroke "${escapedCommand}"
      keystroke return
    end tell
  `;

  await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
}

// Open folder in terminal
export async function openFolderInTerminal(itemPath: string): Promise<void> {
  const folder = getFolderPath(itemPath);
  await executeInTerminal(`cd "${folder}"`);
  await showHUD(`Opened folder in terminal`);
}

// Open in Claude Code
export async function openInClaudeCode(itemPath: string): Promise<void> {
  const folder = getFolderPath(itemPath);
  await executeInTerminal(`cd "${folder}" && claude`);
  await showHUD(`Opened in Claude Code`);
}

// View git history for a file
export async function viewGitHistory(itemPath: string): Promise<void> {
  const expanded = expandPath(itemPath);
  const folder = getFolderPath(itemPath);
  const filename = path.basename(expanded);
  await executeInTerminal(`cd "${folder}" && git log --oneline -20 "${filename}"`);
  await showHUD(`Showing git history`);
}

// Open file in default editor
export async function openInEditor(itemPath: string): Promise<void> {
  const expanded = expandPath(itemPath);
  // Try VS Code first, then Cursor, then default
  try {
    await execAsync(`code "${expanded}"`);
    await showHUD(`Opened in VS Code`);
  } catch {
    try {
      await execAsync(`cursor "${expanded}"`);
      await showHUD(`Opened in Cursor`);
    } catch {
      await execAsync(`open "${expanded}"`);
      await showHUD(`Opened in default editor`);
    }
  }
}

// Open documentation if it exists
export async function openDocumentation(docPath: string): Promise<void> {
  await execAsync(`open "${docPath}"`);
  await showHUD(`Opened documentation`);
}

// Get terminal app (exported for use elsewhere)
export { getTerminalApp };
