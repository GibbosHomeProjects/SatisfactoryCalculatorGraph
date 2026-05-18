import type { GameData } from "@/data/types";
import type { Graph } from "@/engine/graph";

export type ConnectResult = { ok: boolean; reason?: string };

function sourceItemForms(data: GameData, g: Graph, nodeId: string): Set<string> {
  const node = g.nodes[nodeId];
  if (!node) return new Set();
  switch (node.kind) {
    case "miner":
      return new Set([data.items[node.itemId]?.form ?? "solid"]);
    case "water-extractor":
      return new Set(["fluid"]);
    case "oil-pump":
      return new Set(["fluid"]);
    case "resource-well":
      return new Set([data.items[node.itemId]?.form ?? "fluid"]);
    case "machine": {
      const r = data.recipes[node.recipeId];
      if (!r) return new Set();
      const forms = new Set<string>();
      for (const o of r.outputs) {
        const f = data.items[o.itemId]?.form;
        if (f) forms.add(f);
      }
      return forms;
    }
    case "sink":
    case "output":
      return new Set();
  }
}

function targetAcceptsForms(data: GameData, g: Graph, nodeId: string): Set<string> {
  const node = g.nodes[nodeId];
  if (!node) return new Set();
  if (node.kind === "sink" || node.kind === "output") return new Set(["solid", "fluid", "gas"]);
  if (node.kind === "machine") {
    const r = data.recipes[node.recipeId];
    if (!r) return new Set(["solid", "fluid", "gas"]);
    const forms = new Set<string>();
    for (const i of r.inputs) {
      const f = data.items[i.itemId]?.form;
      if (f) forms.add(f);
    }
    return forms;
  }
  return new Set();
}

export function canConnect(
  data: GameData,
  graph: Graph,
  fromId: string,
  toId: string,
): ConnectResult {
  const out = sourceItemForms(data, graph, fromId);
  const accept = targetAcceptsForms(data, graph, toId);
  for (const f of out) if (accept.has(f)) return { ok: true };
  return { ok: false, reason: "Incompatible item forms" };
}
