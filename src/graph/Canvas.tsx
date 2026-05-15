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
import { sampleGameData } from "@/data/sample";
import { canConnect } from "./validation";
import MinerNode from "./nodes/MinerNode";
import WaterExtractorNode from "./nodes/WaterExtractorNode";
import OilPumpNode from "./nodes/OilPumpNode";
import ResourceWellNode from "./nodes/ResourceWellNode";
import MachineNode from "./nodes/MachineNode";
import AwesomeSinkNode from "./nodes/AwesomeSinkNode";

const nodeTypes = {
  miner: MinerNode,
  "water-extractor": WaterExtractorNode,
  "oil-pump": OilPumpNode,
  "resource-well": ResourceWellNode,
  machine: MachineNode,
  sink: AwesomeSinkNode,
};

export default function Canvas() {
  const graph = useGraphStore((s) => s.graph);
  const addEdge = useGraphStore((s) => s.addEdge);
  const selectNode = useGraphStore((s) => s.selectNode);

  const rfNodes: RFNode[] = useMemo(
    () =>
      Object.values(graph.nodes).map((n, i) => ({
        id: n.id,
        position: { x: (i % 6) * 220, y: Math.floor(i / 6) * 160 },
        data: {},
        type: n.kind,
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

  const isValidConnection = useCallback((c: Connection | { source: string; target: string }) => {
    if (!c.source || !c.target) return false;
    return canConnect(sampleGameData, useGraphStore.getState().graph, c.source, c.target).ok;
  }, []);

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      onConnect={onConnect}
      isValidConnection={isValidConnection}
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
