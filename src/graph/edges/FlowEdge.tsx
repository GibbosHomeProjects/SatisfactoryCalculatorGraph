import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { gameData } from "@/data";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";
import type { BeltTier, PipeTier } from "@/engine/graph";

function colourForForm(form?: string) {
  if (form === "fluid")
    return { stroke: "#38bdf8", glow: "rgba(56,189,248,0.5)", chip: "rgba(56,189,248,0.5)" };
  if (form === "gas")
    return { stroke: "#86efac", glow: "rgba(134,239,172,0.5)", chip: "rgba(134,239,172,0.5)" };
  return { stroke: "#06b6d4", glow: "rgba(6,182,212,0.5)", chip: "rgba(6,182,212,0.5)" };
}

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
  const palette = colourForForm(item?.form);
  const rate = computed?.amountPerMin ?? 0;
  const cap = capacityFor(item?.form, edge?.tier);
  const over = rate > cap;
  const tier = edge?.tier ?? (item?.form === "fluid" || item?.form === "gas" ? "mk2" : "mk5");
  const stroke = over ? "#ef4444" : palette.stroke;

  return (
    <>
      <BaseEdge
        path={path}
        style={{
          stroke,
          strokeWidth: over ? 3 : 2,
          filter: over
            ? "drop-shadow(0 0 6px rgba(239,68,68,0.6))"
            : `drop-shadow(0 0 6px ${palette.glow})`,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="num text-xs"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: "rgba(8,4,18,0.9)",
            color: over ? "#fca5a5" : "var(--text)",
            border: `1px solid ${over ? "rgba(239,68,68,0.5)" : palette.chip}`,
            padding: "0.12rem 0.4rem",
            borderRadius: "4px",
            boxShadow: `0 0 8px ${over ? "rgba(239,68,68,0.25)" : palette.glow}`,
            fontSize: "0.66rem",
            pointerEvents: "all",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span>
            {item?.displayName ?? edge?.itemId} · {rate.toFixed(0)}/min
          </span>
          {over && <span title={`Exceeds ${tier} capacity (${cap}/min)`}>⚠</span>}
          {edge && (
            <select
              className="label-mono"
              style={{
                background: "rgba(0,0,0,0.5)",
                color: "var(--text-faint)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "3px",
                padding: "0 0.2rem",
              }}
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
