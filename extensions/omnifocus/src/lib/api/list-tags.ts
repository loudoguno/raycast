import { executeScript } from "../utils/execute-script";
import { OmniFocusTag } from "../types";

/**
 * Fetch all tags from OmniFocus.
 */
export async function listTags(): Promise<OmniFocusTag[]> {
  return executeScript<OmniFocusTag[]>(`
    var omnifocus = Application('OmniFocus');
    var doc = omnifocus.defaultDocument();
    var tags = doc.flattenedTags();
    var results = [];

    for (var i = 0; i < tags.length; i++) {
      results.push({
        id: tags[i].id(),
        name: tags[i].name()
      });
    }

    return JSON.stringify(results);
  `);
}
