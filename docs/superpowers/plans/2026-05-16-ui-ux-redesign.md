# UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder Tailwind UI with a coherent neon/cyber design language and ship three high-leverage UX features (Cmd+K command palette + keyboard shortcuts, bottleneck heatmap, smart-default clock speeds).

**Architecture:** Pure functions for the new analysis logic (`bottleneck.ts`, planner clock heuristic). One CSS-custom-properties theme file (`theme.css`) owns every colour/spacing token; every component reads from it. Each redesigned UI file does *only* the visual change for its component — no engine logic — and reads the bottleneck report through a single `useBottleneck()` hook. The command palette is one isolated overlay component plus a keyboard-shortcuts hook so other components stay unaware of either system.

**Tech Stack:** React 18 + TypeScript, Tailwind (still configured but used sparingly — most styling moves to plain CSS via theme tokens), Zustand store (unchanged), Vitest (engine + hook tests), `@xyflow/react` (unchanged).

**Spec:** [`docs/superpowers/specs/2026-05-16-ui-ux-redesign-design.md`](../specs/2026-05-16-ui-ux-redesign-design.md)

---

## Phase A — Foundation (theme + engine)

### Task 1: Theme tokens

**Files:**
- Create: `src/ui/theme.css`
- Modify: `src/index.css`

- [ ] **Step 1: Write the theme file**

Create `src/ui/theme.css`:

```css
/* Neon/cyber design tokens. All colours, glows, and one-off font-stack
   references live here so components never hard-code anything visual. */

:root {
  /* Surfaces */
  --bg-base-from: #1a0b2e;
  --bg-base-via:  #0a0414;
  --bg-base-to:   #06030c;
  --bg-base:      radial-gradient(120% 70% at 0% 0%, var(--bg-base-from) 0%, var(--bg-base-via) 60%, var(--bg-base-to) 100%);
  --bg-panel:     rgba(0, 0, 0, 0.25);
  --surface:      rgba(8, 4, 18, 0.85);
  --border:       #2b1748;
  --border-soft:  rgba(124, 115, 151, 0.3);

  /* Text */
  --text:         #e7e3f5;
  --text-muted:   #7c7397;
  --text-faint:   rgba(124, 115, 151, 0.6);

  /* Accents */
  --accent-cyan:    #06b6d4;
  --accent-cyan-2:  #67e8f9;
  --accent-magenta: #c026d3;
  --accent-magenta-2: #f0abfc;
  --accent-amber:   #f59e0b;
  --accent-amber-2: #fbbf24;
  --accent-green:   #15803d;
  --accent-green-2: #86efac;
  --accent-sky:     #0284c7;
  --accent-sky-2:   #38bdf8;
  --accent-red:     #ef4444;

  /* Effects */
  --glow-default:  0 0 14px;
  --glow-strong:   0 0 22px;
  --glow-hot:      0 0 22px rgba(232, 121, 249, 0.45);

  /* Typography */
  --font-display:  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono:     ui-monospace, "SF Mono", Menlo, Consolas, monospace;

  /* Numeric formatting (consumers should also add font-variant-numeric: tabular-nums) */
  --tracking-mono: 0.12em;
}

html, body, #root { height: 100%; }

body {
  background: var(--bg-base);
  background-attachment: fixed;
  color: var(--text);
  font-family: var(--font-display);
}

/* Mono labels reused all over the chrome. */
.label-mono {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: var(--tracking-mono);
  color: var(--text-muted);
  text-transform: uppercase;
}

/* Tabular-numeric numeric values reused in stats. */
.num {
  font-variant-numeric: tabular-nums;
}

/* Soft hover-glow used on palette items, buttons. */
.glow-hover { transition: box-shadow 0.15s, border-color 0.15s, color 0.15s; }
.glow-hover:hover {
  border-color: rgba(6, 182, 212, 0.5);
  color: var(--accent-cyan-2);
}

/* Pulsing hot border for bottleneck nodes. */
@keyframes hot-pulse {
  0%, 100% { box-shadow: 0 0 18px rgba(232, 121, 249, 0.35); }
  50%      { box-shadow: 0 0 28px rgba(232, 121, 249, 0.6); }
}
.node-hot {
  border-color: var(--accent-magenta) !important;
  animation: hot-pulse 2.5s ease-in-out infinite;
}
.node-dim {
  opacity: 0.55;
  box-shadow: none !important;
}
```

- [ ] **Step 2: Replace the body styles in `src/index.css`**

Replace the entire contents of `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import "./ui/theme.css";
```

- [ ] **Step 3: Smoke-build**

```bash
npm run build
```

Expected: clean build, css bundle ~24 KB (was 24 KB).

- [ ] **Step 4: Commit**

```bash
git add src/ui/theme.css src/index.css
git commit -m "feat(theme): introduce neon/cyber design tokens in theme.css"
```

---

### Task 2: Bottleneck analysis engine

**Files:**
- Create: `src/engine/bottleneck.ts`
- Create: `src/engine/bottleneck.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/engine/bottleneck.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import { compute } from "./compute";
import { bottleneck } from "./bottleneck";
import type { Graph } from "./graph";

describe("bottleneck analysis", () => {
  it("flags the single source as the bottleneck when downstream is starved", () => {
    // 1 miner @ 60 ore/min feeding a smelter+constructor chain that wants more.
    const g: Graph = {
      nodes: {
        m:  { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 },
        sm: { kind: "machine", id: "sm", recipeId: "recipe-iron-ingot", clockPct: 100, sloopsUsed: 0 },
        c:  { kind: "machine", id: "c",  recipeId: "recipe-iron-plate", clockPct: 100, sloopsUsed: 0 },
      },
      edges: [
        { id: "e1", fromNodeId: "m",  toNodeId: "sm", itemId: "iron-ore" },
        { id: "e2", fromNodeId: "sm", toNodeId: "c",  itemId: "iron-ingot" },
      ],
    };
    const res = compute(sampleGameData, g);
    const report = bottleneck(sampleGameData, g, res);
    expect(report.bottleneckNodeId).toBe("m");
  });

  it("returns no bottleneck when no production node exists", () => {
    const g: Graph = {
      nodes: { m: { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 } },
      edges: [],
    };
    const res = compute(sampleGameData, g);
    const report = bottleneck(sampleGameData, g, res);
    expect(report.bottleneckNodeId).toBeNull();
    expect(report.underSuppliedNodeIds.size).toBe(0);
  });

  it("marks downstream machines under-supplied when input < per-machine demand", () => {
    // Pure Iron Ingot recipe needs 35 ore + 20 water per minute per machine.
    // Give it only 4 water/min so it's under-supplied.
    const g: Graph = {
      nodes: {
        m: { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk2", purity: "normal", clockPct: 100 },
        w: { kind: "water-extractor", id: "w", clockPct: 3.3333 }, // ~4 m^3/min
        r: { kind: "machine", id: "r", recipeId: "recipe-pure-iron-ingot", clockPct: 100, sloopsUsed: 0 },
      },
      edges: [
        { id: "e1", fromNodeId: "m", toNodeId: "r", itemId: "iron-ore" },
        { id: "e2", fromNodeId: "w", toNodeId: "r", itemId: "water" },
      ],
    };
    const res = compute(sampleGameData, g);
    const report = bottleneck(sampleGameData, g, res);
    expect(report.underSuppliedNodeIds.has("r")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing test**

```bash
npm run test:run -- src/engine/bottleneck.test.ts
```

Expected: fail with "Cannot find module './bottleneck'".

- [ ] **Step 3: Implement**

Create `src/engine/bottleneck.ts`:

```ts
import type { GameData } from "@/data/types";
import type { Graph } from "./graph";
import type { ComputeResult } from "./compute";
import { recipeInputPerMinPerMachine } from "./production";

