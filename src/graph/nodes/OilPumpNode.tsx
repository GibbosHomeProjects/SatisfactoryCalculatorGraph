import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { gameData } from "@/data";
import { oilPumpOutput } from "@/engine/sources";
import { NodeCard } from "./NodeCard";

export default function OilPumpNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "oil-pump") return null;
  const rate = oilPumpOutput(gameData, node.purity, node.clockPct);
  return (
    <NodeCard
      nodeId={id}
      accent="sky"
      type="Oil Extractor"
      name="Crude Oil"
      meta={`${node.purity} · ${node.clockPct}% clock`}
      rate={`${rate.toFixed(1)} m³/min`}
    >
      <Handle type="source" position={Position.Right} />
    </NodeCard>
  );
}
