import type { GitForgeProvider, ProviderId } from "../types";
import { githubProvider } from "./github";
import { forgejoProvider } from "./forgejo";

export const ALL_PROVIDERS: GitForgeProvider[] = [
  githubProvider,
  forgejoProvider,
];

export function getEnabledProviders(): GitForgeProvider[] {
  return ALL_PROVIDERS.filter((p) => p.isConfigured());
}

export function getProvider(id: ProviderId): GitForgeProvider {
  const p = ALL_PROVIDERS.find((p) => p.id === id);
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}