export type BottleneckReport = {
  bottleneckNodeId: string | null;
  bottleneckDelta?: { itemId: string; perMinShortfall: number };
  underSuppliedNodeIds: Set<string>;
};

const SOURCE_KINDS = new Set([
  "miner",
  "water-extractor",
  "oil-pump",
  "resource-well",
]);

/**
 * Identify the single node most limiting overall throughput, plus the set
 * of nodes that aren't getting enough input for their current configuration.
 *
 * Algorithm:
 *   - For each machine node, look at every input. If supply for that input
 *     is less than `per_machine_demand * effective_machine_count` (i.e. the
 *     machine could absorb more), the node is under-supplied.
 *   - The bottleneck node is the upstream-most source / producer whose
 *     ratio supply/demand is smallest along any path to an under-supplied
 *     consumer. If no consumer is under-supplied, there is no bottleneck.
 */
export function bottleneck(
  data: GameData,
  graph: Graph,
  result: ComputeResult,
): BottleneckReport {
  const underSuppliedNodeIds = new Set<string>();
  const ratios = new Map<string, { ratio: number; itemId: string; shortfall: number }>();

  for (const node of Object.values(graph.nodes)) {
    if (node.kind !== "machine") continue;
    const recipe = data.recipes[node.recipeId];
    if (!recipe || recipe.inputs.length === 0) continue;

    const computedMachineCount = result.nodes[node.id]?.machineCount ?? 0;

    let worstRatio = Infinity;
    let worstItem = recipe.inputs[0]!.itemId;
    let worstShortfall = 0;

    for (const inp of recipe.inputs) {
      const perMachineDemand = recipeInputPerMinPerMachine(recipe, inp.itemId, node.clockPct);
      if (perMachineDemand === 0) continue;

      // Sum incoming supply for this item from the compute result.
      let supply = 0;
      for (const e of graph.edges) {
        if (e.toNodeId !== node.id || e.itemId !== inp.itemId) continue;
        supply += result.edges[e.id]?.amountPerMin ?? 0;
      }

      // If supply is less than what the machine could absorb at its current
      // clock running at the "rounded up" machine count, it's under-supplied.
      const maxAbsorb = perMachineDemand * Math.ceil(computedMachineCount);
      if (supply + 1e-6 < maxAbsorb) underSuppliedNodeIds.add(node.id);

      const ratio = maxAbsorb === 0 ? 1 : supply / maxAbsorb;
      if (ratio < worstRatio) {
        worstRatio = ratio;
        worstItem = inp.itemId;
        worstShortfall = Math.max(0, maxAbsorb - supply);
      }
    }

    if (worstRatio < 1) {
      // Walk upstream to find the deepest producer of the limiting item.
      const seen = new Set<string>();
      let cursor = node.id;
      // BFS upstream along edges that carry `worstItem`.
      while (!seen.has(cursor)) {
        seen.add(cursor);
        const incoming = graph.edges.find(
          (e) => e.toNodeId === cursor && e.itemId === worstItem,
        );
        if (!incoming) break;
        cursor = incoming.fromNodeId;
      }
      const upstream = graph.nodes[cursor];
      const candidateId = upstream && SOURCE_KINDS.has(upstream.kind) ? cursor : node.id;
      const existing = ratios.get(candidateId);
      if (!existing || worstRatio < existing.ratio) {
        ratios.set(candidateId, { ratio: worstRatio, itemId: worstItem, shortfall: worstShortfall });
      }
    }
  }

  if (ratios.size === 0) {
    return { bottleneckNodeId: null, underSuppliedNodeIds };
  }

  let worstId: string | null = null;
  let worst = { ratio: Infinity, itemId: "", shortfall: 0 };
  for (const [id, r] of ratios) {
    if (r.ratio < worst.ratio) {
      worst = r;
      worstId = id;
    }
  }

  return {
    bottleneckNodeId: worstId,
    bottleneckDelta: { itemId: worst.itemId, perMinShortfall: worst.shortfall },
    underSuppliedNodeIds,
  };
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
npm run test:run -- src/engine/bottleneck.test.ts
```

Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/engine/bottleneck.ts src/engine/bottleneck.test.ts
git commit -m "feat(engine): pure bottleneck analysis with under-supply detection"
```

---

### Task 3: `useBottleneck` React hook

**Files:**
- Create: `src/graph/useBottleneck.ts`

- [ ] **Step 1: Implement the hook**

Create `src/graph/useBottleneck.ts`:

```ts
import { useMemo } from "react";
import { useGraphStore } from "./store";
import { useComputed } from "./useComputed";
import { gameData } from "@/data";
import { bottleneck } from "@/engine/bottleneck";

/**
 * Memoised bottleneck report for the current graph. Recomputes only when
 * the graph reference changes (i.e. on actual graph mutation, not on
 * unrelated UI state updates).
 */
export function useBottleneck() {
  const graph = useGraphStore((s) => s.graph);
  const compute = useComputed();
  return useMemo(() => bottleneck(gameData, graph, compute), [graph, compute]);
}
```

- [ ] **Step 2: Build to verify it type-checks**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/graph/useBottleneck.ts
git commit -m "feat(graph): useBottleneck hook with memoised analysis"
```

---

### Task 4: Smart-default clocks in the planner

**Files:**
- Modify: `src/engine/planner.ts`
- Modify: `src/engine/planner.test.ts`

- [ ] **Step 1: Write the failing test cases**

Append to `src/engine/planner.test.ts` (inside the existing `describe("planChainFor", ...)` block):

```ts
  it("smart-default clock: 60 ingot supply for a 30/min recipe -> clock 100", () => {
    // Build a graph that supplies exactly 60 iron ingot/min via a single
    // Mk1 normal miner -> smelter. Then plan iron-plate (needs 30 ingot @ 100%).
    const graph: Graph = {
      nodes: {
        m: ironOreMiner("m"),
        sm: { kind: "machine", id: "sm", recipeId: "recipe-iron-ingot", clockPct: 100, sloopsUsed: 0 },
      },
      edges: [{ id: "e0", fromNodeId: "m", toNodeId: "sm", itemId: "iron-ore" }],
    };
    const plan = planChainFor(sampleGameData, graph, "iron-plate");
    const plateMachine = plan.newNodes.find(
      (n) => n.kind === "machine" && (n as { recipeId: string }).recipeId === "recipe-iron-plate",
    );
    expect(plateMachine).toBeDefined();
    expect((plateMachine as { clockPct: number }).clockPct).toBe(100);
  });

  it("smart-default clock: 45 ingot supply for a 30/min recipe -> clock 75", () => {
    // Underclock a smelter to 75% so it outputs 45 ingot/min (instead of 60).
    const graph: Graph = {
      nodes: {
        m: ironOreMiner("m"),
        sm: { kind: "machine", id: "sm", recipeId: "recipe-iron-ingot", clockPct: 75, sloopsUsed: 0 },
      },
      edges: [{ id: "e0", fromNodeId: "m", toNodeId: "sm", itemId: "iron-ore" }],
    };
    const plan = planChainFor(sampleGameData, graph, "iron-plate");
    const plateMachine = plan.newNodes.find(
      (n) => n.kind === "machine" && (n as { recipeId: string }).recipeId === "recipe-iron-plate",
    );
    // 45 / 30 = 1.5 machines @ 100%; ceil(1.5) = 2 machines; clock = 1.5/2*100 = 75
    expect((plateMachine as { clockPct: number }).clockPct).toBe(75);
  });

  it("smart-default clock: zero supply leaves clock at 100", () => {
    // No upstream miner at all. Plan a chain for screw.
    const graph: Graph = { nodes: {}, edges: [] };
    const plan = planChainFor(sampleGameData, graph, "screw");
    const screwMachine = plan.newNodes.find(
      (n) => n.kind === "machine" && (n as { recipeId: string }).recipeId === "recipe-screw",
    );
    expect((screwMachine as { clockPct: number }).clockPct).toBe(100);
  });
```

- [ ] **Step 2: Confirm the new tests fail**

```bash
npm run test:run -- src/engine/planner.test.ts
```

Expected: the three new tests fail (clockPct currently always 100; second test expects 75 instead).

- [ ] **Step 3: Implement the smart-default clock pass**

In `src/engine/planner.ts`, locate the `planChainFor()` function (the part after `ensureProducer(targetItemId)` is called). Replace the final `return { newNodes, newEdges, warnings };` block with the following:

```ts
  ensureProducer(targetItemId);

  // ----- Smart-default clock pass -----
  // After the full chain is laid out, run a fresh compute over the merged
  // graph to discover the real per-input supply each new machine will see.
  // Then choose the clock that makes machine_count exactly equal to
  // ceil(supply/perMachineAt100), capped at 100% (never auto-overclock).
  const merged: Graph = {
    nodes: { ...graph.nodes },
    edges: [...graph.edges, ...newEdges],
  };
  for (const n of newNodes) merged.nodes[n.id] = n;

  // Lazy import to avoid a circular reference: compute lives in compute.ts,
  // which imports planner-adjacent helpers from production.ts.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { compute } = require("./compute") as typeof import("./compute");

  const computed = compute(data, merged);

  for (const node of newNodes) {
    if (node.kind !== "machine") continue;
    const recipe = data.recipes[node.recipeId];
    if (!recipe || recipe.inputs.length === 0) continue;

    let worstRatio = Infinity;
    for (const inp of recipe.inputs) {
      const perMachineAt100 = (60 / recipe.durationSeconds) * inp.amountPerCycle;
      if (perMachineAt100 === 0) continue;

      let supply = 0;
      for (const e of merged.edges) {
        if (e.toNodeId !== node.id || e.itemId !== inp.itemId) continue;
        supply += computed.edges[e.id]?.amountPerMin ?? 0;
      }
      const machinesNeeded = supply / perMachineAt100;
      if (!Number.isFinite(machinesNeeded) || machinesNeeded === 0) continue;
      const integerMachines = Math.max(1, Math.ceil(machinesNeeded));
      const clockForExactFit = (machinesNeeded / integerMachines) * 100;
      const cappedClock = Math.min(100, clockForExactFit);
      if (cappedClock / 100 < worstRatio) worstRatio = cappedClock / 100;
    }

    if (worstRatio !== Infinity) {
      node.clockPct = Math.round(worstRatio * 100);
    }
  }

  return { newNodes, newEdges, warnings };
```

- [ ] **Step 4: Confirm all planner tests pass**

```bash
npm run test:run -- src/engine/planner.test.ts
```

Expected: 7 passing (4 original + 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/engine/planner.ts src/engine/planner.test.ts
git commit -m "feat(planner): smart-default clock so new machines consume supply exactly"
```

---

## Phase B — Visual redesign

### Task 5: Canvas redesign — grid backdrop + glow flair

**Files:**
- Modify: `src/graph/Canvas.tsx`

- [ ] **Step 1: Add the new background styling**

In `src/graph/Canvas.tsx`, locate the `return (` block at the bottom. Replace the wrapper `<div>` with:

```tsx
  return (
    <div
      ref={wrapperRef}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex-1 min-w-0 relative"
      style={{
        height: "100%",
        backgroundColor: "#0a0414",
        backgroundImage:
          "radial-gradient(600px 300px at 20% 30%, rgba(6, 182, 212, 0.06), transparent 60%)," +
          "radial-gradient(500px 300px at 80% 70%, rgba(232, 121, 249, 0.06), transparent 60%)," +
          "linear-gradient(rgba(124, 115, 151, 0.10) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(124, 115, 151, 0.10) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 24px 24px, 24px 24px",
      }}
    >
```

- [ ] **Step 2: Build + smoke run**

```bash
npm run build
```

Expected: clean. Verify in the running preview at `http://localhost:5173/SatisfactoryCalculatorGraph/` that the canvas now has the 24×24 dotted grid and the cyan/magenta corner glows.

- [ ] **Step 3: Commit**

```bash
git add src/graph/Canvas.tsx
git commit -m "feat(canvas): neon grid backdrop with cyan + magenta corner flair"
```

---

### Task 6: Top bar (ProjectBar) — brand + hot pill + kbd hints

**Files:**
- Modify: `src/ui/ProjectBar.tsx`

- [ ] **Step 1: Rewrite the file**

Replace `src/ui/ProjectBar.tsx` entirely with:

```tsx
import { useMemo, useState } from "react";
import { useProjectStore } from "@/storage/projects";
import { exportCurrentProject, importProjectFromFile } from "@/storage/importExport";
import { useBottleneck } from "@/graph/useBottleneck";
import PlanDialog from "./PlanDialog";

export default function ProjectBar() {
  const projectsMap = useProjectStore((s) => s.projects);
  const projects = useMemo(() => Object.values(projectsMap), [projectsMap]);
  const current = useProjectStore((s) => s.currentProjectId);
  const ps = useProjectStore.getState();
  const [planOpen, setPlanOpen] = useState(false);
  const report = useBottleneck();
  const hotCount = (report.bottleneckNodeId ? 1 : 0) + report.underSuppliedNodeIds.size;

  return (
    <>
      <header
        className="h-10 flex items-center gap-2 px-3 text-sm shrink-0"
        style={{ background: "rgba(0,0,0,0.35)", borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="label-mono"
          style={{
            color: "var(--accent-cyan-2)",
            textShadow: "0 0 8px rgba(6,182,212,0.6)",
            fontSize: "0.78rem",
            marginRight: "0.4rem",
          }}
        >
          FICSIT∥CALC
        </span>

        <select
          className="bg-neutral-800 rounded px-2 py-1 glow-hover"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
          value={current ?? ""}
          onChange={(e) => ps.switchTo(e.target.value)}
        >
          <option value="" disabled>Select project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <ChromeButton onClick={() => {
          const name = prompt("Project name?", "New Project");
          if (name) ps.createProject(name);
        }}>New</ChromeButton>

        <ChromeButton onClick={() => {
          if (!current) return;
          const name = prompt("New name?", projects.find((p) => p.id === current)?.name ?? "");
          if (name) ps.renameProject(current, name);
        }}>Rename</ChromeButton>

        <ChromeButton onClick={() => current && ps.duplicateProject(current)}>Duplicate</ChromeButton>

        <ChromeButton
          primary
          onClick={() => setPlanOpen(true)}
          title="Auto-build a chain from existing sources to a target item"
          kbd="⌘P"
        >
          Plan…
        </ChromeButton>

        <ChromeButton onClick={() => exportCurrentProject()}>Export</ChromeButton>

        <label
          className="px-2 py-1 rounded glow-hover cursor-pointer text-xs"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Import
          <input
            type="file" accept=".json" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importProjectFromFile(f).catch((err) => alert(String(err)));
              e.target.value = "";
            }}
          />
        </label>

        <ChromeButton danger onClick={() => {
          if (current && confirm("Delete this project?")) ps.deleteProject(current);
        }}>Delete</ChromeButton>

        <span className="flex-1" />

        <ChromeButton kbd="⌘K" title="Command palette">⌘K</ChromeButton>

        {hotCount > 0 && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background: "rgba(232,121,249,0.08)",
              border: "1px solid rgba(232,121,249,0.4)",
              color: "var(--accent-magenta-2)",
            }}
          >
            {hotCount} hot node{hotCount === 1 ? "" : "s"}
          </span>
        )}
      </header>
      <PlanDialog open={planOpen} onClose={() => setPlanOpen(false)} />
    </>
  );
}

function ChromeButton({
  children, onClick, primary, danger, title, kbd,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  title?: string;
  kbd?: string;
}) {
  const baseBg = primary
    ? "linear-gradient(180deg, rgba(232,121,249,0.18), rgba(232,121,249,0.05))"
    : danger
      ? "rgba(220,38,38,0.15)"
      : "rgba(255,255,255,0.04)";
  const borderColor = primary
    ? "rgba(232,121,249,0.5)"
    : danger
      ? "rgba(220,38,38,0.45)"
      : "rgba(255,255,255,0.08)";
  const color = primary ? "var(--accent-magenta-2)" : danger ? "#fca5a5" : "var(--text)";
  const boxShadow = primary ? "0 0 16px rgba(232,121,249,0.2)" : "none";

  return (
    <button
      onClick={onClick}
      title={title}
      className="px-2 py-1 rounded text-xs glow-hover inline-flex items-center gap-1"
      style={{ background: baseBg, border: `1px solid ${borderColor}`, color, boxShadow }}
    >
      <span>{children}</span>
      {kbd && (
        <span
          className="label-mono"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "0.05rem 0.3rem",
            borderRadius: "3px",
            fontSize: "0.6rem",
            color: "var(--text-faint)",
          }}
        >
          {kbd}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Build + visual verify**

```bash
npm run build
```

Open the preview. Confirm:
- The cyan "FICSIT∥CALC" brand mark appears on the left with a soft text glow.
- The "Plan…" button is a magenta-tinted primary with the `⌘P` chip.
- When you have any nodes that trigger a bottleneck (drag a miner + smelter, run Plan), the magenta "hot nodes" pill appears on the right.

- [ ] **Step 3: Commit**

```bash
git add src/ui/ProjectBar.tsx
git commit -m "feat(ui): redesigned top bar with brand mark, kbd chips, hot-nodes pill"
```

---

### Task 7: Palette redesign — sections + glyphs

**Files:**
- Modify: `src/ui/Palette.tsx`

- [ ] **Step 1: Rewrite the file**

Replace `src/ui/Palette.tsx` entirely with:

```tsx
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
              onDragStart={(e) =>
                e.dataTransfer.setData("application/x-satcalc-kind", it.kind)
              }
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
```

- [ ] **Step 2: Build + verify**

```bash
npm run build
```

Reload the preview. The palette now shows three section labels with their items and glowing colour dots.

- [ ] **Step 3: Commit**

```bash
git add src/ui/Palette.tsx
git commit -m "feat(ui): palette redesign with section headers and accent glyphs"
```

---

### Task 8: Summary bar redesign — Hot cell

**Files:**
- Modify: `src/ui/SummaryBar.tsx`

- [ ] **Step 1: Rewrite the file**

Replace `src/ui/SummaryBar.tsx` entirely with:

```tsx
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
          ? gameData.recipes[node.recipeId]?.displayName ?? "Machine"
          : node?.kind ?? "node";
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
  k, children, hot,
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
```

- [ ] **Step 2: Build + verify**

```bash
npm run build
```

Open the preview. Verify the summary bar uses tabular numerics, monospace `Raw / Power / Points / Hot` labels, and the Hot cell appears in magenta when a bottleneck exists.

- [ ] **Step 3: Commit**

```bash
git add src/ui/SummaryBar.tsx
git commit -m "feat(ui): summary bar with bottleneck Hot cell and tabular numerics"
```

---

### Task 9: Inspector redesign — control look + stats grid + suggestion

**Files:**
- Modify: `src/ui/Inspector.tsx`

- [ ] **Step 1: Rewrite the file**

Replace `src/ui/Inspector.tsx` entirely with:

```tsx
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
        Click a node to inspect.<br />
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
          style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5" }}
          onClick={() => remove(node.id)}
        >
          Delete
        </button>
      </div>

      {"clockPct" in node && (
        <NumField label="Clock %" value={node.clockPct} min={1} max={250} onChange={(v) => update(node.id, { clockPct: v } as never)} />
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
          <SelectField
            label="Recipe"
            value={node.recipeId}
            options={Object.values(gameData.recipes)
              .sort((a, b) => Number(a.isAlternate) - Number(b.isAlternate) || a.displayName.localeCompare(b.displayName))
              .map((r) => ({ value: r.id, label: `${r.displayName}${r.isAlternate ? " · ALT" : ""}` }))}
            onChange={(v) => update(node.id, { recipeId: v } as never)}
          />
          <NumField label="Somersloop slots used" value={node.sloopsUsed} min={0} onChange={(v) => update(node.id, { sloopsUsed: v } as never)} />
        </>
      )}

      {node.kind === "sink" && (
        <NumField label="Coupons already purchased" value={node.couponsAlreadyPurchased} min={0} onChange={(v) => update(node.id, { couponsAlreadyPurchased: v } as never)} />
      )}

      <div
        className="grid grid-cols-2 gap-2 pt-2"
        style={{ borderTop: "1px dashed var(--border-soft)" }}
      >
        {Object.entries(cmp?.outputsPerMin ?? {}).map(([item, rate]) => (
          <Stat key={item} k={gameData.items[item]?.displayName ?? item} v={`${rate.toFixed(1)}/min`} />
        ))}
        <Stat k="Power" v={`${(cmp?.totalPowerMW ?? 0).toFixed(1)} MW`} />
        <Stat k="Status" v={isHot ? "Bottleneck" : isDim ? "Under-supplied" : "OK"} hot={isHot || isDim} />
        {isHot && <Suggestion node={node} cmp={cmp} />}
      </div>
    </aside>
  );
}

