import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

function getTerminalApp(): string {
  // Terminal.app lives in /System/Applications/Utilities/, not /Applications/
  const checks: [string, string][] = [
    ["Terminal", "/System/Applications/Utilities/Terminal.app"],
    ["Terminal", "/Applications/Terminal.app"],
    ["iTerm", "/Applications/iTerm.app"],
    ["Ghostty", "/Applications/Ghostty.app"],
  ];
  for (const [name, appPath] of checks) {
    try {
      fs.accessSync(appPath);
      return name;
    } catch {
      // Continue
    }
  }
  return "Terminal";
}

/**
 * Launch an interactive command in a new terminal window.
 * Writes a self-cleaning launcher script to /tmp to avoid
 * keystroke injection issues with long commands.
 */
export async function executeInTerminal(command: string): Promise<void> {
  const terminal = getTerminalApp();
  const home = os.homedir();
  const expandedCommand = command.replace(/~/g, home);

  // Write self-cleaning launcher script
  const scriptPath = path.join(os.tmpdir(), `burn-${Date.now()}.sh`);
  const scriptContent = [
    "#!/bin/bash",
    `trap 'rm -f "${scriptPath}"' EXIT`,
    expandedCommand,
  ].join("\n");
  fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });

  if (terminal === "iTerm") {
    const script = `
      tell application "iTerm"
        activate
        create window with default profile command "${scriptPath}"
      end tell
    `;
    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
  } else if (terminal === "Ghostty") {
    // Ghostty: open new window, keystroke just the short script path
    const script = `
      tell application "Ghostty" to activate
      delay 0.5
      tell application "System Events"
        keystroke "n" using command down
      end tell
      delay 0.3
      tell application "System Events"
        keystroke "${scriptPath}"
        keystroke return
      end tell
    `;
    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
  } else {
    // Terminal.app
    const script = `
      tell application "Terminal"
        activate
        do script "${scriptPath}"
      end tell
    `;
    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
  }
}

export { getTerminalApp };
