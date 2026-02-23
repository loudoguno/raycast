import { MenuBarExtra, openCommandPreferences, Clipboard, showHUD, open } from "@raycast/api";
import { getWatchedRepos, getRepoStatus, sortRepos, statusIcon, RepoStatus } from "./utils/git";

function getMenuBarTitle(repos: RepoStatus[]): string {
  const attentionCount = repos.filter((r) => !r.error && (r.isDirty || r.unpushedCount > 0)).length;
  if (attentionCount === 0) return "⑃";
  return `⑃ ${attentionCount}`;
}

function getStatusSummary(repo: RepoStatus): string {
  if (repo.error) return `Error: ${repo.error}`;
  const parts: string[] = [];
  if (repo.isDirty) parts.push(`${repo.dirtyCount} changed`);
  if (repo.unpushedCount > 0) parts.push(`${repo.unpushedCount} unpushed`);
  if (repo.isStale) parts.push("stale");
  return parts.length > 0 ? parts.join(", ") : "clean";
}

export default function Command() {
  const repoPaths = getWatchedRepos();
  const repos = sortRepos(repoPaths.map(getRepoStatus));
  const title = getMenuBarTitle(repos);

  return (
    <MenuBarExtra icon="⑃" title={title} tooltip="Git Repos Status">
      {repos.map((repo) => {
        const icon = statusIcon(repo);
        const summary = getStatusSummary(repo);
        const label = `${icon} ${repo.name} (${repo.branch}) — ${summary}`;

        return (
          <MenuBarExtra.Submenu key={repo.path} title={label}>
            <MenuBarExtra.Item
              title="Open in Terminal"
              onAction={async () => {
                open(`terminal://`);
                await showHUD(`Opening ${repo.name} in Terminal`);
                const { execSync } = require("child_process");
                execSync(
                  `osascript -e 'tell application "Terminal" to do script "cd \\"${repo.path}\\""'`,
                );
              }}
            />
            <MenuBarExtra.Item
              title="Copy Path"
              onAction={async () => {
                await Clipboard.copy(repo.path);
                await showHUD(`Copied: ${repo.path}`);
              }}
            />
          </MenuBarExtra.Submenu>
        );
      })}
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item title="Preferences..." onAction={openCommandPreferences} />
    </MenuBarExtra>
  );
}
