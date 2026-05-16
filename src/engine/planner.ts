import type { GameData } from "@/data/types";
import type { Graph, GraphEdge, GraphNode, MachineNode } from "./graph";
import { v4 as uuid } from "uuid";
import { compute } from "./compute";

export type PlanResult = {
  newNodes: GraphNode[];
  newEdges: GraphEdge[];
  warnings: string[];
};

/**
 * Build a default-recipe chain that produces `targetItemId` using the items
 * already supplied by source nodes (or other machines) in `graph`. Returns
 * new nodes/edges to merge into the graph. The existing compute engine
 * handles throughput once the graph is updated.
 *
 * - Only non-alternate recipes are used.
 * - When an item is already produced by any node in `graph` (a miner, an
 *   extractor, or a previously placed machine), no new producer is created
 *   for it; instead the new chain connects to every existing producer.
 * - If an item has no source AND no default recipe, a warning is recorded
 *   and the chain stops short there.
 */
export function planChainFor(
  data: GameData,
  graph: Graph,
  targetItemId: string,
): PlanResult {
  const newNodes: GraphNode[] = [];
  const newEdges: GraphEdge[] = [];
  const warnings: string[] = [];

  // itemId -> nodeIds that produce it (existing graph + nodes we add below).
  const producers = new Map<string, string[]>();
  const register = (itemId: string, nodeId: string) => {
    const list = producers.get(itemId) ?? [];
    list.push(nodeId);
    producers.set(itemId, list);
  };

  for (const n of Object.values(graph.nodes)) {
    switch (n.kind) {
      case "miner":
        register(n.itemId, n.id);
        break;
      case "water-extractor":
        register("water", n.id);
        break;
      case "oil-pump":
        register("crude-oil", n.id);
        break;
      case "resource-well":
        register(n.itemId, n.id);
        break;
      case "machine": {
        const r = data.recipes[n.recipeId];
        if (r) for (const o of r.outputs) register(o.itemId, n.id);
        break;
      }
      case "sink":
        break;
    }
  }

  const visiting = new Set<string>();

  function ensureProducer(itemId: string): string[] {
    const existing = producers.get(itemId);
    if (existing && existing.length > 0) return existing.slice();

    if (visiting.has(itemId)) {
      warnings.push(
        `Cycle detected involving ${data.items[itemId]?.displayName ?? itemId}`,
      );
      return [];
    }
    visiting.add(itemId);

    const candidates = Object.values(data.recipes)
      .filter((r) => !r.isAlternate && r.outputs.some((o) => o.itemId === itemId))
      .sort((a, b) => a.id.localeCompare(b.id));
    const recipe = candidates[0];

    if (!recipe) {
      warnings.push(
        `No source or default recipe for "${data.items[itemId]?.displayName ?? itemId}"`,
      );
      visiting.delete(itemId);
      return [];
    }

    const inputs = recipe.inputs.map((inp) => ({
      itemId: inp.itemId,
      producerIds: ensureProducer(inp.itemId),
    }));

    const node: MachineNode = {
      kind: "machine",
      id: uuid(),
      recipeId: recipe.id,
      clockPct: 100,
      sloopsUsed: 0,
    };
    newNodes.push(node);

    for (const { itemId: inpId, producerIds } of inputs) {
      for (const fromId of producerIds) {
        newEdges.push({
          id: uuid(),
          fromNodeId: fromId,
          toNodeId: node.id,
          itemId: inpId,
        });
      }
    }

    for (const o of recipe.outputs) register(o.itemId, node.id);

    visiting.delete(itemId);
    return [node.id];
  }

  ensureProducer(targetItemId);

  // ----- Smart-default clock pass -----
  // After the chain is laid out, run a fresh compute over the merged graph
  // to discover the actual per-input supply each new machine will see.
  // Then pick the clock that makes machine_count exactly equal to
  // ceil(supply/perMachineAt100), capped at 100% so we never auto-overclock.
  const merged: Graph = {
    nodes: { ...graph.nodes },
    edges: [...graph.edges, ...newEdges],
  };
  for (const n of newNodes) merged.nodes[n.id] = n;
  const computed = compute(data, merged);

  for (const node of newNodes) {
    if (node.kind !== "machine") continue;
    const recipe = data.recipes[node.recipeId];
    if (!recipe || recipe.inputs.length === 0) continue;

    let worstRatio = Infinity;
    for (const inp of recipe.inputs) {
      const perMachineAt100 = (60 / recipe.durationSeconds) * inp.amountPerCycle;
      if (perMachineAt100 === 0) continue;

      let supply = 0;
      for (const e of merged.edges) {
        if (e.toNodeId !== node.id || e.itemId !== inp.itemId) continue;
        supply += computed.edges[e.id]?.amountPerMin ?? 0;
      }
      const machinesNeeded = supply / perMachineAt100;
      if (!Number.isFinite(machinesNeeded) || machinesNeeded === 0) continue;
      const integerMachines = Math.max(1, Math.ceil(machinesNeeded));
      const clockForExactFit = (machinesNeeded / integerMachines) * 100;
      const cappedClock = Math.min(100, clockForExactFit);
      if (cappedClock / 100 < worstRatio) worstRatio = cappedClock / 100;
    }

    if (worstRatio !== Infinity) {
      node.clockPct = Math.round(worstRatio * 100);
    }
  }

  return { newNodes, newEdges, warnings };
}
