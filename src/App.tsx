import { useEffect } from "react";
import Canvas from "@/graph/Canvas";
import Palette from "@/ui/Palette";
import Inspector from "@/ui/Inspector";
import ProjectBar from "@/ui/ProjectBar";
import SummaryBar from "@/ui/SummaryBar";
import { useProjectStore } from "@/storage/projects";

export default function App() {
  useEffect(() => {
    useProjectStore.getState().init();
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
