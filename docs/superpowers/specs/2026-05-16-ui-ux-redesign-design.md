# UI/UX Redesign — Design

**Date:** 2026-05-16
**Repo:** https://github.com/GibbosHomeProjects/SatisfactoryCalculatorGraph
**Branch:** continuing on `feat/implementation`
**Builds on:** [`2026-05-15-satisfactory-calculator-graph-design.md`](2026-05-15-satisfactory-calculator-graph-design.md)

## 1. Purpose

Replace the current placeholder Tailwind UI with a coherent **neon / cyber** design language and add three high-leverage UX features that make the app feel modern and considered without padding it with optional fluff:

- A keyboard-driven **command palette** (Cmd/Ctrl-K) and a small set of single-key shortcuts.
- A **bottleneck heatmap** that visually marks the single chain limiter and dims downstream nodes that are under-supplied — turning the graph from a passive display into a coach.
- **Smart-default clock speeds** on planner-added machines: each new machine starts at the clock that exactly consumes its upstream supply, so the chain is automatically waste-free and ratio-clean from the moment it's generated.

Functional behaviour from the original spec (forward chain building, persisted local projects, JSON export/import, real game data) stays untouched.

## 2. Scope

### In scope

- Aesthetic shell: dark base, cyan / magenta accents, monospace-tabular numerics, subtle glow effects, grid backdrop on the canvas.
- Redesigned custom nodes (Miner, Water Extractor, Oil Pump, Resource Well, Machine, AWESOME Sink) with consistent typography and a stats area.
- Redesigned panel chrome (top bar, palette, inspector, summary bar).
- **Bottleneck engine + heatmap overlay** — pure analysis function + visual treatment of nodes and the summary bar.
- **Command palette** (`Cmd/Ctrl-K`) — fuzzy search over a small set of actions and items.
- **Keyboard shortcuts** — `Delete` removes the selected node, `Cmd/Ctrl-P` opens the Plan… dialog, `Cmd/Ctrl-K` opens the palette, `/` focuses the palette search, `Esc` closes any modal.
- **Smart-default clock speeds** in the planner: new machines start at a clock that consumes their upstream supply with zero waste.
- Verification that adjusting clock on planner-added machines updates throughput live (it already routes through the same `updateNode` path, but the implementation plan must include an explicit smoke check).

### Out of scope (deliberately deferred)

