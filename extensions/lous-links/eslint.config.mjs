import raycastConfig from "@raycast/eslint-config";

export default [
  ...raycastConfig,
  // cli/ and tests/ run under bun, not the Raycast runtime — they are outside
  // the extension build root and are checked by `bun test` instead.
  { ignores: ["cli/**", "tests/**", "dist/**"] },
];
