const ITEMS = [
  { kind: "miner", label: "Miner" },
  { kind: "water-extractor", label: "Water Extractor" },
  { kind: "oil-pump", label: "Oil Pump" },
  { kind: "resource-well", label: "Resource Well" },
  { kind: "machine", label: "Machine" },
  { kind: "sink", label: "AWESOME Sink" },
];

export default function Palette() {
  return (
    <aside className="w-44 bg-neutral-900/80 border-r border-neutral-800 p-2 space-y-1 overflow-auto">
      <div className="text-xs uppercase tracking-wide opacity-60 px-2 pt-1">Nodes</div>
      {ITEMS.map((it) => (
        <div
          key={it.kind}
          className="cursor-grab rounded border border-neutral-700 px-2 py-1 text-sm hover:bg-neutral-800"
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData("application/x-satcalc-kind", it.kind)
          }
        >
          {it.label}
        </div>
      ))}
    </aside>
  );
}
