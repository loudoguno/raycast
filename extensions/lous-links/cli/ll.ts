#!/usr/bin/env bun
/**
 * ll — lous-links from the shell (and from agents).
 *
 * PURPOSE   Save, search and open links in Lou's private lous-links library
 *           without a browser. Shares src/lib/api.ts with the Raycast
 *           extension, so the wire contract is defined in exactly one place.
 * SCOPE     Read/write against the lous-links Cloudflare Worker only. No other
 *           network, no writes outside ~/.config/lous-links.
 * CREATED   2026-09-04 by sai-mx3, session "mx3: work-board first-principles
 *           sweep".
 * RELATED   ../src/lib/api.ts (the client), ../README.md (API contract +
 *           evidence), ~/code/raycast/scripts/lous-links-save-front.sh (the
 *           hotkey wrapper), ~/.local/bin/ll (symlink to this file).
 * REQUIRED  Optional. The Raycast extension works without it; this is the
 *           shell/agent surface.
 * AUTH      $LOUS_LINKS_TOKEN, else ~/.config/lous-links/token (chmod 600).
 *           The token is never printed — every URL goes through redactUrl().
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import {
  DEFAULT_BASE_URL,
  createClient,
  hostOf,
  parseLinks,
  prepareRequest,
  redactUrl,
  saveLink,
  toMarkdown,
  type ApiConfig,
  type LousLink,
} from "../src/lib/api";
import {
  SESSIONS_INDEX_PATH,
  planSessionPush,
  readSessionsIndex,
  searchSessions,
  type AgentSession,
} from "../src/lib/sessions";

const TOKEN_FILE = join(homedir(), ".config", "lous-links", "token");
const DRY_RUN_PLACEHOLDER = "DRY-RUN-NO-TOKEN";

const HELP = `ll — lous-links from the shell

Usage
  ll save <url> [--title T] [--note N] [--tags a,b]
  ll save-front [--title T] [--note N] [--tags a,b]
  ll list [--json]
  ll search <query...> [--json]
  ll open <handle>
  ll delete <handle>
  ll star <handle> [--off]
  ll --help

Sessions (Claude / Codex / Hermes, one searchable place)
  ll sessions collect
  ll sessions search <query...> [--agent <kind>] [--json]
  ll sessions push [--since YYYY-MM-DD] [--with-summary] [--dry-run]

  --index <path> reads a different sessions.json (default
                 ${SESSIONS_INDEX_PATH.replace(homedir(), "~")})

Flags
  --dry-run      print the exact request and send nothing
  --base <url>   override the base URL (env LOUS_LINKS_BASE, default:
                 ${DEFAULT_BASE_URL})
  --json         machine-readable output (list, search, save)

Auth
  $LOUS_LINKS_TOKEN, else ${TOKEN_FILE.replace(homedir(), "~")} (chmod 600).
  Sent as ?t=<token>; never printed.

save-front resolves the frontmost window via AppleScript (Chrome, Chromium,
Brave, Arc, Safari, Finder) and falls back to a URL on the clipboard.`;

interface Args {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  const valueFlags = new Set([
    "title",
    "note",
    "tags",
    "base",
    "agent",
    "since",
    "index",
  ]);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const name = arg.slice(2);
      if (valueFlags.has(name)) {
        const next = argv[++i];
        if (next === undefined) fail(`--${name} needs a value`, 2);
        flags[name] = next;
      } else {
        flags[name] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  const command = positional.shift() ?? "";
  return { command, positional, flags };
}

function fail(message: string, code = 1): never {
  process.stderr.write(`ll: ${message}\n`);
  process.exit(code);
}

async function readToken(): Promise<string> {
  const fromEnv = (process.env.LOUS_LINKS_TOKEN ?? "").trim();
  if (fromEnv) return fromEnv;
  const file = Bun.file(TOKEN_FILE);
  if (await file.exists()) return (await file.text()).trim();
  return "";
}

function baseUrlFrom(flags: Args["flags"]): string {
  const flag = typeof flags.base === "string" ? flags.base : "";
  return (flag || process.env.LOUS_LINKS_BASE || DEFAULT_BASE_URL).trim();
}

/** Print a request instead of sending it. Never prints the token. */
function printDryRun(
  config: ApiConfig,
  method: string,
  path: string,
  body?: unknown,
) {
  const req = prepareRequest(config, method, path, body);
  process.stdout.write(`[dry-run] ${req.method} ${redactUrl(req.url)}\n`);
  for (const [k, v] of Object.entries(req.headers)) {
    process.stdout.write(`[dry-run] ${k}: ${v}\n`);
  }
  if (req.body) process.stdout.write(`[dry-run] ${req.body}\n`);
}

