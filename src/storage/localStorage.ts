const KEY_INDEX = "sat-calc:projects:index";
const keyForProject = (id: string) => `sat-calc:projects:${id}`;

export type ProjectMeta = { id: string; name: string; updatedAt: number };

export const SCHEMA_VERSION = 1;

export type StoredProject = {
  schemaVersion: number;
  meta: ProjectMeta;
  graph: unknown;
};

export function readIndex(): ProjectMeta[] {
  const raw = localStorage.getItem(KEY_INDEX);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ProjectMeta[];
  } catch {
    return [];
  }
}

export function writeIndex(idx: ProjectMeta[]) {
  localStorage.setItem(KEY_INDEX, JSON.stringify(idx));
}

export function readProject(id: string): StoredProject | null {
  const raw = localStorage.getItem(keyForProject(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredProject;
  } catch {
    return null;
  }
}

export function writeProject(p: StoredProject) {
  localStorage.setItem(keyForProject(p.meta.id), JSON.stringify(p));
}

export function deleteStoredProject(id: string) {
  localStorage.removeItem(keyForProject(id));
}
