import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node as RFNode,
  type Edge as RFEdge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "./store";

export default function Canvas() {
  const graph = useGraphStore((s) => s.graph);
  const addEdge = useGraphStore((s) => s.addEdge);
  const selectNode = useGraphStore((s) => s.selectNode);

  const rfNodes: RFNode[] = useMemo(
    () =>
      Object.values(graph.nodes).map((n, i) => ({
        id: n.id,
        position: { x: (i % 6) * 220, y: Math.floor(i / 6) * 160 },
        data: { kind: n.kind },
        type: "default",
      })),
    [graph.nodes],
  );

  const rfEdges: RFEdge[] = useMemo(
    () =>
      graph.edges.map((e) => ({
        id: e.id,
        source: e.fromNodeId,
        target: e.toNodeId,
        label: e.itemId,
      })),
    [graph.edges],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      addEdge({ fromNodeId: c.source, toNodeId: c.target, itemId: "iron-ore" });
    },
    [addEdge],
  );

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      onConnect={onConnect}
      onNodeClick={(_, n) => selectNode(n.id)}
      onPaneClick={() => selectNode(null)}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
