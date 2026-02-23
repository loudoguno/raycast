# Machine Sync Dashboard — Future Improvements

## High Priority
- [ ] Configurable watched repos via Raycast preferences (instead of hardcoded)
- [ ] Configurable remote machine hostname via preferences
- [ ] Show branch diff between machines (which commits exist on one but not the other)
- [ ] Handle non-fast-forward situations — warn before push/pull if diverged

## UX Improvements
- [ ] Add search/filter to quickly find a repo
- [ ] Show time since last fetch/refresh in the UI
- [ ] Auto-refresh on window focus (re-check when user opens the command)
- [ ] Color the detail panel commit list (highlight divergent commits)
- [ ] Add "Open in VS Code" action
- [ ] Add "Open on GitHub" action for repos with GitHub remotes
- [ ] Toast notifications for SSH timeout vs offline (more specific errors)

## New Features
- [ ] Menu bar command showing quick sync status icon (like git-repos extension)
- [ ] "Sync All" action — pull all repos on both machines in one click
- [ ] Show stale repos (last commit > 7 days)
- [ ] Support for more machines (next-mbp, etc.) — make machine list configurable
- [ ] Diff viewer — show what's different between the two machines' working trees
- [ ] SSH tunnel health check (Tailscale status)
- [ ] History view — track sync events over time

## Technical Debt
- [ ] Parallelize SSH calls (currently sequential per repo)
- [ ] Cache SSH results with TTL to speed up re-opens
- [ ] Better error messages when SSH key auth fails
- [ ] Add `~/code/raycast` to mxb .gitignore awareness (it'll always differ since we dev here)
