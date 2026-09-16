import type { Project } from "./types";

const KEY = "flowwrite.projects.v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function listProjects(): Project[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Project[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  } catch {
    return [];
  }
}

export function getProject(id: string): Project | null {
  return listProjects().find((p) => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  if (!isBrowser()) return;
  const all = listProjects().filter((p) => p.id !== project.id);
  all.unshift(project);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteProject(id: string): void {
  if (!isBrowser()) return;
  const all = listProjects().filter((p) => p.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function renameProject(id: string, name: string): void {
  const p = getProject(id);
  if (!p) return;
  saveProject({ ...p, name, updatedAt: new Date().toISOString() });
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