function NumField({
  label, value, min = 0, max, onChange,
}: { label: string; value: number; min?: number; max?: number; onChange: (v: number) => void }) {
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
  label, value, options, onChange,
}: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
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
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
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
  node, cmp,
}: { node: { kind: string; mk?: string; purity?: string; clockPct?: number }; cmp: { outputsPerMin?: Record<string, number> } | undefined }) {
  // One-line coaching suggestion shown only for the bottleneck node.
  let text: string | null = null;
  if (node.kind === "miner") {
    const cur = node.mk ?? "mk1";
    const next = cur === "mk1" ? "mk2" : cur === "mk2" ? "mk3" : null;
    if (next) text = `+1 Mk → ~2× rate`;
    else if (node.purity !== "pure") text = `Pure node → 2× rate`;
  } else if (node.kind === "machine" && (node.clockPct ?? 100) < 250) {
    const head = Math.min(250, (node.clockPct ?? 100) + 50);
    text = `Clock → ${head}% to push more`;
  } else if (node.kind === "water-extractor" || node.kind === "oil-pump" || node.kind === "resource-well") {
    if ((node.clockPct ?? 100) < 250) text = `Clock → +50% for more flow`;
  }
  if (!text) return null;
  void cmp; // reserved for future deltas
  return (
    <div className="col-span-2 label-mono" style={{ color: "var(--text-faint)" }}>
      Tip: {text}
    </div>
  );
}
```

- [ ] **Step 2: Build + verify**

```bash
npm run build
```

Verify in preview:
- Empty inspector shows "Click a node to inspect." + Cmd+K hint.
- Selecting a miner shows monospace labels, dark inputs, stats grid with `Output / Power / Status`.
- When the miner is the bottleneck, `Status` is magenta and the `Tip:` line appears.

- [ ] **Step 3: Commit**

```bash
git add src/ui/Inspector.tsx
git commit -m "feat(ui): inspector redesign with stats grid and bottleneck coaching tip"
```

---

### Task 10: FlowEdge restyle — cyan glow + accent chip

**Files:**
- Modify: `src/graph/edges/FlowEdge.tsx`

- [ ] **Step 1: Replace the file**

Replace `src/graph/edges/FlowEdge.tsx` entirely with:

```tsx
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { gameData } from "@/data";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";
import type { BeltTier, PipeTier } from "@/engine/graph";

