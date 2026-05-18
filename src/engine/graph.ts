import type { MinerMk, MinerPurity } from "@/data/types";

export type BeltTier = "mk1" | "mk2" | "mk3" | "mk4" | "mk5" | "mk6";
export type PipeTier = "mk1" | "mk2";

export type Position = { x: number; y: number };

export type SourceNode =
  | { kind: "miner"; id: string; position?: Position; itemId: string; mk: MinerMk; purity: MinerPurity; clockPct: number }
  | { kind: "water-extractor"; id: string; position?: Position; clockPct: number }
  | { kind: "oil-pump"; id: string; position?: Position; purity: MinerPurity; clockPct: number }
  | { kind: "resource-well"; id: string; position?: Position; itemId: string; satellites: MinerPurity[]; clockPct: number };

export type MachineNode = {
  kind: "machine";
  id: string;
  position?: Position;
  recipeId: string;
  clockPct: number;
  sloopsUsed: number;
};

export type SinkNode = {
  kind: "sink";
  id: string;
  position?: Position;
  couponsAlreadyPurchased: number;
};

export type OutputNode = {
  kind: "output";
  id: string;
  position?: Position;
  itemId: string;
  targetRatePerMin: number;
};

export type GraphNode = SourceNode | MachineNode | SinkNode | OutputNode;

export type GraphEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  itemId: string;
  // Tier used for capacity warnings only; defaults applied by the edge view
  // when undefined (mk5 for solid, mk2 for fluid/gas).
  tier?: BeltTier | PipeTier;
  // Relative weight for splitting output when multiple edges carry the same
  // item from the same node. Defaults to 1 (equal split).
  splitRatio?: number;
};

export type Graph = {
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
};