- Undo / redo with action history (user declined; we record this as a candidate for a follow-up).
- Auto-arrange / dagre-layout button (user declined).
- Item icons / image assets (greeny data has no icon URLs; we'll keep colour-coded glyphs).
- Multi-select + bulk operations on nodes.
- Recipe search-in-place on the machine card (the Inspector's recipe dropdown is enough for now).
- Light theme — the redesign is dark-only.

## 3. Visual Language

A **neon / cyber** language, restrained enough not to fatigue across long sessions.

| Token | Value | Use |
| --- | --- | --- |
| `bg-base` | `radial-gradient(120% 70% at 0% 0%, #1a0b2e 0%, #0a0414 60%, #06030c 100%)` | App background |
| `bg-panel` | `rgba(0,0,0,0.25)` over `bg-base` | Top bar, palette, inspector, summary bar |
| `surface` | `rgba(8,4,18,0.85)` + `backdrop-filter: blur(8px)` | Node cards |
| `accent-cyan` | `#06b6d4` / `#67e8f9` text | Default flow + brand mark |
| `accent-magenta` | `#c026d3` / `#f0abfc` text | Bottleneck / warning |
| `accent-amber` | `#f59e0b` / `#fbbf24` text | Source nodes (miner / extractors) |
| `accent-green` | `#15803d` / `#86efac` text | Production machines |
| `text` | `#e7e3f5` | Body |
| `text-muted` | `#7c7397` | Labels |
| `border` | `#2b1748` | Panel separators |
| `font-display` | system sans | Brand / titles |
| `font-mono` | `ui-monospace, monospace` | Section labels, numerics, kbd hints |
| `glow-default` | `0 0 14px currentColor at 0.25 opacity` | Node cards |
| `glow-hot` | `0 0 22px rgba(232,121,249,0.45)` + 2.5s pulse | Bottleneck nodes |

Numerics use `font-variant-numeric: tabular-nums` everywhere so values line up. Section labels (e.g. "SOURCES", "PROCESS", "OUTPUT" in the palette) are tiny monospace with `letter-spacing: 0.12em`.

A `src/ui/theme.css` file owns the tokens as CSS custom properties so we never hard-code colours in component files.

## 4. Component Redesigns

### 4.1 Top bar

Left to right: brand mark (`FICSIT∥CALC` in cyan monospace with text-shadow glow), project picker, `New / Rename / Duplicate`, **Plan…** button (primary magenta), `Export / Import`, spacer, command-palette button (shows `⌘K`), `Delete` (red).

A small pill on the far right shows live hot-node count (`"2 hot nodes"` when the bottleneck engine flags any). Clicking the pill toggles the heatmap on/off.

### 4.2 Palette

Three labelled sections (`SOURCES`, `PROCESS`, `OUTPUT`) with subtle hover glow on each item. Each palette item has a 10×10 glyph dot in the type's accent colour (amber / cyan / green / magenta / sky) with a `box-shadow: 0 0 6px currentColor` glow.

### 4.3 Node cards

A single, consistent shape used by every node type:

```
┌─────────────────────────┐
│ TYPE LABEL (mono, tiny) │  ← e.g. "Miner Mk2", "Smelter"
│ Recipe / Item (display) │
│ key: val   ·   key: val │  ← clock, machine count, MW
│ rate /min               │  ← large mono numeric
│ [optional badge]        │  ← "ALT", "Bottleneck", "(capped)"
└─────────────────────────┘
```

- **Source nodes** (`Miner`, `Water Extractor`, `Oil Pump`, `Resource Well`): amber or sky-blue border, no input handle.
- **Machine nodes**: green border, both handles.
- **AWESOME Sink**: magenta border, input handle only. Shows points/min and minutes-to-next-coupon.

When a node is the chain bottleneck, the border colour overrides to magenta + the `glow-hot` 2.5-second pulse animation + a `Bottleneck` badge.

When a node is **under-supplied** (any incoming edge carries less than the node's per-machine demand × current machine count), the entire card uses `opacity: 0.55` and drops its glow. This is the "downstream dim" effect.

### 4.4 Edges (`FlowEdge.tsx`)

- Solid flows: cyan (`#06b6d4`) with `drop-shadow(0 0 6px #06b6d4)` SVG filter.
- Fluid flows: sky (`#38bdf8`).
- Gas flows: green (`#86efac`).
- Over-tier edges: red (`#ef4444`) with a thicker stroke and an inline `⚠` glyph.

Edge labels keep the same pattern as today (item name + rate + inline tier picker) but pick up the new chip styling: `rgba(8,4,18,0.9)` bg, accent-coloured border, monospace numerics.

### 4.5 Inspector

Two regions:

1. **Form fields** for the selected node, styled with the new control look (`rgba(0,0,0,0.4)` bg, monospace value text).
2. **Stats grid** beneath a dashed divider — 2×2 grid showing live compute results. For a miner: `Output`, `Power`, `Status` (Bottleneck or OK), and **one coaching suggestion** (`+1 Mk → +120/min` or `Pure node → +120/min`). The suggestion is deliberately small and unobtrusive — a single dim line, not a callout.

If no node is selected, the inspector shows a neutral empty state with a Cmd-K hint.

### 4.6 Summary bar

Same `key: value` chip pattern as before but using monospace labels and tabular numerics. The right side gets a `Hot:` cell that names the limiter and its delta (`"Miner Mk2 · −40 plate/min"`) when one exists, in magenta.

### 4.7 Command palette (`Cmd/Ctrl-K`)

A fixed-overlay dialog (centred, ~480 px wide), keyboard-driven only. Single text input + result list, fuzzy-filtered. Item categories:

- **Actions**: New project, Plan…, Export, Import, Toggle heatmap, Delete selection, etc.
- **Add a node**: every palette type as a quick-add (drops at viewport centre).
- **Pick an item to make**: shortcut to the Plan dialog pre-filled with the chosen item.

`↑/↓` to navigate, `Enter` to invoke, `Esc` to dismiss. The first action with a current keyboard shortcut shows it on the right of the row.

### 4.8 Empty state on the canvas

When the graph has zero nodes, the canvas centre shows a low-contrast message with two cyan-tinted shortcut hints:

> Drag a node from the left, or press `⌘K` to start.

## 5. Bottleneck Heatmap

A pure analysis function `bottleneck(data, graph, computed) → BottleneckReport` is added to `src/engine/bottleneck.ts`:

```ts
export type BottleneckReport = {
  bottleneckNodeId: string | null;
  bottleneckDelta?: { item: string; perMinShortfall: number };
  underSuppliedNodeIds: Set<string>;
};
```

### Definitions

- **Bottleneck node** = the single source-of-supply or production node whose output ratio limits the *target* of the chain most severely. We compute it by walking each sink / leaf machine, tracing the path back through edges, and picking the node along that path whose `availableSupply / demandedSupply` is smallest. If multiple nodes tie at the minimum, the deepest-upstream wins (matches user intuition — the *root* of the shortage).
- **Under-supplied node** = any production node where any required input has `supply < per_machine_demand × machine_count`.

Both are derived from `ComputeResult` so no engine changes are needed besides exposing per-edge supply (already done) and per-node per-input demand (a small addition).

### Visual coupling

- `MachineNode`, `MinerNode`, etc. each subscribe to the bottleneck report via a `useBottleneck()` hook (memoised; same store-driven recompute model as `useComputed`) and switch class to `node-bottleneck` or `node-under-supplied` accordingly.
- The summary bar's `Hot:` cell reads from the report.
- The top-bar pill (`"2 hot nodes"`) shows `1 + underSupplied.size` and toggles a global `heatmapEnabled` flag stored on the Zustand store (default `true`).

### Coaching suggestion

For the **bottleneck node only**, the Inspector's stats grid adds a single suggestion line:

- Miner: `+1 Mk → +X/min` (jumps to the next Mk level) or `Pure node → +Y/min` if currently Normal/Impure.
- Machine: `+50% clock → +X/min` (capped at 250%).
- Water/Oil/Well: `+50% clock → +X/min`.

These are tooltip-friendly text only — they don't apply changes automatically. The user always commits the change themselves.

## 6. Smart-Default Clock Speeds in the Planner

Today `planChainFor()` sets every new machine to `clockPct: 100`. The user changes this manually if needed. The new behaviour:

After the planner finishes adding nodes and edges, run a **second pass** that, for each newly-added machine, computes the supply it'll receive from its upstream producers and sets its `clockPct` so the per-machine demand of its most-constrained input equals the per-machine supply available.

**Algorithm (pseudocode):**

```
For each new machine M in dependency-order (upstream first):
  Build a temporary compute() result against the *partial* graph that includes
  M's upstream producers but not yet M's downstream consumers.
  For each input I of M's recipe:
    available = supply[I] for M from the partial result
    perMachineAt100 = recipeInputPerMinPerMachine(recipe, I, 100)
    machinesNeeded = available / perMachineAt100
  bestClock = min(250, ceil(machinesNeeded * 100 / round_up(machinesNeeded)))
  Set M.clockPct = bestClock
```

Concretely: if 60 ingot/min is available and the iron-plate recipe needs 30 ingot/machine at 100%, then `machinesNeeded = 2` → `bestClock = 100%`. If 45 ingot/min is available, `machinesNeeded = 1.5` → `ceil = 2` machines, clock = `100 × 1.5 / 2 = 75%` — the planner-set clock cleanly absorbs all 45 ingot/min with no overflow into a fractional 2.5th machine.

The default is capped at `100%` so the planner never silently overclocks; the user can crank a node above 100% by hand when they choose.

If a machine has zero supply (no upstream producer for one of its inputs), the planner leaves its clock at `100%` and the existing warning surfaces in the dialog. The user resolves it by adding the missing source and re-running Plan.

## 7. Files Touched / Added

```
src/
├── ui/
│   ├── theme.css                  NEW   CSS custom properties for tokens
│   ├── CommandPalette.tsx         NEW   ⌘K overlay
│   ├── Palette.tsx                EDIT  section labels, glyphs, hover glow
│   ├── ProjectBar.tsx             EDIT  brand mark, hot-pill, kbd hints
│   ├── Inspector.tsx              EDIT  control look, stats grid, suggestion
│   ├── SummaryBar.tsx             EDIT  Hot cell, monospace numerics
│   └── EmptyState.tsx             NEW   centred message + ⌘K hint
├── graph/
│   ├── Canvas.tsx                 EDIT  grid backdrop + bg flair
│   ├── nodes/
│   │   ├── MinerNode.tsx          EDIT  new look, hot/dim states
│   │   ├── MachineNode.tsx        EDIT  same
│   │   ├── WaterExtractorNode.tsx EDIT  same
│   │   ├── OilPumpNode.tsx        EDIT  same
│   │   ├── ResourceWellNode.tsx   EDIT  same
│   │   └── AwesomeSinkNode.tsx    EDIT  same
│   ├── edges/FlowEdge.tsx         EDIT  cyan glow stroke, accent chip
│   ├── useBottleneck.ts           NEW   memoised wrapper around bottleneck()
│   └── useKeyboardShortcuts.ts    NEW   single hook owning the global handlers
├── engine/
│   ├── bottleneck.ts              NEW   pure analysis fn
│   └── planner.ts                 EDIT  smart-default clock pass + tests
├── ui/keyboard.ts                 NEW   shortcut <-> action registry
├── App.tsx                        EDIT  mount CommandPalette + shortcuts
└── index.css                      EDIT  import theme.css
```

Estimated total new code: ~600 lines, mostly small files. The largest single new file is `CommandPalette.tsx` (~120 lines).

## 8. Testing

- **Bottleneck unit tests** (`src/engine/bottleneck.test.ts`): covers single-source single-chain, multiple sources splitting an item, under-supplied node detection, no-bottleneck (fully supplied) case.
- **Smart-default clock unit tests** (`src/engine/planner.test.ts`, new cases): cover integer-supply (clock = 100%), fractional-supply (clock < 100%), no-supply (clock = 100% and warning recorded).
- **Inspector smoke check** (added to the existing manual-verification ritual): plan a chain, click a planner-added machine, change clock in the inspector, confirm the rate label on the node updates.
- **Command palette** is covered indirectly by the shortcut hook test (`src/graph/useKeyboardShortcuts.test.tsx`): asserts that `Cmd+K` toggles the palette open state via a test-only store hook.

No new Playwright tests; the existing happy-path keeps working unchanged.

## 9. Risks / Open Questions

- **Bottleneck definition for graphs with no clear leaf** (e.g., a sink-less chain). We default to "the node whose ratio is smallest"; if multiple chains exist, we report the worst across all chains. Edge case but worth a visible explanation in the spec note.
- **Performance of the bottleneck recompute on every store change.** Memoised on the same `graph` reference as `useComputed`, so re-runs only on actual mutation. Trees up to a few hundred nodes should finish in <2 ms.
- **Smart-default clock and user override.** Once the planner sets a clock, the user can edit it; we never re-overwrite a manually-set value. The planner only assigns clocks on initial creation, never after.
- **Cmd+K conflicts with the browser's built-in URL bar focus on some platforms.** We capture `preventDefault()` when the canvas has focus; if the user is in the URL bar this hook never runs.
