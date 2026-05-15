import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";

export default function AwesomeSinkNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  const computed = useComputed().nodes[id];
  if (!node || node.kind !== "sink") return null;
  const pts = computed?.pointsPerMin ?? 0;
  const cost = computed?.nextCouponCost ?? 0;
  const minutesPerCoupon = pts > 0 ? cost / pts : Number.POSITIVE_INFINITY;

  return (
    <div className="rounded-lg border border-fuchsia-400/50 bg-neutral-900/90 p-3 text-sm min-w-[200px]">
      <Handle type="target" position={Position.Left} />
      <div className="text-fuchsia-300 font-semibold">AWESOME Sink</div>
      <div className="text-xs">Points/min: {pts.toFixed(0)}</div>
      <div className="text-xs">Next coupon: {cost.toLocaleString()} pts</div>
      <div className="text-xs">
        ≈ {Number.isFinite(minutesPerCoupon) ? `${minutesPerCoupon.toFixed(1)} min` : "—"}
      </div>
    </div>
  );
}
