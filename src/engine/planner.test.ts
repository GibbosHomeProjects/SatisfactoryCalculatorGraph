import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import { planChainFor } from "./planner";
import { compute } from "./compute";
import type { Graph } from "./graph";

const ironOreMiner = (id: string): Graph["nodes"][string] => ({
  kind: "miner",
  id,
  itemId: "iron-ore",
  mk: "mk1",
  purity: "normal",
  clockPct: 100,
});

describe("planChainFor", () => {
  it("iron ore -> screws builds smelter + iron-rod + screw chain", () => {
    const graph: Graph = { nodes: { m: ironOreMiner("m") }, edges: [] };
    const plan = planChainFor(sampleGameData, graph, "screw");

    const recipes = plan.newNodes
      .filter((n) => n.kind === "machine")
      .map((n) => (n.kind === "machine" ? n.recipeId : ""));
    expect(recipes).toContain("recipe-iron-ingot");
    expect(recipes).toContain("recipe-iron-rod");
    expect(recipes).toContain("recipe-screw");
    expect(plan.warnings).toHaveLength(0);
  });

  it("merging the plan into the graph computes 60 ore -> 60 screw/min", () => {
    const graph: Graph = { nodes: { m: ironOreMiner("m") }, edges: [] };
    const plan = planChainFor(sampleGameData, graph, "screw");

    const merged: Graph = {
      nodes: { ...graph.nodes },
      edges: [...graph.edges, ...plan.newEdges],
    };
    for (const n of plan.newNodes) merged.nodes[n.id] = n;

    const res = compute(sampleGameData, merged);

    // Find the screw-producing machine and check its output.
    const screwMachine = plan.newNodes.find(
      (n) => n.kind === "machine" && n.recipeId === "recipe-screw",
    );
    expect(screwMachine).toBeDefined();
    // 60 ore/min -> 60 ingot/min -> 60 rod/min -> 240 screw/min (4 screws per rod)
    expect(res.nodes[screwMachine!.id]!.outputsPerMin["screw"]).toBeCloseTo(240, 5);
  });

  it("reuses existing intermediate machines instead of duplicating them", () => {
    const graph: Graph = {
      nodes: {
        m: ironOreMiner("m"),
        sm: {
          kind: "machine",
          id: "sm",
          recipeId: "recipe-iron-ingot",
          clockPct: 100,
          sloopsUsed: 0,
        },
      },
      edges: [{ id: "e0", fromNodeId: "m", toNodeId: "sm", itemId: "iron-ore" }],
    };
    const plan = planChainFor(sampleGameData, graph, "iron-plate");

    const machineRecipes = plan.newNodes
      .filter((n) => n.kind === "machine")
      .map((n) => (n.kind === "machine" ? n.recipeId : ""));
    // Should NOT add a second iron-ingot smelter; should add only the iron-plate constructor.
    expect(machineRecipes).toEqual(["recipe-iron-plate"]);
    // And the new constructor should consume from the existing "sm" smelter.
    const plateNode = plan.newNodes[0]!;
    const edgesIntoPlate = plan.newEdges.filter((e) => e.toNodeId === plateNode.id);
    expect(edgesIntoPlate).toHaveLength(1);
    expect(edgesIntoPlate[0]!.fromNodeId).toBe("sm");
    expect(edgesIntoPlate[0]!.itemId).toBe("iron-ingot");
  });

  it("warns when no source/recipe exists for a required input", () => {
    // Empty graph -> target requiring inputs with no available source-only items
    // among the recipes (plastic needs crude-oil; no oil pump present).
    const graph: Graph = { nodes: {}, edges: [] };
    const plan = planChainFor(sampleGameData, graph, "plastic");
    expect(plan.warnings.length).toBeGreaterThan(0);
    expect(plan.warnings.join(" ")).toMatch(/Crude Oil/i);
  });
});
