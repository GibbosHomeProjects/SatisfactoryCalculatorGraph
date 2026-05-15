import type { GameData } from "@/data/types";
import type { Graph, GraphNode } from "./graph";
import {
  recipeInputPerMinPerMachine,
  recipeOutputPerMinPerMachine,
} from "./production";
import {
  minerOutput,
  waterExtractorOutput,
  oilPumpOutput,
  resourceWellSatelliteOutput,
} from "./sources";
import { powerPerMachineMW } from "./power";
import { sinkPointsPerMin, couponCost } from "./sink";

export type ComputedNode = {
  outputsPerMin: Record<string, number>;
  machineCount: number;
  totalPowerMW: number;
  pointsPerMin?: number;
  nextCouponCost?: number;
  warnings: string[];
};

export type ComputedEdge = {
  amountPerMin: number;
};

export type ComputeResult = {
  nodes: Record<string, ComputedNode>;
  edges: Record<string, ComputedEdge>;
};

const MAX_ITERATIONS = 50;
const CONVERGENCE_EPSILON = 1e-3;

export function compute(data: GameData, graph: Graph): ComputeResult {
  const nodes: Record<string, ComputedNode> = {};
  const edges: Record<string, ComputedEdge> = {};
  for (const id of Object.keys(graph.nodes)) {
    nodes[id] = { outputsPerMin: {}, machineCount: 0, totalPowerMW: 0, warnings: [] };
  }
  for (const e of graph.edges) edges[e.id] = { amountPerMin: 0 };

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let maxDelta = 0;

    for (const node of Object.values(graph.nodes)) {
      const prev = { ...nodes[node.id]!.outputsPerMin };

      const supply: Record<string, number> = {};
      for (const e of graph.edges) {
        if (e.toNodeId !== node.id) continue;
        supply[e.itemId] = (supply[e.itemId] ?? 0) + edges[e.id]!.amountPerMin;
      }

      const updated = evaluateNode(data, node, supply);
      nodes[node.id] = updated;

      const outgoing = graph.edges.filter((e) => e.fromNodeId === node.id);
      const grouped: Record<string, typeof outgoing> = {};
      for (const e of outgoing) (grouped[e.itemId] ??= []).push(e);

      // Machines and sinks are infinitely scalable consumers: they absorb
      // whatever they receive. With multiple consumers of the same item, we
      // split the available output equally across outgoing edges. The user
      // can later add per-edge weights if needed.
      for (const [itemId, outs] of Object.entries(grouped)) {
        const totalAvailable = updated.outputsPerMin[itemId] ?? 0;
        const perEdge = outs.length > 0 ? totalAvailable / outs.length : 0;
        for (const e of outs) {
          edges[e.id]!.amountPerMin = perEdge;
        }
      }

      for (const k of Object.keys(updated.outputsPerMin)) {
        const before = prev[k] ?? 0;
        maxDelta = Math.max(maxDelta, Math.abs(updated.outputsPerMin[k]! - before));
      }
    }

    if (maxDelta < CONVERGENCE_EPSILON) break;
  }

  return { nodes, edges };
}

function evaluateNode(
  data: GameData,
  node: GraphNode,
  supply: Record<string, number>,
): ComputedNode {
  const out: ComputedNode = { outputsPerMin: {}, machineCount: 0, totalPowerMW: 0, warnings: [] };
  switch (node.kind) {
    case "miner": {
      const rate = minerOutput(data, node.mk, node.purity, node.clockPct);
      out.outputsPerMin[node.itemId] = rate;
      out.machineCount = 1;
      const b = data.buildings[`miner-${node.mk}`];
      if (b) out.totalPowerMW = powerPerMachineMW(b.basePowerMW, node.clockPct, 0, 0);
      return out;
    }
    case "water-extractor": {
      out.outputsPerMin["water"] = waterExtractorOutput(data, node.clockPct);
      out.machineCount = 1;
      const b = data.buildings["water-extractor"];
      if (b) out.totalPowerMW = powerPerMachineMW(b.basePowerMW, node.clockPct, 0, 0);
      return out;
    }
    case "oil-pump": {
      out.outputsPerMin["crude-oil"] = oilPumpOutput(data, node.purity, node.clockPct);
      out.machineCount = 1;
      const b = data.buildings["oil-pump"];
      if (b) out.totalPowerMW = powerPerMachineMW(b.basePowerMW, node.clockPct, 0, 0);
      return out;
    }
    case "resource-well": {
      let total = 0;
      for (const p of node.satellites) {
        total += resourceWellSatelliteOutput(data, node.itemId, p, node.clockPct);
      }
      out.outputsPerMin[node.itemId] = total;
      out.machineCount = node.satellites.length;
      return out;
    }
    case "machine": {
      const recipe = data.recipes[node.recipeId];
      if (!recipe) {
        out.warnings.push(`Recipe ${node.recipeId} not found`);
        return out;
      }
      const building = data.buildings[recipe.buildingId];
      if (!building) {
        out.warnings.push(`Building ${recipe.buildingId} not found`);
        return out;
      }
      let limiting = Infinity;
      for (const inp of recipe.inputs) {
        const haveSupply = supply[inp.itemId] ?? 0;
        const need = recipeInputPerMinPerMachine(recipe, inp.itemId, node.clockPct);
        if (need === 0) continue;
        const m = haveSupply / need;
        if (m < limiting) limiting = m;
      }
      const machineCount = limiting === Infinity ? 0 : limiting;
      out.machineCount = machineCount;

      for (const o of recipe.outputs) {
        const perMachine = recipeOutputPerMinPerMachine(
          recipe,
          o.itemId,
          node.clockPct,
          node.sloopsUsed,
          building.somersloopSlots,
        );
        out.outputsPerMin[o.itemId] = perMachine * machineCount;
      }
      const perMachinePower = powerPerMachineMW(
        building.basePowerMW,
        node.clockPct,
        node.sloopsUsed,
        building.somersloopSlots,
      );
      out.totalPowerMW = perMachinePower * machineCount;
      return out;
    }
    case "sink": {
      const flows = Object.entries(supply).map(([itemId, amountPerMin]) => ({
        itemId,
        amountPerMin,
      }));
      const points = sinkPointsPerMin(data, flows);
      out.pointsPerMin = points;
      out.nextCouponCost = couponCost(node.couponsAlreadyPurchased);
      const totalThroughput = flows.reduce((a, b) => a + b.amountPerMin, 0);
      if (totalThroughput > 1200) {
        out.warnings.push(`Sink throughput ${totalThroughput.toFixed(0)}/min exceeds 1200/min cap`);
      }
      return out;
    }
  }
}
