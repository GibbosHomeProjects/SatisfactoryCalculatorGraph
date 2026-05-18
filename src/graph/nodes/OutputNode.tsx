import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";
import { gameData } from "@/data";
import { NodeCard } from "./NodeCard";

export default function OutputNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  const computed = useComputed().nodes[id];
  if (!node || node.kind !== "output") return null;

  const item = gameData.items[node.itemId];
  const actual = computed?.outputsPerMin[node.itemId] ?? 0;
  const target = node.targetRatePerMin;
  const hasTarget = target > 0;
  const met = !hasTarget || actual >= target - 0.01;

  const rateLabel = hasTarget
    ? `${actual.toFixed(1)} / ${target} /min`
    : `${actual.toFixed(1)} /min`;

  return (
    <NodeCard
      nodeId={id}
      accent={met ? "emerald" : "magenta"}
      type="Output"
      name={item?.displayName ?? node.itemId}
      rate={rateLabel}
      badge={hasTarget ? (met ? "Target met" : "Under target") : undefined}
    >
      <Handle type="target" position={Position.Left} />
    </NodeCard>
  );
}
