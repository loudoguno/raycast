# Linear Custom - Planned Improvements

Track of planned improvements for this fork. Use the "Submit Feedback" command to add new ideas!

---

## Status Legend
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- ⏸️ On Hold

---

## Keyboard Shortcuts & Hotkeys

### 🔴 Global Hotkey for Create Issue
**Priority**: High
**Description**: Set up `⌃⌥L` as global hotkey to quickly create Linear issues from anywhere.
**Implementation**: Modify `package.json` commands section, add hotkey preference.

### 🔴 Quick Assign to Me (`⌘M`)
**Priority**: High
**Description**: Single keystroke to assign the selected issue to yourself.
**Files**: `src/components/IssueActions.tsx`
**Implementation**:
```typescript
<Action
  title="Assign to Me"
  icon={Icon.Person}
  shortcut={{ modifiers: ["cmd"], key: "m" }}
  onAction={() => assignIssue(issue.id, currentUser.id)}
/>
```

### 🔴 Copy Issue as Markdown Link (`⌘⇧C`)
**Priority**: Medium
**Description**: Copy `[ISSUE-123: Title](url)` format for easy pasting.
**Implementation**: Add action to issue actions panel.

### 🔴 Quick Status Cycle (`⌘S`)
**Priority**: Medium
**Description**: Cycle through statuses: Todo → In Progress → Done
**Implementation**: State machine for status transitions.

---

## UI Enhancements

### 🔴 Project Name in List View
**Priority**: High
**Description**: Show project name prominently in issue list (currently only shows identifier).
**Files**: `src/components/IssueListItem.tsx`
**Before**:
```
ABC-123  Fix login bug
```
**After**:
```
ABC-123  Fix login bug                    [Project Alpha]
```

### 🔴 Priority Color Badges
**Priority**: Medium
**Description**: Visual priority indicators using Raycast tag colors.
**Implementation**:
```typescript
const priorityColors = {
  urgent: Color.Red,
  high: Color.Orange,
  medium: Color.Yellow,
  low: Color.Green,
  none: Color.SecondaryText,
};
```

### 🔴 Customizable Default View
**Priority**: Medium
**Description**: Preference to set default filter (My Issues, All Issues, specific project).
**Files**: `package.json` preferences, `src/search-issues.tsx`

### 🔴 Issue Preview Improvements
**Priority**: Low
**Description**: Better markdown rendering in issue detail view, show linked issues.

---

## New Features

### 🔴 Quick Status Change Menu
**Priority**: High
**Description**: Change status without opening full detail view.
**Implementation**: Submenu action with all available statuses.
```typescript
<ActionPanel.Submenu title="Change Status" icon={Icon.Circle}>
  {statuses.map(status => (
    <Action
      key={status.id}
      title={status.name}
      onAction={() => updateStatus(issue.id, status.id)}
    />
  ))}
</ActionPanel.Submenu>
```

### 🔴 Batch Operations
**Priority**: Medium
**Description**: Select multiple issues and perform bulk actions (assign, change status, add label).
**Implementation**: Multi-select list mode with batch action panel.

### 🔴 Issue Templates
**Priority**: Medium
**Description**: Pre-defined templates for common issue types (bug, feature, task).
**Files**: New `src/create-issue-from-template.tsx`
**Templates**:
- Bug Report: Title, Steps to Reproduce, Expected, Actual
- Feature Request: Title, User Story, Acceptance Criteria
- Task: Title, Description, Checklist

### 🔴 Quick Capture to Triage
**Priority**: Medium
**Description**: Fastest path to create an issue - just title, auto-assigns to Triage.
**Implementation**: Simplified form, single text input.

### 🔴 Project Switcher
**Priority**: Low
**Description**: Quick switch between projects without going to settings.

### 🔴 Daily Issue Digest
**Priority**: Low
**Description**: Menu bar command showing issues updated today, due today, assigned to me.

---

## Performance & Polish

### 🔴 Caching Improvements
**Priority**: Medium
**Description**: Cache project list, user list, statuses to reduce API calls.

### 🔴 Offline Indicator
**Priority**: Low
**Description**: Show when Linear API is unreachable, offer cached data.

---

## Integration Ideas (Future)

### 🔴 GitHub PR Linking
**Description**: Show linked PRs for issues, quick action to open PR.

### 🔴 Slack Integration
**Description**: Share issue to Slack channel directly from Raycast.

### 🔴 Calendar Integration
**Description**: Create calendar block for issue work sessions.

---

## Notes

- Each improvement should have its own GitHub issue for tracking
- Use "Submit Feedback" command to create issues programmatically
- Reference this file in issue descriptions for context
