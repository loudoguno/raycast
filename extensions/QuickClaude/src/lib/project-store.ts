import { LocalStorage } from "@raycast/api";
import { homedir } from "os";
import path from "path";
import { expandTilde } from "./utils";

const PROJECTS_KEY = "quickclaude-projects";

export interface StoredProject {
  path: string; // absolute path
  lastAccessed: number; // timestamp
  accessCount: number;
}

/**
 * Load all stored projects sorted by most recently accessed.
 * Always includes ~/.claude as the default entry.
 */
export async function loadProjects(): Promise<StoredProject[]> {
  const raw = await LocalStorage.getItem<string>(PROJECTS_KEY);
  let projects: StoredProject[] = raw ? JSON.parse(raw) : [];

  // Ensure ~/.claude always exists
  const claudeDir = path.join(homedir(), ".claude");
  const hasDefault = projects.some((p) => p.path === claudeDir);
  if (!hasDefault) {
    projects.push({ path: claudeDir, lastAccessed: 0, accessCount: 0 });
  }

  // Sort by most recently accessed (0 = never accessed goes last)
  projects.sort((a, b) => b.lastAccessed - a.lastAccessed);

  return projects;
}

/**
 * Add or update a project path. Records access time.
 */
export async function touchProject(projectPath: string): Promise<void> {
  const absPath = expandTilde(projectPath);
  const projects = await loadProjects();

  const existing = projects.find((p) => p.path === absPath);
  if (existing) {
    existing.lastAccessed = Date.now();
    existing.accessCount += 1;
  } else {
    projects.push({ path: absPath, lastAccessed: Date.now(), accessCount: 1 });
  }

  await LocalStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

/**
 * Add a new project path (from file picker or manual entry).
 */
export async function addProject(projectPath: string): Promise<void> {
  const absPath = expandTilde(projectPath);
  const projects = await loadProjects();

  const exists = projects.some((p) => p.path === absPath);
  if (!exists) {
    projects.push({ path: absPath, lastAccessed: Date.now(), accessCount: 0 });
    await LocalStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
}

/**
 * Remove a project from the store.
 */
export async function removeProject(projectPath: string): Promise<void> {
  const absPath = expandTilde(projectPath);
  let projects = await loadProjects();
  projects = projects.filter((p) => p.path !== absPath);
  await LocalStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}
