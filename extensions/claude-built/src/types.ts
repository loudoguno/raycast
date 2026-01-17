export type ItemType = "skill" | "cli" | "raycast" | "alias" | "tool";

export type ExecutionType = "terminal" | "raycast-deeplink" | "shell" | "open";

export interface Execution {
  type: ExecutionType;
  command?: string;
  args?: string[];
  deeplink?: string;
}

export interface RegistryItem {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  path: string;
  trigger?: string;
  created_at: string;
  updated_at?: string;
  last_used?: string;
  use_count: number;
  tags: string[];
  execution: Execution;
}

export interface Registry {
  version: string;
  generated_at: string;
  items: RegistryItem[];
}
