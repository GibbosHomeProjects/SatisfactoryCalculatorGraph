import { useGraphStore } from "@/graph/store";
import { gameData } from "@/data";

export default function Inspector() {
  const id = useGraphStore((s) => s.selectedNodeId);
  const node = useGraphStore((s) => (id ? s.graph.nodes[id] : null));
  const update = useGraphStore((s) => s.updateNode);
  const remove = useGraphStore((s) => s.removeNode);

  if (!node) {
    return (
      <aside className="w-72 border-l border-neutral-800 p-3 text-sm opacity-60">
        No selection.
      </aside>
    );
  }

  const numberInput = (label: string, value: number, key: string, min = 0, max?: number) => (
    <label className="block">
      <span className="text-xs opacity-80">{label}</span>
      <input
        type="number"
        min={min}
        {...(max !== undefined ? { max } : {})}
        className="w-full bg-neutral-800 rounded px-2 py-1"
        value={value}
        onChange={(e) => update(node.id, { [key]: Number(e.target.value) } as never)}
      />
    </label>
  );

  return (
    <aside className="w-72 border-l border-neutral-800 p-3 text-sm space-y-3 overflow-auto">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase opacity-60">{node.kind}</div>
        <button
          className="text-xs px-2 py-0.5 rounded bg-red-900/40 hover:bg-red-900/60"
          onClick={() => remove(node.id)}
        >
          Delete
        </button>
      </div>

      {"clockPct" in node && numberInput("Clock %", node.clockPct, "clockPct", 1, 250)}

      {node.kind === "miner" && (
        <>
          <label className="block">
            <span className="text-xs opacity-80">Ore</span>
            <select
              className="w-full bg-neutral-800 rounded px-2 py-1"
              value={node.itemId}
              onChange={(e) => update(node.id, { itemId: e.target.value } as never)}
            >
              {gameData.mineableItemIds
                .map((id) => gameData.items[id])
                .filter((i): i is NonNullable<typeof i> => !!i)
                .sort((a, b) => a.displayName.localeCompare(b.displayName))
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.displayName}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs opacity-80">Mk</span>
            <select
              className="w-full bg-neutral-800 rounded px-2 py-1"
              value={node.mk}
              onChange={(e) => update(node.id, { mk: e.target.value as never } as never)}
            >
              <option value="mk1">Mk1</option>
              <option value="mk2">Mk2</option>
              <option value="mk3">Mk3</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs opacity-80">Purity</span>
            <select
              className="w-full bg-neutral-800 rounded px-2 py-1"
              value={node.purity}
              onChange={(e) => update(node.id, { purity: e.target.value as never } as never)}
            >
              <option value="impure">Impure</option>
              <option value="normal">Normal</option>
              <option value="pure">Pure</option>
            </select>
          </label>
        </>
      )}

      {node.kind === "oil-pump" && (
        <label className="block">
          <span className="text-xs opacity-80">Purity</span>
          <select
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={node.purity}
            onChange={(e) => update(node.id, { purity: e.target.value as never } as never)}
          >
            <option value="impure">Impure</option>
            <option value="normal">Normal</option>
            <option value="pure">Pure</option>
          </select>
        </label>
      )}

      {node.kind === "machine" && (
        <>
          <label className="block">
            <span className="text-xs opacity-80">Recipe</span>
            <select
              className="w-full bg-neutral-800 rounded px-2 py-1"
              value={node.recipeId}
              onChange={(e) => update(node.id, { recipeId: e.target.value } as never)}
            >
              {Object.values(gameData.recipes)
                .sort((a, b) => Number(a.isAlternate) - Number(b.isAlternate))
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName}
                    {r.isAlternate ? " · ALT" : ""}
                  </option>
                ))}
            </select>
          </label>
          {numberInput("Somersloop slots used", node.sloopsUsed, "sloopsUsed", 0)}
        </>
      )}

      {node.kind === "sink" &&
        numberInput(
          "Coupons already purchased",
          node.couponsAlreadyPurchased,
          "couponsAlreadyPurchased",
          0,
        )}
    </aside>
  );
}
