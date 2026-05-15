import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import { canConnect } from "./validation";
import type { Graph } from "@/engine/graph";

const baseGraph = (): Graph => ({
  nodes: {
    m: { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 },
    w: { kind: "water-extractor", id: "w", clockPct: 100 },
    c: { kind: "machine", id: "c", recipeId: "recipe-iron-plate", clockPct: 100, sloopsUsed: 0 },
  },
  edges: [],
});

describe("connect validation", () => {
  it("solid -> solid-input machine is fine", () => {
    expect(canConnect(sampleGameData, baseGraph(), "m", "c").ok).toBe(true);
  });

  it("fluid -> solid-only machine is rejected", () => {
    expect(canConnect(sampleGameData, baseGraph(), "w", "c").ok).toBe(false);
  });
});
