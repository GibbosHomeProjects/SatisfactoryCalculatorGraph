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
