import { getPreferenceValues } from "@raycast/api";
import { readdirSync, statSync, existsSync } from "fs";
import { join, basename } from "path";
import { homedir } from "os";
import { isProjectHealthy } from "./bd-client";
import type { BeadsProject } from "./types";

interface Preferences {
  scanDirectories: string;
}

/**
 * Discover all beads-enabled projects under the configured scan directories.
 *
 * 📿 How beads projects work:
 * When you run `bd init` in a project, it creates a `.beads/` directory
 * containing the configuration, Dolt database files, and sync metadata.
 * This scanner finds those directories to give you a cross-project view.
 */
export function discoverProjects(): BeadsProject[] {
  const prefs = getPreferenceValues<Preferences>();
  const scanDirs = prefs.scanDirectories
    .split(",")
    .map((d) => d.trim())
    .map((d) => d.replace(/^~/, homedir()));

  const projects: BeadsProject[] = [];

  for (const scanDir of scanDirs) {
    if (!existsSync(scanDir)) continue;

    try {
      const entries = readdirSync(scanDir);
      for (const entry of entries) {
        const fullPath = join(scanDir, entry);
        try {
          const stat = statSync(fullPath);
          if (!stat.isDirectory()) continue;

          const beadsDir = join(fullPath, ".beads");
          if (!existsSync(beadsDir)) continue;

          // Found a beads-enabled project — check health
          const health = isProjectHealthy(fullPath);
          projects.push({
            name: basename(fullPath),
            path: fullPath,
            healthy: health.healthy,
            error: health.error,
          });
        } catch {
          // Skip entries we can't stat (permissions, etc.)
        }
      }
    } catch {
      // Skip scan dirs we can't read
    }
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get just the project names and paths without health-checking each one.
 * Faster than discoverProjects() — useful when you just need the project list.
 */
export function discoverProjectPaths(): { name: string; path: string }[] {
  const prefs = getPreferenceValues<Preferences>();
  const scanDirs = prefs.scanDirectories
    .split(",")
    .map((d) => d.trim())
    .map((d) => d.replace(/^~/, homedir()));

  const projects: { name: string; path: string }[] = [];

  for (const scanDir of scanDirs) {
    if (!existsSync(scanDir)) continue;

    try {
      const entries = readdirSync(scanDir);
      for (const entry of entries) {
        const fullPath = join(scanDir, entry);
        try {
          if (!statSync(fullPath).isDirectory()) continue;
          if (!existsSync(join(fullPath, ".beads"))) continue;
          projects.push({ name: basename(fullPath), path: fullPath });
        } catch {
          // skip
        }
      }
    } catch {
      // skip
    }
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}
