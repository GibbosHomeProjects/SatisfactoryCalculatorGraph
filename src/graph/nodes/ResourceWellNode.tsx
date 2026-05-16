import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { gameData } from "@/data";
import { resourceWellSatelliteOutput } from "@/engine/sources";
import { NodeCard } from "./NodeCard";

export default function ResourceWellNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "resource-well") return null;
  let total = 0;
  try {
    for (const p of node.satellites) {
      total += resourceWellSatelliteOutput(gameData, node.itemId, p, node.clockPct);
    }
  } catch {
    total = 0;
  }
  const item = gameData.items[node.itemId];
  return (
    <NodeCard
      nodeId={id}
      accent="emerald"
      type="Resource Well"
      name={item?.displayName ?? node.itemId}
      meta={`${node.satellites.length} satellites · ${node.clockPct}% clock`}
      rate={`${total.toFixed(1)} /min`}
    >
      <Handle type="source" position={Position.Right} />
    </NodeCard>
  );
}
