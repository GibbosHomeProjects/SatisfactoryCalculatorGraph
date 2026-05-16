import type { ReactNode } from "react";
import { useBottleneck } from "../useBottleneck";

type Accent = "amber" | "sky" | "green" | "emerald" | "magenta";

const ACCENT_BORDER: Record<Accent, string> = {
  amber: "#d97706",
  sky: "#0284c7",
  green: "#15803d",
  emerald: "#065f46",
  magenta: "#c026d3",
};
const ACCENT_TEXT: Record<Accent, string> = {
  amber: "#fbbf24",
  sky: "#38bdf8",
  green: "#86efac",
  emerald: "#6ee7b7",
  magenta: "#f0abfc",
};
const ACCENT_GLOW: Record<Accent, string> = {
  amber: "rgba(245,158,11,0.25)",
  sky: "rgba(56,189,248,0.25)",
  green: "rgba(34,197,94,0.25)",
  emerald: "rgba(16,185,129,0.25)",
  magenta: "rgba(232,121,249,0.45)",
};

export function NodeCard({
  nodeId,
  accent,
  type,
  name,
  meta,
  rate,
  badge,
  children,
}: {
  nodeId: string;
  accent: Accent;
  type: string;
  name: string;
  meta?: ReactNode;
  rate?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  const report = useBottleneck();
  const isHot = report.bottleneckNodeId === nodeId;
  const isDim = report.underSuppliedNodeIds.has(nodeId);

  const borderColor = isHot ? ACCENT_BORDER.magenta : ACCENT_BORDER[accent];
  const textColor = isHot ? ACCENT_TEXT.magenta : ACCENT_TEXT[accent];
  const glow = isHot ? `0 0 22px ${ACCENT_GLOW.magenta}` : `0 0 14px ${ACCENT_GLOW[accent]}`;

  return (
    <div
      className={`rounded-lg text-sm ${isHot ? "node-hot" : ""} ${isDim ? "node-dim" : ""}`}
      style={{
        background: "rgba(8,4,18,0.85)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${borderColor}`,
        boxShadow: glow,
        padding: "0.6rem 0.75rem",
        minWidth: "180px",
        transition: "transform 0.15s, box-shadow 0.18s",
        color: "var(--text)",
      }}
    >
      <div className="label-mono" style={{ color: textColor, marginBottom: "0.15rem" }}>
        {type}
      </div>
      <div style={{ fontWeight: 600, fontSize: "0.82rem", marginBottom: "0.3rem" }}>
        {name}
      </div>
      {meta && (
        <div className="num" style={{ fontSize: "0.66rem", opacity: 0.75, lineHeight: 1.3 }}>
          {meta}
        </div>
      )}
      {rate !== undefined && (
        <div
          className="num"
          style={{ fontSize: "0.92rem", fontWeight: 700, marginTop: "0.35rem" }}
        >
          {rate}
        </div>
      )}
      {(isHot || badge) && (
        <div
          className="label-mono"
          style={{
            display: "inline-block",
            marginTop: "0.3rem",
            padding: "0.05rem 0.4rem",
            border: `1px solid ${isHot ? "rgba(232,121,249,0.5)" : "rgba(124,115,151,0.4)"}`,
            color: isHot ? "var(--accent-magenta-2)" : "var(--text-faint)",
            background: isHot ? "rgba(232,121,249,0.15)" : "rgba(0,0,0,0.3)",
            borderRadius: "3px",
            fontSize: "0.58rem",
          }}
        >
          {isHot ? "Bottleneck" : badge}
        </div>
      )}
      {children}
    </div>
  );
}
