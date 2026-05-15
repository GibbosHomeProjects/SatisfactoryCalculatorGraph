import type { MinerMk, MinerPurity } from "@/data/types";

export type BeltTier = "mk1" | "mk2" | "mk3" | "mk4" | "mk5" | "mk6";
export type PipeTier = "mk1" | "mk2";

export type SourceNode =
  | { kind: "miner"; id: string; itemId: string; mk: MinerMk; purity: MinerPurity; clockPct: number }
  | { kind: "water-extractor"; id: string; clockPct: number }
  | { kind: "oil-pump"; id: string; purity: MinerPurity; clockPct: number }
  | { kind: "resource-well"; id: string; itemId: string; satellites: MinerPurity[]; clockPct: number };

export type MachineNode = {
  kind: "machine";
  id: string;
  recipeId: string;
  clockPct: number;
  sloopsUsed: number;
};

export type SinkNode = {
  kind: "sink";
  id: string;
  couponsAlreadyPurchased: number;
};

export type GraphNode = SourceNode | MachineNode | SinkNode;

export type GraphEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  itemId: string;
  // Tier used for capacity warnings only; defaults applied by the edge view
  // when undefined (mk5 for solid, mk2 for fluid/gas).
  tier?: BeltTier | PipeTier;
};

export type Graph = {
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
};
