import { useMemo, useState } from "react";
import { gameData } from "@/data";
import { useGraphStore } from "@/graph/store";
import { planChainFor } from "@/engine/planner";

type Props = { open: boolean; onClose: () => void };

export default function PlanDialog({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(gameData.items)
      .filter((i) => i.displayName.toLowerCase().includes(q))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [query]);

  if (!open) return null;

  const onPick = (itemId: string) => {
    const store = useGraphStore.getState();
    const plan = planChainFor(gameData, store.graph, itemId);
    setWarnings(plan.warnings);
    for (const n of plan.newNodes) store.addNodeRaw(n);
    for (const e of plan.newEdges) store.addEdgeRaw(e);
    if (plan.warnings.length === 0) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 w-[420px] space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Auto-build chain</h2>
          <button
            className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <p className="text-xs opacity-70">
          Pick the item you want. The planner will add machines for the default recipe
          chain, connecting up to the source nodes already on the canvas.
        </p>
        <input
          autoFocus
          type="text"
          placeholder="Search items…"
          className="w-full bg-neutral-800 rounded px-2 py-1 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="max-h-64 overflow-auto border border-neutral-800 rounded">
          {candidates.map((it) => (
            <button
              key={it.id}
              className="w-full text-left px-2 py-1 text-sm hover:bg-neutral-800 border-b border-neutral-800 last:border-b-0"
              onClick={() => onPick(it.id)}
            >
              {it.displayName}
              <span className="text-xs opacity-60 ml-2">{it.form}</span>
            </button>
          ))}
          {candidates.length === 0 && (
            <div className="px-2 py-3 text-xs opacity-60">No items match.</div>
          )}
        </div>
        {warnings.length > 0 && (
          <div className="text-xs text-amber-300 space-y-1 bg-amber-950/30 border border-amber-700/40 rounded p-2">
            <div className="font-semibold">Planner warnings:</div>
            {warnings.map((w, i) => (
              <div key={i}>• {w}</div>
            ))}
            <div className="text-amber-200/80 pt-1">
              Chain was added where possible. Add the missing source nodes and re-plan.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
