import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { gameData } from "@/data";
import { minerOutput } from "@/engine/sources";
import { NodeCard } from "./NodeCard";

export default function MinerNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "miner") return null;
  const rate = minerOutput(gameData, node.mk, node.purity, node.clockPct);
  const raw = gameData.minerOutputPerMin[node.mk][node.purity] * (node.clockPct / 100);
  const capped = rate < raw;
  const item = gameData.items[node.itemId];

  return (
    <NodeCard
      nodeId={id}
      accent="amber"
      type={`Miner ${node.mk.toUpperCase()}`}
      name={item?.displayName ?? node.itemId}
      meta={`${node.purity} · ${node.clockPct}% clock`}
      rate={
        <>
          {rate.toFixed(1)} /min
          {capped && (
            <span
              className="label-mono"
              title={`Raw rate ${raw.toFixed(1)}/min · capped at Mk6 belt (1200/min)`}
              style={{ marginLeft: "0.4rem", color: "var(--accent-amber-2)", fontSize: "0.55rem" }}
            >
              CAPPED
            </span>
          )}
        </>
      }
    >
      <Handle type="source" position={Position.Right} />
    </NodeCard>
  );
}
