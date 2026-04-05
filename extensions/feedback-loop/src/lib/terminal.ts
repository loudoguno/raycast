import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";

const execAsync = promisify(exec);
const HOME = process.env.HOME || "";

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

export async function executeInTerminal(command: string): Promise<void> {
  const terminal = getTerminalApp();
  const expandedCommand = command.replace(/~/g, HOME);

  // Escape double quotes for AppleScript string
  const escapedCommand = expandedCommand.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

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

  // Use heredoc-style execution to avoid shell quoting issues
  await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
}
