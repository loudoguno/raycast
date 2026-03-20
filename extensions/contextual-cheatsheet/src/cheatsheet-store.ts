import { LocalStorage, getFrontmostApplication } from "@raycast/api";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { readFile } from "fs/promises";

const VAULT_DIR = join(homedir(), "vaults", "flote-vault");
const MAPPING_FILE = join(VAULT_DIR, "_ADMIN", "app-mapping.json");
const STORE_KEY = "cheatsheet-urls";

export interface CheatsheetConfig {
  [bundleId: string]: {
    appName: string;
    url: string;
  };
}

export interface AppInfo {
  name: string;
  bundleId: string;
  path: string;
}

/** Get the currently focused app */
export async function getCurrentApp(): Promise<AppInfo> {
  const app = await getFrontmostApplication();
  return {
    name: app.name,
    bundleId: app.bundleId ?? "",
    path: app.path ?? "",
  };
}

/** Load the bundle-to-filename mapping from the vault */
async function loadVaultMapping(): Promise<Record<string, string>> {
  if (!existsSync(MAPPING_FILE)) return {};
  const raw = await readFile(MAPPING_FILE, "utf-8");
  return JSON.parse(raw);
}

/** Load user's custom cheatsheet URL configs */
export async function loadConfigs(): Promise<CheatsheetConfig> {
  const raw = await LocalStorage.getItem<string>(STORE_KEY);
  return raw ? JSON.parse(raw) : {};
}

/** Save user's custom cheatsheet URL configs */
export async function saveConfigs(configs: CheatsheetConfig): Promise<void> {
  await LocalStorage.setItem(STORE_KEY, JSON.stringify(configs));
}

/** Set a cheatsheet URL for a specific app */
export async function setCheatsheetUrl(
  bundleId: string,
  appName: string,
  url: string,
): Promise<void> {
  const configs = await loadConfigs();
  configs[bundleId] = { appName, url };
  await saveConfigs(configs);
}

/** Remove a cheatsheet config */
export async function removeCheatsheet(bundleId: string): Promise<void> {
  const configs = await loadConfigs();
  delete configs[bundleId];
  await saveConfigs(configs);
}

/**
 * Resolve what to open for an app's cheatsheet.
 *
 * Resolution order:
 *   1. Custom URL (set by user via "Set Cheatsheet URL")
 *   2. Vault cheatsheet.md (apps/AppName/cheatsheet.md — synced from SideNotes)
 *   3. Vault main note (apps/AppName.md)
 *   4. None — prompt user to set a URL
 */
export async function resolveCheatsheet(app: AppInfo): Promise<{
  source: "custom-url" | "vault-cheatsheet" | "vault-note" | "none";
  url: string;
}> {
  // 1. Custom URL from user config
  const configs = await loadConfigs();
  const config = configs[app.bundleId];
  if (config?.url) {
    return { source: "custom-url", url: config.url };
  }

  // Resolve vault name from bundle ID mapping
  const mapping = await loadVaultMapping();
  const vaultName = mapping[app.bundleId] ?? app.name;
  const appsDir = join(VAULT_DIR, "apps");

  // 2. Vault cheatsheet.md (from SideNotes sync or manual creation)
  const cheatsheetInFolder = join(appsDir, vaultName, "cheatsheet.md");
  if (existsSync(cheatsheetInFolder)) {
    return { source: "vault-cheatsheet", url: cheatsheetInFolder };
  }

  // 3. Vault main note
  const mainNote = join(appsDir, `${vaultName}.md`);
  if (existsSync(mainNote)) {
    return { source: "vault-note", url: mainNote };
  }

  // Also check folder note
  const folderNote = join(appsDir, vaultName, `${vaultName}.md`);
  if (existsSync(folderNote)) {
    return { source: "vault-note", url: folderNote };
  }

  // 4. Nothing found
  return { source: "none", url: "" };
}
