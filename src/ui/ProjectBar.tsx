import { useMemo } from "react";
import { useProjectStore } from "@/storage/projects";
import { exportCurrentProject, importProjectFromFile } from "@/storage/importExport";

export default function ProjectBar() {
  const projectsMap = useProjectStore((s) => s.projects);
  const projects = useMemo(() => Object.values(projectsMap), [projectsMap]);
  const current = useProjectStore((s) => s.currentProjectId);
  const ps = useProjectStore.getState();

  return (
    <header className="h-10 flex items-center gap-2 px-3 border-b border-neutral-800 bg-neutral-900/80 text-sm shrink-0">
      <select
        className="bg-neutral-800 rounded px-2 py-1"
        value={current ?? ""}
        onChange={(e) => ps.switchTo(e.target.value)}
      >
        <option value="" disabled>
          Select project…
        </option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        onClick={() => {
          const name = prompt("Project name?", "New Project");
          if (name) ps.createProject(name);
        }}
      >
        New
      </button>
      <button
        className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        onClick={() => {
          if (!current) return;
          const name = prompt("New name?", projects.find((p) => p.id === current)?.name ?? "");
          if (name) ps.renameProject(current, name);
        }}
      >
        Rename
      </button>
      <button
        className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        onClick={() => current && ps.duplicateProject(current)}
      >
        Duplicate
      </button>
      <button
        className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        onClick={() => exportCurrentProject()}
      >
        Export
      </button>
      <label className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 cursor-pointer">
        Import
        <input
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importProjectFromFile(f).catch((err) => alert(String(err)));
            e.target.value = "";
          }}
        />
      </label>
      <button
        className="px-2 py-1 rounded bg-red-900/40 hover:bg-red-900/60"
        onClick={() => {
          if (current && confirm("Delete this project?")) ps.deleteProject(current);
        }}
      >
        Delete
      </button>
    </header>
  );
}