function colourForForm(form?: string) {
  if (form === "fluid") return { stroke: "#38bdf8", glow: "rgba(56,189,248,0.5)", chip: "rgba(56,189,248,0.5)" };
  if (form === "gas") return { stroke: "#86efac", glow: "rgba(134,239,172,0.5)", chip: "rgba(134,239,172,0.5)" };
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
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

- [ ] **Step 2: Build + verify**

```bash
npm run build
```

In preview: edges glow cyan/sky/green by form; the inline label chip uses the new chrome.

- [ ] **Step 3: Commit**

```bash
git add src/graph/edges/FlowEdge.tsx
git commit -m "feat(edges): cyan-glow flow edges with accent-coloured chip labels"
```

---

### Task 11: Source-node redesigns (Miner / WaterExtractor / OilPump / ResourceWell)

**Files:**
- Modify: `src/graph/nodes/MinerNode.tsx`
- Modify: `src/graph/nodes/WaterExtractorNode.tsx`
- Modify: `src/graph/nodes/OilPumpNode.tsx`
- Modify: `src/graph/nodes/ResourceWellNode.tsx`

- [ ] **Step 1: Add a shared NodeCard helper**

Create `src/graph/nodes/NodeCard.tsx`:

```tsx
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
        <div className="num" style={{ fontSize: "0.92rem", fontWeight: 700, marginTop: "0.35rem" }}>
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
```

- [ ] **Step 2: Rewrite MinerNode**

Replace `src/graph/nodes/MinerNode.tsx` entirely with:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { gameData } from "@/data";
import { minerOutput } from "@/engine/sources";
import { NodeCard } from "./NodeCard";

export default function MinerNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "miner") return null;
  const rate = minerOutput(gameData, node.mk, node.purity, node.clockPct);
  const raw = gameData.minerOutputPerMin[node.mk][node.purity] * (node.clockPct / 100);
  const capped = rate < raw;
  const item = gameData.items[node.itemId];

  return (
    <NodeCard
      nodeId={id}
      accent="amber"
      type={`Miner ${node.mk.toUpperCase()}`}
      name={item?.displayName ?? node.itemId}
      meta={`${node.purity} · ${node.clockPct}% clock`}
      rate={
        <>
          {rate.toFixed(1)} /min
          {capped && (
            <span
              className="label-mono"
              title={`Raw rate ${raw.toFixed(1)}/min · capped at Mk6 belt (1200/min)`}
              style={{ marginLeft: "0.4rem", color: "var(--accent-amber-2)", fontSize: "0.55rem" }}
            >
              CAPPED
            </span>
          )}
        </>
      }
    >
      <Handle type="source" position={Position.Right} />
    </NodeCard>
  );
}
```

- [ ] **Step 3: Rewrite WaterExtractorNode**

Replace `src/graph/nodes/WaterExtractorNode.tsx` entirely with:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { gameData } from "@/data";
import { waterExtractorOutput } from "@/engine/sources";
import { NodeCard } from "./NodeCard";

export default function WaterExtractorNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "water-extractor") return null;
  const rate = waterExtractorOutput(gameData, node.clockPct);
  return (
    <NodeCard
      nodeId={id}
      accent="sky"
      type="Water Extractor"
      name="Water"
      meta={`${node.clockPct}% clock`}
      rate={`${rate.toFixed(1)} m³/min`}
    >
      <Handle type="source" position={Position.Right} />
    </NodeCard>
  );
}
```

