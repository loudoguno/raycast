import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { environment } from "@raycast/api";

const execFileAsync = promisify(execFile);

function getHelperPath(): string {
  return path.join(environment.assetsPath, "status-menu-helper");
}

export async function clickAtPosition(
  x: number,
  y: number,
  button: "left" | "right" = "left",
): Promise<void> {
  const helperPath = getHelperPath();

  await execFileAsync(
    helperPath,
    ["click", String(x), String(y), button],
    { timeout: 5000 },
  );
}
