/**
 * Graph configuration management.
 *
 * Uses Raycast's LocalStorage (encrypted, persistent) instead of the
 * broken usePersistentState from raycast-toolkit.
 */

import { LocalStorage } from "@raycast/api";
import type { GraphConfig, GraphsConfigMap } from "./types";

const STORAGE_KEY = "roam-graphs-config";

/** Load all configured graphs */
export async function loadGraphs(): Promise<GraphsConfigMap> {
  const raw = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as GraphsConfigMap;
  } catch {
    return {};
  }
}

/** Save a graph configuration (add or update) */
export async function saveGraph(config: GraphConfig): Promise<void> {
  const graphs = await loadGraphs();
  graphs[config.name] = config;
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(graphs));
}

/** Remove a graph configuration */
export async function removeGraph(name: string): Promise<void> {
  const graphs = await loadGraphs();
  delete graphs[name];
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(graphs));
}

/** Get a single graph config by name, or the first available graph */
export async function getGraphOrPrimary(
  preferredName?: string,
): Promise<GraphConfig | null> {
  const graphs = await loadGraphs();
  if (preferredName && graphs[preferredName]) {
    return graphs[preferredName];
  }
  // Fall back to first configured graph
  const names = Object.keys(graphs);
  return names.length > 0 ? graphs[names[0]] : null;
}