// ── frontmost-window resolution ────────────────────────────────────────────

async function run(cmd: string[], stdin?: string): Promise<string> {
  const proc = Bun.spawn(cmd, {
    stdin: stdin ? new TextEncoder().encode(stdin) : "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) throw new Error(err.trim() || `${cmd[0]} exited ${code}`);
  return out.trim();
}

const osa = (script: string) => run(["osascript", "-"], script);

const FRONT_APP_SCRIPT = `use framework "AppKit"
set a to current application's NSWorkspace's sharedWorkspace()'s frontmostApplication()
return ((a's bundleIdentifier()) as text) & "|||" & ((a's localizedName()) as text)`;

const CHROMIUM_TAB = (bundleId: string) => `tell application id "${bundleId}"
  set t to active tab of front window
  return (title of t) & "|||" & (URL of t)
end tell`;

const SAFARI_TAB = `tell application "Safari"
  set t to current tab of front window
  return (name of t) & "|||" & (URL of t)
end tell`;

const FINDER_ITEM = `tell application "Finder"
  set sel to selection
  if (count of sel) > 0 then
    set f to item 1 of sel
  else
    set f to target of front window
  end if
  return (name of f as text) & "|||" & (URL of f as text)
end tell`;

const CHROMIUM_FAMILY: Record<string, string> = {
  "com.google.Chrome": "com.google.Chrome",
  "com.google.Chrome.canary": "com.google.Chrome.canary",
  "org.chromium.Chromium": "org.chromium.Chromium",
  "com.brave.Browser": "com.brave.Browser",
  "com.brave.Browser.beta": "com.brave.Browser.beta",
  "company.thebrowser.Browser": "company.thebrowser.Browser",
  "com.microsoft.edgemac": "com.microsoft.edgemac",
  "com.vivaldi.Vivaldi": "com.vivaldi.Vivaldi",
};

interface FrontLink {
  title: string;
  url: string;
  source: string;
}

async function resolveFront(): Promise<FrontLink> {
  let bundleId = "";
  let appName = "";
  try {
    const [id, name] = (await osa(FRONT_APP_SCRIPT)).split("|||");
    bundleId = (id ?? "").trim();
    appName = (name ?? "").trim();
  } catch {
    // fall through to the clipboard
  }

  const script = CHROMIUM_FAMILY[bundleId]
    ? CHROMIUM_TAB(CHROMIUM_FAMILY[bundleId])
    : bundleId === "com.apple.Safari"
      ? SAFARI_TAB
      : bundleId === "com.apple.finder"
        ? FINDER_ITEM
        : null;

  if (script) {
    try {
      const [title, url] = (await osa(script)).split("|||");
      if (url?.trim()) {
        return {
          title: (title ?? "").trim(),
          url: url.trim(),
          source: appName || bundleId,
        };
      }
    } catch {
      // fall through to the clipboard
    }
  }

  const clip = await run(["pbpaste"]).catch(() => "");
  const [first] = parseLinks(clip);
  if (first) {
    return { title: first.title ?? "", url: first.url, source: "clipboard" };
  }

  throw new Error(
    `no URL in the frontmost window (${appName || bundleId || "unknown app"}) or on the clipboard`,
  );
}

// ── sessions ───────────────────────────────────────────────────────────────

/**
 * The collector is owned by a sibling agent and lives beside this CLI. Resolve
 * it relative to the source file first; fall back to the canonical checkout so
 * the ~/.local/bin/ll symlink still finds it.
 */
function collectorPath(): string {
  const local = resolve(import.meta.dir, "..", "sessions", "collect.ts");
  if (existsSync(local)) return local;
  return join(
    homedir(),
    "code",
    "raycast",
    "extensions",
    "lous-links",
    "sessions",
    "collect.ts",
  );
}

function formatSession(session: AgentSession): string {
  const when = (session.started || "").slice(0, 16).replace("T", " ");
  const projects = session.projects?.length
    ? ` [${session.projects.join(",")}]`
    : "";
  return `${session.id}\t${session.agent}\t${session.machine}\t${when}\t${session.title}${projects}`;
}

async function loadSessions(path?: string): Promise<AgentSession[]> {
  const from = path || SESSIONS_INDEX_PATH;
  const index = await readSessionsIndex(from);
  if (!index) {
    fail(`no session index at ${from} — run \`ll sessions collect\` first`);
  }
  return index.sessions;
}

// ── formatting ─────────────────────────────────────────────────────────────

function formatLink(link: LousLink): string {
  const star = link.star === 1 || link.star === true ? " *" : "";
  const opens = link.open_count ? ` ${link.open_count}x` : "";
  const tags = link.tags ? ` [${link.tags}]` : "";
  return `${link.handle}\t${link.title || link.url}\t${hostOf(link)}${tags}${star}${opens}`;
}

/** Order-insensitive token scoring, ported from the web client (app.js:85). */
function score(link: LousLink, query: string): number {
  const hay = [link.title ?? "", link.dom ?? "", link.scheme ?? "", link.note ?? "", link.tags ?? "", link.url]
    .join(" ")
    .toLowerCase();
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0.001;
  let s = 0;
  for (const token of tokens) {
    const i = hay.indexOf(token);
    if (i < 0) return -1;
    s += (i === 0 ? 3 : 1) + ((link.title ?? "").toLowerCase().includes(token) ? 2 : 0);
  }
  s += Math.min(4, (link.open_count || 0) * 0.5);
  if (link.star) s += 2;
  if (link.pin) s += 2;
  return s;
}

// ── commands ───────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command || args.flags.help || args.command === "help") {
    process.stdout.write(`${HELP}\n`);
    return;
  }

  const dryRun = args.flags["dry-run"] === true;
  const asJson = args.flags.json === true;
  const baseUrl = baseUrlFrom(args.flags);
  const realToken = await readToken();
  const token = realToken || (dryRun ? DRY_RUN_PLACEHOLDER : "");

  if (!realToken && dryRun) {
    process.stderr.write(
      `ll: no token configured — printing the request shape only\n`,
    );
  }
  const config: ApiConfig = { baseUrl, token };
  const client = createClient(config);
  const str = (name: string) =>
    typeof args.flags[name] === "string"
      ? (args.flags[name] as string)
      : undefined;

  switch (args.command) {
    case "save":
    case "save-front": {
      let url: string;
      let title = str("title");

      if (args.command === "save-front") {
        const front = await resolveFront();
        url = front.url;
        title = title ?? front.title;
        process.stderr.write(`ll: resolved from ${front.source}\n`);
      } else {
        url = args.positional[0] ?? fail("save needs a <url>", 2);
      }

      const note = str("note");
      const tags = str("tags");

      if (dryRun) {
        printDryRun(config, "POST", "/api/save", compact({ url, title }));
        if (note || tags) {
          process.stdout.write(
            `[dry-run] then PATCH /api/links/<handle>?t=*** ${JSON.stringify(compact({ note, tags }))}\n`,
          );
        }
        return;
      }

      const saved = await saveLink(client, { url, title, note, tags });
      process.stdout.write(
        asJson
          ? `${JSON.stringify(saved)}\n`
          : `saved ${saved.handle}  ${toMarkdown(saved)}\n`,
      );
      return;
    }

    case "list": {
      if (dryRun) return printDryRun(config, "GET", "/api/links");
      const links = (await client.list()).filter((l) => !l.hide);
      process.stdout.write(
        asJson
          ? `${JSON.stringify(links, null, 2)}\n`
          : `${links.map(formatLink).join("\n")}\n`,
      );
      return;
    }

    case "search": {
      const query = args.positional.join(" ");
      if (!query) fail("search needs a <query>", 2);
      if (dryRun) return printDryRun(config, "GET", "/api/links");
      const hits = (await client.list())
        .filter((l) => !l.hide)
        .map((link) => ({ link, s: score(link, query) }))
        .filter((x) => x.s >= 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.link);
      process.stdout.write(
        asJson
          ? `${JSON.stringify(hits, null, 2)}\n`
          : hits.length
            ? `${hits.map(formatLink).join("\n")}\n`
            : `no links match "${query}"\n`,
      );
      return;
    }

    case "open": {
      const handle = args.positional[0] ?? fail("open needs a <handle>", 2);
      const path = `/api/open/${encodeURIComponent(handle)}`;
      if (dryRun) return printDryRun(config, "POST", path);
      const link = (await client.list()).find((l) => l.handle === handle);
      if (!link) fail(`no link with handle ${handle}`);
      await client.open(handle);
      await run(["open", link.url]);
      process.stdout.write(`opened ${link.url}\n`);
      return;
    }

    case "delete": {
      const handle = args.positional[0] ?? fail("delete needs a <handle>", 2);
      const path = `/api/links/${encodeURIComponent(handle)}`;
      if (dryRun) return printDryRun(config, "DELETE", path);
      await client.remove(handle);
      process.stdout.write(`deleted ${handle}\n`);
      return;
    }

    case "star": {
      const handle = args.positional[0] ?? fail("star needs a <handle>", 2);
      const path = `/api/links/${encodeURIComponent(handle)}`;
      const body = { star: args.flags.off !== true };
      if (dryRun) return printDryRun(config, "PATCH", path, body);
      await client.patch(handle, body);
      process.stdout.write(
        `${body.star ? "starred" : "unstarred"} ${handle}\n`,
      );
      return;
    }

    case "sessions": {
      const sub = args.positional.shift() ?? "";

      if (sub === "collect") {
        const script = collectorPath();
        if (!existsSync(script)) {
          fail(
            `collector not found at ${script} — it is written by the sessions collector, not by this CLI`,
          );
        }
        if (dryRun) {
          process.stdout.write(`[dry-run] ${process.execPath} ${script}\n`);
          return;
        }
        const out = await run([process.execPath, script]);
        process.stdout.write(
          out ? `${out}\n` : `collected → ${SESSIONS_INDEX_PATH}\n`,
        );
        return;
      }

      if (sub === "search") {
        const query = args.positional.join(" ");
        const sessions = await loadSessions(str("index"));
        const hits = searchSessions(sessions, query, { agent: str("agent") });
        process.stdout.write(
          asJson
            ? `${JSON.stringify(hits, null, 2)}\n`
            : hits.length
              ? `${hits.map(formatSession).join("\n")}\n`
              : `no sessions match "${query}"\n`,
        );
        return;
      }

      if (sub === "push") {
        const sessions = await loadSessions(str("index"));
        const options = {
          since: str("since"),
          withSummary: args.flags["with-summary"] === true,
        };

        if (dryRun && !realToken) {
          process.stdout.write(
            "[DEFERRED-VERIFY: token] no lous-links token on this machine — planning only, nothing sent.\n",
          );
        }

        // A dry run sends nothing at all, including the dedupe GET.
        const existing = dryRun
          ? []
          : (await client.list()).map((link) => link.url);
        const plan = planSessionPush(sessions, existing, options);

        if (asJson) {
          process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
          if (dryRun) return;
        }

        if (dryRun) {
          process.stdout.write(
            "[dry-run] dedupe skipped — GET /api/links is a request too\n",
          );
          for (const push of plan.planned) {
            printDryRun(
              config,
              "POST",
              "/api/save",
              compact({ url: push.url, title: push.title }),
            );
            if (push.note || push.tags) {
              process.stdout.write(
                `[dry-run] then PATCH /api/links/<handle>?t=*** ${JSON.stringify(compact({ note: push.note, tags: push.tags }))}\n`,
              );
            }
          }
          process.stdout.write(
            `[dry-run] ${plan.planned.length} to save, ${plan.skipped.length} skipped\n`,
          );
          return;
        }

        let saved = 0;
        for (const push of plan.planned) {
          await saveLink(client, {
            url: push.url,
            title: push.title,
            note: push.note,
            tags: push.tags,
          });
          saved++;
        }
        const already = plan.skipped.filter(
          (s) => s.reason === "already-saved",
        ).length;
        const noUrl = plan.skipped.filter((s) => s.reason === "no-url").length;
        if (!asJson) {
          process.stdout.write(
            `pushed ${saved} session${saved === 1 ? "" : "s"} (${already} already saved, ${noUrl} with no URL)\n`,
          );
        }
        return;
      }

      fail(
        `unknown sessions subcommand "${sub}" — try collect, search, push`,
        2,
      );
      return;
    }

    default:
      fail(`unknown command "${args.command}" — try ll --help`, 2);
  }
}

function compact(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
