import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import { compute } from "./compute";
import { summarise } from "./summarise";
import type { Graph } from "./graph";

describe("project summary", () => {
  it("sums raw inputs, power, and points across the graph", () => {
    const g: Graph = {
      nodes: {
        m:  { kind: "miner", id: "m",  itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 },
        sm: { kind: "machine", id: "sm", recipeId: "recipe-iron-ingot", clockPct: 100, sloopsUsed: 0 },
        s:  { kind: "sink", id: "s", couponsAlreadyPurchased: 0 },
      },
      edges: [
        { id: "e1", fromNodeId: "m",  toNodeId: "sm", itemId: "iron-ore" },
        { id: "e2", fromNodeId: "sm", toNodeId: "s",  itemId: "iron-ingot" },
      ],
    };
    const res = compute(sampleGameData, g);
    const sum = summarise(sampleGameData, g, res);
    expect(sum.rawInputsPerMin["iron-ore"]).toBe(60);
    expect(sum.totalPowerMW).toBeGreaterThan(0);
    expect(sum.totalPointsPerMin).toBe(60 * 2);
  });
});
