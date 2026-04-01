import { LocalStorage } from "@raycast/api";
import { homedir } from "os";
import { expandTilde } from "./utils";

const PROJECTS_KEY = "quickclaude-projects";

export interface StoredProject {
  path: string; // absolute path
  lastAccessed: number; // timestamp
  accessCount: number;
}

/**
 * Load all stored projects sorted by most recently accessed.
 * Seeds with home directory on first run.
 */
export async function loadProjects(): Promise<StoredProject[]> {
  const raw = await LocalStorage.getItem<string>(PROJECTS_KEY);
  const projects: StoredProject[] = raw ? JSON.parse(raw) : [];

  // Seed with home dir on first run so there's always at least one option
  if (projects.length === 0) {
    projects.push({ path: homedir(), lastAccessed: 0, accessCount: 0 });
  }

  projects.sort((a, b) => b.lastAccessed - a.lastAccessed);
  return projects;
}

/**
 * Record a project access (adds if new, bumps timestamp if existing).
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

  if (!projects.some((p) => p.path === absPath)) {
    projects.push({ path: absPath, lastAccessed: Date.now(), accessCount: 0 });
    await LocalStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
}

/**
 * Remove a project from the store.
 */
export async function removeProject(projectPath: string): Promise<void> {
  const absPath = expandTilde(projectPath);
  const projects = await loadProjects();
  const filtered = projects.filter((p) => p.path !== absPath);
  await LocalStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
}
