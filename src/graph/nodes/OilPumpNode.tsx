import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { sampleGameData } from "@/data/sample";
import { oilPumpOutput } from "@/engine/sources";

export default function OilPumpNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "oil-pump") return null;
  const rate = oilPumpOutput(sampleGameData, node.purity, node.clockPct);
  return (
    <div className="rounded-lg border border-sky-400/40 bg-neutral-900/90 p-3 text-sm min-w-[180px]">
      <div className="text-sky-300 font-semibold">Oil Extractor</div>
      <div className="text-xs opacity-80">Crude Oil · {node.purity}</div>
      <div className="text-xs opacity-80">Clock {node.clockPct}%</div>
      <div className="text-base mt-1">{rate.toFixed(1)} m³/min</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
