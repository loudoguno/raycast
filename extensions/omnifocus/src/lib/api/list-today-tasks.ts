import { executeScript } from "../utils/execute-script";
import { TodayTask } from "../types";

/**
 * Fetch tasks relevant to "today": overdue, due today, flagged, and due soon (next 3 days).
 * Results are pre-sorted within each section.
 */
export async function listTodayTasks(): Promise<TodayTask[]> {
  return executeScript<TodayTask[]>(`
    var omnifocus = Application('OmniFocus');
    var doc = omnifocus.defaultDocument();
    var results = [];

    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var todayEnd = new Date(todayStart.getTime() + 86400000);
    var soonEnd = new Date(todayStart.getTime() + 86400000 * 4);

    var allTasks = doc.flattenedTasks();
    for (var i = 0; i < allTasks.length; i++) {
      var t = allTasks[i];
      try { if (t.completed()) continue; } catch(e) { continue; }
      try { if (t.dropped()) continue; } catch(e) {}

      var due = t.dueDate();
      var flagged = t.flagged();

      // Skip if not due within range and not flagged
      if (!due && !flagged) continue;
      if (due && due >= soonEnd && !flagged) continue;

      // Determine section
      var section;
      if (due && due < todayStart) section = 'overdue';
      else if (due && due < todayEnd) section = 'due-today';
      else if (flagged && (!due || due >= todayEnd)) section = 'flagged';
      else section = 'due-soon';

      // Collect tags
      var tags = [];
      try {
        var tt = t.tags();
        for (var k = 0; k < tt.length; k++) tags.push(tt[k].name());
      } catch(e) {}

      // Get containing project name
      var projectName = null;
      try { projectName = t.containingProject().name(); } catch(e) {}

      // Note excerpt (first line, max 100 chars)
      var noteText = '';
      try { noteText = t.note() || ''; } catch(e) {}
      var firstLine = noteText.split('\\n')[0];
      var noteExcerpt = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;

      // Estimated minutes
      var est = null;
      try {
        var raw = t.estimatedMinutes();
        if (raw && raw > 0) est = raw;
      } catch(e) {}

      // Defer date
      var deferDate = null;
      try {
        var dd = t.deferDate();
        if (dd) deferDate = dd.toISOString();
      } catch(e) {}

      results.push({
        id: t.id(),
        name: t.name(),
        projectName: projectName,
        tags: tags,
        dueDate: due ? due.toISOString() : null,
        deferDate: deferDate,
        flagged: flagged,
        estimatedMinutes: est,
        noteExcerpt: noteExcerpt,
        section: section
      });
    }

    // Sort: overdue oldest-first, due-today earliest-first, flagged alpha, due-soon earliest-first
    results.sort(function(a, b) {
      var sectionOrder = { 'overdue': 0, 'due-today': 1, 'flagged': 2, 'due-soon': 3 };
      if (sectionOrder[a.section] !== sectionOrder[b.section]) {
        return sectionOrder[a.section] - sectionOrder[b.section];
      }
      if (a.section === 'flagged') return a.name.localeCompare(b.name);
      if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.name.localeCompare(b.name);
    });

    return JSON.stringify(results);
  `);
}
