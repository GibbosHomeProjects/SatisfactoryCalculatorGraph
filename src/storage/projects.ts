import { create } from "zustand";
import { v4 as uuid } from "uuid";
import {
  readIndex,
  writeIndex,
  readProject,
  writeProject,
  deleteStoredProject,
  SCHEMA_VERSION,
  type ProjectMeta,
  type StoredProject,
} from "./localStorage";
import { useGraphStore } from "@/graph/store";
import type { Graph } from "@/engine/graph";

type ProjectStore = {
  projects: Record<string, ProjectMeta>;
  currentProjectId: string | null;
  init: () => void;
  createProject: (name: string) => string;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => string;
  deleteProject: (id: string) => void;
  switchTo: (id: string) => void;
  saveCurrent: () => void;
};

const emptyGraph = (): Graph => ({ nodes: {}, edges: [] });

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: {},
  currentProjectId: null,

  init: () => {
    const idx = readIndex();
    const projects: Record<string, ProjectMeta> = {};
    for (const m of idx) projects[m.id] = m;
    set({ projects, currentProjectId: null });
  },

  createProject: (name) => {
    const id = uuid();
    const meta: ProjectMeta = { id, name, updatedAt: Date.now() };
    const stored: StoredProject = { schemaVersion: SCHEMA_VERSION, meta, graph: emptyGraph() };
    writeProject(stored);
    const idx = [...readIndex(), meta];
    writeIndex(idx);
    set((s) => ({ projects: { ...s.projects, [id]: meta }, currentProjectId: id }));
    useGraphStore.getState().reset();
    return id;
  },

  renameProject: (id, name) => {
    const meta = get().projects[id];
    if (!meta) return;
    const next: ProjectMeta = { ...meta, name, updatedAt: Date.now() };
    const stored = readProject(id);
    if (stored) writeProject({ ...stored, meta: next });
    writeIndex(Object.values({ ...get().projects, [id]: next }));
    set((s) => ({ projects: { ...s.projects, [id]: next } }));
  },

  duplicateProject: (id) => {
    const source = readProject(id);
    if (!source) return id;
    const newId = uuid();
    const meta: ProjectMeta = {
      id: newId,
      name: `${source.meta.name} (copy)`,
      updatedAt: Date.now(),
    };
    writeProject({ schemaVersion: SCHEMA_VERSION, meta, graph: source.graph });
    writeIndex([...Object.values(get().projects), meta]);
    set((s) => ({ projects: { ...s.projects, [newId]: meta } }));
    return newId;
  },

  deleteProject: (id) => {
    deleteStoredProject(id);
    const remaining = { ...get().projects };
    delete remaining[id];
    writeIndex(Object.values(remaining));
    const nextCurrent = get().currentProjectId === id ? null : get().currentProjectId;
    set({ projects: remaining, currentProjectId: nextCurrent });
  },

  switchTo: (id) => {
    const stored = readProject(id);
    if (!stored) return;
    useGraphStore.getState().load(stored.graph as Graph);
    set({ currentProjectId: id });
  },

  saveCurrent: () => {
    const id = get().currentProjectId;
    if (!id) return;
    const meta = get().projects[id];
    if (!meta) return;
    const updated: ProjectMeta = { ...meta, updatedAt: Date.now() };
    writeProject({
      schemaVersion: SCHEMA_VERSION,
      meta: updated,
      graph: useGraphStore.getState().graph,
    });
    writeIndex(Object.values({ ...get().projects, [id]: updated }));
    set((s) => ({ projects: { ...s.projects, [id]: updated } }));
  },
}));
