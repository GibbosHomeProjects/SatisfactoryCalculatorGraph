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
import FlowEdge from "./edges/FlowEdge";

const edgeTypes = { flow: FlowEdge };
const nodeTypes = {
  miner: MinerNode,
  "water-extractor": WaterExtractorNode,
  "oil-pump": OilPumpNode,
  "resource-well": ResourceWellNode,
  machine: MachineNode,
  sink: AwesomeSinkNode,
};

type AddNodeArg = Parameters<ReturnType<typeof useGraphStore.getState>["addNode"]>[0];

const nodeDefaults: Record<string, AddNodeArg> = {
  miner: { kind: "miner", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 },
  "water-extractor": { kind: "water-extractor", clockPct: 100 },
  "oil-pump": { kind: "oil-pump", purity: "normal", clockPct: 100 },
  "resource-well": {
    kind: "resource-well",
    itemId: "nitrogen-gas",
    satellites: ["normal"],
    clockPct: 100,
  },
  machine: { kind: "machine", recipeId: "recipe-iron-ingot", clockPct: 100, sloopsUsed: 0 },
  sink: { kind: "sink", couponsAlreadyPurchased: 0 },
};

export default function Canvas() {
  const graph = useGraphStore((s) => s.graph);
  const addEdge = useGraphStore((s) => s.addEdge);
  const addNode = useGraphStore((s) => s.addNode);
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
        type: "flow",
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

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData("application/x-satcalc-kind");
      const defaults = nodeDefaults[kind];
      if (defaults) addNode(defaults);
    },
    [addNode],
  );

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex-1 min-w-0 relative"
      style={{ height: "100%" }}
    >
    <ReactFlow
      style={{ width: "100%", height: "100%" }}
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
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
    </div>
  );
}
