import { describe, it, expect, beforeEach } from "vitest";
import { useGraphStore } from "./store";

beforeEach(() => useGraphStore.getState().reset());

describe("graph store", () => {
  it("adds a node and assigns it a unique id", () => {
    const id = useGraphStore.getState().addNode({
      kind: "miner",
      itemId: "iron-ore",
      mk: "mk1",
      purity: "normal",
      clockPct: 100,
    });
    expect(useGraphStore.getState().graph.nodes[id]).toBeDefined();
  });

  it("removes a node and its incident edges", () => {
    const s = useGraphStore.getState();
    const a = s.addNode({ kind: "miner", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 });
    const b = s.addNode({ kind: "sink", couponsAlreadyPurchased: 0 });
    s.addEdge({ fromNodeId: a, toNodeId: b, itemId: "iron-ore" });
    expect(useGraphStore.getState().graph.edges).toHaveLength(1);
    useGraphStore.getState().removeNode(a);
    expect(useGraphStore.getState().graph.nodes[a]).toBeUndefined();
    expect(useGraphStore.getState().graph.edges).toHaveLength(0);
  });

  it("updateNode patches a node in place", () => {
    const id = useGraphStore.getState().addNode({
      kind: "miner", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100,
    });
    useGraphStore.getState().updateNode(id, { clockPct: 200 } as never);
    const node = useGraphStore.getState().graph.nodes[id]!;
    expect((node as { clockPct: number }).clockPct).toBe(200);
  });

  it("updateEdgeTier updates the tier on an existing edge", () => {
    const s = useGraphStore.getState();
    const a = s.addNode({ kind: "miner", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 });
    const b = s.addNode({ kind: "sink", couponsAlreadyPurchased: 0 });
    const eid = s.addEdge({ fromNodeId: a, toNodeId: b, itemId: "iron-ore" });
    s.updateEdgeTier(eid, "mk3");
    const edge = useGraphStore.getState().graph.edges.find((e) => e.id === eid);
    expect(edge?.tier).toBe("mk3");
  });
});
