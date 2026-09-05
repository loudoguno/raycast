/**
 * Save Front Link — the one-hotkey command.
 *
 * Resolve the frontmost window's title + URL, save it to lous-links, HUD the
 * result. If the front app yields no URL (a plain text editor, an app with no
 * scripting surface), fall back to a URL on the clipboard before giving up.
 */
import { Clipboard, showHUD } from "@raycast/api";
import { createClient, parseLinks, saveLink } from "./lib/api";
import { getConfig, getPrefs } from "./lib/prefs";
import { resolveFrontLink } from "./resolver";

export default async function Command() {
  try {
    const prefs = getPrefs();
    const front = await resolveFrontLink();

    let url = front.url;
    let title = front.title;

    if (!url) {
      const clip = (await Clipboard.readText()) ?? "";
      const [first] = parseLinks(clip);
      if (!first) {
        await showHUD(
          front.appName
            ? `⚠️ No link in ${front.appName} or on the clipboard`
            : "⚠️ No link on the front window or clipboard",
        );
        return;
      }
      url = first.url;
      title = first.title ?? title;
    }

    const client = createClient(getConfig(prefs));
    const saved = await saveLink(client, {
      url,
      title: title || undefined,
      tags: prefs.defaultTags,
    });

    await showHUD(`🔗 Saved: ${truncate(saved.title || saved.url)}`);
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
