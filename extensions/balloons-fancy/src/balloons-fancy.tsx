import { showHUD, open } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default async function Command() {
  try {
    // Launch the BalloonsApp
    await execAsync("open -a /Applications/BalloonsApp.app");

    // Show HUD confirmation
    await showHUD("🎈✨ Fancy Balloons launched!");
  } catch (error) {
    // If app not found, show helpful message
    await showHUD("❌ BalloonsApp not found. Please build and install it first.");
    console.error(error);
  }
}
