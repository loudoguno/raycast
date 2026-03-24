import { runAppleScript } from "@raycast/utils";

export interface LinkResult {
  title: string;
  url: string;
}

/**
 * Escape a string for safe inclusion in AppleScript string literals.
 */
function escapeForAppleScript(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Write a markdown link to the clipboard in multiple formats:
 * 1. public.utf8-plain-text — [title](url)
 * 2. public.rtf — styled hyperlink
 * 3. public.html — HTML hyperlink
 *
 * Uses NSPasteboard via JXA for multi-type clipboard writing.
 */
export async function writeMultiFormatClipboard(
  link: LinkResult,
): Promise<void> {
  const { title, url } = link;

  // Plain text markdown
  const mdLink = url ? `[${title}](${url})` : title;

  // HTML for RTF conversion
  const escapedTitle = escapeHtml(title);
  const htmlLink = url
    ? `<p style="color:#ACACAC;font-family:Helvetica Neue,sans-serif;font-size:13px;"><a href="${escapeHtml(url)}">${escapedTitle}</a></p>`
    : `<p style="color:#ACACAC;font-family:Helvetica Neue,sans-serif;font-size:13px;">${escapedTitle}</p>`;

  const escapedMd = escapeForAppleScript(mdLink);
  const escapedHtml = escapeForAppleScript(htmlLink);

  await runAppleScript(
    `
    use framework "AppKit"

    set mdLink to "${escapedMd}"
    set htmlStr to "${escapedHtml}"

    -- Convert HTML to RTF via NSAttributedString
    set htmlData to (current application's NSString's stringWithString:htmlStr)'s dataUsingEncoding:(current application's NSUTF8StringEncoding)
    set attrStr to current application's NSAttributedString's alloc()'s initWithHTML:htmlData documentAttributes:(missing value)
    set rtfData to attrStr's RTFFromRange:{0, attrStr's |length|()} documentAttributes:{DocumentType:current application's NSRTFTextDocumentType}

    -- Write to pasteboard
    set pb to current application's NSPasteboard's generalPasteboard()
    pb's clearContents()
    pb's setString:mdLink forType:"public.utf8-plain-text"
    pb's setData:rtfData forType:"public.rtf"
    pb's setString:htmlStr forType:"public.html"

    return "ok"
    `,
    { humanReadableOutput: true },
  );
}

/**
 * Write multiple links to the clipboard (e.g., multiple Finder selections).
 */
export async function writeMultiLinkClipboard(
  links: LinkResult[],
): Promise<void> {
  if (links.length === 1) {
    return writeMultiFormatClipboard(links[0]);
  }

  const mdLines = links
    .map((l) => (l.url ? `[${l.title}](${l.url})` : l.title))
    .join("\n");
  const htmlLines = links
    .map((l) => {
      const t = escapeHtml(l.title);
      return l.url ? `<a href="${escapeHtml(l.url)}">${t}</a>` : t;
    })
    .join("<br/>\n");

  const htmlFull = `<p style="color:#ACACAC;font-family:Helvetica Neue,sans-serif;font-size:13px;">${htmlLines}</p>`;

  const escapedMd = escapeForAppleScript(mdLines);
  const escapedHtml = escapeForAppleScript(htmlFull);

  await runAppleScript(
    `
    use framework "AppKit"

    set mdLink to "${escapedMd}"
    set htmlStr to "${escapedHtml}"

    set htmlData to (current application's NSString's stringWithString:htmlStr)'s dataUsingEncoding:(current application's NSUTF8StringEncoding)
    set attrStr to current application's NSAttributedString's alloc()'s initWithHTML:htmlData documentAttributes:(missing value)
    set rtfData to attrStr's RTFFromRange:{0, attrStr's |length|()} documentAttributes:{DocumentType:current application's NSRTFTextDocumentType}

    set pb to current application's NSPasteboard's generalPasteboard()
    pb's clearContents()
    pb's setString:mdLink forType:"public.utf8-plain-text"
    pb's setData:rtfData forType:"public.rtf"
    pb's setString:htmlStr forType:"public.html"

    return "ok"
    `,
    { humanReadableOutput: true },
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
