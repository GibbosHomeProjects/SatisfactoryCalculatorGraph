import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type { BeltTier, Graph, GraphNode, GraphEdge, PipeTier } from "@/engine/graph";

type DistributiveOmit<T, K extends keyof T | string> = T extends unknown ? Omit<T, K> : never;
type AddNodeInput = DistributiveOmit<GraphNode, "id">;
type AddEdgeInput = Omit<GraphEdge, "id">;

type GraphStore = {
  graph: Graph;
  selectedNodeId: string | null;
  addNode: (n: AddNodeInput) => string;
  removeNode: (id: string) => void;
  updateNode: (id: string, patch: Partial<GraphNode>) => void;
  addEdge: (e: AddEdgeInput) => string;
  removeEdge: (id: string) => void;
  updateEdgeTier: (id: string, tier: BeltTier | PipeTier) => void;
  selectNode: (id: string | null) => void;
  reset: () => void;
  load: (g: Graph) => void;
};

const empty = (): Graph => ({ nodes: {}, edges: [] });

export const useGraphStore = create<GraphStore>((set) => ({
  graph: empty(),
  selectedNodeId: null,

  addNode: (n) => {
    const id = uuid();
    set((s) => ({
      graph: { ...s.graph, nodes: { ...s.graph.nodes, [id]: { ...n, id } as GraphNode } },
    }));
    return id;
  },

  removeNode: (id) =>
    set((s) => {
      const nodes = { ...s.graph.nodes };
      delete nodes[id];
      const edges = s.graph.edges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id);
      return { graph: { nodes, edges } };
    }),

  updateNode: (id, patch) =>
    set((s) => {
      const cur = s.graph.nodes[id];
      if (!cur) return s;
      return {
        graph: {
          ...s.graph,
          nodes: { ...s.graph.nodes, [id]: { ...cur, ...patch } as GraphNode },
        },
      };
    }),

  addEdge: (e) => {
    const id = uuid();
    set((s) => ({ graph: { ...s.graph, edges: [...s.graph.edges, { ...e, id }] } }));
    return id;
  },

  removeEdge: (id) =>
    set((s) => ({ graph: { ...s.graph, edges: s.graph.edges.filter((e) => e.id !== id) } })),

  updateEdgeTier: (id, tier) =>
    set((s) => ({
      graph: {
        ...s.graph,
        edges: s.graph.edges.map((e) => (e.id === id ? { ...e, tier } : e)),
      },
    })),

  selectNode: (id) => set({ selectedNodeId: id }),
  reset: () => set({ graph: empty(), selectedNodeId: null }),
  load: (g) => set({ graph: g, selectedNodeId: null }),
}));