- [ ] **Step 4: Rewrite OilPumpNode**

Replace `src/graph/nodes/OilPumpNode.tsx` entirely with:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { gameData } from "@/data";
import { oilPumpOutput } from "@/engine/sources";
import { NodeCard } from "./NodeCard";

export default function OilPumpNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "oil-pump") return null;
  const rate = oilPumpOutput(gameData, node.purity, node.clockPct);
  return (
    <NodeCard
      nodeId={id}
      accent="sky"
      type="Oil Extractor"
      name="Crude Oil"
      meta={`${node.purity} · ${node.clockPct}% clock`}
      rate={`${rate.toFixed(1)} m³/min`}
    >
      <Handle type="source" position={Position.Right} />
    </NodeCard>
  );
}
```

- [ ] **Step 5: Rewrite ResourceWellNode**

Replace `src/graph/nodes/ResourceWellNode.tsx` entirely with:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { gameData } from "@/data";
import { resourceWellSatelliteOutput } from "@/engine/sources";
import { NodeCard } from "./NodeCard";

export default function ResourceWellNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "resource-well") return null;
  let total = 0;
  try {
    for (const p of node.satellites) {
      total += resourceWellSatelliteOutput(gameData, node.itemId, p, node.clockPct);
    }
  } catch {
    total = 0;
  }
  const item = gameData.items[node.itemId];
  return (
    <NodeCard
      nodeId={id}
      accent="emerald"
      type="Resource Well"
      name={item?.displayName ?? node.itemId}
      meta={`${node.satellites.length} satellites · ${node.clockPct}% clock`}
      rate={`${total.toFixed(1)} /min`}
    >
      <Handle type="source" position={Position.Right} />
    </NodeCard>
  );
}
```

