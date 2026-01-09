# Kickoff Prompt - Copy This Into Claude Code

Replace the `[PLACEHOLDERS]` with your info, then paste into Claude Code.

---

```
I want to set up my forked Raycast extensions. Here's my context:

## My Info
- GitHub username: [YOUR_GITHUB_USERNAME]
- Raycast username: [YOUR_RAYCAST_USERNAME]
- Repository path: ~/code/raycast

## What I Want

Fork and set up these extensions (pick one or more):
- [x] Linear - for issue tracking customization
- [x] Obsidian - for note-taking customization
- [x] Roam Research - for semantic knowledge agent

## Tasks

1. **Fork the extensions** using the fork-extension.sh script in extensions/forked/scripts/

2. **Set up each extension**:
   - Copy submit-feedback.tsx from _shared/ to src/
   - Configure EXTENSION_INFO in submit-feedback.tsx with my GitHub info
   - Convert package.json.template to package.json with my Raycast username
   - Add submit-feedback command to package.json
   - Run npm install

3. **Verify it works**:
   - Run npm run build to check for errors
   - Tell me the command to start dev mode

4. **Show me next steps**:
   - How to test in Raycast
   - How to use the Submit Feedback command
   - Which improvements to tackle first

Start with Linear since it's the simplest. Walk me through each step.
```

---

## After Initial Setup

Once extensions are forked, use these follow-up prompts:

### Implement First Improvement
```
Now implement the first improvement from linear-custom/IMPROVEMENTS.md:
"Quick Assign to Me (⌘M)"

Read the improvement spec, implement it, and commit.
```

### Start Roam RAG
```
Now let's start on the Roam semantic search. Read roam-custom/DESIGN.md
and implement Phase 1 Step 1: Roam API Integration.

My Roam graph name is: [YOUR_GRAPH_NAME]
I have an API token ready to add to preferences.
```

### Check Status
```
What's the current status of my forked extensions?
- Are they all set up correctly?
- Any npm issues?
- What improvements have been implemented vs pending?
```
