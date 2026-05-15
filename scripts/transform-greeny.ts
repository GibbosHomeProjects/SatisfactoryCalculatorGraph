/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * One-time transformer: reads .local-game-data/greeny-data.json (downloaded from
 * https://raw.githubusercontent.com/greeny/SatisfactoryTools/master/data/data.json)
 * and emits three normalised JSON files that the app consumes directly:
 *
 *   src/data/items.json      - every item we care about, keyed by slug
 *   src/data/recipes.json    - every machine-craftable recipe, keyed by slug
 *   src/data/game-info.json  - production buildings, miner output table,
 *                              belt/pipe tiers, mineable + resource-well ids
 *
 * Run with: npx tsx scripts/transform-greeny.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  Building,
  BuildingCategory,
  Item,
  Recipe,
} from "../src/data/types";

const INPUT = path.resolve(".local-game-data/greeny-data.json");

const OUT_ITEMS = path.resolve("src/data/items.json");
const OUT_RECIPES = path.resolve("src/data/recipes.json");
const OUT_INFO = path.resolve("src/data/game-info.json");

// Greeny's `className` (e.g. "Desc_OreIron_C") -> our slug (e.g. "iron-ore").
function buildClassToSlug(items: Record<string, any>): Map<string, string> {
  const m = new Map<string, string>();
  for (const [className, it] of Object.entries(items)) m.set(className, it.slug);
  return m;
}

// Building slug normalisations. Greeny uses some slugs that don't match what
// the compute engine looks up (e.g. `miner-mk-1`, `oil-extractor`). Map to the
// canonical ids the engine uses (see src/engine/compute.ts).
const BUILDING_ID_REMAP: Record<string, string> = {
  "miner-mk-1": "miner-mk1",
  "miner-mk-2": "miner-mk2",
  "miner-mk-3": "miner-mk3",
  "oil-extractor": "oil-pump",
  // "constructor" collides with Object.prototype.constructor when used as a
  // JS object key — rename so dictionary lookups stay sane.
  constructor: "constructor-bldg",
};
const normaliseBuildingId = (slug: string) => BUILDING_ID_REMAP[slug] ?? slug;

function itemForm(it: any): "solid" | "fluid" | "gas" {
  const name: string = it.name ?? "";
  if (/\bgas\b/i.test(name) || /nitrogen/i.test(name)) return "gas";
  return it.liquid ? "fluid" : "solid";
}

function mapBuildingCategory(slug: string): BuildingCategory | null {
  const s = slug.toLowerCase();
  if (s === "miner-mk-1" || s === "miner-mk-2" || s === "miner-mk-3") return "miner";
  if (s === "water-extractor" || s === "water-pump") return "water-extractor";
  if (s === "oil-extractor" || s === "oil-pump") return "oil-pump";
  if (s === "resource-well-pressurizer" || s === "fracking-smasher") return "resource-well-pressurizer";
  if (s === "resource-well-extractor" || s === "fracking-extractor") return "resource-well-extractor";
  if (s === "smelter") return "smelter";
  if (s === "constructor") return "constructor";
  if (s === "assembler") return "assembler";
  if (s === "foundry") return "foundry";
  if (s === "manufacturer") return "manufacturer";
  if (s === "refinery") return "refinery";
  if (s === "blender") return "blender";
  if (s === "packager") return "packager";
  if (s === "particle-accelerator" || s === "hadron-collider") return "particle-accelerator";
  if (s === "awesome-sink" || s === "sink") return "awesome-sink";
  return null;
}

function somersloopSlotsFor(category: BuildingCategory): number {
  switch (category) {
    case "smelter":
    case "constructor":
      return 1;
    case "assembler":
    case "foundry":
    case "refinery":
      return 2;
    case "manufacturer":
    case "blender":
    case "particle-accelerator":
      return 4;
    default:
      return 0;
  }
}

