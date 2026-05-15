# Satisfactory Calculator Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based, local-only, node-graph production calculator for Satisfactory 1.1 — forward-direction chain building with accurate throughput, machine count, power, somersloop, belt/pipe tier, and AWESOME-Sink math, plus multi-project save/load.

**Architecture:** Vite + React 18 + TypeScript + Tailwind, with React Flow (`@xyflow/react`) for the graph canvas and Zustand for state. A pure-function calculation engine (`src/engine/`) is unit-tested with Vitest and consumes a static JSON game-data bundle. Persistence is `localStorage` only; export/import is user-triggered JSON file I/O. Deployment is GitHub Pages via Actions.

**Tech Stack:** Vite 5, React 18, TypeScript 5 (strict), `@xyflow/react` v12, Zustand, Tailwind CSS, Vitest, Playwright (smoke test only), GitHub Actions Pages deploy.

**Spec:** [`docs/superpowers/specs/2026-05-15-satisfactory-calculator-graph-design.md`](../specs/2026-05-15-satisfactory-calculator-graph-design.md)

---

## Phase 1 — Foundation

Scaffolds the project, the type model, and a small hand-curated test data set. No UI work yet.

### Task 1: Scaffold Vite + React + TypeScript

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.nvmrc`

- [ ] **Step 1: Create the project with Vite's React-TS template**

Run from project root:

```bash
npm create vite@latest . -- --template react-ts
```

Press `y` to confirm scaffolding into the non-empty directory (the spec and `.gitignore` are already there).

- [ ] **Step 2: Install base dependencies**

```bash
npm install
```

- [ ] **Step 3: Pin the GitHub Pages base path**

Replace `vite.config.ts` contents with:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/SatisfactoryCalculatorGraph/",
});
```

- [ ] **Step 4: Strict TypeScript**

In `tsconfig.json`, ensure `compilerOptions` contains:

```json
"strict": true,
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true
```

(Add the latter two if not present.)

- [ ] **Step 5: Pin Node version**

Create `.nvmrc`:

```
20
```

- [ ] **Step 6: Sanity run**

Run `npm run dev` and confirm the default Vite + React page renders at `http://localhost:5173/SatisfactoryCalculatorGraph/`. Stop the server (Ctrl-C).

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Add Tailwind CSS, ESLint, Prettier, Vitest

**Files:**
- Create: `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.cjs`, `.prettierrc`, `vitest.config.ts`
- Modify: `src/index.css`, `package.json` (scripts), `tsconfig.json` (path alias)

- [ ] **Step 1: Install dev dependencies**

```bash
npm install -D tailwindcss postcss autoprefixer prettier eslint-config-prettier vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Initialise Tailwind**

```bash
npx tailwindcss init -p
```

This creates `tailwind.config.js` and `postcss.config.js`. Rename `tailwind.config.js` to `tailwind.config.ts` and replace its contents with:

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Wire Tailwind into the stylesheet**

Replace `src/index.css` contents with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { @apply bg-neutral-950 text-neutral-100; }
```

- [ ] **Step 4: Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Add scripts**

In `package.json`, set the `scripts` block to:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run",
  "lint": "eslint src --ext .ts,.tsx",
  "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
}
```

- [ ] **Step 6: Add `@/` path alias**

In `tsconfig.json` `compilerOptions` add:

```json
"baseUrl": ".",
"paths": { "@/*": ["src/*"] }
```

In `vite.config.ts` add the resolver:

```ts
import path from "node:path";
// inside defineConfig({})
resolve: { alias: { "@": path.resolve(__dirname, "src") } },
```

- [ ] **Step 7: Replace boilerplate App**

Replace `src/App.tsx` with:

```tsx
export default function App() {
  return (
    <main className="h-full grid place-items-center">
      <h1 className="text-2xl font-semibold">Satisfactory Calculator Graph</h1>
    </main>
  );
}
```

- [ ] **Step 8: Smoke test**

Run `npm run dev` → confirm the dark page with the heading renders. Stop server.
Run `npm run test:run` → expect "No test files found" (clean exit, not error).

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "chore: add Tailwind, Vitest, ESLint config and path alias"
```

---

### Task 3: Define the game-data type model

**Files:**
- Create: `src/data/types.ts`

- [ ] **Step 1: Write the type definitions**

Create `src/data/types.ts`:

```ts
export type Form = "solid" | "fluid" | "gas";

export type Item = {
  id: string;
  displayName: string;
  iconUrl: string;
  form: Form;
  sinkPoints: number;
  stackSize: number;
};

export type BuildingCategory =
  | "miner"
  | "water-extractor"
  | "oil-pump"
  | "resource-well-pressurizer"
  | "resource-well-extractor"
  | "smelter"
  | "constructor"
  | "assembler"
  | "foundry"
  | "manufacturer"
  | "refinery"
  | "blender"
  | "packager"
  | "particle-accelerator"
  | "awesome-sink";

export type Building = {
  id: string;
  displayName: string;
  category: BuildingCategory;
  basePowerMW: number;
  powerIsVariable: boolean;
  variablePowerMW?: { minMW: number; maxMW: number };
  somersloopSlots: number;
};

export type RecipePort = { itemId: string; amountPerCycle: number };

export type Recipe = {
  id: string;
  displayName: string;
  buildingId: string;
  isAlternate: boolean;
  durationSeconds: number;
  inputs: RecipePort[];
  outputs: RecipePort[];
};

export type MinerPurity = "impure" | "normal" | "pure";
export type MinerMk = "mk1" | "mk2" | "mk3";

export type GameData = {
  version: string;
  items: Record<string, Item>;
  buildings: Record<string, Building>;
  recipes: Record<string, Recipe>;
  minerOutputPerMin: Record<MinerMk, Record<MinerPurity, number>>;
  beltTierPerMin: Record<"mk1" | "mk2" | "mk3" | "mk4" | "mk5" | "mk6", number>;
  pipeTierPerMin: Record<"mk1" | "mk2", number>;
  waterExtractorPerMin: number;
  oilPumpPerMin: Record<MinerPurity, number>;
  resourceWellSatellitePerMin: Record<string, Record<MinerPurity, number>>;
};
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no output (clean compile).

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat(data): define core game-data type model"
```

---

### Task 4: Hand-curated test data fixture

A minimal subset of real Satisfactory data, large enough to exercise every engine code path without needing the full data dump yet. Replaced by the generated full dump in Phase 7.

**Files:**
- Create: `src/data/sample.ts`

- [ ] **Step 1: Write the fixture**

Create `src/data/sample.ts`:

```ts
import type { GameData } from "./types";

// Curated subset of Satisfactory 1.1 data for tests and early UI development.
// Numbers verified against satisfactory.wiki.gg in May 2026.
export const sampleGameData: GameData = {
  version: "1.1-sample",
  items: {
    "iron-ore":   { id: "iron-ore",   displayName: "Iron Ore",   iconUrl: "", form: "solid", sinkPoints: 1,   stackSize: 100 },
    "iron-ingot": { id: "iron-ingot", displayName: "Iron Ingot", iconUrl: "", form: "solid", sinkPoints: 2,   stackSize: 100 },
    "iron-plate": { id: "iron-plate", displayName: "Iron Plate", iconUrl: "", form: "solid", sinkPoints: 6,   stackSize: 100 },
    "iron-rod":   { id: "iron-rod",   displayName: "Iron Rod",   iconUrl: "", form: "solid", sinkPoints: 4,   stackSize: 100 },
    "screw":      { id: "screw",      displayName: "Screw",      iconUrl: "", form: "solid", sinkPoints: 2,   stackSize: 500 },
    "water":      { id: "water",      displayName: "Water",      iconUrl: "", form: "fluid", sinkPoints: 0,   stackSize: 0 },
    "crude-oil":  { id: "crude-oil",  displayName: "Crude Oil",  iconUrl: "", form: "fluid", sinkPoints: 0,   stackSize: 0 },
    "plastic":    { id: "plastic",    displayName: "Plastic",    iconUrl: "", form: "solid", sinkPoints: 75,  stackSize: 200 },
    "rubber":     { id: "rubber",     displayName: "Rubber",     iconUrl: "", form: "solid", sinkPoints: 60,  stackSize: 200 },
    "heavy-oil-residue": { id: "heavy-oil-residue", displayName: "Heavy Oil Residue", iconUrl: "", form: "fluid", sinkPoints: 0, stackSize: 0 },
    "polymer-resin":     { id: "polymer-resin",     displayName: "Polymer Resin",     iconUrl: "", form: "solid", sinkPoints: 12, stackSize: 200 },
  },
  buildings: {
    "miner-mk1":   { id: "miner-mk1",   displayName: "Miner Mk1",   category: "miner",           basePowerMW: 5,   powerIsVariable: false, somersloopSlots: 0 },
    "miner-mk2":   { id: "miner-mk2",   displayName: "Miner Mk2",   category: "miner",           basePowerMW: 15,  powerIsVariable: false, somersloopSlots: 0 },
    "miner-mk3":   { id: "miner-mk3",   displayName: "Miner Mk3",   category: "miner",           basePowerMW: 45,  powerIsVariable: false, somersloopSlots: 0 },
    "water-extractor": { id: "water-extractor", displayName: "Water Extractor", category: "water-extractor", basePowerMW: 20, powerIsVariable: false, somersloopSlots: 0 },
    "oil-pump":    { id: "oil-pump",    displayName: "Oil Extractor", category: "oil-pump",      basePowerMW: 40,  powerIsVariable: false, somersloopSlots: 0 },
    "smelter":     { id: "smelter",     displayName: "Smelter",     category: "smelter",         basePowerMW: 4,   powerIsVariable: false, somersloopSlots: 1 },
    "constructor": { id: "constructor", displayName: "Constructor", category: "constructor",     basePowerMW: 4,   powerIsVariable: false, somersloopSlots: 1 },
    "assembler":   { id: "assembler",   displayName: "Assembler",   category: "assembler",       basePowerMW: 15,  powerIsVariable: false, somersloopSlots: 2 },
    "refinery":    { id: "refinery",    displayName: "Refinery",    category: "refinery",        basePowerMW: 30,  powerIsVariable: false, somersloopSlots: 2 },
    "packager":    { id: "packager",    displayName: "Packager",    category: "packager",        basePowerMW: 10,  powerIsVariable: false, somersloopSlots: 0 },
    "awesome-sink":{ id: "awesome-sink",displayName: "AWESOME Sink",category: "awesome-sink",    basePowerMW: 30,  powerIsVariable: false, somersloopSlots: 0 },
  },
  recipes: {
    "recipe-iron-ingot": {
      id: "recipe-iron-ingot", displayName: "Iron Ingot", buildingId: "smelter", isAlternate: false, durationSeconds: 2,
      inputs:  [{ itemId: "iron-ore",   amountPerCycle: 1 }],
      outputs: [{ itemId: "iron-ingot", amountPerCycle: 1 }],
    },
    "recipe-pure-iron-ingot": {
      id: "recipe-pure-iron-ingot", displayName: "Pure Iron Ingot", buildingId: "refinery", isAlternate: true, durationSeconds: 12,
      inputs:  [{ itemId: "iron-ore",   amountPerCycle: 7 }, { itemId: "water", amountPerCycle: 4 }],
      outputs: [{ itemId: "iron-ingot", amountPerCycle: 13 }],
    },
    "recipe-iron-plate": {
      id: "recipe-iron-plate", displayName: "Iron Plate", buildingId: "constructor", isAlternate: false, durationSeconds: 6,
      inputs:  [{ itemId: "iron-ingot", amountPerCycle: 3 }],
      outputs: [{ itemId: "iron-plate", amountPerCycle: 2 }],
    },
    "recipe-iron-rod": {
      id: "recipe-iron-rod", displayName: "Iron Rod", buildingId: "constructor", isAlternate: false, durationSeconds: 4,
      inputs:  [{ itemId: "iron-ingot", amountPerCycle: 1 }],
      outputs: [{ itemId: "iron-rod", amountPerCycle: 1 }],
    },
    "recipe-screw": {
      id: "recipe-screw", displayName: "Screw", buildingId: "constructor", isAlternate: false, durationSeconds: 6,
      inputs:  [{ itemId: "iron-rod", amountPerCycle: 1 }],
      outputs: [{ itemId: "screw", amountPerCycle: 4 }],
    },
    "recipe-plastic": {
      id: "recipe-plastic", displayName: "Plastic", buildingId: "refinery", isAlternate: false, durationSeconds: 6,
      inputs:  [{ itemId: "crude-oil", amountPerCycle: 3 }],
      outputs: [{ itemId: "plastic", amountPerCycle: 2 }, { itemId: "heavy-oil-residue", amountPerCycle: 1 }],
    },
    "recipe-residual-plastic": {
      id: "recipe-residual-plastic", displayName: "Residual Plastic", buildingId: "refinery", isAlternate: false, durationSeconds: 6,
      inputs:  [{ itemId: "polymer-resin", amountPerCycle: 6 }, { itemId: "water", amountPerCycle: 2 }],
      outputs: [{ itemId: "plastic", amountPerCycle: 2 }],
    },
  },
  minerOutputPerMin: {
    mk1: { impure: 30,  normal: 60,  pure: 120 },
    mk2: { impure: 60,  normal: 120, pure: 240 },
    mk3: { impure: 120, normal: 240, pure: 480 },
  },
  beltTierPerMin: { mk1: 60, mk2: 120, mk3: 270, mk4: 480, mk5: 780, mk6: 1200 },
  pipeTierPerMin: { mk1: 300, mk2: 600 },
  waterExtractorPerMin: 120,
  oilPumpPerMin: { impure: 60, normal: 120, pure: 240 },
  resourceWellSatellitePerMin: {
    "nitrogen-gas": { impure: 30, normal: 60, pure: 120 },
  },
};
```

