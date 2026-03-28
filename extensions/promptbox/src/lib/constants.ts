import * as os from "os";
import * as path from "path";

export const HOME = os.homedir();
export const PROMPTBOX_DIR = path.join(
  HOME,
  "Library",
  "Mobile Documents",
  "com~apple~CloudDocs",
  "CloudClaude",
  "Promptbox",
);

export const STAGES = ["inbox", "wip", "outbox", "complete"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_DIRS: Record<Stage, string> = {
  inbox: path.join(PROMPTBOX_DIR, "inbox"),
  wip: path.join(PROMPTBOX_DIR, "wip"),
  outbox: path.join(PROMPTBOX_DIR, "outbox"),
  complete: path.join(PROMPTBOX_DIR, "complete"),
};

export const CURRENT_MACHINE = os.hostname().replace(/\.local$/, "");
