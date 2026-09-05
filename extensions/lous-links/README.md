# Lous Links

One hotkey saves the frontmost window's title + URL into **lous-links**, Lou's private
link library (Cloudflare Worker + D1). A list command searches, opens, stars, pins and
deletes. A bun CLI (`ll`) gives the shell — and agents — the same reach.

- Web: <https://lous-links.myoldkylakehouse.workers.dev> · <https://loudog.uno/links>
- Server source lives on **mxb** (`~/code/lous-links`, no remote). This extension was
  written against the *served* client, not the server source.

## Install

```bash
cd ~/code/raycast/extensions/lous-links
npm install
npm run dev          # imports the dev extension into Raycast; leave running to hot-reload
```

Once `npm run dev` has run once, the three commands stay in Raycast even after you stop
the dev server (Raycast → Preferences → Extensions → Lous Links).

### Token

Every request carries `?t=<token>` — the path the Worker itself documents for "the
Shortcut / CLI / agent". The token lives only on your devices; nothing here reads a
browser cookie.

- **Raycast**: Preferences → Extensions → Lous Links → *Token* (stored in the macOS keychain).
- **CLI**: `$LOUS_LINKS_TOKEN`, else `~/.config/lous-links/token`:

```bash
mkdir -p ~/.config/lous-links && printf '%s' 'YOUR_TOKEN' > ~/.config/lous-links/token && chmod 600 ~/.config/lous-links/token
```

The token is never logged. Every URL printed by the CLI passes through `redactUrl()`,
which rewrites `t=…` to `t=***`.

### Hotkey

Raycast → Extensions → **Lous Links → Save Front Link** → Record Hotkey.
(Or bind `scripts/lous-links-save-front.sh` if you prefer the script-command route —
it shells out to `ll save-front` and needs no extension loaded.)

## Commands

| Command | Mode | What it does |
|---|---|---|
| **Save Front Link** | no-view | Resolves the frontmost window (40+ apps) → `POST /api/save` → HUD `Saved: <title>`. Falls back to a URL on the clipboard, then to an error HUD. |
| **Save Clipboard Link** | no-view | Saves every link on the clipboard — markdown links keep their title, bare URLs of any scheme are accepted. |
| **Search Links** | view | Fuzzy search over title/url/note/tags. Open (records the open first), Copy URL (`⌘C`), Copy Markdown (`⇧⌘C`), Favorite (`⌘S`), Pin (`⇧⌘P`), Open in web (`⌘L`), Delete (`⌃X`, with confirmation). |
| **Search Sessions** | view | Every Claude / Codex / Hermes session in one list — see below. |

### Preferences

| Name | Type | Default |
|---|---|---|
| `baseUrl` | textfield | `https://lous-links.myoldkylakehouse.workers.dev` |
| `token` | password (required) | — |
| `defaultTags` | textfield | — (comma-separated, applied to every save from Raycast) |
| `repoPath` | textfield | `~/code/raycast` (where `sessions/collect.ts` lives) |

Use the **workers.dev origin** for API calls. `https://loudog.uno/links` also works — the
client is base-path aware (`app.js:1` derives `LL_BASE` from `/^\/links(\/|$)/`) — but it
is a proxy hop, so the direct origin is the default.

## CLI

`~/.local/bin/ll` → `cli/ll.ts` (`#!/usr/bin/env bun`). It imports `src/lib/api.ts`, the
same client the extension uses, so there is exactly one definition of the wire contract.

```bash
ll save https://example.com --title "Example" --note "why" --tags read,later
ll save-front                 # AppleScript: Chrome/Chromium/Brave/Arc/Safari/Finder, else clipboard
ll list [--json]
ll search housing nyc         # order-insensitive scoring, ported from the web client
ll open <handle>              # records the open, then `open`s the URL
ll delete <handle>
ll star <handle> [--off]
ll --help

# global flags
--dry-run        print the exact request and send nothing (token shown as t=***)
--base <url>     override the base URL (env LOUS_LINKS_BASE)
--json           machine-readable output
```

`--dry-run` works without a token — it prints the request shape and says so on stderr.

