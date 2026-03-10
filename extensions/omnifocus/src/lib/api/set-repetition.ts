import { executeScript } from "../utils/execute-script";
import { escapeJXA } from "../utils/escape-jxa";
import { RepetitionMethod } from "../types";

/**
 * Set a repetition rule on a task using Omni Automation (evaluateJavascript).
 * JXA's repetitionRule setter crashes OmniFocus, so we use the Omni Automation bridge.
 */
export async function setRepetition(
  taskId: string,
  ruleString: string,
  method: RepetitionMethod,
): Promise<void> {
  const escapedTaskId = escapeJXA(taskId);
  const escapedRule = escapeJXA(ruleString);

  // Map our method names to Omni Automation's Task.RepetitionMethod
  const methodMap: Record<RepetitionMethod, string> = {
    fixed: "Fixed",
    "due-after-completion": "DueDate",
    "defer-after-completion": "DeferUntilDate",
  };
  const omniMethod = methodMap[method];

  await executeScript(`
    var omnifocus = Application('OmniFocus');
    omnifocus.evaluateJavascript(\`
      (function() {
        var targetTask = null;
        flattenedTasks.forEach(function(task) {
          if (task.id.primaryKey === "${escapedTaskId}") {
            targetTask = task;
          }
        });
        if (targetTask) {
          targetTask.repetitionRule = new Task.RepetitionRule(
            "${escapedRule}",
            Task.RepetitionMethod.${omniMethod}
          );
        }
      })()
    \`);
    return JSON.stringify(true);
  `);
}