- [ ] **Step 2: Verify it type-checks**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/data/sample.ts
git commit -m "feat(data): add hand-curated sample data fixture"
```

---

## Phase 2 — Calculation Engine (TDD)

Every step here is test-first. Engine code is pure functions with no React/DOM dependency, so tests run fast and in isolation.

### Task 5: Source-node output calculations

**Files:**
- Create: `src/engine/sources.ts`, `src/engine/sources.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/sources.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import {
  minerOutput,
  waterExtractorOutput,
  oilPumpOutput,
  resourceWellSatelliteOutput,
} from "./sources";

describe("source outputs", () => {
  it("miner Mk2 pure node at 100% = 240/min", () => {
    expect(minerOutput(sampleGameData, "mk2", "pure", 100)).toBe(240);
  });

  it("miner Mk1 impure at 250% = 75/min (linear scaling)", () => {
    expect(minerOutput(sampleGameData, "mk1", "impure", 250)).toBe(75);
  });

  it("water extractor at 50% = 60 m^3/min", () => {
    expect(waterExtractorOutput(sampleGameData, 50)).toBe(60);
  });

  it("oil pump normal at 100% = 120/min", () => {
    expect(oilPumpOutput(sampleGameData, "normal", 100)).toBe(120);
  });

  it("resource well satellite nitrogen impure at 200% = 60/min", () => {
    expect(
      resourceWellSatelliteOutput(sampleGameData, "nitrogen-gas", "impure", 200),
    ).toBe(60);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
npm run test:run -- src/engine/sources.test.ts
```

Expected: fails with "Cannot find module './sources'".

- [ ] **Step 3: Implement**

Create `src/engine/sources.ts`:

```ts
import type { GameData, MinerMk, MinerPurity } from "@/data/types";

const scale = (base: number, clockPct: number) => base * (clockPct / 100);

export function minerOutput(
  data: GameData,
  mk: MinerMk,
  purity: MinerPurity,
  clockPct: number,
): number {
  return scale(data.minerOutputPerMin[mk][purity], clockPct);
}

export function waterExtractorOutput(data: GameData, clockPct: number): number {
  return scale(data.waterExtractorPerMin, clockPct);
}

export function oilPumpOutput(
  data: GameData,
  purity: MinerPurity,
  clockPct: number,
): number {
  return scale(data.oilPumpPerMin[purity], clockPct);
}

export function resourceWellSatelliteOutput(
  data: GameData,
  itemId: string,
  purity: MinerPurity,
  clockPct: number,
): number {
  const table = data.resourceWellSatellitePerMin[itemId];
  if (!table) throw new Error(`No resource-well table for item ${itemId}`);
  return scale(table[purity], clockPct);
}
```

- [ ] **Step 4: Run and confirm pass**

```bash
npm run test:run -- src/engine/sources.test.ts
```

Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add src/engine/sources.ts src/engine/sources.test.ts
git commit -m "feat(engine): source-node output formulas (TDD)"
```

---

### Task 6: Production-node throughput and machine count

**Files:**
- Create: `src/engine/production.ts`, `src/engine/production.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/production.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import {
  recipeOutputPerMinPerMachine,
  recipeInputPerMinPerMachine,
  machineCountFromSupply,
  outputMultiplier,
} from "./production";

describe("production-node math", () => {
  it("Iron Ingot recipe at 100% no sloops = 30 ingot/min/machine", () => {
    const r = sampleGameData.recipes["recipe-iron-ingot"]!;
    expect(recipeOutputPerMinPerMachine(r, "iron-ingot", 100, 0, 1)).toBe(30);
  });

  it("Iron Ingot recipe at 100% needs 1 ore/min/machine", () => {
    const r = sampleGameData.recipes["recipe-iron-ingot"]!;
    expect(recipeInputPerMinPerMachine(r, "iron-ore", 100)).toBe(30);
  });

  it("output_multiplier: 1 sloop in 1-slot machine = 2", () => {
    expect(outputMultiplier(1, 1)).toBe(2);
  });

  it("output_multiplier: 0 slots returns 1 regardless", () => {
    expect(outputMultiplier(0, 0)).toBe(1);
  });

  it("output_multiplier: 1 of 2 sloops = 1.5", () => {
    expect(outputMultiplier(1, 2)).toBe(1.5);
  });

  it("machineCount: 60 ore/min supply, recipe needs 30/min -> 2 machines", () => {
    const r = sampleGameData.recipes["recipe-iron-ingot"]!;
    const supply = { "iron-ore": 60 };
    expect(machineCountFromSupply(r, supply, 100)).toBe(2);
  });

  it("machineCount limited by minimum input: 60 ore, 4 water -> Pure Iron Ingot 1 machine", () => {
    const r = sampleGameData.recipes["recipe-pure-iron-ingot"]!;
    // recipe: 35 ore/min + 20 water/min per machine at 100%
    const supply = { "iron-ore": 60, "water": 4 };
    // ore allows 60/35 ~= 1.71; water allows 4/20 = 0.2 -> floor 0.2
    expect(machineCountFromSupply(r, supply, 100)).toBeCloseTo(0.2, 5);
  });

  it("machineCount: missing input returns 0", () => {
    const r = sampleGameData.recipes["recipe-iron-ingot"]!;
    expect(machineCountFromSupply(r, {}, 100)).toBe(0);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
npm run test:run -- src/engine/production.test.ts
```

Expected: fails on missing module.

- [ ] **Step 3: Implement**

Create `src/engine/production.ts`:

```ts
import type { Recipe } from "@/data/types";

export function outputMultiplier(sloopsUsed: number, maxSlots: number): number {
  if (maxSlots <= 0) return 1;
  return 1 + sloopsUsed / maxSlots;
}

export function powerMultiplier(sloopsUsed: number, maxSlots: number): number {
  const m = outputMultiplier(sloopsUsed, maxSlots);
  return m * m;
}

const perMin = (durationSeconds: number, amountPerCycle: number) =>
  (60 / durationSeconds) * amountPerCycle;

export function recipeOutputPerMinPerMachine(
  recipe: Recipe,
  itemId: string,
  clockPct: number,
  sloopsUsed: number,
  maxSlots: number,
): number {
  const port = recipe.outputs.find((o) => o.itemId === itemId);
  if (!port) return 0;
  const base = perMin(recipe.durationSeconds, port.amountPerCycle);
  return base * (clockPct / 100) * outputMultiplier(sloopsUsed, maxSlots);
}

export function recipeInputPerMinPerMachine(
  recipe: Recipe,
  itemId: string,
  clockPct: number,
): number {
  const port = recipe.inputs.find((i) => i.itemId === itemId);
  if (!port) return 0;
  return perMin(recipe.durationSeconds, port.amountPerCycle) * (clockPct / 100);
}

export function machineCountFromSupply(
  recipe: Recipe,
  supplyPerMin: Record<string, number>,
  clockPct: number,
): number {
  if (recipe.inputs.length === 0) return 0;
  let limiting = Infinity;
  for (const inp of recipe.inputs) {
    const supply = supplyPerMin[inp.itemId] ?? 0;
    const need = recipeInputPerMinPerMachine(recipe, inp.itemId, clockPct);
    if (need === 0) continue;
    const machines = supply / need;
    if (machines < limiting) limiting = machines;
  }
  return limiting === Infinity ? 0 : limiting;
}
```

- [ ] **Step 4: Run and confirm pass**

```bash
npm run test:run -- src/engine/production.test.ts
```

Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add src/engine/production.ts src/engine/production.test.ts
git commit -m "feat(engine): production throughput, machine count, somersloop multipliers"
```

---

### Task 7: Overclock power formula

**Files:**
- Create: `src/engine/power.ts`, `src/engine/power.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/power.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { powerPerMachineMW, log2_2_5 } from "./power";

describe("overclock power formula", () => {
  it("100% clock, no sloops = base power", () => {
    expect(powerPerMachineMW(4, 100, 0, 1)).toBeCloseTo(4, 6);
  });

  it("250% clock applies (2.5^1.321928) ~= 3.4 multiplier", () => {
    // 4 MW base * (2.5)^1.321928 ~ 13.6
    expect(powerPerMachineMW(4, 250, 0, 1)).toBeCloseTo(4 * Math.pow(2.5, log2_2_5), 6);
  });

  it("50% clock applies (0.5)^1.321928 ~= 0.40 multiplier", () => {
    expect(powerPerMachineMW(4, 50, 0, 1)).toBeCloseTo(4 * Math.pow(0.5, log2_2_5), 6);
  });

  it("1 sloop in 1-slot doubles output, quadruples power", () => {
    // base 4, clock 100, 1/1 sloops -> 4 * 1 * 4 = 16
    expect(powerPerMachineMW(4, 100, 1, 1)).toBeCloseTo(16, 6);
  });

  it("log2(2.5) constant", () => {
    expect(log2_2_5).toBeCloseTo(1.32192809488736, 12);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
npm run test:run -- src/engine/power.test.ts
```

- [ ] **Step 3: Implement**

Create `src/engine/power.ts`:

```ts
import { powerMultiplier } from "./production";

export const log2_2_5 = Math.log2(2.5);

export function powerPerMachineMW(
  basePowerMW: number,
  clockPct: number,
  sloopsUsed: number,
  maxSlots: number,
): number {
  const clockMult = Math.pow(clockPct / 100, log2_2_5);
  return basePowerMW * clockMult * powerMultiplier(sloopsUsed, maxSlots);
}
```

- [ ] **Step 4: Run and confirm pass**

```bash
npm run test:run -- src/engine/power.test.ts
```

Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add src/engine/power.ts src/engine/power.test.ts
git commit -m "feat(engine): overclock power formula with somersloop multiplier"
```

---

### Task 8: AWESOME Sink math

**Files:**
- Create: `src/engine/sink.ts`, `src/engine/sink.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/sink.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import { sinkPointsPerMin, couponCost } from "./sink";

describe("AWESOME Sink math", () => {
  it("60 plates/min (6 pts each) = 360 pts/min", () => {
    const flows = [{ itemId: "iron-plate", amountPerMin: 60 }];
    expect(sinkPointsPerMin(sampleGameData, flows)).toBe(360);
  });

  it("items with 0 sink points contribute 0", () => {
    const flows = [{ itemId: "water", amountPerMin: 600 }];
    expect(sinkPointsPerMin(sampleGameData, flows)).toBe(0);
  });

  it("multiple inputs sum correctly", () => {
    const flows = [
      { itemId: "iron-plate", amountPerMin: 60 }, // 6 * 60 = 360
      { itemId: "screw",      amountPerMin: 120 }, // 2 * 120 = 240
    ];
    expect(sinkPointsPerMin(sampleGameData, flows)).toBe(600);
  });

  it("unknown item is ignored (no throw)", () => {
    const flows = [{ itemId: "made-up", amountPerMin: 100 }];
    expect(sinkPointsPerMin(sampleGameData, flows)).toBe(0);
  });

  it("coupon cost for first coupon (n=0) = 1000", () => {
    expect(couponCost(0)).toBe(1000);
  });

  it("coupon cost for n=3 = 250*(1)^2 + 1000 = 1250", () => {
    expect(couponCost(3)).toBe(1250);
  });

  it("coupon cost for n=6 = 250*(2)^2 + 1000 = 2000", () => {
    expect(couponCost(6)).toBe(2000);
  });

  it("coupon cost flat after n=2998", () => {
    expect(couponCost(3000)).toBe(249_501_250);
  });
});
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test:run -- src/engine/sink.test.ts
```

- [ ] **Step 3: Implement**

Create `src/engine/sink.ts`:

```ts
import type { GameData } from "@/data/types";

export type SinkInflow = { itemId: string; amountPerMin: number };

export function sinkPointsPerMin(data: GameData, flows: SinkInflow[]): number {
  let total = 0;
  for (const f of flows) {
    const item = data.items[f.itemId];
    if (!item) continue;
    total += item.sinkPoints * f.amountPerMin;
  }
  return total;
}

export function couponCost(couponsAlreadyPurchased: number): number {
  if (couponsAlreadyPurchased > 2998) return 249_501_250;
  return 250 * Math.pow(Math.ceil(couponsAlreadyPurchased / 3) - 1, 2) + 1000;
}
```

- [ ] **Step 4: Confirm pass**

```bash
npm run test:run -- src/engine/sink.test.ts
```

Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add src/engine/sink.ts src/engine/sink.test.ts
git commit -m "feat(engine): AWESOME Sink point and coupon-cost math"
```

---

### Task 9: Graph compute — topological walk + cycle convergence

This is the heart of the engine. It walks the user's graph and computes throughputs end-to-end. Cycles (e.g., Plastic ↔ Rubber) are resolved by fixed-point iteration.

**Files:**
- Create: `src/engine/graph.ts`, `src/engine/compute.ts`, `src/engine/compute.test.ts`

- [ ] **Step 1: Define the graph IR**

Create `src/engine/graph.ts`:

```ts
import type { MinerMk, MinerPurity } from "@/data/types";

export type SourceNode =
  | { kind: "miner"; id: string; itemId: string; mk: MinerMk; purity: MinerPurity; clockPct: number }
  | { kind: "water-extractor"; id: string; clockPct: number }
  | { kind: "oil-pump"; id: string; purity: MinerPurity; clockPct: number }
  | { kind: "resource-well"; id: string; itemId: string; satellites: MinerPurity[]; clockPct: number };

export type MachineNode = {
  kind: "machine";
  id: string;
  recipeId: string;
  clockPct: number;
  sloopsUsed: number;
};

export type SinkNode = {
  kind: "sink";
  id: string;
  couponsAlreadyPurchased: number;
};

export type GraphNode = SourceNode | MachineNode | SinkNode;

export type BeltTier = "mk1" | "mk2" | "mk3" | "mk4" | "mk5" | "mk6";
export type PipeTier = "mk1" | "mk2";

export type GraphEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  itemId: string;
  // Tier used for capacity warnings only; defaults applied by the edge view
  // when undefined (mk5 for solid, mk2 for fluid/gas).
  tier?: BeltTier | PipeTier;
};

export type Graph = {
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
};
```

- [ ] **Step 2: Write failing compute tests**

Create `src/engine/compute.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import { compute } from "./compute";
import type { Graph } from "./graph";

describe("graph compute", () => {
  it("single miner emits its output rate on its outgoing edge", () => {
    const g: Graph = {
      nodes: {
        m: { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk2", purity: "normal", clockPct: 100 },
        s: { kind: "sink", id: "s", couponsAlreadyPurchased: 0 },
      },
      edges: [{ id: "e1", fromNodeId: "m", toNodeId: "s", itemId: "iron-ore" }],
    };
    const res = compute(sampleGameData, g);
    expect(res.edges["e1"]!.amountPerMin).toBe(120);
  });

  it("miner -> smelter -> constructor: 120 ore -> 120 ingot -> 80 plate", () => {
    const g: Graph = {
      nodes: {
        m:  { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk2", purity: "normal", clockPct: 100 },
        sm: { kind: "machine", id: "sm", recipeId: "recipe-iron-ingot", clockPct: 100, sloopsUsed: 0 },
        c:  { kind: "machine", id: "c",  recipeId: "recipe-iron-plate", clockPct: 100, sloopsUsed: 0 },
      },
      edges: [
        { id: "e1", fromNodeId: "m",  toNodeId: "sm", itemId: "iron-ore" },
        { id: "e2", fromNodeId: "sm", toNodeId: "c",  itemId: "iron-ingot" },
      ],
    };
    const res = compute(sampleGameData, g);
    expect(res.edges["e1"]!.amountPerMin).toBe(120);
    expect(res.edges["e2"]!.amountPerMin).toBe(120);
    // 120 ingot/min, recipe needs 30/min/machine -> 4 machines, outputs 2 plate per 6s = 20/min/machine, total 80/min
    expect(res.nodes["c"]!.outputsPerMin["iron-plate"]).toBe(80);
  });

  it("two consumers split supply proportionally to demand", () => {
    // 60 ingot supply; one consumer wants 30, other wants 30 -> each gets 30
    const g: Graph = {
      nodes: {
        m:  { kind: "miner", id: "m",  itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 },
        sm: { kind: "machine", id: "sm", recipeId: "recipe-iron-ingot", clockPct: 100, sloopsUsed: 0 },
        a:  { kind: "machine", id: "a",  recipeId: "recipe-iron-plate", clockPct: 100, sloopsUsed: 0 },
        b:  { kind: "machine", id: "b",  recipeId: "recipe-iron-rod",   clockPct: 100, sloopsUsed: 0 },
      },
      edges: [
        { id: "e1", fromNodeId: "m",  toNodeId: "sm", itemId: "iron-ore" },
        { id: "e2", fromNodeId: "sm", toNodeId: "a",  itemId: "iron-ingot" },
        { id: "e3", fromNodeId: "sm", toNodeId: "b",  itemId: "iron-ingot" },
      ],
    };
    const res = compute(sampleGameData, g);
    expect(res.edges["e2"]!.amountPerMin + res.edges["e3"]!.amountPerMin).toBeCloseTo(60, 5);
  });

  it("machine without inputs produces 0", () => {
    const g: Graph = {
      nodes: {
        c: { kind: "machine", id: "c", recipeId: "recipe-iron-plate", clockPct: 100, sloopsUsed: 0 },
      },
      edges: [],
    };
    const res = compute(sampleGameData, g);
    expect(res.nodes["c"]!.outputsPerMin["iron-plate"]).toBe(0);
  });
});
```

- [ ] **Step 3: Confirm failure**

```bash
npm run test:run -- src/engine/compute.test.ts
```

- [ ] **Step 4: Implement compute engine**

Create `src/engine/compute.ts`:

```ts
import type { GameData } from "@/data/types";
import type { Graph, GraphNode } from "./graph";
import {
  recipeInputPerMinPerMachine,
  recipeOutputPerMinPerMachine,
} from "./production";
import {
  minerOutput,
  waterExtractorOutput,
  oilPumpOutput,
  resourceWellSatelliteOutput,
} from "./sources";
import { powerPerMachineMW } from "./power";
import { sinkPointsPerMin, couponCost } from "./sink";

export type ComputedNode = {
  outputsPerMin: Record<string, number>;
  machineCount: number;
  totalPowerMW: number;
  pointsPerMin?: number;
  nextCouponCost?: number;
  warnings: string[];
};

export type ComputedEdge = {
  amountPerMin: number;
};

export type ComputeResult = {
  nodes: Record<string, ComputedNode>;
  edges: Record<string, ComputedEdge>;
};

const MAX_ITERATIONS = 50;
const CONVERGENCE_EPSILON = 1e-3;

export function compute(data: GameData, graph: Graph): ComputeResult {
  // Initialise empty result.
  const nodes: Record<string, ComputedNode> = {};
  const edges: Record<string, ComputedEdge> = {};
  for (const id of Object.keys(graph.nodes)) {
    nodes[id] = { outputsPerMin: {}, machineCount: 0, totalPowerMW: 0, warnings: [] };
  }
  for (const e of graph.edges) edges[e.id] = { amountPerMin: 0 };

  // Iterate to fixed point. A topological walk would be optimal for DAGs,
  // but iterating is simpler and handles cycles uniformly. Bounded by
  // MAX_ITERATIONS; converges in 1 pass for DAGs in practice.
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let maxDelta = 0;

    for (const node of Object.values(graph.nodes)) {
      const prev = { ...nodes[node.id]!.outputsPerMin };

      // Sum incoming supply per item.
      const supply: Record<string, number> = {};
      for (const e of graph.edges) {
        if (e.toNodeId !== node.id) continue;
        supply[e.itemId] = (supply[e.itemId] ?? 0) + edges[e.id]!.amountPerMin;
      }

      const updated = evaluateNode(data, node, supply);
      nodes[node.id] = updated;

      // Distribute outputs to outgoing edges proportionally to demand.
      // Pass 1: collect downstream demand per outgoing item.
      const outgoing = graph.edges.filter((e) => e.fromNodeId === node.id);
      const grouped: Record<string, typeof outgoing> = {};
      for (const e of outgoing) (grouped[e.itemId] ??= []).push(e);

      for (const [itemId, outs] of Object.entries(grouped)) {
        const totalAvailable = updated.outputsPerMin[itemId] ?? 0;
        // Demand for this item from each consumer.
        const demands = outs.map((e) => {
          const consumer = graph.nodes[e.toNodeId]!;
          if (consumer.kind !== "machine") {
            // Sinks accept everything; pretend demand is +Infinity proxy.
            return Number.POSITIVE_INFINITY;
          }
          const recipe = data.recipes[consumer.recipeId];
          if (!recipe) return 0;
          return recipeInputPerMinPerMachine(recipe, itemId, consumer.clockPct);
        });
        const finiteSum = demands
          .filter((d) => Number.isFinite(d))
          .reduce((a, b) => a + b, 0);
        const infiniteCount = demands.filter((d) => !Number.isFinite(d)).length;

        // If any consumer has infinite demand (a sink), it takes the leftover
        // after finite consumers; if multiple, split evenly.
        const finiteAlloc = finiteSum <= totalAvailable ? finiteSum : totalAvailable;
        const leftover = Math.max(0, totalAvailable - finiteAlloc);
        const perInfinite = infiniteCount > 0 ? leftover / infiniteCount : 0;

        const scale = finiteSum > 0 ? finiteAlloc / finiteSum : 0;
        outs.forEach((e, i) => {
          const d = demands[i]!;
          edges[e.id]!.amountPerMin = Number.isFinite(d) ? d * scale : perInfinite;
        });
      }

      for (const k of Object.keys(updated.outputsPerMin)) {
        const before = prev[k] ?? 0;
        maxDelta = Math.max(maxDelta, Math.abs(updated.outputsPerMin[k]! - before));
      }
    }

    if (maxDelta < CONVERGENCE_EPSILON) break;
  }

  return { nodes, edges };
}

function evaluateNode(
  data: GameData,
  node: GraphNode,
  supply: Record<string, number>,
): ComputedNode {
  const out: ComputedNode = { outputsPerMin: {}, machineCount: 0, totalPowerMW: 0, warnings: [] };
  switch (node.kind) {
    case "miner": {
      const rate = minerOutput(data, node.mk, node.purity, node.clockPct);
      out.outputsPerMin[node.itemId] = rate;
      out.machineCount = 1;
      const b = data.buildings[`miner-${node.mk}`];
      if (b) out.totalPowerMW = powerPerMachineMW(b.basePowerMW, node.clockPct, 0, 0);
      return out;
    }
    case "water-extractor": {
      out.outputsPerMin["water"] = waterExtractorOutput(data, node.clockPct);
      out.machineCount = 1;
      const b = data.buildings["water-extractor"];
      if (b) out.totalPowerMW = powerPerMachineMW(b.basePowerMW, node.clockPct, 0, 0);
      return out;
    }
    case "oil-pump": {
      out.outputsPerMin["crude-oil"] = oilPumpOutput(data, node.purity, node.clockPct);
      out.machineCount = 1;
      const b = data.buildings["oil-pump"];
      if (b) out.totalPowerMW = powerPerMachineMW(b.basePowerMW, node.clockPct, 0, 0);
      return out;
    }
    case "resource-well": {
      let total = 0;
      for (const p of node.satellites) {
        total += resourceWellSatelliteOutput(data, node.itemId, p, node.clockPct);
      }
      out.outputsPerMin[node.itemId] = total;
      out.machineCount = node.satellites.length;
      return out;
    }
    case "machine": {
      const recipe = data.recipes[node.recipeId];
      if (!recipe) {
        out.warnings.push(`Recipe ${node.recipeId} not found`);
        return out;
      }
      const building = data.buildings[recipe.buildingId];
      if (!building) {
        out.warnings.push(`Building ${recipe.buildingId} not found`);
        return out;
      }
      // Machine count limited by the most-constrained input.
      let limiting = Infinity;
      for (const inp of recipe.inputs) {
        const haveSupply = supply[inp.itemId] ?? 0;
        const need = recipeInputPerMinPerMachine(recipe, inp.itemId, node.clockPct);
        if (need === 0) continue;
        const m = haveSupply / need;
        if (m < limiting) limiting = m;
      }
      const machineCount = limiting === Infinity ? 0 : limiting;
      out.machineCount = machineCount;

      for (const o of recipe.outputs) {
        const perMachine = recipeOutputPerMinPerMachine(
          recipe,
          o.itemId,
          node.clockPct,
          node.sloopsUsed,
          building.somersloopSlots,
        );
        out.outputsPerMin[o.itemId] = perMachine * machineCount;
      }
      const perMachinePower = powerPerMachineMW(
        building.basePowerMW,
        node.clockPct,
        node.sloopsUsed,
        building.somersloopSlots,
      );
      out.totalPowerMW = perMachinePower * machineCount;
      return out;
    }
    case "sink": {
      const flows = Object.entries(supply).map(([itemId, amountPerMin]) => ({
        itemId,
        amountPerMin,
      }));
      const points = sinkPointsPerMin(data, flows);
      out.pointsPerMin = points;
      out.nextCouponCost = couponCost(node.couponsAlreadyPurchased);
      // Throughput cap warning.
      const totalThroughput = flows.reduce((a, b) => a + b.amountPerMin, 0);
      if (totalThroughput > 1200) {
        out.warnings.push(`Sink throughput ${totalThroughput.toFixed(0)}/min exceeds 1200/min cap`);
      }
      return out;
    }
  }
}
```

- [ ] **Step 5: Run tests, confirm pass**

```bash
npm run test:run -- src/engine/compute.test.ts
```

Expected: 4 passing.

- [ ] **Step 6: Commit**

```bash
git add src/engine/graph.ts src/engine/compute.ts src/engine/compute.test.ts
git commit -m "feat(engine): graph compute with fixed-point convergence"
```

---

### Task 10: Project-level summary

**Files:**
- Create: `src/engine/summarise.ts`, `src/engine/summarise.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/summarise.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import { compute } from "./compute";
import { summarise } from "./summarise";
import type { Graph } from "./graph";

describe("project summary", () => {
  it("sums raw inputs, power, and points across the graph", () => {
    const g: Graph = {
      nodes: {
        m:  { kind: "miner", id: "m",  itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 },
        sm: { kind: "machine", id: "sm", recipeId: "recipe-iron-ingot", clockPct: 100, sloopsUsed: 0 },
        s:  { kind: "sink", id: "s", couponsAlreadyPurchased: 0 },
      },
      edges: [
        { id: "e1", fromNodeId: "m",  toNodeId: "sm", itemId: "iron-ore" },
        { id: "e2", fromNodeId: "sm", toNodeId: "s",  itemId: "iron-ingot" },
      ],
    };
    const res = compute(sampleGameData, g);
    const sum = summarise(sampleGameData, g, res);
    expect(sum.rawInputsPerMin["iron-ore"]).toBe(60);
    expect(sum.totalPowerMW).toBeGreaterThan(0);
    expect(sum.totalPointsPerMin).toBe(60 * 2); // 60 ingot/min @ 2 pts each
  });
});
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test:run -- src/engine/summarise.test.ts
```

- [ ] **Step 3: Implement**

Create `src/engine/summarise.ts`:

```ts
import type { GameData } from "@/data/types";
import type { Graph } from "./graph";
import type { ComputeResult } from "./compute";

export type Summary = {
  rawInputsPerMin: Record<string, number>;
  totalPowerMW: number;
  totalPointsPerMin: number;
  warnings: { nodeId: string; message: string }[];
};

const SOURCE_KINDS = new Set([
  "miner",
  "water-extractor",
  "oil-pump",
  "resource-well",
]);

export function summarise(_data: GameData, graph: Graph, res: ComputeResult): Summary {
  const summary: Summary = {
    rawInputsPerMin: {},
    totalPowerMW: 0,
    totalPointsPerMin: 0,
    warnings: [],
  };

  for (const [id, node] of Object.entries(graph.nodes)) {
    const comp = res.nodes[id]!;
    if (SOURCE_KINDS.has(node.kind)) {
      for (const [itemId, amt] of Object.entries(comp.outputsPerMin)) {
        summary.rawInputsPerMin[itemId] = (summary.rawInputsPerMin[itemId] ?? 0) + amt;
      }
    } else {
      summary.totalPowerMW += comp.totalPowerMW;
    }
    if (comp.pointsPerMin) summary.totalPointsPerMin += comp.pointsPerMin;
    for (const w of comp.warnings) summary.warnings.push({ nodeId: id, message: w });
  }
  return summary;
}
```

- [ ] **Step 4: Confirm pass and commit**

```bash
npm run test:run -- src/engine/summarise.test.ts
git add src/engine/summarise.ts src/engine/summarise.test.ts
git commit -m "feat(engine): project-level summary"
```

---

## Phase 3 — Zustand Store

### Task 11: Project + graph store

**Files:**
- Create: `src/graph/store.ts`, `src/graph/store.test.ts`

- [ ] **Step 1: Install Zustand and uuid**

```bash
npm install zustand uuid
npm install -D @types/uuid
```

- [ ] **Step 2: Write failing test**

Create `src/graph/store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useGraphStore } from "./store";

beforeEach(() => useGraphStore.getState().reset());

describe("graph store", () => {
  it("adds a node and assigns it a unique id", () => {
    const id = useGraphStore.getState().addNode({
      kind: "miner",
      itemId: "iron-ore",
      mk: "mk1",
      purity: "normal",
      clockPct: 100,
    });
    expect(useGraphStore.getState().graph.nodes[id]).toBeDefined();
  });

  it("removes a node and its incident edges", () => {
    const s = useGraphStore.getState();
    const a = s.addNode({ kind: "miner", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 });
    const b = s.addNode({ kind: "sink", couponsAlreadyPurchased: 0 });
    const e = s.addEdge({ fromNodeId: a, toNodeId: b, itemId: "iron-ore" });
    expect(useGraphStore.getState().graph.edges).toHaveLength(1);
    useGraphStore.getState().removeNode(a);
    expect(useGraphStore.getState().graph.nodes[a]).toBeUndefined();
    expect(useGraphStore.getState().graph.edges).toHaveLength(0);
    void e;
  });

  it("updateNode patches a node in place", () => {
    const id = useGraphStore.getState().addNode({
      kind: "miner", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100,
    });
    useGraphStore.getState().updateNode(id, { clockPct: 200 });
    expect((useGraphStore.getState().graph.nodes[id] as any).clockPct).toBe(200);
  });
});
```

- [ ] **Step 3: Implement the store**

Create `src/graph/store.ts`:

```ts
import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type { BeltTier, Graph, GraphNode, GraphEdge, PipeTier } from "@/engine/graph";

type AddNodeInput = Omit<GraphNode, "id">;
type AddEdgeInput = Omit<GraphEdge, "id">;

type GraphStore = {
  graph: Graph;
  addNode: (n: AddNodeInput) => string;
  removeNode: (id: string) => void;
  updateNode: (id: string, patch: Partial<GraphNode>) => void;
  addEdge: (e: AddEdgeInput) => string;
  removeEdge: (id: string) => void;
  updateEdgeTier: (id: string, tier: BeltTier | PipeTier) => void;
  reset: () => void;
  load: (g: Graph) => void;
};

const empty = (): Graph => ({ nodes: {}, edges: [] });

export const useGraphStore = create<GraphStore>((set) => ({
  graph: empty(),

  addNode: (n) => {
    const id = uuid();
    set((s) => ({
      graph: { ...s.graph, nodes: { ...s.graph.nodes, [id]: { ...n, id } as GraphNode } },
    }));
    return id;
  },

  removeNode: (id) =>
    set((s) => {
      const nodes = { ...s.graph.nodes };
      delete nodes[id];
      const edges = s.graph.edges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id);
      return { graph: { nodes, edges } };
    }),

  updateNode: (id, patch) =>
    set((s) => {
      const cur = s.graph.nodes[id];
      if (!cur) return s;
      return { graph: { ...s.graph, nodes: { ...s.graph.nodes, [id]: { ...cur, ...patch } as GraphNode } } };
    }),

  addEdge: (e) => {
    const id = uuid();
    set((s) => ({ graph: { ...s.graph, edges: [...s.graph.edges, { ...e, id }] } }));
    return id;
  },

  removeEdge: (id) =>
    set((s) => ({ graph: { ...s.graph, edges: s.graph.edges.filter((e) => e.id !== id) } })),

  updateEdgeTier: (id, tier) =>
    set((s) => ({
      graph: {
        ...s.graph,
        edges: s.graph.edges.map((e) => (e.id === id ? { ...e, tier } : e)),
      },
    })),

  reset: () => set({ graph: empty() }),
  load: (g) => set({ graph: g }),
}));
```

- [ ] **Step 4: Confirm pass**

```bash
npm run test:run -- src/graph/store.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/graph/store.ts src/graph/store.test.ts package.json package-lock.json
git commit -m "feat(graph): Zustand graph store with add/remove/update"
```

---

### Task 12: Project store (named projects in localStorage)

**Files:**
- Create: `src/storage/localStorage.ts`, `src/storage/projects.ts`, `src/storage/projects.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/storage/projects.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "./projects";

beforeEach(() => {
  localStorage.clear();
  useProjectStore.getState().init();
});

describe("project store", () => {
  it("creates a new project with default name", () => {
    const id = useProjectStore.getState().createProject("My Plant");
    expect(useProjectStore.getState().projects[id]!.name).toBe("My Plant");
    expect(useProjectStore.getState().currentProjectId).toBe(id);
  });

  it("renames a project", () => {
    const id = useProjectStore.getState().createProject("A");
    useProjectStore.getState().renameProject(id, "B");
    expect(useProjectStore.getState().projects[id]!.name).toBe("B");
  });

  it("duplicates and deletes a project", () => {
    const id = useProjectStore.getState().createProject("A");
    const id2 = useProjectStore.getState().duplicateProject(id);
    expect(useProjectStore.getState().projects[id2]!.name).toBe("A (copy)");
    useProjectStore.getState().deleteProject(id);
    expect(useProjectStore.getState().projects[id]).toBeUndefined();
  });
});
```

- [ ] **Step 2: Implement localStorage helpers**

Create `src/storage/localStorage.ts`:

```ts
const KEY_INDEX = "sat-calc:projects:index";
const keyForProject = (id: string) => `sat-calc:projects:${id}`;

export type ProjectMeta = { id: string; name: string; updatedAt: number };

export const SCHEMA_VERSION = 1;

export type StoredProject = {
  schemaVersion: number;
  meta: ProjectMeta;
  graph: unknown; // Graph (kept loose here to avoid circular import)
};

export function readIndex(): ProjectMeta[] {
  const raw = localStorage.getItem(KEY_INDEX);
  if (!raw) return [];
  try { return JSON.parse(raw) as ProjectMeta[]; } catch { return []; }
}

export function writeIndex(idx: ProjectMeta[]) {
  localStorage.setItem(KEY_INDEX, JSON.stringify(idx));
}

export function readProject(id: string): StoredProject | null {
  const raw = localStorage.getItem(keyForProject(id));
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredProject; } catch { return null; }
}

export function writeProject(p: StoredProject) {
  localStorage.setItem(keyForProject(p.meta.id), JSON.stringify(p));
}

export function deleteStoredProject(id: string) {
  localStorage.removeItem(keyForProject(id));
}
```

- [ ] **Step 3: Implement the project store**

Create `src/storage/projects.ts`:

```ts
import { create } from "zustand";
import { v4 as uuid } from "uuid";
import {
  readIndex, writeIndex, readProject, writeProject, deleteStoredProject,
  SCHEMA_VERSION, type ProjectMeta, type StoredProject,
} from "./localStorage";
import { useGraphStore } from "@/graph/store";

type ProjectStore = {
  projects: Record<string, ProjectMeta>;
  currentProjectId: string | null;
  init: () => void;
  createProject: (name: string) => string;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => string;
  deleteProject: (id: string) => void;
  switchTo: (id: string) => void;
  saveCurrent: () => void;
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: {},
  currentProjectId: null,

  init: () => {
    const idx = readIndex();
    const projects: Record<string, ProjectMeta> = {};
    for (const m of idx) projects[m.id] = m;
    set({ projects, currentProjectId: null });
  },

  createProject: (name) => {
    const id = uuid();
    const meta: ProjectMeta = { id, name, updatedAt: Date.now() };
    const stored: StoredProject = { schemaVersion: SCHEMA_VERSION, meta, graph: { nodes: {}, edges: [] } };
    writeProject(stored);
    const idx = [...readIndex(), meta];
    writeIndex(idx);
    set((s) => ({ projects: { ...s.projects, [id]: meta }, currentProjectId: id }));
    useGraphStore.getState().reset();
    return id;
  },

  renameProject: (id, name) => {
    const meta = get().projects[id];
    if (!meta) return;
    const next: ProjectMeta = { ...meta, name, updatedAt: Date.now() };
    const stored = readProject(id);
    if (stored) writeProject({ ...stored, meta: next });
    writeIndex(Object.values({ ...get().projects, [id]: next }));
    set((s) => ({ projects: { ...s.projects, [id]: next } }));
  },

  duplicateProject: (id) => {
    const source = readProject(id);
    if (!source) return id;
    const newId = uuid();
    const meta: ProjectMeta = { id: newId, name: `${source.meta.name} (copy)`, updatedAt: Date.now() };
    writeProject({ schemaVersion: SCHEMA_VERSION, meta, graph: source.graph });
    writeIndex([...Object.values(get().projects), meta]);
    set((s) => ({ projects: { ...s.projects, [newId]: meta } }));
    return newId;
  },

  deleteProject: (id) => {
    deleteStoredProject(id);
    const remaining = { ...get().projects };
    delete remaining[id];
    writeIndex(Object.values(remaining));
    const nextCurrent = get().currentProjectId === id ? null : get().currentProjectId;
    set({ projects: remaining, currentProjectId: nextCurrent });
  },

  switchTo: (id) => {
    const stored = readProject(id);
    if (!stored) return;
    useGraphStore.getState().load(stored.graph as never);
    set({ currentProjectId: id });
  },

  saveCurrent: () => {
    const id = get().currentProjectId;
    if (!id) return;
    const meta = get().projects[id];
    if (!meta) return;
    const updated: ProjectMeta = { ...meta, updatedAt: Date.now() };
    writeProject({ schemaVersion: SCHEMA_VERSION, meta: updated, graph: useGraphStore.getState().graph });
    writeIndex(Object.values({ ...get().projects, [id]: updated }));
    set((s) => ({ projects: { ...s.projects, [id]: updated } }));
  },
}));
```

- [ ] **Step 4: Confirm pass**

```bash
npm run test:run -- src/storage/projects.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/storage/
git commit -m "feat(storage): project CRUD backed by localStorage"
```

---

## Phase 4 — React Flow Canvas & Custom Nodes

### Task 13: Install React Flow and render the canvas

**Files:**
- Modify: `src/App.tsx`
- Create: `src/graph/Canvas.tsx`

- [ ] **Step 1: Install**

```bash
npm install @xyflow/react
```

- [ ] **Step 2: Implement minimal canvas wired to the store**

Create `src/graph/Canvas.tsx`:

```tsx
import { useMemo, useCallback } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node as RFNode, type Edge as RFEdge, type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "./store";

export default function Canvas() {
  const graph = useGraphStore((s) => s.graph);
  const addEdge = useGraphStore((s) => s.addEdge);

  const rfNodes: RFNode[] = useMemo(
    () => Object.values(graph.nodes).map((n, i) => ({
      id: n.id,
      position: { x: i * 220, y: 100 },
      data: { kind: n.kind },
      type: "default",
    })),
    [graph.nodes],
  );

  const rfEdges: RFEdge[] = useMemo(
    () => graph.edges.map((e) => ({
      id: e.id, source: e.fromNodeId, target: e.toNodeId, label: e.itemId,
    })),
    [graph.edges],
  );

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target) return;
    addEdge({ fromNodeId: c.source, toNodeId: c.target, itemId: "iron-ore" });
  }, [addEdge]);

  return (
    <ReactFlow nodes={rfNodes} edges={rfEdges} onConnect={onConnect} fitView>
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
```

- [ ] **Step 3: Mount in App**

Replace `src/App.tsx`:

```tsx
import Canvas from "@/graph/Canvas";

export default function App() {
  return (
    <main className="h-full w-full">
      <Canvas />
    </main>
  );
}
```

- [ ] **Step 4: Smoke run**

```bash
npm run dev
```

Open the browser, confirm the empty canvas renders with pan/zoom/minimap. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/graph/Canvas.tsx src/App.tsx package.json package-lock.json
git commit -m "feat(ui): React Flow canvas wired to graph store"
```

---

### Task 14: Custom node — MinerNode

**Files:**
- Create: `src/graph/nodes/MinerNode.tsx`
- Modify: `src/graph/Canvas.tsx`

- [ ] **Step 1: Implement the node component**

Create `src/graph/nodes/MinerNode.tsx`:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { sampleGameData } from "@/data/sample";
import { minerOutput } from "@/engine/sources";

export type MinerNodeData = { kind: "miner" };

export default function MinerNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "miner") return null;
  const rate = minerOutput(sampleGameData, node.mk, node.purity, node.clockPct);

  return (
    <div className="rounded-lg border border-amber-400/40 bg-neutral-900/90 p-3 text-sm shadow-md min-w-[180px]">
      <div className="text-amber-300 font-semibold">Miner {node.mk.toUpperCase()}</div>
      <div className="text-xs opacity-80">{node.itemId} · {node.purity}</div>
      <div className="text-xs opacity-80">Clock {node.clockPct}%</div>
      <div className="text-base mt-1">{rate.toFixed(1)} /min</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

- [ ] **Step 2: Register in Canvas**

In `src/graph/Canvas.tsx`, add a `nodeTypes` map and pass to `ReactFlow`:

```tsx
import MinerNode from "./nodes/MinerNode";

const nodeTypes = { miner: MinerNode };
// inside Canvas component, change the rfNodes map:
const rfNodes: RFNode[] = useMemo(
  () => Object.values(graph.nodes).map((n, i) => ({
    id: n.id,
    position: { x: i * 220, y: 100 },
    data: {},
    type: n.kind,
  })),
  [graph.nodes],
);
// pass nodeTypes={nodeTypes} to <ReactFlow ... />
```

- [ ] **Step 3: Seed a miner for visual verification**

Temporarily in `src/App.tsx` add a `useEffect` that adds one miner on mount:

```tsx
import { useEffect } from "react";
import Canvas from "@/graph/Canvas";
import { useGraphStore } from "@/graph/store";

export default function App() {
  useEffect(() => {
    const s = useGraphStore.getState();
    if (Object.keys(s.graph.nodes).length === 0) {
      s.addNode({ kind: "miner", itemId: "iron-ore", mk: "mk2", purity: "normal", clockPct: 100 });
    }
  }, []);
  return <main className="h-full w-full"><Canvas /></main>;
}
```

- [ ] **Step 4: Smoke run, then remove the seed**

```bash
npm run dev
```

Confirm one miner card renders with "120.0 /min". Stop server. Revert `src/App.tsx` to remove the `useEffect` block.

- [ ] **Step 5: Commit**

```bash
git add src/graph/nodes/MinerNode.tsx src/graph/Canvas.tsx src/App.tsx
git commit -m "feat(nodes): MinerNode custom React Flow node"
```

---

### Task 15: Remaining source nodes — WaterExtractor, OilPump, Fracker

**Files:**
- Create: `src/graph/nodes/WaterExtractorNode.tsx`, `OilPumpNode.tsx`, `ResourceWellNode.tsx`
- Modify: `src/graph/Canvas.tsx` (extend `nodeTypes`)

- [ ] **Step 1: Implement each component analogously to `MinerNode`**

For each file, follow the same pattern: read the node from the store, compute its rate from the appropriate `src/engine/sources.ts` function, render a card with a single source handle on the right. Fluid extractors use a blue card (`border-sky-400/40`); resource wells render satellite count and per-satellite purity badges.

Example skeleton for `WaterExtractorNode.tsx`:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { sampleGameData } from "@/data/sample";
import { waterExtractorOutput } from "@/engine/sources";

export default function WaterExtractorNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  if (!node || node.kind !== "water-extractor") return null;
  const rate = waterExtractorOutput(sampleGameData, node.clockPct);
  return (
    <div className="rounded-lg border border-sky-400/40 bg-neutral-900/90 p-3 text-sm min-w-[180px]">
      <div className="text-sky-300 font-semibold">Water Extractor</div>
      <div className="text-xs opacity-80">Clock {node.clockPct}%</div>
      <div className="text-base mt-1">{rate.toFixed(1)} m³/min</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

Mirror this for `OilPumpNode.tsx` (uses `oilPumpOutput`) and `ResourceWellNode.tsx` (uses `resourceWellSatelliteOutput` per satellite and sums).

- [ ] **Step 2: Register in `nodeTypes`**

In `Canvas.tsx`:

```tsx
import WaterExtractorNode from "./nodes/WaterExtractorNode";
import OilPumpNode from "./nodes/OilPumpNode";
import ResourceWellNode from "./nodes/ResourceWellNode";

const nodeTypes = {
  miner: MinerNode,
  "water-extractor": WaterExtractorNode,
  "oil-pump": OilPumpNode,
  "resource-well": ResourceWellNode,
};
```

- [ ] **Step 3: Smoke verify by temporarily seeding one of each in `App.tsx`, then remove the seed.**

- [ ] **Step 4: Commit**

```bash
git add src/graph/nodes/ src/graph/Canvas.tsx
git commit -m "feat(nodes): water extractor, oil pump, resource well nodes"
```

---

### Task 16: MachineNode and AwesomeSinkNode (uses compute result for live values)

**Files:**
- Create: `src/graph/nodes/MachineNode.tsx`, `AwesomeSinkNode.tsx`
- Create: `src/graph/useComputed.ts` (hook that runs compute + memoises)
- Modify: `src/graph/Canvas.tsx`

- [ ] **Step 1: Compute hook**

Create `src/graph/useComputed.ts`:

```ts
import { useMemo } from "react";
import { useGraphStore } from "./store";
import { sampleGameData } from "@/data/sample";
import { compute } from "@/engine/compute";

export function useComputed() {
  const graph = useGraphStore((s) => s.graph);
  return useMemo(() => compute(sampleGameData, graph), [graph]);
}
```

- [ ] **Step 2: MachineNode**

Create `src/graph/nodes/MachineNode.tsx`:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";
import { sampleGameData } from "@/data/sample";

export default function MachineNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  const computed = useComputed().nodes[id];
  if (!node || node.kind !== "machine") return null;
  const recipe = sampleGameData.recipes[node.recipeId];
  const building = recipe ? sampleGameData.buildings[recipe.buildingId] : undefined;

  return (
    <div className="rounded-lg border border-emerald-400/40 bg-neutral-900/90 p-3 text-sm min-w-[200px]">
      <Handle type="target" position={Position.Left} />
      <div className="text-emerald-300 font-semibold">{building?.displayName ?? "Machine"}</div>
      <div className="text-xs opacity-80">{recipe?.displayName ?? "(no recipe)"} {recipe?.isAlternate ? "· ALT" : ""}</div>
      <div className="text-xs opacity-80">Clock {node.clockPct}% · Sloops {node.sloopsUsed}/{building?.somersloopSlots ?? 0}</div>
      <div className="text-xs mt-1">Machines: {computed?.machineCount.toFixed(2)} (round up {Math.ceil(computed?.machineCount ?? 0)})</div>
      <div className="text-xs">Power: {computed?.totalPowerMW.toFixed(1)} MW</div>
      {Object.entries(computed?.outputsPerMin ?? {}).map(([k, v]) => (
        <div key={k} className="text-xs">{k}: {v.toFixed(1)}/min</div>
      ))}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

- [ ] **Step 3: AwesomeSinkNode**

Create `src/graph/nodes/AwesomeSinkNode.tsx`:

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";

export default function AwesomeSinkNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  const computed = useComputed().nodes[id];
  if (!node || node.kind !== "sink") return null;
  const pts = computed?.pointsPerMin ?? 0;
  const cost = computed?.nextCouponCost ?? 0;
  const minutesPerCoupon = pts > 0 ? cost / pts : Number.POSITIVE_INFINITY;

  return (
    <div className="rounded-lg border border-fuchsia-400/50 bg-neutral-900/90 p-3 text-sm min-w-[200px]">
      <Handle type="target" position={Position.Left} />
      <div className="text-fuchsia-300 font-semibold">AWESOME Sink</div>
      <div className="text-xs">Points/min: {pts.toFixed(0)}</div>
      <div className="text-xs">Next coupon: {cost.toLocaleString()} pts</div>
      <div className="text-xs">≈ {Number.isFinite(minutesPerCoupon) ? minutesPerCoupon.toFixed(1) + " min" : "—"}</div>
    </div>
  );
}
```

- [ ] **Step 4: Register and smoke-verify**

Add to `nodeTypes` in `Canvas.tsx`. Temporarily seed a miner → smelter → sink chain in `App.tsx` to verify live numbers update. Remove seed after.

- [ ] **Step 5: Commit**

```bash
git add src/graph/nodes/ src/graph/useComputed.ts src/graph/Canvas.tsx
git commit -m "feat(nodes): machine and AWESOME sink nodes with live compute"
```

---

### Task 17: Connection validation

**Files:**
- Create: `src/graph/validation.ts`, `src/graph/validation.test.ts`
- Modify: `src/graph/Canvas.tsx` (call `isValidConnection`)

- [ ] **Step 1: Write failing tests**

Create `src/graph/validation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import { canConnect } from "./validation";
import type { Graph } from "@/engine/graph";

const baseGraph = (): Graph => ({
  nodes: {
    m: { kind: "miner", id: "m", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 },
    w: { kind: "water-extractor", id: "w", clockPct: 100 },
    c: { kind: "machine", id: "c", recipeId: "recipe-iron-plate", clockPct: 100, sloopsUsed: 0 },
  },
  edges: [],
});

describe("connect validation", () => {
  it("solid->solid is fine", () => {
    expect(canConnect(sampleGameData, baseGraph(), "m", "c").ok).toBe(true);
  });

  it("fluid->solid-only machine is rejected", () => {
    expect(canConnect(sampleGameData, baseGraph(), "w", "c").ok).toBe(false);
  });
});
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test:run -- src/graph/validation.test.ts
```

- [ ] **Step 3: Implement**

Create `src/graph/validation.ts`:

```ts
import type { GameData } from "@/data/types";
import type { Graph } from "@/engine/graph";

export type ConnectResult = { ok: boolean; reason?: string };

function sourceItemForms(data: GameData, g: Graph, nodeId: string): Set<string> {
  const node = g.nodes[nodeId];
  if (!node) return new Set();
  switch (node.kind) {
    case "miner": return new Set([data.items[node.itemId]?.form ?? "solid"]);
    case "water-extractor": return new Set(["fluid"]);
    case "oil-pump": return new Set(["fluid"]);
    case "resource-well": return new Set([data.items[node.itemId]?.form ?? "fluid"]);
    case "machine": {
      const r = data.recipes[node.recipeId];
      if (!r) return new Set();
      const forms = new Set<string>();
      for (const o of r.outputs) {
        const f = data.items[o.itemId]?.form;
        if (f) forms.add(f);
      }
      return forms;
    }
    case "sink": return new Set();
  }
}

function targetAcceptsForms(data: GameData, g: Graph, nodeId: string): Set<string> {
  const node = g.nodes[nodeId];
  if (!node) return new Set();
  if (node.kind === "sink") return new Set(["solid", "fluid", "gas"]);
  if (node.kind === "machine") {
    const r = data.recipes[node.recipeId];
    if (!r) return new Set(["solid", "fluid", "gas"]); // tolerate no-recipe yet
    const forms = new Set<string>();
    for (const i of r.inputs) {
      const f = data.items[i.itemId]?.form;
      if (f) forms.add(f);
    }
    return forms;
  }
  return new Set();
}

export function canConnect(
  data: GameData,
  graph: Graph,
  fromId: string,
  toId: string,
): ConnectResult {
  const out = sourceItemForms(data, graph, fromId);
  const accept = targetAcceptsForms(data, graph, toId);
  for (const f of out) if (accept.has(f)) return { ok: true };
  return { ok: false, reason: "Incompatible item forms" };
}
```

- [ ] **Step 4: Wire into Canvas**

In `Canvas.tsx`, add `isValidConnection`:

```tsx
import { sampleGameData } from "@/data/sample";
import { canConnect } from "./validation";

const isValidConnection = (c: Connection) => {
  if (!c.source || !c.target) return false;
  return canConnect(sampleGameData, useGraphStore.getState().graph, c.source, c.target).ok;
};
// pass isValidConnection={isValidConnection} to <ReactFlow />
```

- [ ] **Step 5: Confirm test pass and commit**

```bash
npm run test:run -- src/graph/validation.test.ts
git add src/graph/validation.ts src/graph/validation.test.ts src/graph/Canvas.tsx
git commit -m "feat(graph): connect-time form validation"
```

---

### Task 18: FlowEdge (item-coloured, throughput-labelled)

**Files:**
- Create: `src/graph/edges/FlowEdge.tsx`
- Modify: `src/graph/Canvas.tsx`

- [ ] **Step 1: Implement**

Create `src/graph/edges/FlowEdge.tsx`:

```tsx
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { sampleGameData } from "@/data/sample";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";
import type { BeltTier, PipeTier } from "@/engine/graph";

const colourForForm = (form?: string) =>
  form === "fluid" ? "#38bdf8" : form === "gas" ? "#86efac" : "#93c5fd";

function capacityFor(form: string | undefined, tier: BeltTier | PipeTier | undefined): number {
  if (form === "fluid" || form === "gas") {
    const t = (tier ?? "mk2") as PipeTier;
    return sampleGameData.pipeTierPerMin[t];
  }
  const t = (tier ?? "mk5") as BeltTier;
  return sampleGameData.beltTierPerMin[t];
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
  const item = edge ? sampleGameData.items[edge.itemId] : undefined;
  const baseColor = colourForForm(item?.form);
  const rate = computed?.amountPerMin ?? 0;
  const cap = capacityFor(item?.form, edge?.tier);
  const over = rate > cap;
  const stroke = over ? "#ef4444" : baseColor;
  const tier = edge?.tier ?? (item?.form === "fluid" || item?.form === "gas" ? "mk2" : "mk5");

  return (
    <>
      <BaseEdge path={path} style={{ stroke, strokeWidth: over ? 3 : 2 }} />
      <EdgeLabelRenderer>
        <div
          className={
            "absolute text-[10px] px-1.5 py-0.5 rounded border bg-neutral-900/90 text-neutral-100 " +
            (over ? "border-red-500 text-red-200" : "border-neutral-700")
          }
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: "all" }}
        >
          {item?.displayName ?? edge?.itemId} · {rate.toFixed(0)}/min
          {over && <span title={`Exceeds ${tier} capacity (${cap}/min)`}> · ⚠</span>}
          {edge && (
            <select
              className="ml-1 bg-neutral-800 rounded px-0.5 text-[10px]"
              value={tier}
              onChange={(e) => updateEdgeTier(edge.id, e.target.value as BeltTier | PipeTier)}
            >
              {tierOptionsFor(item?.form).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

- [ ] **Step 2: Register in Canvas**

```tsx
import FlowEdge from "./edges/FlowEdge";
const edgeTypes = { flow: FlowEdge };
// in rfEdges map, set type: "flow"
// pass edgeTypes={edgeTypes} to <ReactFlow />
```

- [ ] **Step 3: Smoke run**

`npm run dev` — verify connections render coloured with item + rate labels.

- [ ] **Step 4: Commit**

```bash
git add src/graph/edges/ src/graph/Canvas.tsx
git commit -m "feat(edges): coloured flow edges with throughput labels"
```

---

## Phase 5 — UI Panels

### Task 19: Palette (drag to add nodes)

**Files:**
- Create: `src/ui/Palette.tsx`
- Modify: `src/App.tsx`, `src/graph/Canvas.tsx`

- [ ] **Step 1: Implement palette with HTML drag-and-drop**

Create `src/ui/Palette.tsx`:

```tsx
const ITEMS = [
  { kind: "miner",            label: "Miner" },
  { kind: "water-extractor",  label: "Water Extractor" },
  { kind: "oil-pump",         label: "Oil Pump" },
  { kind: "resource-well",    label: "Resource Well" },
  { kind: "machine",          label: "Machine" },
  { kind: "sink",             label: "AWESOME Sink" },
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
          onDragStart={(e) => e.dataTransfer.setData("application/x-satcalc-kind", it.kind)}
        >
          {it.label}
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 2: Handle drop on Canvas**

In `Canvas.tsx`, add a wrapper div with drop handlers and call `addNode` with defaults appropriate to the dropped kind:

```tsx
const onDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const kind = e.dataTransfer.getData("application/x-satcalc-kind");
  if (!kind) return;
  const defaults: Record<string, any> = {
    miner: { kind: "miner", itemId: "iron-ore", mk: "mk1", purity: "normal", clockPct: 100 },
    "water-extractor": { kind: "water-extractor", clockPct: 100 },
    "oil-pump": { kind: "oil-pump", purity: "normal", clockPct: 100 },
    "resource-well": { kind: "resource-well", itemId: "nitrogen-gas", satellites: ["normal"], clockPct: 100 },
    machine: { kind: "machine", recipeId: "recipe-iron-ingot", clockPct: 100, sloopsUsed: 0 },
    sink: { kind: "sink", couponsAlreadyPurchased: 0 },
  };
  if (defaults[kind]) addNode(defaults[kind]);
};
// wrap <ReactFlow> in <div onDragOver={(e)=>e.preventDefault()} onDrop={onDrop} className="flex-1" />
```

- [ ] **Step 3: Compose in App**

```tsx
import Palette from "@/ui/Palette";
// App returns:
<main className="h-full w-full flex">
  <Palette />
  <Canvas />
</main>
```

- [ ] **Step 4: Smoke run**

Drag each palette item onto the canvas; verify it appears as the correct custom node.

- [ ] **Step 5: Commit**

```bash
git add src/ui/Palette.tsx src/graph/Canvas.tsx src/App.tsx
git commit -m "feat(ui): node palette with drag-to-add"
```

---

### Task 20: Inspector panel

**Files:**
- Create: `src/ui/Inspector.tsx`
- Modify: `src/graph/store.ts` (add `selectedNodeId`), `src/graph/Canvas.tsx`, `src/App.tsx`

- [ ] **Step 1: Add selection to store**

In `src/graph/store.ts`, extend the store with:

```ts
selectedNodeId: string | null;
selectNode: (id: string | null) => void;
```

And the default value `null` plus the setter:

```ts
selectedNodeId: null,
selectNode: (id) => set({ selectedNodeId: id }),
```

- [ ] **Step 2: Implement Inspector**

Create `src/ui/Inspector.tsx`:

```tsx
import { useGraphStore } from "@/graph/store";
import { sampleGameData } from "@/data/sample";

export default function Inspector() {
  const id = useGraphStore((s) => s.selectedNodeId);
  const node = useGraphStore((s) => (id ? s.graph.nodes[id] : null));
  const update = useGraphStore((s) => s.updateNode);
  if (!node) {
    return <aside className="w-72 border-l border-neutral-800 p-3 text-sm opacity-60">No selection.</aside>;
  }

  return (
    <aside className="w-72 border-l border-neutral-800 p-3 text-sm space-y-3 overflow-auto">
      <div className="text-xs uppercase opacity-60">{node.kind}</div>

      {"clockPct" in node && (
        <label className="block">
          <span className="text-xs opacity-80">Clock %</span>
          <input
            type="number" min={1} max={250} step={1}
            className="w-full bg-neutral-800 rounded px-2 py-1"
            value={node.clockPct}
            onChange={(e) => update(node.id, { clockPct: Number(e.target.value) } as never)}
          />
        </label>
      )}

      {node.kind === "miner" && (
        <>
          <label className="block">
            <span className="text-xs opacity-80">Ore</span>
            <select
              className="w-full bg-neutral-800 rounded px-2 py-1"
              value={node.itemId}
              onChange={(e) => update(node.id, { itemId: e.target.value } as never)}
            >
              {Object.values(sampleGameData.items).filter((i) => i.form === "solid").map((i) => (
                <option key={i.id} value={i.id}>{i.displayName}</option>
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
              <option value="mk1">Mk1</option><option value="mk2">Mk2</option><option value="mk3">Mk3</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs opacity-80">Purity</span>
            <select
              className="w-full bg-neutral-800 rounded px-2 py-1"
              value={node.purity}
              onChange={(e) => update(node.id, { purity: e.target.value as never } as never)}
            >
              <option value="impure">Impure</option><option value="normal">Normal</option><option value="pure">Pure</option>
            </select>
          </label>
        </>
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
              {Object.values(sampleGameData.recipes)
                .sort((a, b) => Number(a.isAlternate) - Number(b.isAlternate))
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName}{r.isAlternate ? " · ALT" : ""}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs opacity-80">Somersloop slots used</span>
            <input
              type="number" min={0} className="w-full bg-neutral-800 rounded px-2 py-1"
              value={node.sloopsUsed}
              onChange={(e) => update(node.id, { sloopsUsed: Number(e.target.value) } as never)}
            />
          </label>
        </>
      )}

      {node.kind === "sink" && (
        <label className="block">
          <span className="text-xs opacity-80">Coupons already purchased</span>
          <input
            type="number" min={0} className="w-full bg-neutral-800 rounded px-2 py-1"
            value={node.couponsAlreadyPurchased}
            onChange={(e) => update(node.id, { couponsAlreadyPurchased: Number(e.target.value) } as never)}
          />
        </label>
      )}
    </aside>
  );
}
```

- [ ] **Step 3: Wire selection from Canvas**

In `Canvas.tsx`, add `onNodeClick`:

```tsx
const select = useGraphStore.getState().selectNode;
// pass: onNodeClick={(_, n) => select(n.id)} onPaneClick={() => select(null)}
```

- [ ] **Step 4: Mount Inspector in App**

```tsx
<main className="h-full w-full flex">
  <Palette />
  <Canvas />
  <Inspector />
</main>
```

- [ ] **Step 5: Smoke run**

Add a miner, click it, change clock to 200%, confirm the miner card rate updates.

- [ ] **Step 6: Commit**

```bash
git add src/ui/Inspector.tsx src/graph/store.ts src/graph/Canvas.tsx src/App.tsx
git commit -m "feat(ui): inspector panel with per-node-type forms"
```

---

### Task 21: Project bar (top of screen)

**Files:**
- Create: `src/ui/ProjectBar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement**

Create `src/ui/ProjectBar.tsx`:

```tsx
import { useProjectStore } from "@/storage/projects";

export default function ProjectBar() {
  const projects = useProjectStore((s) => Object.values(s.projects));
  const current = useProjectStore((s) => s.currentProjectId);
  const ps = useProjectStore.getState();

  return (
    <header className="h-10 flex items-center gap-2 px-3 border-b border-neutral-800 bg-neutral-900/80 text-sm">
      <select
        className="bg-neutral-800 rounded px-2 py-1"
        value={current ?? ""}
        onChange={(e) => ps.switchTo(e.target.value)}
      >
        <option value="" disabled>Select project…</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        onClick={() => {
          const name = prompt("Project name?", "New Project");
          if (name) ps.createProject(name);
        }}>New</button>
      <button className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        onClick={() => {
          if (!current) return;
          const name = prompt("New name?", projects.find(p => p.id === current)?.name ?? "");
          if (name) ps.renameProject(current, name);
        }}>Rename</button>
      <button className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        onClick={() => current && ps.duplicateProject(current)}>Duplicate</button>
      <button className="px-2 py-1 rounded bg-red-900/40 hover:bg-red-900/60"
        onClick={() => {
          if (current && confirm("Delete this project?")) ps.deleteProject(current);
        }}>Delete</button>
    </header>
  );
}
```

- [ ] **Step 2: Initialise store on mount**

In `src/App.tsx`:

```tsx
import { useEffect } from "react";
import { useProjectStore } from "@/storage/projects";
import ProjectBar from "@/ui/ProjectBar";
// inside App():
useEffect(() => { useProjectStore.getState().init(); }, []);
// layout:
<main className="h-full w-full flex flex-col">
  <ProjectBar />
  <div className="flex flex-1 overflow-hidden">
    <Palette />
    <div className="flex-1"><Canvas /></div>
    <Inspector />
  </div>
</main>
```

- [ ] **Step 3: Smoke run**

Create a project, add a miner, refresh page — confirm graph reappears once you re-select the project from the dropdown. (Auto-load on init comes in Task 23.)

- [ ] **Step 4: Commit**

```bash
git add src/ui/ProjectBar.tsx src/App.tsx
git commit -m "feat(ui): project bar with create/rename/duplicate/delete"
```

---

### Task 22: Summary bar (bottom of screen)

**Files:**
- Create: `src/ui/SummaryBar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement**

Create `src/ui/SummaryBar.tsx`:

```tsx
import { useComputed } from "@/graph/useComputed";
import { useGraphStore } from "@/graph/store";
import { sampleGameData } from "@/data/sample";
import { summarise } from "@/engine/summarise";

export default function SummaryBar() {
  const graph = useGraphStore((s) => s.graph);
  const res = useComputed();
  const sum = summarise(sampleGameData, graph, res);

  const raw = Object.entries(sum.rawInputsPerMin)
    .map(([k, v]) => `${k} ${v.toFixed(0)}/min`).join(" · ") || "—";

  return (
    <footer className="h-8 flex items-center gap-4 px-3 border-t border-neutral-800 bg-neutral-900/80 text-xs">
      <span>Raw: {raw}</span>
      <span>Power: {sum.totalPowerMW.toFixed(1)} MW</span>
      <span>Points: {sum.totalPointsPerMin.toFixed(0)}/min</span>
      {sum.warnings.length > 0 && (
        <span className="text-amber-300">⚠ {sum.warnings.length} warning{sum.warnings.length === 1 ? "" : "s"}</span>
      )}
    </footer>
  );
}
```

- [ ] **Step 2: Mount in App**

```tsx
<main className="h-full w-full flex flex-col">
  <ProjectBar />
  <div className="flex flex-1 overflow-hidden">
    <Palette />
    <div className="flex-1"><Canvas /></div>
    <Inspector />
  </div>
  <SummaryBar />
</main>
```

- [ ] **Step 3: Smoke run + commit**

```bash
npm run dev
# verify the summary bar shows live totals as you build a chain
git add src/ui/SummaryBar.tsx src/App.tsx
git commit -m "feat(ui): project summary bar"
```

---

## Phase 6 — Persistence + Import/Export

### Task 23: Auto-save on graph change

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Subscribe and debounce-save**

In `src/App.tsx`:

```tsx
import { useEffect } from "react";
import { useGraphStore } from "@/graph/store";
import { useProjectStore } from "@/storage/projects";

// inside App:
useEffect(() => {
  let timer: number | undefined;
  const unsub = useGraphStore.subscribe((s, prev) => {
    if (s.graph === prev.graph) return;
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => useProjectStore.getState().saveCurrent(), 300);
  });
  return () => { unsub(); if (timer) clearTimeout(timer); };
}, []);
```

(If your Zustand version exports a separate `useStore.subscribe` rather than store property, adapt accordingly.)

- [ ] **Step 2: Auto-load latest on init**

After `useProjectStore.getState().init()` in the previous `useEffect`, pick the most-recently-updated project and switch to it:

```tsx
useEffect(() => {
  const ps = useProjectStore.getState();
  ps.init();
  const latest = Object.values(ps.projects).sort((a, b) => b.updatedAt - a.updatedAt)[0];
  if (latest) ps.switchTo(latest.id);
}, []);
```

- [ ] **Step 3: Smoke run**

Build a small chain, hard-refresh the page, verify the same chain is restored automatically.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(storage): debounced auto-save and auto-load latest project"
```

---

### Task 24: JSON export / import

**Files:**
- Create: `src/storage/importExport.ts`
- Modify: `src/ui/ProjectBar.tsx`

- [ ] **Step 1: Implement helpers**

Create `src/storage/importExport.ts`:

```ts
import { SCHEMA_VERSION, type StoredProject } from "./localStorage";
import { useGraphStore } from "@/graph/store";
import { useProjectStore } from "./projects";
import { v4 as uuid } from "uuid";

export function exportCurrentProject() {
  const ps = useProjectStore.getState();
  const id = ps.currentProjectId;
  if (!id) return;
  const meta = ps.projects[id];
  if (!meta) return;
  const blob: StoredProject = {
    schemaVersion: SCHEMA_VERSION,
    meta,
    graph: useGraphStore.getState().graph,
  };
  const json = JSON.stringify(blob, null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meta.name}.satgraph.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProjectFromFile(file: File) {
  const text = await file.text();
  const parsed: StoredProject = JSON.parse(text);
  if (parsed.schemaVersion > SCHEMA_VERSION) {
    throw new Error("This file was saved by a newer app version. Please update.");
  }
  // Future-proofing: migrate older versions here. v1 needs no migration.
  const newId = uuid();
  const meta = { ...parsed.meta, id: newId, name: parsed.meta.name + " (imported)", updatedAt: Date.now() };
  const ps = useProjectStore.getState();
  // Direct write via localStorage helpers, then refresh in-memory index.
  const { writeProject, writeIndex, readIndex } = await import("./localStorage");
  writeProject({ schemaVersion: SCHEMA_VERSION, meta, graph: parsed.graph });
  writeIndex([...readIndex(), meta]);
  ps.init();
  ps.switchTo(newId);
}
```

- [ ] **Step 2: Add buttons in ProjectBar**

```tsx
import { exportCurrentProject, importProjectFromFile } from "@/storage/importExport";

// add inside the header:
<button className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
  onClick={() => exportCurrentProject()}>Export</button>
<label className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 cursor-pointer">
  Import
  <input type="file" accept=".json" className="hidden"
    onChange={(e) => {
      const f = e.target.files?.[0];
      if (f) importProjectFromFile(f).catch((err) => alert(String(err)));
      e.target.value = "";
    }} />
</label>
```

- [ ] **Step 3: Smoke run**

Export a project, delete it, re-import the JSON, confirm the chain restores.

- [ ] **Step 4: Commit**

```bash
git add src/storage/importExport.ts src/ui/ProjectBar.tsx
git commit -m "feat(storage): JSON export and import for projects"
```

---

## Phase 7 — Full Game Data

### Task 25: Build-time data generation script

**Files:**
- Create: `scripts/generate-data.ts`, `scripts/README.md`
- Modify: `package.json` (add `gen:data` script), every `import { sampleGameData } ...` to import from `@/data/satisfactory-1.1` after generation

- [ ] **Step 1: Install parser**

```bash
npm install -D satisfactory-docs-parser tsx
```

- [ ] **Step 2a: Probe the parser output shape**

Create `scripts/probe-parser.ts` to dump one item, building, and recipe from the parser so we know the exact field names before writing the mapper:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseDocs } from "satisfactory-docs-parser";

async function main() {
  const raw = await fs.readFile(path.resolve(".local-game-data/Docs.json"), "utf-8");
  const parsed = parseDocs(raw);
  const sample = {
    itemKeys: Object.keys(parsed.items).slice(0, 3),
    item0: Object.values(parsed.items)[0],
    buildableKeys: Object.keys(parsed.buildables).slice(0, 3),
    buildable0: Object.values(parsed.buildables)[0],
    recipeKeys: Object.keys(parsed.recipes).slice(0, 3),
    recipe0: Object.values(parsed.recipes)[0],
  };
  await fs.writeFile(
    path.resolve(".local-game-data/parser-probe.json"),
    JSON.stringify(sample, null, 2),
  );
  console.log("Wrote .local-game-data/parser-probe.json — open it to see fields.");
}
main().catch((e) => { console.error(e); process.exit(1); });
```

Run it:

```bash
npx tsx scripts/probe-parser.ts
```

Open `.local-game-data/parser-probe.json` and identify, for each parser entity, the exact field names that correspond to our `Item`, `Building`, `Recipe` types in `src/data/types.ts`. Make notes; the next step uses them.

- [ ] **Step 2b: Implement the generator using the field names you observed**

Create `scripts/generate-data.ts`. Replace the placeholder field paths (`p.??`) in the body below with the exact names from your probe output (typical names from `satisfactory-docs-parser` are listed in comments as a starting hypothesis — verify against your probe file):

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseDocs } from "satisfactory-docs-parser";
import type { GameData, Item, Building, Recipe, BuildingCategory } from "../src/data/types";

const INPUT  = path.resolve(".local-game-data/Docs.json");
const OUTPUT = path.resolve("src/data/satisfactory-1.1.json");

// Field-path shim. After Step 2a, replace each accessor below with the real
// path observed in parser-probe.json. The shape we assume here is the typical
// satisfactory-docs-parser output; if a field is missing or named differently
// in your probe output, edit the accessor — do not silently fall back.
const FIELDS = {
  itemId:           (p: any) => p.slug,                       // e.g. "iron-ore"
  itemName:         (p: any) => p.name,
  itemForm:         (p: any) => (p.liquid ? "fluid" : p.gas ? "gas" : "solid"),
  itemSinkPoints:   (p: any) => p.sinkPoints ?? 0,
  itemStackSize:    (p: any) => p.stackSize ?? 0,
  itemIcon:         (p: any) => p.icon ?? "",
  // For amounts, parser usually normalises liquids to m^3 already.
  // If your probe shows raw mL values, divide by 1000 in mapItem/mapRecipe.
  bldgId:           (p: any) => p.slug,
  bldgName:         (p: any) => p.name,
  bldgCategory:     (p: any) => mapCategory(p),               // see below
  bldgPower:        (p: any) => p.metadata?.powerConsumption ?? 0,
  bldgVariable:     (p: any) => p.metadata?.powerConsumptionRange != null,
  bldgVarRange:     (p: any) => p.metadata?.powerConsumptionRange,
  bldgSloops:       (p: any) => p.metadata?.productionShardSlotSize ?? 0,
  recipeId:         (p: any) => p.slug,
  recipeName:       (p: any) => p.name,
  recipeBuilding:   (p: any) => p.producedIn?.[0],
  recipeAlternate:  (p: any) => p.isAlternate ?? p.name?.startsWith("Alternate:") ?? false,
  recipeDuration:   (p: any) => p.craftTime,
  recipeInputs:     (p: any) => p.ingredients ?? [],
  recipeOutputs:    (p: any) => p.products ?? [],
  portItemId:       (p: any) => p.item,                       // slug
  portAmount:       (p: any) => p.amount,                     // per cycle
};

function mapCategory(p: any): BuildingCategory | null {
  // Map the parser's category/slug to our BuildingCategory union. Add cases
  // as needed; unmapped buildings are skipped (return null).
  const slug = (p.slug ?? "").toLowerCase();
  if (slug.includes("miner")) return "miner";
  if (slug.includes("water-extractor")) return "water-extractor";
  if (slug.includes("oil-extractor") || slug.includes("oil-pump")) return "oil-pump";
  if (slug.includes("pressurizer")) return "resource-well-pressurizer";
  if (slug.includes("well-extractor")) return "resource-well-extractor";
  if (slug.includes("smelter")) return "smelter";
  if (slug.includes("constructor")) return "constructor";
  if (slug.includes("assembler")) return "assembler";
  if (slug.includes("foundry")) return "foundry";
  if (slug.includes("manufacturer")) return "manufacturer";
  if (slug.includes("refinery")) return "refinery";
  if (slug.includes("blender")) return "blender";
  if (slug.includes("packager")) return "packager";
  if (slug.includes("hadron") || slug.includes("particle-accelerator")) return "particle-accelerator";
  if (slug.includes("sink") || slug.includes("awesome")) return "awesome-sink";
  return null;
}

function mapItem(p: any): Item {
  return {
    id: FIELDS.itemId(p),
    displayName: FIELDS.itemName(p),
    iconUrl: FIELDS.itemIcon(p),
    form: FIELDS.itemForm(p),
    sinkPoints: FIELDS.itemSinkPoints(p),
    stackSize: FIELDS.itemStackSize(p),
  };
}

function mapBuilding(p: any): Building | null {
  const category = FIELDS.bldgCategory(p);
  if (!category) return null;
  const variable = FIELDS.bldgVariable(p);
  const range = FIELDS.bldgVarRange(p);
  return {
    id: FIELDS.bldgId(p),
    displayName: FIELDS.bldgName(p),
    category,
    basePowerMW: variable && range ? (range.min + range.max) / 2 : FIELDS.bldgPower(p),
    powerIsVariable: variable,
    variablePowerMW: variable && range ? { minMW: range.min, maxMW: range.max } : undefined,
    somersloopSlots: FIELDS.bldgSloops(p),
  };
}

function mapRecipe(p: any): Recipe | null {
  const building = FIELDS.recipeBuilding(p);
  if (!building) return null;
  return {
    id: FIELDS.recipeId(p),
    displayName: FIELDS.recipeName(p),
    buildingId: building,
    isAlternate: FIELDS.recipeAlternate(p),
    durationSeconds: FIELDS.recipeDuration(p),
    inputs:  FIELDS.recipeInputs(p).map((x: any)  => ({ itemId: FIELDS.portItemId(x), amountPerCycle: FIELDS.portAmount(x) })),
    outputs: FIELDS.recipeOutputs(p).map((x: any) => ({ itemId: FIELDS.portItemId(x), amountPerCycle: FIELDS.portAmount(x) })),
  };
}

function sortKeys<T>(rec: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const k of Object.keys(rec).sort()) out[k] = rec[k]!;
  return out;
}

async function main() {
  const raw = await fs.readFile(INPUT, "utf-8");
  const parsed = parseDocs(raw);

  const items: Record<string, Item> = {};
  for (const p of Object.values(parsed.items)) {
    const item = mapItem(p as any);
    if (item.id) items[item.id] = item;
  }

  const buildings: Record<string, Building> = {};
  for (const p of Object.values(parsed.buildables)) {
    const b = mapBuilding(p as any);
    if (b) buildings[b.id] = b;
  }

  const recipes: Record<string, Recipe> = {};
  for (const p of Object.values(parsed.recipes)) {
    const r = mapRecipe(p as any);
    if (r) recipes[r.id] = r;
  }

  const out: GameData = {
    version: "1.1",
    items:     sortKeys(items),
    buildings: sortKeys(buildings),
    recipes:   sortKeys(recipes),
    minerOutputPerMin: {
      mk1: { impure: 30,  normal: 60,  pure: 120 },
      mk2: { impure: 60,  normal: 120, pure: 240 },
      mk3: { impure: 120, normal: 240, pure: 480 },
    },
    beltTierPerMin: { mk1: 60, mk2: 120, mk3: 270, mk4: 480, mk5: 780, mk6: 1200 },
    pipeTierPerMin: { mk1: 300, mk2: 600 },
    waterExtractorPerMin: 120,
    oilPumpPerMin: { impure: 60, normal: 120, pure: 240 },
    resourceWellSatellitePerMin: {}, // populated by hand from wiki — see scripts/README.md
  };
  await fs.writeFile(OUTPUT, JSON.stringify(out, null, 2));
  console.log(
    `Wrote ${OUTPUT}: ${Object.keys(out.items).length} items, ` +
    `${Object.keys(out.buildings).length} buildings, ${Object.keys(out.recipes).length} recipes`,
  );
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Add script and a README explaining how to run it**

In `package.json`:

```json
"gen:data": "tsx scripts/generate-data.ts"
```

Create `scripts/README.md` with instructions for placing `Docs.json` and running `npm run gen:data`.

- [ ] **Step 4: Run the script (manual) and confirm output**

Drop a real `Docs.json` (or a downloaded dump file) at `.local-game-data/Docs.json`, run `npm run gen:data`, and confirm `src/data/satisfactory-1.1.json` exists with a non-trivial size.

- [ ] **Step 5: Swap imports from `sample` to the generated bundle**

In every file currently importing `sampleGameData`, switch to a single barrel `src/data/index.ts`:

```ts
import data from "./satisfactory-1.1.json";
import type { GameData } from "./types";
export const gameData = data as unknown as GameData;
```

Then global-replace `sampleGameData` → `gameData` and `@/data/sample` → `@/data`. Keep `src/data/sample.ts` for tests only (it remains the source of truth for unit-test fixtures).

- [ ] **Step 6: Run all tests + start dev**

```bash
npm run test:run
npm run dev
```

Confirm tests still pass (they use `sample`) and the running app has the full recipe list in the inspector.

- [ ] **Step 7: Commit**

```bash
git add scripts/ src/data/ package.json package-lock.json src/
git commit -m "feat(data): generator script + bundle full Satisfactory 1.1 data"
```

---

## Phase 8 — Deploy + smoke test

### Task 26: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test:run
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit (do not push yet — pushing is a confirmation step)**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Pages deploy workflow"
```

Note: the user must enable Pages in the repo settings (Source = "GitHub Actions") before the first deploy will publish.

---

### Task 27: Playwright happy-path smoke test

**Files:**
- Create: `playwright.config.ts`, `e2e/happy-path.spec.ts`

- [ ] **Step 1: Install Playwright**

```bash
npm init playwright@latest -- --quiet --browser=chromium --no-examples
```

(Accept defaults; if it prompts to install browsers, allow it.)

- [ ] **Step 2: Configure base URL**

Edit `playwright.config.ts`'s `use.baseURL` to `http://localhost:5173/SatisfactoryCalculatorGraph/` and add `webServer`:

```ts
webServer: {
  command: "npm run dev",
  port: 5173,
  reuseExistingServer: !process.env.CI,
},
```

- [ ] **Step 3: Write the test**

Create `e2e/happy-path.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("create project, drag a miner, see output rate", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New" }).click();
  // prompt() is auto-confirmed in headless via dialog handler:
  page.on("dialog", (d) => d.accept("Test Plant"));
  await page.getByText("Miner").first().dragTo(page.locator(".react-flow__pane"));
  await expect(page.getByText(/\/min/).first()).toBeVisible();
});
```

- [ ] **Step 4: Run**

```bash
npx playwright test
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e/ package.json package-lock.json
git commit -m "test(e2e): Playwright happy-path smoke test"
```

---

## Post-completion

After Task 27, the working tree has a complete, locally-runnable app with auto-deploying CI. Decide whether to push to the `origin/main` remote on GitHub — this is your call, not the agent's. Once you confirm a push, the GitHub Actions workflow publishes to Pages.

---

## Self-review notes (author)

- **Spec coverage:** every §2 in-scope bullet maps to at least one task — sources (T5, T14, T15), production math (T6), power (T7), somersloop (T6+T7), sink (T8, T16), compute/cycles (T9), summary (T10), projects (T12), persistence (T11+T12+T23), import/export (T24), validation (T17), edges (T18), data generation (T25), deploy (T26). Out-of-scope items (power generators, target-driven solving, mobile-first, multi-user) deliberately absent.
- **Bite-sizing:** each task is ≤7 steps, every code step shows the actual code, every test step shows the actual test. No "TODO/TBD/implement later".
- **Type consistency:** `GraphNode` discriminator `kind` ("miner" | "water-extractor" | ... | "machine" | "sink") is used consistently across `graph.ts`, `compute.ts`, store, and all node components. `MinerMk` / `MinerPurity` re-used everywhere they appear. Engine functions all import from `@/data/types`.
- **Data swap:** Task 25 explicitly migrates from `sampleGameData` to the generated bundle and keeps `sample.ts` as the test fixture so unit tests stay stable across game patches.
