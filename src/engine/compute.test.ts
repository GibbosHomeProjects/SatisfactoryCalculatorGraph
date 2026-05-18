import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import { compute } from "./compute";
import type { Graph } from "./graph";

describe("graph compute", () => {
  it("single miner emits its output rate on its outgoing edge", () => {
    const g: Graph = {
      nodes: {
        m: { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk2", purity: "normal", clockPct: 100 },
        s: { kind: "sink", id: "s", couponsAlreadyPurchased: 0 },
      },
      edges: [{ id: "e1", fromNodeId: "m", toNodeId: "s", itemId: "iron-ore" }],
    };
    const res = compute(sampleGameData, g);
    expect(res.edges["e1"]!.amountPerMin).toBe(120);
  });

  it("miner -> smelter -> constructor: 120 ore -> 120 ingot -> 80 plate", () => {
    const g: Graph = {
      nodes: {
        m:  { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk2", purity: "normal", clockPct: 100 },
        sm: { kind: "machine", id: "sm", recipeId: "recipe-iron-ingot", clockPct: 100, sloopsUsed: 0 },
        c:  { kind: "machine", id: "c",  recipeId: "recipe-iron-plate", clockPct: 100, sloopsUsed: 0 },
      },
      edges: [
        { id: "e1", fromNodeId: "m",  toNodeId: "sm", itemId: "iron-ore" },
        { id: "e2", fromNodeId: "sm", toNodeId: "c",  itemId: "iron-ingot" },
      ],
    };
    const res = compute(sampleGameData, g);
    expect(res.edges["e1"]!.amountPerMin).toBe(120);
    expect(res.edges["e2"]!.amountPerMin).toBe(120);
    expect(res.nodes["c"]!.outputsPerMin["iron-plate"]).toBe(80);
  });

  it("two consumers split supply proportionally to demand", () => {
    const g: Graph = {
      nodes: {
        m:  { kind: "miner", id: "m",  itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 },
        sm: { kind: "machine", id: "sm", recipeId: "recipe-iron-ingot", clockPct: 100, sloopsUsed: 0 },
        a:  { kind: "machine", id: "a",  recipeId: "recipe-iron-plate", clockPct: 100, sloopsUsed: 0 },
        b:  { kind: "machine", id: "b",  recipeId: "recipe-iron-rod",   clockPct: 100, sloopsUsed: 0 },
      },
      edges: [
        { id: "e1", fromNodeId: "m",  toNodeId: "sm", itemId: "iron-ore" },
        { id: "e2", fromNodeId: "sm", toNodeId: "a",  itemId: "iron-ingot" },
        { id: "e3", fromNodeId: "sm", toNodeId: "b",  itemId: "iron-ingot" },
      ],
    };
    const res = compute(sampleGameData, g);
    expect(res.edges["e2"]!.amountPerMin + res.edges["e3"]!.amountPerMin).toBeCloseTo(60, 5);
  });

  it("weighted split distributes output proportionally to splitRatio", () => {
    // Mk2 miner at normal purity = 120/min. Route 2/3 to sink A, 1/3 to sink B.
    const g: Graph = {
      nodes: {
        m: { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk2", purity: "normal", clockPct: 100 },
        a: { kind: "sink", id: "a", couponsAlreadyPurchased: 0 },
        b: { kind: "sink", id: "b", couponsAlreadyPurchased: 0 },
      },
      edges: [
        { id: "e1", fromNodeId: "m", toNodeId: "a", itemId: "iron-ore", splitRatio: 2 },
        { id: "e2", fromNodeId: "m", toNodeId: "b", itemId: "iron-ore", splitRatio: 1 },
      ],
    };
    const res = compute(sampleGameData, g);
    expect(res.edges["e1"]!.amountPerMin).toBeCloseTo(80, 5);
    expect(res.edges["e2"]!.amountPerMin).toBeCloseTo(40, 5);
  });

  it("machine without inputs produces 0", () => {
    const g: Graph = {
      nodes: {
        c: { kind: "machine", id: "c", recipeId: "recipe-iron-plate", clockPct: 100, sloopsUsed: 0 },
      },
      edges: [],
    };
    const res = compute(sampleGameData, g);
    expect(res.nodes["c"]!.outputsPerMin["iron-plate"]).toBe(0);
  });
});
