/**
 * PROVENANCE: copied verbatim (imports retargeted only) from
 * ~/code/raycast/extensions/universal-copy-link/src on 2026-09-04 by sai-mx3.
 * Raycast extensions are separate build roots and cannot import across
 * directories, so the front-window resolver is vendored here.
 * Upstream is canonical — fix bugs there first, then re-copy.
 */
/**
 * Bundle ID alias map — resolves Setapp variants, version upgrades,
 * and MAS vs direct-purchase differences to a canonical bundle ID.
 * The router resolves aliases BEFORE looking up handlers.
 */
export const bundleAliases: Record<string, string> = {
  // Setapp variants → canonical bundle ID
  "com.hogbaysoftware.Bike-setapp": "com.hogbaysoftware.Bike",
  "com.soulmen.ulysses-setapp": "com.ulyssesapp.mac",
  "com.houdah.HoudahSpot-setapp": "com.houdah.HoudahSpot4",
  "com.apptorium.SideNotes-setapp": "com.apptorium.SideNotes",

  // Version upgrades → canonical
  "com.omnigroup.OmniFocus3": "com.omnigroup.OmniFocus4",
  "com.omnigroup.OmniFocus3.MacAppStore": "com.omnigroup.OmniFocus4",
  "com.omnigroup.OmniPlan3": "com.omnigroup.OmniPlan4",
  "com.reederapp.5.macOS": "com.reederapp.macOS",
  "com.sonnysoftware.bookends2": "com.sonnysoftware.bookends",
  "com.panic.transmit.mas": "com.panic.Transmit",

  // Duplicate entries
  "com.apple.AddressBook copy": "com.apple.AddressBook",
};

export function resolveAlias(bundleId: string): string {
  return bundleAliases[bundleId] ?? bundleId;
}
