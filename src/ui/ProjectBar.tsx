import { useMemo, useState } from "react";
import { useProjectStore } from "@/storage/projects";
import { exportCurrentProject, importProjectFromFile } from "@/storage/importExport";
import { useBottleneck } from "@/graph/useBottleneck";
import PlanDialog from "./PlanDialog";

export default function ProjectBar() {
  const projectsMap = useProjectStore((s) => s.projects);
  const projects = useMemo(() => Object.values(projectsMap), [projectsMap]);
  const current = useProjectStore((s) => s.currentProjectId);
  const ps = useProjectStore.getState();
  const [planOpen, setPlanOpen] = useState(false);
  const report = useBottleneck();
  const hotCount = (report.bottleneckNodeId ? 1 : 0) + report.underSuppliedNodeIds.size;

  return (
    <>
      <header
        className="h-10 flex items-center gap-2 px-3 text-sm shrink-0"
        style={{ background: "rgba(0,0,0,0.35)", borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="label-mono"
          style={{
            color: "var(--accent-cyan-2)",
            textShadow: "0 0 8px rgba(6,182,212,0.6)",
            fontSize: "0.78rem",
            marginRight: "0.4rem",
          }}
        >
          FICSIT∥CALC
        </span>

        <select
          className="rounded px-2 py-1 glow-hover"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
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

        <ChromeButton
          onClick={() => {
            const name = prompt("Project name?", "New Project");
            if (name) ps.createProject(name);
          }}
        >
          New
        </ChromeButton>

        <ChromeButton
          onClick={() => {
            if (!current) return;
            const name = prompt("New name?", projects.find((p) => p.id === current)?.name ?? "");
            if (name) ps.renameProject(current, name);
          }}
        >
          Rename
        </ChromeButton>

        <ChromeButton onClick={() => current && ps.duplicateProject(current)}>
          Duplicate
        </ChromeButton>

        <ChromeButton
          primary
          onClick={() => setPlanOpen(true)}
          title="Auto-build a chain from existing sources to a target item"
          kbd="⌘P"
        >
          Plan…
        </ChromeButton>

        <ChromeButton onClick={() => exportCurrentProject()}>Export</ChromeButton>

        <label
          className="px-2 py-1 rounded glow-hover cursor-pointer text-xs"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
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

        <ChromeButton
          danger
          onClick={() => {
            if (current && confirm("Delete this project?")) ps.deleteProject(current);
          }}
        >
          Delete
        </ChromeButton>

        <span className="flex-1" />

        <ChromeButton kbd="⌘K" title="Command palette">
          ⌘K
        </ChromeButton>

        {hotCount > 0 && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background: "rgba(232,121,249,0.08)",
              border: "1px solid rgba(232,121,249,0.4)",
              color: "var(--accent-magenta-2)",
            }}
          >
            {hotCount} hot node{hotCount === 1 ? "" : "s"}
          </span>
        )}
      </header>
      <PlanDialog open={planOpen} onClose={() => setPlanOpen(false)} />
    </>
  );
}

function ChromeButton({
  children,
  onClick,
  primary,
  danger,
  title,
  kbd,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  title?: string;
  kbd?: string;
}) {
  const baseBg = primary
    ? "linear-gradient(180deg, rgba(232,121,249,0.18), rgba(232,121,249,0.05))"
    : danger
      ? "rgba(220,38,38,0.15)"
      : "rgba(255,255,255,0.04)";
  const borderColor = primary
    ? "rgba(232,121,249,0.5)"
    : danger
      ? "rgba(220,38,38,0.45)"
      : "rgba(255,255,255,0.08)";
  const color = primary ? "var(--accent-magenta-2)" : danger ? "#fca5a5" : "var(--text)";
  const boxShadow = primary ? "0 0 16px rgba(232,121,249,0.2)" : "none";

  return (
    <button
      onClick={onClick}
      title={title}
      className="px-2 py-1 rounded text-xs glow-hover inline-flex items-center gap-1"
      style={{ background: baseBg, border: `1px solid ${borderColor}`, color, boxShadow }}
    >
      <span>{children}</span>
      {kbd && (
        <span
          className="label-mono"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "0.05rem 0.3rem",
            borderRadius: "3px",
            fontSize: "0.6rem",
            color: "var(--text-faint)",
          }}
        >
          {kbd}
        </span>
      )}
    </button>
  );
}
