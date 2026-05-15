import { useComputed } from "@/graph/useComputed";
import { useGraphStore } from "@/graph/store";
import { gameData } from "@/data";
import { summarise } from "@/engine/summarise";

export default function SummaryBar() {
  const graph = useGraphStore((s) => s.graph);
  const res = useComputed();
  const sum = summarise(gameData, graph, res);

  const raw =
    Object.entries(sum.rawInputsPerMin)
      .map(([k, v]) => `${gameData.items[k]?.displayName ?? k} ${v.toFixed(0)}/min`)
      .join(" · ") || "—";

  return (
    <footer className="h-8 flex items-center gap-4 px-3 border-t border-neutral-800 bg-neutral-900/80 text-xs shrink-0">
      <span>Raw: {raw}</span>
      <span>Power: {sum.totalPowerMW.toFixed(1)} MW</span>
      <span>Points: {sum.totalPointsPerMin.toFixed(0)}/min</span>
      {sum.warnings.length > 0 && (
        <span className="text-amber-300">
          ⚠ {sum.warnings.length} warning{sum.warnings.length === 1 ? "" : "s"}
        </span>
      )}
    </footer>
  );
}
