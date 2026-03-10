import { executeScript } from "../utils/execute-script";
import { escapeJXA } from "../utils/escape-jxa";
import { CreateTaskOptions, Destination } from "../types";

/**
 * Create a task at the specified destination (inbox, project, or as a subtask of another task).
 * Returns the new task's ID.
 */
export async function addTask(
  destination: Destination,
  options: CreateTaskOptions,
): Promise<string> {
  const name = escapeJXA(options.name);
  const note = options.note ? escapeJXA(options.note) : "";
  const flagged = options.flagged ?? false;
  const dueDate = options.dueDate ? options.dueDate.toISOString() : null;

  // Build tag names array for JXA
  const tagNames = (options.tags ?? []).map((t) => escapeJXA(t));
  const tagNamesJSON = JSON.stringify(tagNames);

  const taskId = await executeScript<string>(`
    var omnifocus = Application('OmniFocus');
    var doc = omnifocus.defaultDocument();

    // Build task properties
    var props = {
      name: "${name}",
      note: "${note}",
      flagged: ${flagged}
    };

    ${dueDate ? `props.dueDate = new Date("${dueDate}");` : ""}

    // Create the task object
    var task = omnifocus.Task(props);

    // Place at destination
    ${
      destination.type === "inbox"
        ? "doc.inboxTasks.push(task);"
        : destination.type === "project"
          ? `var project = doc.flattenedProjects.byId("${escapeJXA(destination.id)}");
       project.tasks.push(task);`
          : `var parentTask = doc.flattenedTasks.byId("${escapeJXA(destination.id)}");
       parentTask.tasks.push(task);`
    }

    // Assign tags (find by name, create if missing)
    var tagNames = ${tagNamesJSON};
    var allTags = doc.flattenedTags();
    for (var i = 0; i < tagNames.length; i++) {
      var tagName = tagNames[i];
      var tag = null;
      for (var ti = 0; ti < allTags.length; ti++) {
        if (allTags[ti].name() === tagName) { tag = allTags[ti]; break; }
      }
      if (!tag) {
        tag = omnifocus.Tag({ name: tagName });
        doc.tags.push(tag);
      }
      task.addTag(tag);
    }

    return JSON.stringify(task.id());
  `);

  return taskId;
}
