import { executeScript } from "../utils/execute-script";
import { escapeJXA } from "../utils/escape-jxa";

/**
 * Complete a task and create a "Waiting: ..." duplicate in the same project.
 * Adds a "Waiting For" tag (created if it doesn't exist).
 * Defers the waiting task to tomorrow with a due date 1 week out.
 * Returns the new waiting task's ID.
 */
export async function completeAndAwait(taskId: string): Promise<string> {
  return executeScript<string>(`
    var omnifocus = Application('OmniFocus');
    var doc = omnifocus.defaultDocument();
    var original = doc.flattenedTasks.byId("${escapeJXA(taskId)}");

    var originalName = original.name();
    var originalNote = original.note() || '';

    // Find or determine where to place the waiting task
    var containingProject = null;
    try { containingProject = original.containingProject(); } catch(e) {}

    // Mark original complete
    original.markComplete();

    // Calculate dates
    var now = new Date();
    var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
    var nextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 17, 0, 0);

    // Create waiting task
    var waitingTask = omnifocus.Task({
      name: 'Waiting: ' + originalName,
      note: 'Original completed ' + now.toLocaleDateString() + '\\n' + originalNote,
      deferDate: tomorrow,
      dueDate: nextWeek,
      flagged: false
    });

    // Place in same project or inbox
    if (containingProject) {
      containingProject.tasks.push(waitingTask);
    } else {
      doc.inboxTasks.push(waitingTask);
    }

    // Add "Waiting For" tag (create if needed)
    var allTags = doc.flattenedTags();
    var waitingTag = null;
    for (var i = 0; i < allTags.length; i++) {
      if (allTags[i].name() === 'Waiting For') { waitingTag = allTags[i]; break; }
    }
    if (!waitingTag) {
      waitingTag = omnifocus.Tag({ name: 'Waiting For' });
      doc.tags.push(waitingTag);
    }
    waitingTask.addTag(waitingTag);

    return JSON.stringify(waitingTask.id());
  `);
}