## Sessions

One searchable place for every Claude, Codex and Hermes session.

The **index** is `~/.local/share/lous-links/sessions.json`, written by
`sessions/collect.ts` (owned separately — nothing in this README's scope writes it):

```jsonc
{ "v", "generated", "machine",
  "sessions": [{ "id", "agent", "machine", "title", "goal", "started", "ended",
                 "cwd", "url", "resume", "source", "projects": [], "summary",
                 "turns", "tags": [] }] }   // sorted by started desc
```

`agent` is one of `claude-code`, `claude-code-bg`, `claude-ai`, `codex-cli`,
`codex-desktop`, `hermes`, `cowork`, `other`.

**Search Sessions** (Raycast) reads that file. If it is missing you get a single row,
*Index not built yet*, whose action runs the collector. Filter by agent with the dropdown;
search hits title, goal, summary, cwd and projects. Per row: Open Session, Copy Resume
Command (`⌘C`), Copy Working Directory (`⇧⌘C`), Open Source File in Finder (`⌘F`),
Reveal in lous-links Web (`⌘L`), Rebuild Index (`⌘R`).

**CLI:**

```bash
ll sessions collect                          # runs sessions/collect.ts with bun
ll sessions search housing --agent codex-cli [--json]
ll sessions push [--since 2026-09-01] [--with-summary] [--dry-run]
ll sessions search|push --index /path/to/sessions.json   # for testing
```

`push` turns sessions into links:

| Field | Value |
|---|---|
| `url` | `session.url`, else the Agent Activity Graph page URL, else **the row is skipped** |
| `title` | `<title> · <agent> · <machine> · <YYYY-MM-DD>` (local calendar day) |
| `note` | the resume command; `+ summary` only with `--with-summary` |
| `tags` | `session,agent:<agent>,machine:<machine>` plus each project |

Upsert means *skip*: `GET /api/links` is fetched **once**, and any session whose URL is
already in the library is left alone (duplicates within one run are collapsed too).
`--dry-run` sends nothing at all — not even the dedupe GET — and says so. With no token,
`--dry-run` prints a `[DEFERRED-VERIFY: token]` line and exits 0.

## API contract

Derived by reading the served client JS. Evidence archived at:

- `/tmp/ll/app.js` (extracted script block)
- `~/agents/ai-outputs/2026-09-04/🗂️ work-board first-principles sweep/evidence/lous-links-client-shell-2026-09-04.html`

### Endpoints (`app.js:5-12`)

| Line | Call | Method + path | Body |
|---|---|---|---|
| 6 | `API.links()` | `GET /api/links` | — |
| 7 | `API.save(b)` | `POST /api/save` | JSON |
| 8 | `API.open(h)` | `POST /api/open/:h` | — |
| 9 | `API.patch(h,b)` | `PATCH /api/links/:h` | JSON |
| 10 | `API.del(h)` | `DELETE /api/links/:h` | — |
| 11 | `API.feedback(t)` | `POST /api/feedback` | `{text, context}` |

Also served, not wrapped by the client: `GET /export.md` (`app.js:90`),
`GET /unlock?key=…` (`app.js:221`), `GET /manifest.webmanifest` (`app.js:2`), `GET /sw.js`
(`app.js:224`).

### Link object

The client never declares a schema, so field names come from how it renders and patches
rows:

| Field | Type | Evidence |
|---|---|---|
| `handle` | string | `app.js:42` `el.dataset.h=d.handle`; used as `:h` at `:64,76,112,116` |
| `url` | string | `app.js:65` |
| `title` | string \| null | `app.js:43` `d.title \|\| d.url`; patched at `:123` |
| `note` | string \| null | `app.js:43`, patched at `:124` |
| `tags` | **comma-separated string** | `app.js:43` `d.tags.split(',')` |
| `dom` | string \| null | `app.js:42-43` (host, drives the glyph) |
| `scheme` | string \| null | `app.js:43,85` (non-http links: `raycast://`, `obsidian://`…) |
| `star` | 0/1 | `app.js:43`; **PATCH takes a boolean** `:76` |
| `pin` | 0/1 | `app.js:37,43`; PATCH boolean `:112` |
| `hide` | 0/1 | `app.js:33` filters `!d.hide`; PATCH boolean `:115` |
| `created_at` | epoch **milliseconds** | `app.js:18` `(Date.now()-ts)/1000`; patched at `:128` |
| `open_count` | number | `app.js:43,64` |

### The one asymmetry that shapes this code

`POST /api/save` is only ever handed `{url}` or `{url,title}` — `app.js:132-134` builds
exactly those two shapes in `parseLinks()` and `app.js:135` passes the object straight to
`API.save`. Nothing in the served client proves the server accepts `note` or `tags` on
save. `PATCH /api/links/:h`, by contrast, is proven for `title`, `url`, `note`, `tags`,
`star`, `pin`, `hide` and `created_at` (`app.js:76,112,115,123,124,125,128`), and returns
the updated row (`app.js:125` does `Object.assign(d, await r.json())`).

So `saveLink()` saves with `{url,title}` and then **PATCHes** note/tags — one request in
the common case, two when there is metadata. If a future server version accepts them on
save, the reconciling PATCH silently stops firing (it only runs when the returned row
disagrees).

### Auth

Unauthenticated requests return `401` with:

> `Unauthorized. Next step: visit /unlock?key=YOUR_TOKEN once in this browser, or append ?t=YOUR_TOKEN to this request (for the Shortcut / CLI / agent).`

Hence `?t=` on every request from here.

## Tests

```bash
bun test
```

`tests/api.test.ts` runs the client against a `Bun.serve` mock and asserts paths, methods,
the presence of `t` on every request, the save body shape, the PATCH/DELETE paths, handle
encoding, 401 handling with the token redacted, and the note/tags reconciliation.

`tests/sessions.test.ts` covers the session index: parsing, the missing-index case, search
(title/goal/summary/cwd/projects, order-insensitive, agent filter), the push mapping
(title/note/tags, `--with-summary`, AAG fallback, no-URL skip), dedupe by URL and within a
run, `--since`, and the full push over the mock server — asserting the exact
`GET /api/links` → `POST /api/save` → `PATCH /api/links/:h` sequence and both bodies.

No token and no network needed for either file.

## Layout

```
src/lib/api.ts        the only API client — no @raycast/api import, so bun can use it
src/lib/sessions.ts   session index: read, search, plan the push (also @raycast-free)
src/lib/prefs.ts      Raycast preferences → ApiConfig
src/save-front-link.ts, src/save-clipboard-link.ts, src/search-links.tsx,
src/search-sessions.tsx
src/resolver/         VENDORED from ../universal-copy-link (see below)
cli/ll.ts             bun CLI, imports src/lib/{api,sessions}.ts
tests/                contract tests against a local Bun.serve mock
sessions/collect.ts   NOT OURS — the index collector, owned separately
```

### `src/resolver/` is vendored, not forked

`aliases.ts`, `handlers.ts`, `router.ts`, `strategies/*`, `scripts/index.ts` are copied
from `~/code/raycast/extensions/universal-copy-link/src` (2026-09-04) with one mechanical
change — `import … from "../clipboard"` became `"../types"`, since only the `LinkResult`
type was needed. Raycast extensions are separate build roots and cannot import across
directories.

**One deliberate behavioural divergence**, in `strategies/browser.ts`: upstream asks for
`title of t` on the `currentTab` branch, but Safari's scripting dictionary has no `title`
on a tab. `sdef /Applications/Safari.app` lists `name`, `URL`, `source`, `text`, `index`,
`visible` — so upstream's Safari path raises an AppleScript error and silently degrades to
the accessibility fallback, which returns a window title and **no URL**. For a link saver
that is the entire payload, so this copy asks for `name` with an in-AppleScript fallback to
`title` (verified against a live Chrome: same result, no regression). Upstream still has
the original and should be fixed too.

**Upstream stays canonical for app coverage.** New app support belongs in
`universal-copy-link` first; then re-copy. `src/resolver/index.ts` is the only original
file in that directory — it wraps the copied router + strategies into `resolveFrontLink()`.
