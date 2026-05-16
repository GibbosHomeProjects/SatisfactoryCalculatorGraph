import { useMemo } from "react";
import { useGraphStore } from "./store";
import { useComputed } from "./useComputed";
import { gameData } from "@/data";
import { bottleneck } from "@/engine/bottleneck";

/**
 * Memoised bottleneck report for the current graph. Recomputes only when
 * the graph reference changes (i.e. on actual graph mutation, not on
 * unrelated UI state updates).
 */
export function useBottleneck() {
  const graph = useGraphStore((s) => s.graph);
  const compute = useComputed();
  return useMemo(() => bottleneck(gameData, graph, compute), [graph, compute]);
}
