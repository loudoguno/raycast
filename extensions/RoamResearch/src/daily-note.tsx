import { getPreferenceValues, open, showHUD } from "@raycast/api";
import { getGraphOrPrimary } from "./lib/graph-config";
import { todayUid } from "./lib/roam-client";
import type { Preferences } from "./lib/types";

export default async function DailyNoteCommand() {
  const prefs = getPreferenceValues<Preferences>();
  const graph = await getGraphOrPrimary(prefs.primaryGraph);

  if (!graph) {
    await showHUD("No graph configured — add one first");
    return;
  }

  const uid = todayUid();
  const url =
    prefs.openIn === "app"
      ? `roam://#/app/${graph.name}/page/${uid}`
      : `https://roamresearch.com/#/app/${graph.name}/page/${uid}`;

  await open(url);
  await showHUD(`Opening today's daily note in ${graph.name}`);
}
