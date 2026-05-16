import { useGraphStore } from "@/graph/store";
import { useComputed } from "@/graph/useComputed";
import { useBottleneck } from "@/graph/useBottleneck";
import { gameData } from "@/data";
import { summarise } from "@/engine/summarise";

export default function SummaryBar() {
  const graph = useGraphStore((s) => s.graph);
  const res = useComputed();
  const sum = summarise(gameData, graph, res);
  const report = useBottleneck();

  const rawCells = Object.entries(sum.rawInputsPerMin).map(([k, v]) => ({
    k: gameData.items[k]?.displayName ?? k,
    v: `${v.toFixed(0)}/min`,
  }));

  let hotText: string | null = null;
  if (report.bottleneckNodeId) {
    const node = graph.nodes[report.bottleneckNodeId];
    const label =
      node?.kind === "miner"
        ? `Miner ${node.mk.toUpperCase()}`
        : node?.kind === "machine"
          ? (gameData.recipes[node.recipeId]?.displayName ?? "Machine")
          : (node?.kind ?? "node");
    const delta = report.bottleneckDelta;
    hotText = delta
      ? `${label} · −${delta.perMinShortfall.toFixed(0)} ${gameData.items[delta.itemId]?.displayName ?? delta.itemId}/min`
      : label;
  }

  return (
    <footer
      className="h-8 flex items-center gap-4 px-3 text-xs num shrink-0"
      style={{
        background: "rgba(0,0,0,0.35)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <SummaryCell k="Raw">
        {rawCells.length === 0
          ? "—"
          : rawCells.map((c, i) => (
              <span key={i} className="ml-1">
                {c.k} {c.v}
                {i < rawCells.length - 1 ? " ·" : ""}
              </span>
            ))}
      </SummaryCell>
      <SummaryCell k="Power">{sum.totalPowerMW.toFixed(1)} MW</SummaryCell>
      <SummaryCell k="Points">{sum.totalPointsPerMin.toFixed(0)}/min</SummaryCell>
      <span className="flex-1" />
      {hotText && (
        <SummaryCell k="Hot" hot>
          <span
            style={{ color: "var(--accent-magenta-2)", textShadow: "0 0 8px rgba(232,121,249,0.4)" }}
          >
            {hotText}
          </span>
        </SummaryCell>
      )}
    </footer>
  );
}

function SummaryCell({
  k,
  children,
  hot,
}: {
  k: string;
  children: React.ReactNode;
  hot?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="label-mono"
        style={{ color: hot ? "var(--accent-magenta-2)" : "var(--text-muted)" }}
      >
        {k}
      </span>
      <span style={{ color: "var(--text)", fontWeight: 600 }}>{children}</span>
    </span>
  );
}
