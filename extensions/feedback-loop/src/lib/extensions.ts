import { getPreferenceValues } from "@raycast/api";
import * as fs from "fs";
import * as path from "path";
import { ExtensionInfo } from "./types";

const HOME = process.env.HOME || "";

const KNOWN_EXTENSIONS: ExtensionInfo[] = [
  { dir: "RoamResearch", name: "roam-research-custom", title: "RoamResearch" },
  { dir: "Search_Status_Menu", name: "search-status-menu", title: "Search Status Menu" },
  { dir: "balloons-fancy", name: "balloons-fancy", title: "Balloons Fancy" },
  { dir: "balloons", name: "balloons", title: "Balloons" },
  { dir: "beads", name: "beads", title: "Beads" },
  { dir: "claude-built", name: "claude-built", title: "Claude Built" },
  { dir: "claude-sessions", name: "claude-sessions", title: "Claude Sessions" },
  { dir: "claude-usage", name: "claude-usage", title: "Claude Usage" },
  { dir: "contextual-cheatsheet", name: "contextual-cheatsheet", title: "Contextual Cheatsheet" },
  { dir: "finder-actions", name: "finder-actions", title: "Finder Actions" },
  { dir: "git-repos", name: "git-repos", title: "Git Repos" },
  { dir: "loutools", name: "loutools", title: "LouTools Remote" },
  { dir: "machine-sync", name: "machine-sync", title: "Machine Sync" },
  { dir: "omnifocus", name: "omnifocus-custom", title: "OmniFocus Custom" },
  { dir: "promptbox", name: "promptbox", title: "Promptbox" },
  { dir: "session-launcher", name: "session-launcher", title: "Session Launcher" },
  { dir: "typing-practice", name: "typing-practice", title: "Typing Practice" },
  { dir: "universal-copy-link", name: "universal-copy-link", title: "Universal Copy Link" },
];

function expandPath(p: string): string {
  return p.replace(/^~/, HOME);
}

function scanExtensions(extensionsDir: string): ExtensionInfo[] | null {
  try {
    const entries = fs.readdirSync(extensionsDir, { withFileTypes: true });
    const results: ExtensionInfo[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "templates" || entry.name === "docs") continue;

      const pkgPath = path.join(extensionsDir, entry.name, "package.json");
      try {
        const raw = fs.readFileSync(pkgPath, "utf-8");
        const pkg = JSON.parse(raw) as { name?: string; title?: string };
        if (pkg.name && pkg.title) {
          results.push({ dir: entry.name, name: pkg.name, title: pkg.title });
        }
      } catch {
        // No package.json or invalid — skip
      }
    }

    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}

export function discoverExtensions(): ExtensionInfo[] {
  const prefs = getPreferenceValues<{ extensionsPath?: string }>();
  const basePath = expandPath(prefs.extensionsPath || "~/code/raycast");
  const extensionsDir = path.join(basePath, "extensions");

  const scanned = scanExtensions(extensionsDir);
  if (!scanned) return [...KNOWN_EXTENSIONS].sort((a, b) => a.title.localeCompare(b.title));

  // Merge: scanned wins, fallback fills gaps
  const byDir = new Map(scanned.map((e) => [e.dir, e]));
  for (const known of KNOWN_EXTENSIONS) {
    if (!byDir.has(known.dir)) {
      byDir.set(known.dir, known);
    }
  }

  return Array.from(byDir.values()).sort((a, b) => a.title.localeCompare(b.title));
}

export function findExtensionByName(name: string): ExtensionInfo | undefined {
  return discoverExtensions().find((e) => e.name === name);
}
