/**
 * Roam block → Raycast markdown rendering.
 *
 * Converts Roam-flavored markup to CommonMark that Raycast's Detail
 * component can render, including:
 *   - [[page links]] → clickable deeplinks
 *   - ((block refs)) → resolved inline text
 *   - {{[[TODO]]}}/{{[[DONE]]}} → checkboxes
 *   - Search term highlighting
 *   - Nested child block indentation
 */

import type { RoamBlock } from "./types";

// ---------------------------------------------------------------------------
// Roam → Markdown conversions
// ---------------------------------------------------------------------------

const ROAM_REPLACEMENTS: [string | RegExp, string][] = [
  ["{{[[TODO]]}}", "- [ ]"],
  ["{{[[DONE]]}}", "- [x]"],
];

/**
 * Convert [[page links]] to clickable Raycast deeplinks.
 * Uses raycast:// protocol to re-open the search command with the page name.
 */
function convertPageLinks(text: string, extensionName: string): string {
  return text.replace(/\[\[([^\]]+)\]\]/g, (_, pageName: string) => {
    const encoded = encodeURIComponent(pageName);
    return `[[[${pageName}]]](raycast://extensions/loudog/${extensionName}/search?arguments=${encodeURIComponent(JSON.stringify({ query: pageName }))})`;
  });
}

/**
 * Resolve ((block references)) using the block's refs data.
 * Falls back to showing the raw UID if the ref isn't in the pull data.
 */
function resolveBlockRefs(text: string, refs?: RoamBlock[]): string {
  if (!refs || refs.length === 0) return text;

  for (const ref of refs) {
    const uid = ref[":block/uid"];
    const content = ref[":block/string"] || ref[":node/title"] || uid;
    text = text.replaceAll(`((${uid}))`, `((${content}))`);
  }
  return text;
}

/**
 * Highlight search terms with bold+italic (***term***).
 * Uses global regex to highlight ALL occurrences (fixing the original's bug).
 */
function highlightSearchTerms(text: string, searchQuery: string): string {
  if (!searchQuery) return text;

  // Don't highlight inside code blocks
  if (text.startsWith("```")) return text;

  for (const word of searchQuery.trim().split(/\s+/)) {
    if (word.length === 0) continue;
    // Escape regex special characters in the search term
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(escaped, "gi"), (match) => `***${match}***`);
  }
  return text;
}

// ---------------------------------------------------------------------------
// Block rendering
// ---------------------------------------------------------------------------

/** Render a single block's text with all conversions applied */
function renderBlockText(
  text: string,
  refs?: RoamBlock[],
  searchQuery?: string,
): string {
  let result = text;

  for (const [from, to] of ROAM_REPLACEMENTS) {
    if (typeof from === "string") {
      result = result.replaceAll(from, to);
    } else {
      result = result.replace(from, to);
    }
  }

  result = resolveBlockRefs(result, refs);
  result = convertPageLinks(result, "roam-research-custom");

  if (searchQuery) {
    result = highlightSearchTerms(result, searchQuery);
  }

  return result;
}

/** Build the parent breadcrumb trail for a block */
function buildBreadcrumb(block: RoamBlock): string {
  const trail: string[] = [];
  let current = block[":block/_children"];
  while (current && current.length > 0) {
    const parent = current[0];
    trail.unshift(parent[":node/title"] || parent[":block/string"] || "");
    current = parent[":block/_children"];
  }
  return trail.length > 0 ? trail.join(" > ") : "";
}

/** Sort blocks by :block/order if available */
function sortByOrder(blocks: RoamBlock[]): RoamBlock[] {
  return [...blocks].sort(
    (a, b) => (a[":block/order"] ?? 0) - (b[":block/order"] ?? 0),
  );
}

/** Render nested children as indented bullet list */
function renderChildren(
  children: RoamBlock[] | undefined,
  depth: number = 0,
): string {
  if (!children || children.length === 0) return "";

  const sorted = sortByOrder(children);
  const lines: string[] = [];
  const indent = "  ".repeat(depth);

  for (const child of sorted) {
    const text = child[":block/string"] || child[":node/title"] || "";
    lines.push(`${indent}- ${text}`);
    if (child[":block/children"] && child[":block/children"].length > 0) {
      lines.push(renderChildren(child[":block/children"], depth + 1));
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a Roam block as Raycast-compatible markdown for the Detail panel.
 *
 * Includes: breadcrumb trail, main block content, and nested children.
 * No artificial truncation — let Raycast handle rendering limits.
 */
export function blockToMarkdown(
  block: RoamBlock,
  searchQuery?: string,
): string {
  const isPage = !!block[":node/title"];
  const mainText = block[":block/string"] || block[":node/title"] || "";
  const rendered = renderBlockText(mainText, block[":block/refs"], searchQuery);

  const parts: string[] = [];

  if (isPage) {
    parts.push(`# ${rendered}`);
  } else {
    const breadcrumb = buildBreadcrumb(block);
    if (breadcrumb) {
      parts.push(`*${breadcrumb}*`);
      parts.push("---");
    }
    parts.push(rendered);
  }

  // Render child blocks as indented bullet list
  const children = block[":block/children"];
  if (children && children.length > 0) {
    parts.push(renderChildren(children));
  }

  // Render linked references (blocks that reference this page/block)
  const backRefs = block[":block/_refs"];
  if (backRefs && backRefs.length > 0) {
    parts.push("---");
    parts.push(`**Linked References** (${backRefs.length})`);

    for (const ref of backRefs) {
      const uid = ref[":block/uid"];
      const text = ref[":block/string"] || ref[":node/title"] || uid;
      // Get parent page title from the ref's _children (parent chain)
      const parentPage =
        ref[":block/_children"]?.[0]?.[":node/title"] ||
        ref[":block/_children"]?.[0]?.[":block/string"];
      const pageLabel = parentPage ? `**${parentPage}**` : "";

      // Make the reference clickable — searches for the block content
      const searchQuery = ref[":node/title"] || text.slice(0, 40);
      const deeplink = `raycast://extensions/loudog/roam-research-custom/search?arguments=${encodeURIComponent(JSON.stringify({ query: searchQuery }))}`;

      if (pageLabel) {
        parts.push(`- ${pageLabel}: [${text}](${deeplink})`);
      } else {
        parts.push(`- [${text}](${deeplink})`);
      }
    }
  }

  return parts.join("\n\n");
}

/**
 * Render a list item subtitle from a block — short, single-line preview.
 */
export function blockSubtitle(block: RoamBlock): string {
  const text = block[":block/string"] || "";
  // Strip Roam markup for a clean subtitle
  return text
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\(\([^)]+\)\)/g, "")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .slice(0, 80);
}
