# Obsidian Custom - Planned Improvements

Track of planned improvements for this fork.

---

## Status Legend
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- ⏸️ On Hold

---

## Quick Capture Features

### 🔴 Global Quick Capture (`⌃⌥N`)
**Priority**: High
**Description**: Capture thoughts instantly without context switching.
**Implementation**:
- Simple text input form
- Configurable destination (inbox, daily note, specific file)
- Optional: AI-suggested tags/links

### 🔴 Append to Daily Note
**Priority**: High
**Description**: Add content to today's daily note without opening Obsidian.
**Implementation**:
```typescript
async function appendToDaily(content: string) {
  const dailyPath = getDailyNotePath(); // Using daily note settings
  const existing = await readFile(dailyPath);
  await writeFile(dailyPath, existing + '\n' + content);
}
```
**Preferences**:
- Append location: Top / Bottom / Under heading
- Include timestamp: Yes / No
- Daily note format (match Obsidian settings)

### 🔴 Template-Based Capture
**Priority**: Medium
**Description**: Quick capture with templates (meeting note, idea, task, etc.)
**Templates**:
- Meeting: Date, Attendees, Agenda, Notes, Action Items
- Idea: Title, Description, Related Topics
- Task: Title, Due Date, Priority, Project
- Reading: Title, Author, Key Takeaways, Quotes

### 🔴 Clipboard Capture
**Priority**: Medium
**Description**: Capture current clipboard as new note or append to existing.
**Actions**:
- Capture as new note (with smart title from content)
- Append to daily note
- Append to specific note (search to select)

---

## Search Enhancements

### 🔴 Full-Text Content Search
**Priority**: High
**Description**: Search note contents, not just titles.
**Implementation**:
- Index note content on first run
- Incremental updates on file changes
- Highlight matches in preview
**Preferences**:
- Enable content search (performance trade-off)
- Max file size to index
- Excluded folders

### 🔴 Folder-Scoped Search
**Priority**: Medium
**Description**: Search within specific folder/subfolder.
**UI**:
- Folder dropdown or path input
- Remember last used folders

### 🔴 Recent Files Command
**Priority**: High
**Description**: Quick access to recently edited notes.
**Implementation**:
- Sort by mtime (file modification time)
- Configurable count (10, 25, 50)
- Exclude specific folders (templates, archive)

### 🔴 Tag Search
**Priority**: Medium
**Description**: Search by tags, show all notes with specific tag.
**Implementation**:
- Parse frontmatter tags
- Parse inline #tags
- Tag autocomplete

### 🔴 Search Operators
**Priority**: Low
**Description**: Advanced search syntax.
**Operators**:
- `in:folder` - Search in folder
- `tag:tagname` - Has tag
- `created:today` - Created today
- `-word` - Exclude word

---

## Multi-Vault Support

### 🔴 Quick Vault Switcher
**Priority**: High
**Description**: Switch active vault without going to preferences.
**Implementation**:
- Dropdown in search commands
- Separate "Switch Vault" command
- Remember last used vault

### 🔴 Vault-Specific Preferences
**Priority**: Medium
**Description**: Different settings per vault.
**Per-Vault Settings**:
- Default capture location
- Daily note format
- Excluded folders

### 🔴 Cross-Vault Search
**Priority**: Low
**Description**: Search across all vaults simultaneously.
**UI**: Results grouped by vault

---

## UI Enhancements

### 🔴 Note Preview Improvements
**Priority**: Medium
**Description**: Better preview in search results.
**Improvements**:
- Rendered markdown (not raw)
- Syntax highlighting for code
- Image previews (if possible)
- Frontmatter displayed nicely

### 🔴 Show Vault Name in Results
**Priority**: Medium
**Description**: For multi-vault users, show which vault each result is from.
**Implementation**: Add vault badge/icon to list items.

### 🔴 Modified Date in List
**Priority**: Low
**Description**: Show when note was last edited.
**Format**: "2 days ago", "Jan 5", etc.

### 🔴 Backlinks Preview
**Priority**: Low
**Description**: Show notes that link to the selected note.
**Implementation**: Parse all notes for `[[note-name]]` references.

---

## New Commands

### 🔴 Open Random Note
**Priority**: Low
**Description**: Serendipitous discovery of old notes.
**Options**:
- Truly random
- Random from specific folder
- Random with specific tag

### 🔴 Daily Notes Navigator
**Priority**: Medium
**Description**: Browse daily notes by date.
**UI**: Calendar-style picker or list of recent daily notes.

### 🔴 Create Note from Template
**Priority**: Medium
**Description**: Select template → create new note with template content.
**Implementation**: Read from templates folder (configurable path).

### 🔴 Quick Link Inserter
**Priority**: Low
**Description**: Search notes and copy `[[wikilink]]` to clipboard.
**Use Case**: When writing in another app, quickly get Obsidian link format.

---

## Integration Ideas

### 🔴 Obsidian URI Scheme
**Description**: Use `obsidian://` URIs for better app integration.
**URIs**:
- `obsidian://open?vault=X&file=Y` - Open note
- `obsidian://new?vault=X&name=Y` - Create note
- `obsidian://search?vault=X&query=Y` - Search

### 🔴 Sync Status Indicator
**Priority**: Low
**Description**: Show if vault is synced (Obsidian Sync, iCloud, etc.)
**Implementation**: Check for `.obsidian/sync.json` or similar.

---

## Performance

### 🔴 File Indexing
**Priority**: Medium
**Description**: Build index for faster searches.
**Index Contains**:
- File paths
- Titles (from filename or frontmatter)
- Tags
- Content hashes (for change detection)

### 🔴 Lazy Loading for Large Vaults
**Priority**: Medium
**Description**: Don't load all files upfront.
**Implementation**: Paginated results, load on scroll.

---

## Notes

- Obsidian's plugin API is different from filesystem access
- This extension reads files directly, no Obsidian plugin needed
- Changes made via this extension appear in Obsidian immediately (same files)
- Respect Obsidian's daily note settings when possible
