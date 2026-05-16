import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { gameData } from "@/data";
import { waterExtractorOutput } from "@/engine/sources";
import { NodeCard } from "./NodeCard";

export default function WaterExtractorNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "water-extractor") return null;
  const rate = waterExtractorOutput(gameData, node.clockPct);
  return (
    <NodeCard
      nodeId={id}
      accent="sky"
      type="Water Extractor"
      name="Water"
      meta={`${node.clockPct}% clock`}
      rate={`${rate.toFixed(1)} m³/min`}
    >
      <Handle type="source" position={Position.Right} />
    </NodeCard>
  );
}
