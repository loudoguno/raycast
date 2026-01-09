# Iterative Development Workflow

A hands-off development workflow for Raycast extension customization using Claude Code.

## The Vision

```
You → Notice Issue → Submit Feedback → Claude Code Implements → PR → Update
         ↑                                                          │
         └──────────────────────────────────────────────────────────┘
                            (iterate)
```

No IDE required. Fire off improvements from the extension itself.

---

## Setup

### 1. Configure GitHub Token

Each extension needs a GitHub token for the Submit Feedback command:

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Create token with `repo` scope
3. In Raycast: Settings → Extensions → [Your Extension] → Preferences
4. Add the token

### 2. Configure Extension for Feedback

Each forked extension has a `submit-feedback.tsx` file. Update the `EXTENSION_INFO`:

```typescript
const EXTENSION_INFO = {
  // Your GitHub repo (your fork of this repo)
  githubRepo: "YOUR_USERNAME/raycast",

  // Extension folder name
  extensionName: "linear-custom",

  // Display name
  displayName: "Linear (Custom)",

  // Labels for GitHub issues
  defaultLabels: ["enhancement", "extension: linear-custom"],
};
```

### 3. Set Up Claude Code

Ensure Claude Code can access your repo:

```bash
# In your raycast extensions directory
cd ~/code/raycast
claude
```

---

## Workflow

### Step 1: Use the Extension

Just use your forked extension normally. When you notice something:
- A feature that would be useful
- A bug or annoyance
- A UI improvement idea
- A keyboard shortcut change

### Step 2: Submit Feedback

1. Open Raycast
2. Search for "Submit Feedback" (or `⌘⇧F` if configured)
3. Choose type: Bug, Feature, Improvement, Question
4. Fill out the form
5. Submit

The command creates a GitHub issue with:
- Extension context (which extension, which command)
- Your description
- Labels for organization
- Hidden metadata for Claude Code

### Step 3: Claude Code Picks Up Issue

Option A: **Manual trigger**
```bash
claude "Implement issue #42 for linear-custom extension"
```

Option B: **Automated via GitHub Actions** (advanced)
```yaml
# .github/workflows/claude-implement.yml
on:
  issues:
    types: [labeled]

jobs:
  implement:
    if: contains(github.event.label.name, 'claude-ready')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Claude Code
        run: |
          claude "Implement issue #${{ github.event.issue.number }}"
```

### Step 4: Review & Merge

1. Claude Code creates a PR
2. You review the changes
3. Test locally: `npm run dev`
4. Merge when satisfied

### Step 5: Update Your Extension

```bash
git pull
cd extensions/forked/linear-custom
npm install
npm run dev
```

Raycast hot-reloads → you have the update.

---

## Issue Format

The Submit Feedback command creates issues with this structure:

```markdown
## ✨ Feature Request

**Extension**: Linear (Custom)
**Priority**: medium

### Description
I want to quickly assign issues to myself without opening the detail view.

---
_Submitted via Linear (Custom) extension feedback command_

<!-- CLAUDE_CODE_CONTEXT
Extension: linear-custom
Repo: username/raycast
Type: feature
Priority: medium
-->
```

The hidden comment helps Claude Code understand the context.

---

## Claude Code Prompts

### Implementing a Feature

```
Implement GitHub issue #42 for the linear-custom extension.

The issue is a feature request for quick assign functionality.
Read the issue, understand the requirements, implement the feature,
write tests if applicable, and create a PR.

Extension location: extensions/forked/linear-custom/
```

### Fixing a Bug

```
Fix the bug described in issue #43 for obsidian-custom.

Read the issue, reproduce the bug, implement a fix,
and create a PR with a clear description of the fix.
```

### Batch Implementation

```
Look at all open issues labeled "claude-ready" in this repo.
Implement them one by one, creating separate commits for each.
Then create a single PR with all changes.
```

---

## Best Practices

### Writing Good Feedback

**Good feedback**:
```
Title: Add "Assign to Me" quick action
Description: When viewing an issue in the list, I want to press ⌘M
to assign it to myself without opening the detail view. This would
save several clicks for a common action.
```

**Vague feedback** (harder to implement):
```
Title: Make it faster
Description: The extension is slow
```

### Organizing Issues

Use labels:
- `extension: linear-custom` - Which extension
- `enhancement` / `bug` / `question` - Type
- `priority: high/medium/low` - Importance
- `claude-ready` - Ready for Claude Code to implement
- `needs-clarification` - Needs more details

### Testing Changes

Always test locally before merging:

```bash
# Pull the PR branch
git fetch origin pull/123/head:pr-123
git checkout pr-123

# Test the extension
cd extensions/forked/linear-custom
npm install
npm run dev

# Try the new feature in Raycast
```

---

## Troubleshooting

### Issue not created
- Check GitHub token has `repo` scope
- Verify repo name in EXTENSION_INFO
- Check network connectivity

### Claude Code doesn't understand
- Add more context to the issue
- Reference specific files
- Include code examples of desired behavior

### Extension not updating
- Run `npm install` after pulling
- Restart `npm run dev`
- Use Raycast's "Refresh Extensions" command

---

## Advanced: Automated Pipeline

For fully automated workflow:

```yaml
# .github/workflows/claude-auto-implement.yml
name: Auto-Implement Issues

on:
  issues:
    types: [labeled]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to implement'
        required: true

jobs:
  implement:
    if: |
      github.event_name == 'workflow_dispatch' ||
      contains(github.event.label.name, 'auto-implement')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Get issue details
        id: issue
        uses: actions/github-script@v7
        with:
          script: |
            const issue = await github.rest.issues.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ github.event.issue.number || inputs.issue_number }}
            });
            return issue.data;

      - name: Run Claude Code
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # Claude Code implementation here
          echo "Implementing issue..."

      - name: Create PR
        uses: peter-evans/create-pull-request@v5
        with:
          title: "Implement #${{ github.event.issue.number }}"
          body: "Automated implementation of #${{ github.event.issue.number }}"
          branch: "auto-implement-${{ github.event.issue.number }}"
```

---

## Summary

1. **Use** your extension normally
2. **Submit Feedback** when you have ideas
3. **Claude Code** implements the changes
4. **Review** and merge the PR
5. **Pull** and enjoy the update

No IDE needed. Development from within Raycast itself.
