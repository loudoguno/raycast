import { showHUD } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default async function Command() {
  try {
    await execAsync("open -a /Applications/BalloonsApp.app --args rainbow");
    await showHUD("🌈 Rainbow appearing!");
  } catch (error) {
    await showHUD("❌ BalloonsApp not found. Please build and install it first.");
    console.error(error);
  }
}
