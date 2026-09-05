/**
 * Save Clipboard Link — save every link on the clipboard.
 *
 * Mirrors the web app's ⌘V behaviour (app.js:136): markdown links keep their
 * title, bare URLs of any scheme are accepted, duplicates within the paste are
 * dropped.
 */
import { Clipboard, showHUD } from "@raycast/api";
import { createClient, parseLinks, saveLink } from "./lib/api";
import { getConfig, getPrefs } from "./lib/prefs";

export default async function Command() {
  try {
    const prefs = getPrefs();
    const clip = (await Clipboard.readText()) ?? "";
    const links = parseLinks(clip);

    if (links.length === 0) {
      await showHUD("⚠️ No link on the clipboard");
      return;
    }

    const client = createClient(getConfig(prefs));
    const saved = [];
    for (const link of links) {
      saved.push(
        await saveLink(client, {
          url: link.url,
          title: link.title,
          tags: prefs.defaultTags,
        }),
      );
    }

    if (saved.length === 1) {
      const only = saved[0];
      await showHUD(`🔗 Saved: ${truncate(only.title || only.url)}`);
    } else {
      await showHUD(`🔗 Saved ${saved.length} links`);
    }
  } catch (error) {
    await showHUD(`❌ ${message(error)}`);
  }
}

function truncate(text: string, max = 50): string {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
