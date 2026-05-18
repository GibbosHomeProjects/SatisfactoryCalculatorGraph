import { useState, useMemo } from "react";
import { useGraphStore } from "@/graph/store";
import { useBottleneck } from "@/graph/useBottleneck";
import { useComputed } from "@/graph/useComputed";
import { gameData } from "@/data";

export default function Inspector() {
  const id = useGraphStore((s) => s.selectedNodeId);
  const node = useGraphStore((s) => (id ? s.graph.nodes[id] : null));
  const update = useGraphStore((s) => s.updateNode);
  const remove = useGraphStore((s) => s.removeNode);
  const report = useBottleneck();
  const computed = useComputed();

  if (!node) {
    return (
      <aside
        className="w-72 p-3 text-sm"
        style={{
          background: "rgba(0,0,0,0.25)",
          borderLeft: "1px solid var(--border)",
          color: "var(--text-faint)",
        }}
      >
        Click a node to inspect.
        <br />
        <span className="label-mono" style={{ marginTop: "0.5rem", display: "block" }}>
          ⌘K · command palette
        </span>
      </aside>
    );
  }

  const isHot = node.id === report.bottleneckNodeId;
  const isDim = report.underSuppliedNodeIds.has(node.id);
  const cmp = computed.nodes[node.id];

  return (
    <aside
      className="w-72 p-3 text-sm overflow-auto flex flex-col gap-2.5"
      style={{ background: "rgba(0,0,0,0.25)", borderLeft: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <div className="label-mono">{node.kind}</div>
        <button
          className="text-xs px-2 py-0.5 rounded glow-hover"
          style={{
            background: "rgba(220,38,38,0.15)",
            border: "1px solid rgba(220,38,38,0.4)",
            color: "#fca5a5",
          }}
          onClick={() => remove(node.id)}
        >
          Delete
        </button>
      </div>

      {"clockPct" in node && (
        <NumField
          label="Clock %"
          value={node.clockPct}
          min={1}
          max={250}
          onChange={(v) => update(node.id, { clockPct: v } as never)}
        />
      )}

      {node.kind === "miner" && (
        <>
          <SelectField
            label="Ore"
            value={node.itemId}
            options={gameData.mineableItemIds
              .map((mid) => gameData.items[mid])
              .filter((i): i is NonNullable<typeof i> => !!i)
              .sort((a, b) => a.displayName.localeCompare(b.displayName))
              .map((i) => ({ value: i.id, label: i.displayName }))}
            onChange={(v) => update(node.id, { itemId: v } as never)}
          />
          <SelectField
            label="Mk"
            value={node.mk}
            options={[
              { value: "mk1", label: "Mk1" },
              { value: "mk2", label: "Mk2" },
              { value: "mk3", label: "Mk3" },
            ]}
            onChange={(v) => update(node.id, { mk: v } as never)}
          />
          <SelectField
            label="Purity"
            value={node.purity}
            options={[
              { value: "impure", label: "Impure" },
              { value: "normal", label: "Normal" },
              { value: "pure", label: "Pure" },
            ]}
            onChange={(v) => update(node.id, { purity: v } as never)}
          />
        </>
      )}

      {node.kind === "oil-pump" && (
        <SelectField
          label="Purity"
          value={node.purity}
          options={[
            { value: "impure", label: "Impure" },
            { value: "normal", label: "Normal" },
            { value: "pure", label: "Pure" },
          ]}
          onChange={(v) => update(node.id, { purity: v } as never)}
        />
      )}

      {node.kind === "machine" && (
        <>
          <RecipeSearch
            value={node.recipeId}
            onChange={(v) => update(node.id, { recipeId: v } as never)}
          />
          <NumField
            label="Somersloop slots used"
            value={node.sloopsUsed}
            min={0}
            onChange={(v) => update(node.id, { sloopsUsed: v } as never)}
          />
        </>
      )}

      {node.kind === "sink" && (
        <NumField
          label="Coupons already purchased"
          value={node.couponsAlreadyPurchased}
          min={0}
          onChange={(v) => update(node.id, { couponsAlreadyPurchased: v } as never)}
        />
      )}

      <div
        className="grid grid-cols-2 gap-2 pt-2"
        style={{ borderTop: "1px dashed var(--border-soft)" }}
      >
        {Object.entries(cmp?.outputsPerMin ?? {}).map(([item, rate]) => (
          <Stat
            key={item}
            k={gameData.items[item]?.displayName ?? item}
            v={`${rate.toFixed(1)}/min`}
          />
        ))}
        <Stat k="Power" v={`${(cmp?.totalPowerMW ?? 0).toFixed(1)} MW`} />
        <Stat
          k="Status"
          v={isHot ? "Bottleneck" : isDim ? "Under-supplied" : "OK"}
          hot={isHot || isDim}
        />
        {isHot && <Suggestion node={node} />}
      </div>
    </aside>
  );
}

function NumField({
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label-mono">{label}</span>
      <input
        type="number"
        min={min}
        {...(max !== undefined ? { max } : {})}
        className="num"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "0.35rem 0.5rem",
          borderRadius: "5px",
          color: "var(--text)",
          fontSize: "0.78rem",
        }}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label-mono">{label}</span>
      <select
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "0.35rem 0.5rem",
          borderRadius: "5px",
          color: "var(--text)",
          fontSize: "0.78rem",
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RecipeSearch({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return Object.values(gameData.recipes)
      .filter((r) => !q || r.displayName.toLowerCase().includes(q))
      .sort(
        (a, b) =>
          Number(a.isAlternate) - Number(b.isAlternate) ||
          a.displayName.localeCompare(b.displayName),
      );
  }, [query]);

  const current = gameData.recipes[value];
  const building = current ? gameData.buildings[current.buildingId] : undefined;

  const inputStyle = {
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "0.35rem 0.5rem",
    borderRadius: "5px",
    color: "var(--text)",
    fontSize: "0.78rem",
    width: "100%",
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="label-mono">Recipe</span>
      {building && (
        <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", marginBottom: "0.1rem" }}>
          Building: <span style={{ color: "var(--text)" }}>{building.displayName}</span>
        </div>
      )}
      <input
        type="text"
        placeholder="Filter…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={inputStyle}
      />
      <select
        size={7}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, padding: "0" }}
      >
        {filtered.map((r) => {
          const bld = gameData.buildings[r.buildingId];
          return (
            <option key={r.id} value={r.id} style={{ padding: "0.2rem 0.4rem" }}>
              {r.displayName}{r.isAlternate ? " · ALT" : ""}{bld ? ` (${bld.displayName})` : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function Stat({ k, v, hot }: { k: string; v: string; hot?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="label-mono">{k}</span>
      <span
        className="num"
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: hot ? "var(--accent-magenta-2)" : "var(--text)",
          textShadow: hot ? "0 0 8px rgba(232,121,249,0.5)" : "none",
        }}
      >
        {v}
      </span>
    </div>
  );
}

function Suggestion({
  node,
}: {
  node: { kind: string; mk?: string; purity?: string; clockPct?: number };
}) {
  let text: string | null = null;
  if (node.kind === "miner") {
    const cur = node.mk ?? "mk1";
    const next = cur === "mk1" ? "mk2" : cur === "mk2" ? "mk3" : null;
    if (next) text = `+1 Mk → ~2× rate`;
    else if (node.purity !== "pure") text = `Pure node → 2× rate`;
  } else if (node.kind === "machine" && (node.clockPct ?? 100) < 250) {
    const head = Math.min(250, (node.clockPct ?? 100) + 50);
    text = `Clock → ${head}% to push more`;
  } else if (
    node.kind === "water-extractor" ||
    node.kind === "oil-pump" ||
    node.kind === "resource-well"
  ) {
    if ((node.clockPct ?? 100) < 250) text = `Clock → +50% for more flow`;
  }
  if (!text) return null;
  return (
    <div className="col-span-2 label-mono" style={{ color: "var(--text-faint)" }}>
      Tip: {text}
    </div>
  );
}
