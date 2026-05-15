/* eslint-disable @typescript-eslint/no-explicit-any */
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseDocs } from "satisfactory-docs-parser";
import type {
  Building,
  BuildingCategory,
  GameData,
  Item,
  Recipe,
} from "../src/data/types";

const INPUT = path.resolve(".local-game-data/Docs.json");
const OUTPUT = path.resolve("src/data/satisfactory-1.1.json");

// Field-path shim. Verify each accessor against `.local-game-data/parser-probe.json`
// (produced by `npx tsx scripts/probe-parser.ts`) before running this script.
// If a field is missing or renamed in your parser version, edit the accessor.
const FIELDS = {
  itemId: (p: any) => p.slug,
  itemName: (p: any) => p.name,
  itemForm: (p: any): "solid" | "fluid" | "gas" =>
    p.liquid ? "fluid" : p.gas ? "gas" : "solid",
  itemSinkPoints: (p: any) => p.sinkPoints ?? 0,
  itemStackSize: (p: any) => p.stackSize ?? 0,
  itemIcon: (p: any) => p.icon ?? "",

  bldgId: (p: any) => p.slug,
  bldgName: (p: any) => p.name,
  bldgPower: (p: any) => p.metadata?.powerConsumption ?? 0,
  bldgVariable: (p: any) => p.metadata?.powerConsumptionRange != null,
  bldgVarRange: (p: any) => p.metadata?.powerConsumptionRange,
  bldgSloops: (p: any) => p.metadata?.productionShardSlotSize ?? 0,

  recipeId: (p: any) => p.slug,
  recipeName: (p: any) => p.name,
  recipeBuilding: (p: any) => p.producedIn?.[0],
  recipeAlternate: (p: any) =>
    p.isAlternate ?? (p.name?.startsWith("Alternate:") ? true : false),
  recipeDuration: (p: any) => p.craftTime,
  recipeInputs: (p: any) => p.ingredients ?? [],
  recipeOutputs: (p: any) => p.products ?? [],
  portItemId: (p: any) => p.item,
  portAmount: (p: any) => p.amount,
};

function mapCategory(p: any): BuildingCategory | null {
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
  if (slug.includes("hadron") || slug.includes("particle-accelerator"))
    return "particle-accelerator";
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
  const category = mapCategory(p);
  if (!category) return null;
  const variable = FIELDS.bldgVariable(p);
  const range = FIELDS.bldgVarRange(p);
  return {
    id: FIELDS.bldgId(p),
    displayName: FIELDS.bldgName(p),
    category,
    basePowerMW: variable && range ? (range.min + range.max) / 2 : FIELDS.bldgPower(p),
    powerIsVariable: variable,
    ...(variable && range ? { variablePowerMW: { minMW: range.min, maxMW: range.max } } : {}),
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
    inputs: FIELDS.recipeInputs(p).map((x: any) => ({
      itemId: FIELDS.portItemId(x),
      amountPerCycle: FIELDS.portAmount(x),
    })),
    outputs: FIELDS.recipeOutputs(p).map((x: any) => ({
      itemId: FIELDS.portItemId(x),
      amountPerCycle: FIELDS.portAmount(x),
    })),
  };
}

function sortKeys<T>(rec: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const k of Object.keys(rec).sort()) out[k] = rec[k]!;
  return out;
}

async function main() {
  const raw = await fs.readFile(INPUT, "utf-8");
  const parsed: any = parseDocs(raw);

  const items: Record<string, Item> = {};
  for (const p of Object.values(parsed.items ?? {})) {
    const item = mapItem(p as any);
    if (item.id) items[item.id] = item;
  }

  const buildings: Record<string, Building> = {};
  for (const p of Object.values(parsed.buildables ?? {})) {
    const b = mapBuilding(p as any);
    if (b) buildings[b.id] = b;
  }

  const recipes: Record<string, Recipe> = {};
  for (const p of Object.values(parsed.recipes ?? {})) {
    const r = mapRecipe(p as any);
    if (r) recipes[r.id] = r;
  }

  const out: GameData = {
    version: "1.1",
    items: sortKeys(items),
    buildings: sortKeys(buildings),
    recipes: sortKeys(recipes),
    minerOutputPerMin: {
      mk1: { impure: 30, normal: 60, pure: 120 },
      mk2: { impure: 60, normal: 120, pure: 240 },
      mk3: { impure: 120, normal: 240, pure: 480 },
    },
    beltTierPerMin: { mk1: 60, mk2: 120, mk3: 270, mk4: 480, mk5: 780, mk6: 1200 },
    pipeTierPerMin: { mk1: 300, mk2: 600 },
    waterExtractorPerMin: 120,
    oilPumpPerMin: { impure: 60, normal: 120, pure: 240 },
    resourceWellSatellitePerMin: {},
  };

  await fs.writeFile(OUTPUT, JSON.stringify(out, null, 2));
  console.log(
    `Wrote ${OUTPUT}: ${Object.keys(out.items).length} items, ` +
      `${Object.keys(out.buildings).length} buildings, ${Object.keys(out.recipes).length} recipes`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
