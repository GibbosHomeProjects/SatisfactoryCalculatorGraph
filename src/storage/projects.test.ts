import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "./projects";

beforeEach(() => {
  localStorage.clear();
  useProjectStore.getState().init();
});

describe("project store", () => {
  it("creates a new project with default name", () => {
    const id = useProjectStore.getState().createProject("My Plant");
    expect(useProjectStore.getState().projects[id]!.name).toBe("My Plant");
    expect(useProjectStore.getState().currentProjectId).toBe(id);
  });

  it("renames a project", () => {
    const id = useProjectStore.getState().createProject("A");
    useProjectStore.getState().renameProject(id, "B");
    expect(useProjectStore.getState().projects[id]!.name).toBe("B");
  });

  it("duplicates and deletes a project", () => {
    const id = useProjectStore.getState().createProject("A");
    const id2 = useProjectStore.getState().duplicateProject(id);
    expect(useProjectStore.getState().projects[id2]!.name).toBe("A (copy)");
    useProjectStore.getState().deleteProject(id);
    expect(useProjectStore.getState().projects[id]).toBeUndefined();
  });
});
