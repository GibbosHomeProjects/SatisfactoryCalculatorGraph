import {
  SCHEMA_VERSION,
  readIndex,
  writeIndex,
  writeProject,
  type StoredProject,
  type ProjectMeta,
} from "./localStorage";
import { useGraphStore } from "@/graph/store";
import { useProjectStore } from "./projects";
import { v4 as uuid } from "uuid";

export function exportCurrentProject() {
  const ps = useProjectStore.getState();
  const id = ps.currentProjectId;
  if (!id) return;
  const meta = ps.projects[id];
  if (!meta) return;
  const blob: StoredProject = {
    schemaVersion: SCHEMA_VERSION,
    meta,
    graph: useGraphStore.getState().graph,
  };
  const json = JSON.stringify(blob, null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meta.name}.satgraph.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProjectFromFile(file: File) {
  const text = await file.text();
  const parsed: StoredProject = JSON.parse(text);
  if (parsed.schemaVersion > SCHEMA_VERSION) {
    throw new Error("This file was saved by a newer app version. Please update.");
  }
  const newId = uuid();
  const meta: ProjectMeta = {
    ...parsed.meta,
    id: newId,
    name: parsed.meta.name + " (imported)",
    updatedAt: Date.now(),
  };
  writeProject({ schemaVersion: SCHEMA_VERSION, meta, graph: parsed.graph });
  writeIndex([...readIndex(), meta]);
  const ps = useProjectStore.getState();
  ps.init();
  ps.switchTo(newId);
}
