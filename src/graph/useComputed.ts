import { useMemo } from "react";
import { useGraphStore } from "./store";
import { sampleGameData } from "@/data/sample";
import { compute } from "@/engine/compute";

export function useComputed() {
  const graph = useGraphStore((s) => s.graph);
  return useMemo(() => compute(sampleGameData, graph), [graph]);
}
