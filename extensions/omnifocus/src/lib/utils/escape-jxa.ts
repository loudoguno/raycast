/**
 * Escape a string for safe embedding in JXA template literals.
 * Prevents injection attacks via task names, notes, etc.
 */
export function escapeJXA(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}
