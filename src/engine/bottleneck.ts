import type { GameData } from "@/data/types";
import type { Graph } from "./graph";
import type { ComputeResult } from "./compute";
import { recipeInputPerMinPerMachine } from "./production";

export type BottleneckReport = {
  bottleneckNodeId: string | null;
  bottleneckDelta?: { itemId: string; perMinShortfall: number };
  underSuppliedNodeIds: Set<string>;
};

const SOURCE_KINDS = new Set([
  "miner",
  "water-extractor",
  "oil-pump",
  "resource-well",
]);

/**
 * Identify the single node most limiting overall throughput, plus the set
 * of nodes that aren't getting enough input for their current configuration.
 *
 * Algorithm:
 *   - For each machine node, look at every input. If supply for that input
 *     is less than `per_machine_demand * ceil(machine_count)`, the node is
 *     under-supplied.
 *   - The bottleneck node is the upstream-most source / producer whose
 *     supply/demand ratio is smallest. If no consumer is under-supplied,
 *     there is no bottleneck.
 */
export function bottleneck(
  data: GameData,
  graph: Graph,
  result: ComputeResult,
): BottleneckReport {
  const underSuppliedNodeIds = new Set<string>();
  const ratios = new Map<string, { ratio: number; itemId: string; shortfall: number }>();

  for (const node of Object.values(graph.nodes)) {
    if (node.kind !== "machine") continue;
    const recipe = data.recipes[node.recipeId];
    if (!recipe || recipe.inputs.length === 0) continue;

    const computedMachineCount = result.nodes[node.id]?.machineCount ?? 0;

    let worstRatio = Infinity;
    let worstItem = recipe.inputs[0]!.itemId;
    let worstShortfall = 0;

    for (const inp of recipe.inputs) {
      const perMachineDemand = recipeInputPerMinPerMachine(recipe, inp.itemId, node.clockPct);
      if (perMachineDemand === 0) continue;

      let supply = 0;
      for (const e of graph.edges) {
        if (e.toNodeId !== node.id || e.itemId !== inp.itemId) continue;
        supply += result.edges[e.id]?.amountPerMin ?? 0;
      }

      const maxAbsorb = perMachineDemand * Math.ceil(computedMachineCount);
      if (supply + 1e-6 < maxAbsorb) underSuppliedNodeIds.add(node.id);

      const ratio = maxAbsorb === 0 ? 1 : supply / maxAbsorb;
      if (ratio < worstRatio) {
        worstRatio = ratio;
        worstItem = inp.itemId;
        worstShortfall = Math.max(0, maxAbsorb - supply);
      }
    }

    if (worstRatio < 1) {
      const seen = new Set<string>();
      let cursor = node.id;
      while (!seen.has(cursor)) {
        seen.add(cursor);
        const incoming = graph.edges.find(
          (e) => e.toNodeId === cursor && e.itemId === worstItem,
        );
        if (!incoming) break;
        cursor = incoming.fromNodeId;
      }
      const upstream = graph.nodes[cursor];
      const candidateId = upstream && SOURCE_KINDS.has(upstream.kind) ? cursor : node.id;
      const existing = ratios.get(candidateId);
      if (!existing || worstRatio < existing.ratio) {
        ratios.set(candidateId, { ratio: worstRatio, itemId: worstItem, shortfall: worstShortfall });
      }
    }
  }

  if (ratios.size === 0) {
    return { bottleneckNodeId: null, underSuppliedNodeIds };
  }

  let worstId: string | null = null;
  let worst = { ratio: Infinity, itemId: "", shortfall: 0 };
  for (const [id, r] of ratios) {
    if (r.ratio < worst.ratio) {
      worst = r;
      worstId = id;
    }
  }

  return {
    bottleneckNodeId: worstId,
    bottleneckDelta: { itemId: worst.itemId, perMinShortfall: worst.shortfall },
    underSuppliedNodeIds,
  };
}