async function main() {
  const raw = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  const classToSlug = buildClassToSlug(raw.items);

  // ---- Items ---------------------------------------------------------------
  // Filter out items that are never referenced from a machine recipe or as a
  // mineable / fluid source. Keeps the file lean.
  const referencedItems = new Set<string>();
  for (const r of Object.values<any>(raw.recipes)) {
    if (!r.inMachine) continue;
    for (const x of r.ingredients ?? []) referencedItems.add(x.item);
    for (const x of r.products ?? []) referencedItems.add(x.item);
  }
  for (const className of Object.keys(raw.resources ?? {})) referencedItems.add(className);

  const items: Record<string, Item> = {};
  for (const [className, it] of Object.entries<any>(raw.items)) {
    if (!referencedItems.has(className)) continue;
    items[it.slug] = {
      id: it.slug,
      displayName: it.name,
      iconUrl: "",
      form: itemForm(it),
      sinkPoints: typeof it.sinkPoints === "number" ? it.sinkPoints : 0,
      stackSize: typeof it.stackSize === "number" ? it.stackSize : 0,
    };
  }

  // ---- Recipes -------------------------------------------------------------
  const recipes: Record<string, Recipe> = {};
  for (const [, r] of Object.entries<any>(raw.recipes)) {
    if (!r.inMachine) continue;
    if (!Array.isArray(r.producedIn) || r.producedIn.length === 0) continue;
    // Resolve building: prefer the first non-workbench producer.
    const buildingClassName: string =
      r.producedIn.find((c: string) => !c.includes("Workbench") && !c.includes("WorkBench")) ??
      r.producedIn[0];
    const buildingInfo = raw.buildings?.[buildingClassName];
    if (!buildingInfo) continue;
    const buildingId: string = normaliseBuildingId(buildingInfo.slug);

    const mapPort = (p: any) => ({
      itemId: classToSlug.get(p.item) ?? p.item,
      // Fluid amounts in greeny data are stored x1000 (mL). Normalise to m³.
      amountPerCycle:
        items[classToSlug.get(p.item) ?? ""]?.form === "solid" ? p.amount : p.amount / 1000,
    });

    recipes[r.slug] = {
      id: r.slug,
      displayName: r.name,
      buildingId,
      isAlternate: !!r.alternate,
      durationSeconds: r.time,
      inputs: (r.ingredients ?? []).map(mapPort),
      outputs: (r.products ?? []).map(mapPort),
    };
  }

  // ---- Buildings + game info ----------------------------------------------
  const buildings: Record<string, Building> = {};
  for (const [, b] of Object.entries<any>(raw.buildings)) {
    const category = mapBuildingCategory(b.slug ?? "");
    if (!category) continue;
    const md = b.metadata ?? {};
    const minMW = md.minPowerConsumption;
    const maxMW = md.maxPowerConsumption;
    const variable = typeof minMW === "number" && typeof maxMW === "number" && maxMW !== minMW;
    const normalisedId = normaliseBuildingId(b.slug);
    buildings[normalisedId] = {
      id: normalisedId,
      displayName: b.name,
      category,
      basePowerMW: variable
        ? (minMW + maxMW) / 2
        : typeof md.powerConsumption === "number"
          ? md.powerConsumption
          : 0,
      powerIsVariable: variable,
      ...(variable ? { variablePowerMW: { minMW: minMW!, maxMW: maxMW! } } : {}),
      somersloopSlots: somersloopSlotsFor(category),
    };
  }

  // Mineable items: from raw.resources, restricted to solid form.
  const mineableItemIds: string[] = [];
  const resourceWellItemIds: string[] = [];
  for (const className of Object.keys(raw.resources ?? {})) {
    const slug = classToSlug.get(className);
    if (!slug) continue;
    const form = items[slug]?.form;
    if (!form) continue;
    if (form === "solid") mineableItemIds.push(slug);
    else resourceWellItemIds.push(slug);
  }

  // --- 1.0/1.1 hand-patches not present in greeny's Update-6 era data --------
  // SAM was added as a mineable solid in Update 1.0. The greeny dump predates
  // it. Patch it in manually so the dropdown surfaces it and the planner can
  // route it through downstream recipes once those are regenerated from a
  // real 1.1 Docs.json.
  if (!items["sam"]) {
    items["sam"] = {
      id: "sam",
      displayName: "SAM",
      iconUrl: "",
      form: "solid",
      sinkPoints: 24,
      stackSize: 100,
    };
  }
  if (!mineableItemIds.includes("sam")) mineableItemIds.push("sam");

  // Particle Accelerator runs at variable power (250-1500 MW depending on
  // recipe). Greeny's metadata records 0 MW for the building, which would make
  // every PA recipe appear free. Patch a sensible nominal so totals are
  // ballpark-correct; users can override per-node when needed.
  const pa = buildings[normaliseBuildingId("particle-accelerator")];
  if (pa && pa.basePowerMW === 0) {
    pa.basePowerMW = 750;
    pa.powerIsVariable = true;
    pa.variablePowerMW = { minMW: 250, maxMW: 1500 };
  }

  // Sort all records by key for stable diffs.
  const sortKeys = <T>(rec: Record<string, T>): Record<string, T> => {
    const out: Record<string, T> = {};
    for (const k of Object.keys(rec).sort()) out[k] = rec[k]!;
    return out;
  };

  const itemsSorted = sortKeys(items);
  const recipesSorted = sortKeys(recipes);
  const buildingsSorted = sortKeys(buildings);

  // ---- Write outputs -------------------------------------------------------
  await fs.writeFile(OUT_ITEMS, JSON.stringify(itemsSorted, null, 2) + "\n");
  await fs.writeFile(OUT_RECIPES, JSON.stringify(recipesSorted, null, 2) + "\n");

  const info = {
    version: "1.1",
    buildings: buildingsSorted,
    mineableItemIds: mineableItemIds.sort(),
    resourceWellItemIds: resourceWellItemIds.sort(),
    minerOutputPerMin: {
      mk1: { impure: 30, normal: 60, pure: 120 },
      mk2: { impure: 60, normal: 120, pure: 240 },
      mk3: { impure: 120, normal: 240, pure: 480 },
    },
    beltTierPerMin: { mk1: 60, mk2: 120, mk3: 270, mk4: 480, mk5: 780, mk6: 1200 },
    pipeTierPerMin: { mk1: 300, mk2: 600 },
    waterExtractorPerMin: 120,
    oilPumpPerMin: { impure: 60, normal: 120, pure: 240 },
    // Per-satellite outputs from a Resource Well by node purity. The values
    // mirror the Wiki for Nitrogen Gas wells; verify if 1.1 changed them.
    resourceWellSatellitePerMin: {
      "nitrogen-gas": { impure: 30, normal: 60, pure: 120 },
    },
  };
  await fs.writeFile(OUT_INFO, JSON.stringify(info, null, 2) + "\n");

  console.log(
    `Wrote ${Object.keys(itemsSorted).length} items, ${Object.keys(recipesSorted).length} recipes, ` +
      `${Object.keys(buildingsSorted).length} buildings ` +
      `(mineable: ${mineableItemIds.length}, resource-well: ${resourceWellItemIds.length}).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