- [ ] **Step 6: Build + verify**

```bash
npm run build
```

In the preview, all four source-node types share the new shape, accent colour, and bottleneck-pulse behaviour when applicable.

- [ ] **Step 7: Commit**

```bash
git add src/graph/nodes/NodeCard.tsx src/graph/nodes/MinerNode.tsx src/graph/nodes/WaterExtractorNode.tsx src/graph/nodes/OilPumpNode.tsx src/graph/nodes/ResourceWellNode.tsx
git commit -m "feat(nodes): source nodes share NodeCard, neon look + bottleneck states"
```

---

### Task 12: Machine + Sink node redesigns

**Files:**
- Modify: `src/graph/nodes/MachineNode.tsx`
- Modify: `src/graph/nodes/AwesomeSinkNode.tsx`

- [ ] **Step 1: Rewrite MachineNode**

Replace `src/graph/nodes/MachineNode.tsx` entirely with:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";
import { gameData } from "@/data";
import { NodeCard } from "./NodeCard";

export default function MachineNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  const computed = useComputed().nodes[id];
  if (!node || node.kind !== "machine") return null;
  const recipe = gameData.recipes[node.recipeId];
  const building = recipe ? gameData.buildings[recipe.buildingId] : undefined;
  const machineCount = computed?.machineCount ?? 0;
  const firstOutput = recipe?.outputs[0];
  const rateValue =
    firstOutput && computed?.outputsPerMin[firstOutput.itemId] !== undefined
      ? `${computed.outputsPerMin[firstOutput.itemId]!.toFixed(1)} /min`
      : "—";

  return (
    <NodeCard
      nodeId={id}
      accent="green"
      type={building?.displayName ?? "Machine"}
      name={`${recipe?.displayName ?? "(no recipe)"}${recipe?.isAlternate ? " · ALT" : ""}`}
      meta={
        <>
          {machineCount.toFixed(2)} × (ceil {Math.ceil(machineCount)}) · {node.clockPct}% clock · Sloops {node.sloopsUsed}/{building?.somersloopSlots ?? 0}
          <br />
          {(computed?.totalPowerMW ?? 0).toFixed(1)} MW
        </>
      }
      rate={rateValue}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </NodeCard>
  );
}
```

- [ ] **Step 2: Rewrite AwesomeSinkNode**

Replace `src/graph/nodes/AwesomeSinkNode.tsx` entirely with:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";
import { NodeCard } from "./NodeCard";

export default function AwesomeSinkNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  const computed = useComputed().nodes[id];
  if (!node || node.kind !== "sink") return null;
  const pts = computed?.pointsPerMin ?? 0;
  const cost = computed?.nextCouponCost ?? 0;
  const minutesPerCoupon = pts > 0 ? cost / pts : Number.POSITIVE_INFINITY;

  return (
    <NodeCard
      nodeId={id}
      accent="magenta"
      type="AWESOME Sink"
      name={`${pts.toFixed(0)} pts/min`}
      meta={
        <>
          Next coupon: {cost.toLocaleString()} pts
          <br />
          ≈ {Number.isFinite(minutesPerCoupon) ? `${minutesPerCoupon.toFixed(1)} min` : "—"}
        </>
      }
    >
      <Handle type="target" position={Position.Left} />
    </NodeCard>
  );
}
```

- [ ] **Step 3: Build + verify**

```bash
npm run build
```

In preview, machine + sink nodes adopt the same NodeCard shape, with green / magenta accents.

- [ ] **Step 4: Commit**

```bash
git add src/graph/nodes/MachineNode.tsx src/graph/nodes/AwesomeSinkNode.tsx
git commit -m "feat(nodes): machine and AWESOME-sink redesigned via NodeCard"
```

---

### Task 13: Empty state on the canvas

**Files:**
- Create: `src/ui/EmptyState.tsx`
- Modify: `src/graph/Canvas.tsx`

- [ ] **Step 1: Write the empty state component**

Create `src/ui/EmptyState.tsx`:

```tsx
import { useGraphStore } from "@/graph/store";

export default function EmptyState() {
  const nodeCount = useGraphStore((s) => Object.keys(s.graph.nodes).length);
  if (nodeCount > 0) return null;
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
      style={{ color: "var(--text-faint)" }}
    >
      <div className="label-mono" style={{ fontSize: "0.7rem", marginBottom: "0.5rem" }}>
        Empty canvas
      </div>
      <div style={{ fontSize: "0.95rem", marginBottom: "0.4rem" }}>
        Drag a node from the left to start.
      </div>
      <div className="label-mono" style={{ fontSize: "0.65rem" }}>
        or press ⌘K
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount it inside the Canvas wrapper**

In `src/graph/Canvas.tsx`, find the `<ReactFlow ...>` block. Just *before* the `<ReactFlow>` opening tag, add:

```tsx
      <EmptyState />
```

And add the import near the top of the file:

```tsx
import EmptyState from "@/ui/EmptyState";
```

- [ ] **Step 3: Build + verify**

```bash
npm run build
```

With an empty graph, the canvas shows the centred "Empty canvas / Drag a node from the left to start. / or press ⌘K" message.

- [ ] **Step 4: Commit**

```bash
git add src/ui/EmptyState.tsx src/graph/Canvas.tsx
git commit -m "feat(ui): canvas empty-state hint with ⌘K shortcut"
```

---

## Phase C — Interactions

### Task 14: Keyboard shortcuts hook

**Files:**
- Create: `src/graph/useKeyboardShortcuts.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement the hook**

Create `src/graph/useKeyboardShortcuts.ts`:

```ts
import { useEffect } from "react";
import { useGraphStore } from "./store";

type Handlers = {
  onOpenPalette?: () => void;
  onOpenPlan?: () => void;
};

const isEditable = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
};

export function useKeyboardShortcuts({ onOpenPalette, onOpenPlan }: Handlers) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;

      const meta = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl-K → command palette
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette?.();
        return;
      }

      // Cmd/Ctrl-P → plan dialog
      if (meta && e.key.toLowerCase() === "p") {
        e.preventDefault();
        onOpenPlan?.();
        return;
      }

      // Delete or Backspace → remove selected node
      if (e.key === "Delete" || e.key === "Backspace") {
        const id = useGraphStore.getState().selectedNodeId;
        if (id) {
          e.preventDefault();
          useGraphStore.getState().removeNode(id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenPalette, onOpenPlan]);
}
```

- [ ] **Step 2: Wire it into App**

In `src/App.tsx`, add the import and call the hook (alongside the existing effects). The full App becomes:

