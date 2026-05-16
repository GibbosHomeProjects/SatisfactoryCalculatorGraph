const SECTIONS: { label: string; items: { kind: string; label: string; color: string }[] }[] = [
  {
    label: "Sources",
    items: [
      { kind: "miner", label: "Miner", color: "#fbbf24" },
      { kind: "water-extractor", label: "Water Extractor", color: "#38bdf8" },
      { kind: "oil-pump", label: "Oil Pump", color: "#38bdf8" },
      { kind: "resource-well", label: "Resource Well", color: "#86efac" },
    ],
  },
  {
    label: "Process",
    items: [{ kind: "machine", label: "Machine", color: "#67e8f9" }],
  },
  {
    label: "Output",
    items: [{ kind: "sink", label: "AWESOME Sink", color: "#f0abfc" }],
  },
];

export default function Palette() {
  return (
    <aside
      className="w-44 overflow-auto"
      style={{
        background: "rgba(0,0,0,0.25)",
        borderRight: "1px solid var(--border)",
        padding: "0.6rem 0.4rem",
      }}
    >
      {SECTIONS.map((section) => (
        <div key={section.label} className="mb-3">
          <div className="label-mono" style={{ padding: "0.4rem 0.4rem 0.25rem" }}>
            {section.label}
          </div>
          {section.items.map((it) => (
            <div
              key={it.kind}
              className="cursor-grab text-sm rounded glow-hover flex items-center gap-2"
              style={{
                padding: "0.4rem 0.55rem",
                border: "1px solid transparent",
                marginBottom: "0.2rem",
              }}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("application/x-satcalc-kind", it.kind)}
            >
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: it.color,
                  color: it.color,
                  boxShadow: "0 0 6px currentColor",
                }}
              />
              {it.label}
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
}
