/** Configuration for a connected Roam graph */
export interface GraphConfig {
  name: string;
  token: string;
}

/** Map of graph name → config, stored in LocalStorage */
export type GraphsConfigMap = Record<string, GraphConfig>;

/** A block returned from Roam pull queries */
export interface RoamBlock {
  ":block/uid": string;
  ":block/string"?: string;
  ":node/title"?: string;
  ":edit/time"?: number;
  ":create/time"?: number;
  ":block/order"?: number;
  ":block/refs"?: RoamBlock[];
  ":block/_refs"?: RoamBlock[];
  ":block/_children"?: RoamBlock[];
  ":block/children"?: RoamBlock[];
}

/** Minimal search result from Roam's search API */
export interface SearchResult {
  ":block/uid": string;
  ":block/string"?: string;
  ":node/title"?: string;
}

/** Preferences from extension settings */
export interface Preferences {
  primaryGraph?: string;
  openIn?: "web" | "app";
}