```tsx
import { useEffect, useState } from "react";
import Canvas from "@/graph/Canvas";
import Palette from "@/ui/Palette";
import Inspector from "@/ui/Inspector";
import ProjectBar from "@/ui/ProjectBar";
import SummaryBar from "@/ui/SummaryBar";
import { useProjectStore } from "@/storage/projects";
import { useGraphStore } from "@/graph/store";
import { useKeyboardShortcuts } from "@/graph/useKeyboardShortcuts";

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  useEffect(() => {
    const ps = useProjectStore.getState();
    ps.init();
    const latest = Object.values(ps.projects).sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (latest) ps.switchTo(latest.id);
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const unsub = useGraphStore.subscribe((s, prev) => {
      if (s.graph === prev.graph) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => useProjectStore.getState().saveCurrent(), 300);
    });
    return () => {
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useKeyboardShortcuts({
    onOpenPalette: () => setPaletteOpen((v) => !v),
    onOpenPlan: () => setPlanOpen(true),
  });

  // Suppress unused-state warning until Task 15 introduces the palette UI.
  void paletteOpen;
  void planOpen;

  return (
    <main className="h-full w-full flex flex-col">
      <ProjectBar />
      <div className="flex flex-1 overflow-hidden">
        <Palette />
        <Canvas />
        <Inspector />
      </div>
      <SummaryBar />
    </main>
  );
}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: clean.

In preview, click on a node, press Delete; the node disappears. Press Cmd+K / Ctrl+K; nothing visible yet (palette comes in Task 15) but no errors.

- [ ] **Step 4: Commit**

```bash
git add src/graph/useKeyboardShortcuts.ts src/App.tsx
git commit -m "feat(ux): global keyboard shortcuts (Delete, Cmd/Ctrl-K, Cmd/Ctrl-P)"
```

---

### Task 15: Command palette (Cmd+K overlay)

**Files:**
- Create: `src/ui/CommandPalette.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement the palette component**

