import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { gameData } from "@/data";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";
import type { BeltTier, PipeTier } from "@/engine/graph";

const colourForForm = (form?: string) =>
  form === "fluid" ? "#38bdf8" : form === "gas" ? "#86efac" : "#93c5fd";

function capacityFor(form: string | undefined, tier: BeltTier | PipeTier | undefined): number {
  if (form === "fluid" || form === "gas") {
    const t = (tier ?? "mk2") as PipeTier;
    return gameData.pipeTierPerMin[t];
  }
  const t = (tier ?? "mk5") as BeltTier;
  return gameData.beltTierPerMin[t];
}

function tierOptionsFor(form: string | undefined): string[] {
  if (form === "fluid" || form === "gas") return ["mk1", "mk2"];
  return ["mk1", "mk2", "mk3", "mk4", "mk5", "mk6"];
}

export default function FlowEdge(props: EdgeProps) {
  const edge = useGraphStore((s) => s.graph.edges.find((e) => e.id === props.id));
  const updateEdgeTier = useGraphStore((s) => s.updateEdgeTier);
  const computed = useComputed().edges[props.id];
  const [path, labelX, labelY] = getBezierPath(props);
  const item = edge ? gameData.items[edge.itemId] : undefined;
  const baseColor = colourForForm(item?.form);
  const rate = computed?.amountPerMin ?? 0;
  const cap = capacityFor(item?.form, edge?.tier);
  const over = rate > cap;
  const stroke = over ? "#ef4444" : baseColor;
  const tier =
    edge?.tier ?? (item?.form === "fluid" || item?.form === "gas" ? "mk2" : "mk5");

  return (
    <>
      <BaseEdge path={path} style={{ stroke, strokeWidth: over ? 3 : 2 }} />
      <EdgeLabelRenderer>
        <div
          className={
            "absolute text-[10px] px-1.5 py-0.5 rounded border bg-neutral-900/90 text-neutral-100 " +
            (over ? "border-red-500 text-red-200" : "border-neutral-700")
          }
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          {item?.displayName ?? edge?.itemId} · {rate.toFixed(0)}/min
          {over && <span title={`Exceeds ${tier} capacity (${cap}/min)`}> · ⚠</span>}
          {edge && (
            <select
              className="ml-1 bg-neutral-800 rounded px-0.5 text-[10px]"
              value={tier}
              onChange={(e) => updateEdgeTier(edge.id, e.target.value as BeltTier | PipeTier)}
            >
              {tierOptionsFor(item?.form).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
