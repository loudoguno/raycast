import { executeScript } from "../utils/execute-script";
import { Destination } from "../types";

/**
 * Fetch all valid task destinations from OmniFocus in a single JXA call.
 * Returns Inbox + active projects + active tasks with breadcrumb paths.
 */
export async function listDestinations(): Promise<Destination[]> {
  return executeScript<Destination[]>(`
    var omnifocus = Application('OmniFocus');
    var doc = omnifocus.defaultDocument();
    var results = [];

    // Inbox is always first
    results.push({
      id: '__inbox__',
      name: 'Inbox',
      type: 'inbox',
      breadcrumb: 'Inbox',
      projectName: null,
      hasChildren: false,
      depth: 0
    });

    // Get all folders (folders don't have a status() property in JXA)
    var allFolders = doc.flattenedFolders();
    for (var fi = 0; fi < allFolders.length; fi++) {
      var f = allFolders[fi];
      try {
        results.push({
          id: f.id(),
          name: f.name(),
          type: 'folder',
          breadcrumb: f.name(),
          projectName: null,
          hasChildren: true,
          depth: 0
        });
      } catch(e) { continue; }
    }

    // Get all projects, filter to active ones in JS
    var allProjects = doc.flattenedProjects();

    for (var pi = 0; pi < allProjects.length; pi++) {
      var p = allProjects[pi];
      var pStatus;
      try { pStatus = String(p.status()); } catch(e) { continue; }
      if (pStatus.indexOf('active') === -1) continue;

      var projectName = p.name();
      var projectId = p.id();
      var topTasks = p.tasks();

      results.push({
        id: projectId,
        name: projectName,
        type: 'project',
        breadcrumb: projectName,
        projectName: projectName,
        hasChildren: topTasks.length > 0,
        depth: 0
      });

      // Recursively add active tasks within this project
      function addTasks(tasks, parentBreadcrumb, depth) {
        for (var ti = 0; ti < tasks.length; ti++) {
          var t = tasks[ti];
          try {
            if (t.completed()) continue;
            // effectivelyDropped may not exist in all versions
            try { if (t.dropped()) continue; } catch(e) {}
          } catch(e) { continue; }
          var taskName = t.name();
          var breadcrumb = parentBreadcrumb + '  >  ' + taskName;
          var children = t.tasks();

          results.push({
            id: t.id(),
            name: taskName,
            type: 'task',
            breadcrumb: breadcrumb,
            projectName: projectName,
            hasChildren: children.length > 0,
            depth: depth
          });

          if (children.length > 0) {
            addTasks(children, breadcrumb, depth + 1);
          }
        }
      }

      addTasks(topTasks, projectName, 1);
    }

    return JSON.stringify(results);
  `);
}
