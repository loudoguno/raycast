# Claude Code Prompts for Raycast Extension Forking

Copy and paste these prompts into Claude Code to get started.

---

## Prompt 1: Fork and Set Up an Extension

```
I want to fork and customize a Raycast extension. Here's my setup:

Repository: ~/code/raycast
Forked extensions directory: ~/code/raycast/extensions/forked

Please help me:
1. Run the fork-extension.sh script for [LINEAR | OBSIDIAN | ROAM-RESEARCH]
2. Copy the submit-feedback.tsx from _shared/ into the new extension's src/
3. Update the EXTENSION_INFO in submit-feedback.tsx with my details:
   - GitHub repo: [YOUR_GITHUB_USERNAME]/raycast
   - Extension name from the folder
4. Update package.json.template → package.json with my Raycast username
5. Add the submit-feedback command to package.json commands array
6. Run npm install
7. Show me what to do next to test it

My GitHub username is: [YOUR_GITHUB_USERNAME]
My Raycast username is: [YOUR_RAYCAST_USERNAME]
```

---

## Prompt 2: Quick Start - Fork All Three

```
Fork all three Raycast extensions (Linear, Obsidian, Roam Research) from the
templates in ~/code/raycast/extensions/forked/

For each one:
1. Use the fork-extension.sh script to clone from upstream
2. Set up the submit-feedback command
3. Configure package.json with my info
4. Run npm install

My details:
- GitHub username: [YOUR_GITHUB_USERNAME]
- Raycast username: [YOUR_RAYCAST_USERNAME]
- GitHub repo for issues: [YOUR_GITHUB_USERNAME]/raycast

Start with Linear since it's the simplest, then do Obsidian, then Roam.
Tell me when each is ready to test with `npm run dev`.
```

---

## Prompt 3: Implement a Specific Improvement

```
I want to implement an improvement from the IMPROVEMENTS.md file.

Extension: [linear-custom | obsidian-custom | roam-custom]
Improvement: [COPY THE IMPROVEMENT TITLE FROM IMPROVEMENTS.md]

Please:
1. Read the IMPROVEMENTS.md to understand the full specification
2. Read the relevant source files in the extension
3. Implement the improvement
4. Update IMPROVEMENTS.md to mark it as completed
5. Test that it builds with npm run build
6. Commit with a descriptive message

Don't push yet - I want to test it first with npm run dev.
```

---

## Prompt 4: Start the Roam Semantic RAG MVP

```
I want to start building the Roam Research semantic RAG extension.

Read these files first:
- ~/code/raycast/extensions/forked/roam-custom/DESIGN.md
- ~/code/raycast/extensions/forked/roam-custom/FEATURES.md
- ~/code/raycast/extensions/forked/roam-custom/IMPROVEMENTS.md

Then implement Phase 1 (Foundation MVP):
1. Set up the Roam API integration using @roam-research/roam-api-sdk
2. Create basic graph sync to pull pages and blocks
3. Set up LanceDB for vector storage
4. Implement basic semantic search command
5. Create a simple "Ask Roam" command that uses Claude

Start with the API integration and a simple search command. We can add
embeddings after we verify the API connection works.

My Roam graph name is: [YOUR_GRAPH_NAME]
```

---

## Prompt 5: Check and Apply Upstream Updates

```
Check all my forked Raycast extensions for upstream updates.

1. Run sync-check.sh for each extension in ~/code/raycast/extensions/forked/
2. Show me what's changed upstream
3. For any extensions with updates, help me decide if I should merge them
4. If I say yes, apply the updates with apply-upstream.sh
5. Help resolve any conflicts with my customizations

Focus on bug fixes and security updates - I can skip new features if they
conflict with my customizations.
```

---

## Prompt 6: Implement Issue from GitHub

```
Implement the GitHub issue for my Raycast extension fork.

Issue URL: [PASTE GITHUB ISSUE URL]
OR
Issue number: #[NUMBER] in repo [YOUR_GITHUB_USERNAME]/raycast

Please:
1. Fetch and read the issue details
2. Identify which extension it's for (from labels or content)
3. Read the relevant source files
4. Implement the requested feature/fix
5. Update IMPROVEMENTS.md if applicable
6. Create a commit with message referencing the issue
7. Create a PR description

I'll review before pushing.
```

---

## Prompt 7: Add a New Custom Feature (Freeform)

```
I want to add a custom feature to my [linear-custom | obsidian-custom | roam-custom] extension.

Feature idea: [DESCRIBE WHAT YOU WANT]

Please:
1. Read the extension's current source code to understand the structure
2. Design how this feature should work (show me before implementing)
3. Implement it following Raycast extension patterns
4. Add it to IMPROVEMENTS.md as a completed item
5. Test it builds successfully

Be conservative - keep it simple and focused. I can iterate on it later
using the submit-feedback workflow.
```

---

## Usage Tips

### Starting a session
```bash
cd ~/code/raycast
claude
```

### Quick commands during session
- "Show me the IMPROVEMENTS.md for linear-custom"
- "What's the status of my forked extensions?"
- "Run npm run dev for obsidian-custom"
- "Commit and push my changes"

### After making changes
```bash
# Test in Raycast
npm run dev

# Then in Raycast, search for your extension
# It will appear as "Linear (Custom)" etc.
```
