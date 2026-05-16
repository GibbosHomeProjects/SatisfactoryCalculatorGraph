import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import { compute } from "./compute";
import { bottleneck } from "./bottleneck";
import type { Graph } from "./graph";

describe("bottleneck analysis", () => {
  it("flags the single source as the bottleneck when downstream is starved", () => {
    // Miner clocked at 75% -> 45 ore/min. Smelter at 100% needs 30/min/machine.
    // That gives 1.5 machines (ceil 2), so the smelter is starved relative
    // to its rounded-up capacity. The bottleneck walks upstream to the miner.
    const g: Graph = {
      nodes: {
        m:  { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 75 },
        sm: { kind: "machine", id: "sm", recipeId: "recipe-iron-ingot", clockPct: 100, sloopsUsed: 0 },
        c:  { kind: "machine", id: "c",  recipeId: "recipe-iron-plate", clockPct: 100, sloopsUsed: 0 },
      },
      edges: [
        { id: "e1", fromNodeId: "m",  toNodeId: "sm", itemId: "iron-ore" },
        { id: "e2", fromNodeId: "sm", toNodeId: "c",  itemId: "iron-ingot" },
      ],
    };
    const res = compute(sampleGameData, g);
    const report = bottleneck(sampleGameData, g, res);
    expect(report.bottleneckNodeId).toBe("m");
  });

  it("returns no bottleneck when no production node exists", () => {
    const g: Graph = {
      nodes: { m: { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 } },
      edges: [],
    };
    const res = compute(sampleGameData, g);
    const report = bottleneck(sampleGameData, g, res);
    expect(report.bottleneckNodeId).toBeNull();
    expect(report.underSuppliedNodeIds.size).toBe(0);
  });

  it("marks downstream machines under-supplied when input < per-machine demand", () => {
    const g: Graph = {
      nodes: {
        m: { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk2", purity: "normal", clockPct: 100 },
        w: { kind: "water-extractor", id: "w", clockPct: 3.3333 },
        r: { kind: "machine", id: "r", recipeId: "recipe-pure-iron-ingot", clockPct: 100, sloopsUsed: 0 },
      },
      edges: [
        { id: "e1", fromNodeId: "m", toNodeId: "r", itemId: "iron-ore" },
        { id: "e2", fromNodeId: "w", toNodeId: "r", itemId: "water" },
      ],
    };
    const res = compute(sampleGameData, g);
    const report = bottleneck(sampleGameData, g, res);
    expect(report.underSuppliedNodeIds.has("r")).toBe(true);
  });
});
