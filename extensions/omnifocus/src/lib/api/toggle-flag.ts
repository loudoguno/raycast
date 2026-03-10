import { executeScript } from "../utils/execute-script";
import { escapeJXA } from "../utils/escape-jxa";

/**
 * Toggle the flagged state on a task. Returns the new flagged value.
 */
export async function toggleFlag(taskId: string): Promise<boolean> {
  return executeScript<boolean>(`
    var omnifocus = Application('OmniFocus');
    var doc = omnifocus.defaultDocument();
    var task = doc.flattenedTasks.byId("${escapeJXA(taskId)}");
    var newVal = !task.flagged();
    task.flagged.set(newVal);
    return JSON.stringify(newVal);
  `);
}
