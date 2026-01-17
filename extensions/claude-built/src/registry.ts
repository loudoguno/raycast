import * as fs from "fs";
import * as path from "path";
import { Registry, RegistryItem } from "./types";

const HOME = process.env.HOME || "";
const PAI_DIR = process.env.PAI_DIR || path.join(HOME, ".claude");
const REGISTRY_PATH = path.join(PAI_DIR, "claude-built-registry.json");
const USAGE_PATH = path.join(PAI_DIR, "claude-built-usage.json");
const FAVORITES_PATH = path.join(PAI_DIR, "claude-built-favorites.json");

export function loadRegistry(): Registry | null {
  try {
    const data = fs.readFileSync(REGISTRY_PATH, "utf-8");
    return JSON.parse(data) as Registry;
  } catch (error) {
    console.error("Failed to load registry:", error);
    return null;
  }
}

export function sortByRecency(items: RegistryItem[]): RegistryItem[] {
  return [...items].sort((a, b) => {
    // Primary: updated_at (most recently modified first)
    const updatedA = new Date(a.updated_at || a.created_at).getTime();
    const updatedB = new Date(b.updated_at || b.created_at).getTime();
    if (updatedB !== updatedA) return updatedB - updatedA;

    // Secondary: use_count (most used first)
    return b.use_count - a.use_count;
  });
}

interface UsageData {
  [key: string]: {
    last_used: string;
    use_count: number;
  };
}

export function updateUsage(itemId: string): void {
  try {
    let usage: UsageData = {};

    if (fs.existsSync(USAGE_PATH)) {
      const data = fs.readFileSync(USAGE_PATH, "utf-8");
      usage = JSON.parse(data) as UsageData;
    }

    const now = new Date().toISOString();
    const existing = usage[itemId] || { use_count: 0 };

    usage[itemId] = {
      last_used: now,
      use_count: existing.use_count + 1,
    };

    fs.writeFileSync(USAGE_PATH, JSON.stringify(usage, null, 2));
  } catch (error) {
    console.error("Failed to update usage:", error);
  }
}

export function getRegistryPath(): string {
  return REGISTRY_PATH;
}

// Favorites management
export function loadFavorites(): Set<string> {
  try {
    if (fs.existsSync(FAVORITES_PATH)) {
      const data = fs.readFileSync(FAVORITES_PATH, "utf-8");
      const favorites = JSON.parse(data) as string[];
      return new Set(favorites);
    }
  } catch (error) {
    console.error("Failed to load favorites:", error);
  }
  return new Set();
}

export function saveFavorites(favorites: Set<string>): void {
  try {
    fs.writeFileSync(FAVORITES_PATH, JSON.stringify([...favorites], null, 2));
  } catch (error) {
    console.error("Failed to save favorites:", error);
  }
}

export function addFavorite(itemId: string): Set<string> {
  const favorites = loadFavorites();
  favorites.add(itemId);
  saveFavorites(favorites);
  return favorites;
}

export function removeFavorite(itemId: string): Set<string> {
  const favorites = loadFavorites();
  favorites.delete(itemId);
  saveFavorites(favorites);
  return favorites;
}

export function isFavorite(itemId: string): boolean {
  return loadFavorites().has(itemId);
}

// Relative time formatting
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return date.toLocaleDateString();
}

// Get folder path from file path
export function getFolderPath(filePath: string): string {
  const expanded = filePath.replace(/~/g, HOME);
  return path.dirname(expanded);
}

// Get expanded path
export function expandPath(filePath: string): string {
  return filePath.replace(/~/g, HOME);
}

// Check if documentation exists for an item
export function findDocumentation(itemPath: string): string | null {
  const folder = getFolderPath(itemPath);
  const docFiles = ["README.md", "readme.md", "DOCS.md", "docs.md", "DOC.md"];

  for (const docFile of docFiles) {
    const docPath = path.join(folder, docFile);
    if (fs.existsSync(docPath)) {
      return docPath;
    }
  }
  return null;
}

// Generate markdown for an item
export function itemToMarkdown(item: RegistryItem): string {
  const lines = [
    `# ${item.name}`,
    "",
    `**Type:** ${item.type}`,
    `**Path:** \`${item.path}\``,
    item.trigger ? `**Trigger:** \`${item.trigger}\`` : null,
    "",
    `## Description`,
    item.description,
    "",
    `## Execution`,
    `\`\`\``,
    item.execution.command || item.execution.deeplink || "",
    `\`\`\``,
    "",
    `**Tags:** ${item.tags.join(", ")}`,
  ].filter(Boolean);

  return lines.join("\n");
}
