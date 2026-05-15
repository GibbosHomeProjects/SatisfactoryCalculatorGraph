import { useEffect } from "react";
import Canvas from "@/graph/Canvas";
import Palette from "@/ui/Palette";
import Inspector from "@/ui/Inspector";
import ProjectBar from "@/ui/ProjectBar";
import SummaryBar from "@/ui/SummaryBar";
import { useProjectStore } from "@/storage/projects";
import { useGraphStore } from "@/graph/store";

export default function App() {
  useEffect(() => {
    const ps = useProjectStore.getState();
    ps.init();
    const latest = Object.values(ps.projects).sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (latest) ps.switchTo(latest.id);
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const unsub = useGraphStore.subscribe((s, prev) => {
      if (s.graph === prev.graph) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => useProjectStore.getState().saveCurrent(), 300);
    });
    return () => {
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <main className="h-full w-full flex flex-col">
      <ProjectBar />
      <div className="flex flex-1 overflow-hidden">
        <Palette />
        <Canvas />
        <Inspector />
      </div>
      <SummaryBar />
    </main>
  );
}
