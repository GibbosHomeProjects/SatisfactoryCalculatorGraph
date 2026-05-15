import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { gameData } from "@/data";
import { waterExtractorOutput } from "@/engine/sources";

export default function WaterExtractorNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "water-extractor") return null;
  const rate = waterExtractorOutput(gameData, node.clockPct);
  return (
    <div className="rounded-lg border border-sky-400/40 bg-neutral-900/90 p-3 text-sm min-w-[180px]">
      <div className="text-sky-300 font-semibold">Water Extractor</div>
      <div className="text-xs opacity-80">Clock {node.clockPct}%</div>
      <div className="text-base mt-1">{rate.toFixed(1)} m³/min</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