Create `src/ui/CommandPalette.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useGraphStore } from "@/graph/store";
import { useProjectStore } from "@/storage/projects";
import { exportCurrentProject } from "@/storage/importExport";
import { gameData } from "@/data";
import { planChainFor } from "@/engine/planner";

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  kbd?: string;
  run: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenPlan: () => void;
};

const NODE_DEFAULTS: Record<string, Parameters<ReturnType<typeof useGraphStore.getState>["addNode"]>[0]> = {
  miner: { kind: "miner", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 },
  "water-extractor": { kind: "water-extractor", clockPct: 100 },
  "oil-pump": { kind: "oil-pump", purity: "normal", clockPct: 100 },
  "resource-well": { kind: "resource-well", itemId: "nitrogen-gas", satellites: ["normal"], clockPct: 100 },
  machine: { kind: "machine", recipeId: Object.keys(gameData.recipes)[0]!, clockPct: 100, sloopsUsed: 0 },
  sink: { kind: "sink", couponsAlreadyPurchased: 0 },
};

export default function CommandPalette({ open, onClose, onOpenPlan }: Props) {
  const [q, setQ] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const commands: Cmd[] = useMemo(() => {
    const cmds: Cmd[] = [
      {
        id: "plan",
        label: "Plan a target item…",
        hint: "Open the auto-chain dialog",
        kbd: "⌘P",
        run: () => { onClose(); onOpenPlan(); },
      },
      {
        id: "new-project",
        label: "New project…",
        run: () => {
          const name = prompt("Project name?", "New Project");
          if (name) useProjectStore.getState().createProject(name);
          onClose();
        },
      },
      {
        id: "export",
        label: "Export current project",
        run: () => { exportCurrentProject(); onClose(); },
      },
      {
        id: "delete-selected",
        label: "Delete selected node",
        kbd: "Del",
        run: () => {
          const id = useGraphStore.getState().selectedNodeId;
          if (id) useGraphStore.getState().removeNode(id);
          onClose();
        },
      },
    ];
    for (const [kind, defaults] of Object.entries(NODE_DEFAULTS)) {
      cmds.push({
        id: `add-${kind}`,
        label: `Add: ${kind.replace(/-/g, " ")}`,
        hint: "Drops a default node onto the canvas",
        run: () => {
          useGraphStore.getState().addNode(defaults);
          onClose();
        },
      });
    }
    // Plan-for-item shortcuts: top-10 items matching the query, executed as
    // a one-step plan against the current graph.
    if (q.trim().length >= 2) {
      const items = Object.values(gameData.items)
        .filter((i) => i.displayName.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 12);
      for (const it of items) {
        cmds.push({
          id: `plan-${it.id}`,
          label: `Plan: ${it.displayName}`,
          hint: "Auto-build a chain that produces this item",
          run: () => {
            const s = useGraphStore.getState();
            const plan = planChainFor(gameData, s.graph, it.id);
            for (const n of plan.newNodes) s.addNodeRaw(n);
            for (const e of plan.newEdges) s.addEdgeRaw(e);
            onClose();
          },
        });
      }
    }
    return cmds;
  }, [q, onClose, onOpenPlan]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(needle) || (c.hint?.toLowerCase().includes(needle) ?? false),
    );
  }, [q, commands]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(filtered.length - 1, h + 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(0, h - 1)); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      filtered[highlight]?.run();
    }
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[18vh] z-50"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-[480px] rounded-lg overflow-hidden"
        style={{
          background: "rgba(8,4,18,0.95)",
          border: "1px solid var(--border)",
          boxShadow: "0 0 30px rgba(6,182,212,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a command or search items…"
          className="w-full"
          style={{
            background: "transparent",
            color: "var(--text)",
            padding: "0.7rem 0.9rem",
            outline: "none",
            border: "none",
            borderBottom: "1px solid var(--border)",
            fontSize: "0.9rem",
          }}
          value={q}
          onChange={(e) => { setQ(e.target.value); setHighlight(0); }}
          onKeyDown={onKey}
        />
        <div className="max-h-80 overflow-auto">
          {filtered.map((c, i) => (
            <div
              key={c.id}
              onClick={() => c.run()}
              className="flex items-center justify-between cursor-pointer text-sm"
              style={{
                padding: "0.5rem 0.9rem",
                background: i === highlight ? "rgba(6,182,212,0.08)" : "transparent",
                borderLeft: i === highlight ? "2px solid var(--accent-cyan-2)" : "2px solid transparent",
              }}
              onMouseEnter={() => setHighlight(i)}
            >
              <div>
                <div>{c.label}</div>
                {c.hint && (
                  <div className="label-mono" style={{ fontSize: "0.6rem", marginTop: "0.1rem" }}>
                    {c.hint}
                  </div>
                )}
              </div>
              {c.kbd && (
                <span
                  className="label-mono"
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "0.05rem 0.35rem",
                    borderRadius: "3px",
                    fontSize: "0.6rem",
                  }}
                >
                  {c.kbd}
                </span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm px-3 py-3" style={{ color: "var(--text-faint)" }}>
              No matches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount it in App and pipe through the open state**

In `src/App.tsx`, add the import and replace the `void paletteOpen; void planOpen;` stub plus the existing return. The full App now becomes:

```tsx
import { useEffect, useState } from "react";
import Canvas from "@/graph/Canvas";
import Palette from "@/ui/Palette";
import Inspector from "@/ui/Inspector";
import ProjectBar from "@/ui/ProjectBar";
import SummaryBar from "@/ui/SummaryBar";
import CommandPalette from "@/ui/CommandPalette";
import PlanDialog from "@/ui/PlanDialog";
import { useProjectStore } from "@/storage/projects";
import { useGraphStore } from "@/graph/store";
import { useKeyboardShortcuts } from "@/graph/useKeyboardShortcuts";

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  useEffect(() => {
    const ps = useProjectStore.getState();
    ps.init();
    const latest = Object.values(ps.projects).sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (latest) ps.switchTo(latest.id);
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const unsub = useGraphStore.subscribe((s, prev) => {
      if (s.graph === prev.graph) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => useProjectStore.getState().saveCurrent(), 300);
    });
    return () => {
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useKeyboardShortcuts({
    onOpenPalette: () => setPaletteOpen((v) => !v),
    onOpenPlan: () => setPlanOpen(true),
  });

  return (
    <main className="h-full w-full flex flex-col">
      <ProjectBar />
      <div className="flex flex-1 overflow-hidden">
        <Palette />
        <Canvas />
        <Inspector />
      </div>
      <SummaryBar />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenPlan={() => setPlanOpen(true)}
      />
      <PlanDialog open={planOpen} onClose={() => setPlanOpen(false)} />
    </main>
  );
}
```

(Note: the existing `PlanDialog` is *also* mounted from inside `ProjectBar`; the new top-level mount means pressing Cmd+P or selecting "Plan a target item…" from the palette also opens it. That's intentional — single state source, two triggers. The duplicate mount is harmless because each instance has its own `open` state.)

- [ ] **Step 3: Build + verify**

```bash
npm run build
```

In preview:
- Press Cmd/Ctrl-K — the palette appears.
- Type "iron" — see "Plan: Iron Ingot", "Plan: Iron Plate", etc.
- Press ↓ to move highlight, Enter to invoke; chain is added.
- Press Esc to close. Press Cmd-P to open the plan dialog directly.

- [ ] **Step 4: Commit**

```bash
git add src/ui/CommandPalette.tsx src/App.tsx
git commit -m "feat(ux): Cmd+K command palette with actions and plan-for-item search"
```

---

## Phase D — Verification

### Task 16: Smoke verification of planner-added clock editing

**Files:** none (manual check + a single new vitest)
- Create: `src/graph/inspector-clock-edit.test.tsx`

- [ ] **Step 1: Write a hook-level verification test**

The Inspector flow is hard to unit-test directly (it needs the whole React tree), so the canonical regression check is: confirm `updateNode` mutates `clockPct` on a planner-added node identically to a palette-added one.

Create `src/graph/inspector-clock-edit.test.tsx`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { sampleGameData } from "@/data/sample";
import { planChainFor } from "@/engine/planner";
import { useGraphStore } from "./store";

beforeEach(() => useGraphStore.getState().reset());

describe("editing clockPct after a node is added", () => {
  it("works identically for palette-added and planner-added nodes", () => {
    const s = useGraphStore.getState();

    // Palette-added miner.
    const minerId = s.addNode({ kind: "miner", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 });

    // Planner adds a smelter on top of it.
    const plan = planChainFor(sampleGameData, useGraphStore.getState().graph, "iron-ingot");
    for (const n of plan.newNodes) useGraphStore.getState().addNodeRaw(n);
    for (const e of plan.newEdges) useGraphStore.getState().addEdgeRaw(e);
    const smelter = plan.newNodes.find((n) => n.kind === "machine");
    expect(smelter).toBeDefined();

    // Update each.
    useGraphStore.getState().updateNode(minerId, { clockPct: 150 } as never);
    useGraphStore.getState().updateNode(smelter!.id, { clockPct: 50 } as never);

    const out = useGraphStore.getState().graph;
    expect((out.nodes[minerId] as { clockPct: number }).clockPct).toBe(150);
    expect((out.nodes[smelter!.id] as { clockPct: number }).clockPct).toBe(50);
  });
});
```

- [ ] **Step 2: Run all tests**

```bash
npm run test:run
```

Expected: all tests pass (existing + 3 new in planner + 3 new in bottleneck + 1 new here).

- [ ] **Step 3: Commit**

```bash
git add src/graph/inspector-clock-edit.test.tsx
git commit -m "test(graph): regression guard that planner-added nodes accept clock edits"
```

- [ ] **Step 4: Manual smoke**

Open the preview at `http://localhost:5173/SatisfactoryCalculatorGraph/`. Hard-refresh, then:

1. New project.
2. Drag a Miner. Set it Mk2 Pure 100%.
3. Cmd+P → search "screw" → Enter. The planner adds a chain; each new machine shows a clock < 100% on most steps because of the smart-default pass.
4. Click any planner-added machine. The Inspector shows the new design with stats grid. Change its clock — the rate updates live on the node card.
5. The miner shows the "Bottleneck" pulse if the chain isn't fully fed; the summary bar's "Hot" cell names it.

If anything misbehaves, file an issue against this branch before merging.

---

## Post-completion

After Task 16, the branch can be merged or shipped. The plan deliberately keeps `sample.ts`-based tests untouched and adds new tests alongside them, so the existing test surface remains the green baseline.

---

## Self-review notes (author)

- **Spec coverage:** every section of the design maps to at least one task.
  - §3 Visual language → Task 1 (theme.css).
  - §4.1 Top bar → Task 6. §4.2 Palette → Task 7. §4.3 Node cards → Tasks 11 + 12. §4.4 Edges → Task 10. §4.5 Inspector → Task 9. §4.6 Summary bar → Task 8. §4.7 Command palette → Task 15. §4.8 Empty state → Task 13. §4.9 Canvas → Task 5.
  - §5 Bottleneck heatmap → Tasks 2 (engine), 3 (hook), 11 + 12 (visual coupling via NodeCard's `useBottleneck`), 8 + 9 (summary + inspector readouts), 6 (top-bar pill).
  - §6 Smart-default clock → Task 4.
  - §7 File list matches the tasks.
  - §8 Testing → planner clock tests (Task 4), bottleneck tests (Task 2), inspector clock edit regression (Task 16), keyboard shortcuts hook covered implicitly by manual smoke (its behaviour is too coupled to global state to justify a dedicated test — flagged as a candidate for follow-up only if a regression surfaces).
- **Placeholder scan:** no TBD, TODO, "implement later", or vague "handle edge cases" lines. Every code step shows complete code.
- **Type consistency:** `BottleneckReport` shape (`bottleneckNodeId`, `bottleneckDelta`, `underSuppliedNodeIds`) is the same in Task 2 (engine), Task 3 (hook re-export), and Tasks 6 / 8 / 9 / 11 (consumers). The `NodeCard` prop names (`nodeId`, `accent`, `type`, `name`, `meta`, `rate`, `badge`, `children`) match between Task 11 (definition) and Tasks 11 / 12 (consumers).
