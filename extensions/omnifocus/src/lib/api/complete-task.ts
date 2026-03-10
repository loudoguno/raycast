import { executeScript } from "../utils/execute-script";
import { escapeJXA } from "../utils/escape-jxa";

/**
 * Mark a task as complete by ID.
 */
export async function completeTask(taskId: string): Promise<void> {
  await executeScript(`
    var omnifocus = Application('OmniFocus');
    var doc = omnifocus.defaultDocument();
    var task = doc.flattenedTasks.byId("${escapeJXA(taskId)}");
    task.markComplete();
    return JSON.stringify(true);
  `);
}
