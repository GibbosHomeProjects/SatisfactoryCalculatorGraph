import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";
import { NodeCard } from "./NodeCard";

export default function AwesomeSinkNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  const computed = useComputed().nodes[id];
  if (!node || node.kind !== "sink") return null;
  const pts = computed?.pointsPerMin ?? 0;
  const cost = computed?.nextCouponCost ?? 0;
  const minutesPerCoupon = pts > 0 ? cost / pts : Number.POSITIVE_INFINITY;

  return (
    <NodeCard
      nodeId={id}
      accent="magenta"
      type="AWESOME Sink"
      name={`${pts.toFixed(0)} pts/min`}
      meta={
        <>
          Next coupon: {cost.toLocaleString()} pts
          <br />
          ≈ {Number.isFinite(minutesPerCoupon) ? `${minutesPerCoupon.toFixed(1)} min` : "—"}
        </>
      }
    >
      <Handle type="target" position={Position.Left} />
    </NodeCard>
  );
}
