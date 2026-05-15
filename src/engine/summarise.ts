import type { GameData } from "@/data/types";
import type { Graph } from "./graph";
import type { ComputeResult } from "./compute";

export type Summary = {
  rawInputsPerMin: Record<string, number>;
  totalPowerMW: number;
  totalPointsPerMin: number;
  warnings: { nodeId: string; message: string }[];
};

const SOURCE_KINDS = new Set([
  "miner",
  "water-extractor",
  "oil-pump",
  "resource-well",
]);

export function summarise(_data: GameData, graph: Graph, res: ComputeResult): Summary {
  const summary: Summary = {
    rawInputsPerMin: {},
    totalPowerMW: 0,
    totalPointsPerMin: 0,
    warnings: [],
  };

  for (const [id, node] of Object.entries(graph.nodes)) {
    const comp = res.nodes[id]!;
    if (SOURCE_KINDS.has(node.kind)) {
      for (const [itemId, amt] of Object.entries(comp.outputsPerMin)) {
        summary.rawInputsPerMin[itemId] = (summary.rawInputsPerMin[itemId] ?? 0) + amt;
      }
    } else {
      summary.totalPowerMW += comp.totalPowerMW;
    }
    if (comp.pointsPerMin) summary.totalPointsPerMin += comp.pointsPerMin;
    for (const w of comp.warnings) summary.warnings.push({ nodeId: id, message: w });
  }
  return summary;
}
