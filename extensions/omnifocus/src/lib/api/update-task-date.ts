import { executeScript } from "../utils/execute-script";
import { escapeJXA } from "../utils/escape-jxa";

/**
 * Set the due date or defer date on a task. Pass null to clear.
 */
export async function updateTaskDate(
  taskId: string,
  field: "due" | "defer",
  date: Date | null,
): Promise<void> {
  const prop = field === "due" ? "dueDate" : "deferDate";
  const dateExpr = date ? `new Date("${date.toISOString()}")` : "null";

  await executeScript(`
    var omnifocus = Application('OmniFocus');
    var doc = omnifocus.defaultDocument();
    var task = doc.flattenedTasks.byId("${escapeJXA(taskId)}");
    task.${prop}.set(${dateExpr});
    return JSON.stringify(true);
  `);
}
