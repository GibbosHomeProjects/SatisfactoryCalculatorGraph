import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { sampleGameData } from "@/data/sample";
import { minerOutput } from "@/engine/sources";

export default function MinerNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "miner") return null;
  const rate = minerOutput(sampleGameData, node.mk, node.purity, node.clockPct);
  const raw =
    sampleGameData.minerOutputPerMin[node.mk][node.purity] * (node.clockPct / 100);
  const capped = rate < raw;
  const item = sampleGameData.items[node.itemId];

  return (
    <div className="rounded-lg border border-amber-400/40 bg-neutral-900/90 p-3 text-sm shadow-md min-w-[180px]">
      <div className="text-amber-300 font-semibold">Miner {node.mk.toUpperCase()}</div>
      <div className="text-xs opacity-80">
        {item?.displayName ?? node.itemId} · {node.purity}
      </div>
      <div className="text-xs opacity-80">Clock {node.clockPct}%</div>
      <div className="text-base mt-1">
        {rate.toFixed(1)} /min
        {capped && (
          <span
            className="ml-1 text-[10px] text-amber-300"
            title={`Raw rate ${raw.toFixed(1)}/min, capped at Mk6 belt limit (1200/min)`}
          >
            (capped)
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
