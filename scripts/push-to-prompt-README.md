# push-to-prompt

Hold `fn+shift+KEY`, talk (Wispr Flow), release, press ⏎. The dictated text fires into a
Claude Code session whose working directory and flags are chosen by KEY. No terminal, no
`cd`, no window to manage. A macOS notification confirms the fire in under a second, Chrome
opens the session's claude.ai page a couple of seconds later, and a second notification
lands with the first line of the reply when the session finishes.

Built 2026-09-04 by Sai-mx3 for [WORK#14](https://github.com/loudoguno/WORK/issues/14).
Build ISA: [`~/.claude/LIFEOS/MEMORY/WORK/20260903-push-to-prompt-build/ISA.md`](file:///Users/loudog/.claude/LIFEOS/MEMORY/WORK/20260903-push-to-prompt-build/ISA.md).

## Install (Lou — three steps, all in Raycast)

1. Raycast → Settings → Extensions → **+** → *Add Script Directory* → `~/code/raycast/scripts`
   (skip if it is already listed; the four new commands appear as **Push to Prompt · K/L/C/Q**).
2. Select each of the four and set its hotkey: `fn+⇧+K`, `fn+⇧+L`, `fn+⇧+C`, `fn+⇧+Q`.
3. Trigger one, dictate a sentence with Wispr Flow, press ⏎ — you should get a notification
   within a second and a Chrome tab within a few.

If Raycast refuses to record an `fn` chord, bind the chord in Karabiner instead and have it
open the Raycast deep link — snippet at the bottom of this file.

## The four profiles

| Key | Working directory | Flags | For |
|-----|-------------------|-------|-----|
| `k` | `~/keybindings` | — | hotkeys, Karabiner, the registry |
| `l` | `~/.claude` | `--effort high` | LifeOS work; full Sai-mx3 identity loads |
| `c` | frontmost kitty cwd → frontmost Finder folder → `~/code` | — | "do this where I'm looking" |
| `q` | `~/.local/share/push-to-prompt/quick` | `--effort low` | one-off questions; reads no files |

Edit the table at `scripts/push-to-prompt-profiles.tsv` (tab separated, symlinked to
`~/.config/push-to-prompt/profiles.tsv`). `push-to-prompt profiles` prints what resolves.

`c` never guesses silently — the directory it picked is in both the notification and the
session name, and it never falls back to bare `~`.

## CLI

```
push-to-prompt <k|l|c|q> "text"     fire a session
push-to-prompt <key> --dry-run "…"  print the exact claude command, fire nothing
push-to-prompt last                 reopen the most recent session URL
push-to-prompt reap [--dry-run]     stop launcher sessions idle > 24 h
push-to-prompt profiles             print the resolved profile table
```

Log and last-URL live in `~/.local/state/push-to-prompt/`.

## Housekeeping

Every session this launcher creates is named with a `🗼` prefix. The nightly launchd job
`uno.loudog.push-to-prompt-reap` (04:17) stops **only** those, and only after 24 h idle —
your other Remote Control bridges are never touched. Check it with
`launchctl list | grep push-to-prompt`, dry-run it with `push-to-prompt reap --dry-run`.

## Karabiner fallback (only if Raycast will not take `fn` chords)

Add to `~/keybindings/karabiner/karabiner.edn` under the appropriate layer — one line per key:

```clojure
[:k [[:open "raycast://script-commands/push-to-prompt-k"]]]
[:l [[:open "raycast://script-commands/push-to-prompt-l"]]]
[:c [[:open "raycast://script-commands/push-to-prompt-c"]]]
[:q [[:open "raycast://script-commands/push-to-prompt-q"]]]
```

This opens Raycast with the command's argument field focused, so the dictate-then-⏎ flow is
unchanged. Not applied by any agent — Karabiner files are yours to edit.

## Gotchas worth remembering

- `--bare` bills `ANTHROPIC_API_KEY` instead of the subscription. Never put it in the flags
  column; `q` uses `--effort low` to stay cheap.
- The backend strips `CLAUDECODE` / `CLAUDE_CODE_*` / `CLAUDE_EFFORT` before launching, or a
  session fired from inside another Claude session misbehaves.
- `PATH` must include `~/.bun/bin` or every LifeOS hook fails with `env: bun: not found` and
  the session comes up with no identity. The backend sets this itself.
