import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { sampleGameData } from "@/data/sample";
import { resourceWellSatelliteOutput } from "@/engine/sources";

export default function ResourceWellNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "resource-well") return null;
  let total = 0;
  try {
    for (const p of node.satellites) {
      total += resourceWellSatelliteOutput(sampleGameData, node.itemId, p, node.clockPct);
    }
  } catch {
    total = 0;
  }
  const item = sampleGameData.items[node.itemId];
  return (
    <div className="rounded-lg border border-emerald-300/40 bg-neutral-900/90 p-3 text-sm min-w-[180px]">
      <div className="text-emerald-200 font-semibold">Resource Well</div>
      <div className="text-xs opacity-80">{item?.displayName ?? node.itemId}</div>
      <div className="text-xs opacity-80">
        Satellites: {node.satellites.length} · Clock {node.clockPct}%
      </div>
      <div className="text-[10px] opacity-70 mt-0.5">
        {node.satellites.map((p, i) => (
          <span key={i} className="mr-1 px-1 rounded bg-neutral-800">
            {p}
          </span>
        ))}
      </div>
      <div className="text-base mt-1">{total.toFixed(1)} /min</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
