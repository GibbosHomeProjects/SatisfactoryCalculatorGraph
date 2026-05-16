import { useMemo, useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node as RFNode,
  type Edge as RFEdge,
  type Connection,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "./store";
import { gameData } from "@/data";
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
  machine: { kind: "machine", recipeId: "recipe-ingotiron-c", clockPct: 100, sloopsUsed: 0 },
  sink: { kind: "sink", couponsAlreadyPurchased: 0 },
};

function gridFallback(i: number) {
  return { x: (i % 6) * 220, y: Math.floor(i / 6) * 160 };
}

export default function Canvas() {
  const graph = useGraphStore((s) => s.graph);
  const addEdge = useGraphStore((s) => s.addEdge);
  const addNode = useGraphStore((s) => s.addNode);
  const setNodePosition = useGraphStore((s) => s.setNodePosition);
  const selectNode = useGraphStore((s) => s.selectNode);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const rfNodes: RFNode[] = useMemo(
    () =>
      Object.values(graph.nodes).map((n, i) => ({
        id: n.id,
        position: n.position ?? gridFallback(i),
        data: {},
        type: n.kind,
      })),
    [graph.nodes],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const c of changes) {
        if (c.type === "position" && c.position && !c.dragging) {
          // Commit final position only when drag releases.
          setNodePosition(c.id, c.position);
        }
      }
    },
    [setNodePosition],
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
    return canConnect(gameData, useGraphStore.getState().graph, c.source, c.target).ok;
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
      if (!defaults) return;
      const bounds = wrapperRef.current?.getBoundingClientRect();
      const position = bounds
        ? { x: e.clientX - bounds.left - 90, y: e.clientY - bounds.top - 40 }
        : { x: 0, y: 0 };
      addNode({ ...defaults, position } as Parameters<typeof addNode>[0]);
    },
    [addNode],
  );

  return (
    <div
      ref={wrapperRef}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex-1 min-w-0 relative"
      style={{
        height: "100%",
        backgroundColor: "#0a0414",
        backgroundImage:
          "radial-gradient(600px 300px at 20% 30%, rgba(6, 182, 212, 0.06), transparent 60%)," +
          "radial-gradient(500px 300px at 80% 70%, rgba(232, 121, 249, 0.06), transparent 60%)," +
          "linear-gradient(rgba(124, 115, 151, 0.10) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(124, 115, 151, 0.10) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 24px 24px, 24px 24px",
      }}
    >
    <ReactFlow
      style={{ width: "100%", height: "100%" }}
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onConnect={onConnect}
      onNodesChange={onNodesChange}
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
