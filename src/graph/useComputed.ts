import { useMemo } from "react";
import { useGraphStore } from "./store";
import { gameData } from "@/data";
import { compute } from "@/engine/compute";

export function useComputed() {
  const graph = useGraphStore((s) => s.graph);
  return useMemo(() => compute(gameData, graph), [graph]);
}
