import type { Building, GameData, Item, Recipe } from "./types";

const items: Record<string, Item> = {
  // Mineable solid resources (placeable on Miner Mk1/Mk2/Mk3).
  "iron-ore":     { id: "iron-ore",     displayName: "Iron Ore",     iconUrl: "", form: "solid", sinkPoints: 1,   stackSize: 100 },
  "copper-ore":   { id: "copper-ore",   displayName: "Copper Ore",   iconUrl: "", form: "solid", sinkPoints: 3,   stackSize: 100 },
  "limestone":    { id: "limestone",    displayName: "Limestone",    iconUrl: "", form: "solid", sinkPoints: 2,   stackSize: 100 },
  "coal":         { id: "coal",         displayName: "Coal",         iconUrl: "", form: "solid", sinkPoints: 3,   stackSize: 100 },
  "caterium-ore": { id: "caterium-ore", displayName: "Caterium Ore", iconUrl: "", form: "solid", sinkPoints: 7,   stackSize: 100 },
  "raw-quartz":   { id: "raw-quartz",   displayName: "Raw Quartz",   iconUrl: "", form: "solid", sinkPoints: 15,  stackSize: 100 },
  "sulfur":       { id: "sulfur",       displayName: "Sulfur",       iconUrl: "", form: "solid", sinkPoints: 11,  stackSize: 100 },
  "bauxite":      { id: "bauxite",      displayName: "Bauxite",      iconUrl: "", form: "solid", sinkPoints: 8,   stackSize: 100 },
  "uranium":      { id: "uranium",      displayName: "Uranium",      iconUrl: "", form: "solid", sinkPoints: 35,  stackSize: 100 },
  "sam":          { id: "sam",          displayName: "SAM",          iconUrl: "", form: "solid", sinkPoints: 24,  stackSize: 100 },

  // Processed solids used in sample recipes.
  "iron-ingot": { id: "iron-ingot", displayName: "Iron Ingot", iconUrl: "", form: "solid", sinkPoints: 2,   stackSize: 100 },
  "iron-plate": { id: "iron-plate", displayName: "Iron Plate", iconUrl: "", form: "solid", sinkPoints: 6,   stackSize: 100 },
  "iron-rod":   { id: "iron-rod",   displayName: "Iron Rod",   iconUrl: "", form: "solid", sinkPoints: 4,   stackSize: 100 },
  "screw":      { id: "screw",      displayName: "Screw",      iconUrl: "", form: "solid", sinkPoints: 2,   stackSize: 500 },
  "plastic":    { id: "plastic",    displayName: "Plastic",    iconUrl: "", form: "solid", sinkPoints: 75,  stackSize: 200 },
  "rubber":     { id: "rubber",     displayName: "Rubber",     iconUrl: "", form: "solid", sinkPoints: 60,  stackSize: 200 },
  "polymer-resin": { id: "polymer-resin", displayName: "Polymer Resin", iconUrl: "", form: "solid", sinkPoints: 12, stackSize: 200 },

  // Fluids and gases.
  "water":             { id: "water",             displayName: "Water",             iconUrl: "", form: "fluid", sinkPoints: 0,  stackSize: 0 },
  "crude-oil":         { id: "crude-oil",         displayName: "Crude Oil",         iconUrl: "", form: "fluid", sinkPoints: 0,  stackSize: 0 },
  "heavy-oil-residue": { id: "heavy-oil-residue", displayName: "Heavy Oil Residue", iconUrl: "", form: "fluid", sinkPoints: 0,  stackSize: 0 },
  "nitrogen-gas":      { id: "nitrogen-gas",      displayName: "Nitrogen Gas",      iconUrl: "", form: "gas",   sinkPoints: 0,  stackSize: 0 },
};

const mineableItemIds = [
  "iron-ore",
  "copper-ore",
  "limestone",
  "coal",
  "caterium-ore",
  "raw-quartz",
  "sulfur",
  "bauxite",
  "uranium",
  "sam",
];

const resourceWellItemIds = ["nitrogen-gas"];

const buildings: Record<string, Building> = {
  "miner-mk1":       { id: "miner-mk1",       displayName: "Miner Mk1",       category: "miner",           basePowerMW: 5,   powerIsVariable: false, somersloopSlots: 0 },
  "miner-mk2":       { id: "miner-mk2",       displayName: "Miner Mk2",       category: "miner",           basePowerMW: 15,  powerIsVariable: false, somersloopSlots: 0 },
  "miner-mk3":       { id: "miner-mk3",       displayName: "Miner Mk3",       category: "miner",           basePowerMW: 45,  powerIsVariable: false, somersloopSlots: 0 },
  "water-extractor": { id: "water-extractor", displayName: "Water Extractor", category: "water-extractor", basePowerMW: 20,  powerIsVariable: false, somersloopSlots: 0 },
  "oil-pump":        { id: "oil-pump",        displayName: "Oil Extractor",   category: "oil-pump",        basePowerMW: 40,  powerIsVariable: false, somersloopSlots: 0 },
  "smelter":         { id: "smelter",         displayName: "Smelter",         category: "smelter",         basePowerMW: 4,   powerIsVariable: false, somersloopSlots: 1 },
  "constructor-bldg":     { id: "constructor-bldg",     displayName: "Constructor",     category: "constructor",         basePowerMW: 4,   powerIsVariable: false, somersloopSlots: 1 },
  "assembler":       { id: "assembler",       displayName: "Assembler",       category: "assembler",       basePowerMW: 15,  powerIsVariable: false, somersloopSlots: 2 },
  "refinery":        { id: "refinery",        displayName: "Refinery",        category: "refinery",        basePowerMW: 30,  powerIsVariable: false, somersloopSlots: 2 },
  "packager":        { id: "packager",        displayName: "Packager",        category: "packager",        basePowerMW: 10,  powerIsVariable: false, somersloopSlots: 0 },
  "awesome-sink":    { id: "awesome-sink",    displayName: "AWESOME Sink",    category: "awesome-sink",    basePowerMW: 30,  powerIsVariable: false, somersloopSlots: 0 },
};

const recipes: Record<string, Recipe> = {
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
    id: "recipe-iron-plate", displayName: "Iron Plate", buildingId: "constructor-bldg", isAlternate: false, durationSeconds: 6,
    inputs:  [{ itemId: "iron-ingot", amountPerCycle: 3 }],
    outputs: [{ itemId: "iron-plate", amountPerCycle: 2 }],
  },
  "recipe-iron-rod": {
    id: "recipe-iron-rod", displayName: "Iron Rod", buildingId: "constructor-bldg", isAlternate: false, durationSeconds: 4,
    inputs:  [{ itemId: "iron-ingot", amountPerCycle: 1 }],
    outputs: [{ itemId: "iron-rod", amountPerCycle: 1 }],
  },
  "recipe-screw": {
    id: "recipe-screw", displayName: "Screw", buildingId: "constructor-bldg", isAlternate: false, durationSeconds: 6,
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
};

// Curated subset of Satisfactory 1.1 data for tests and early UI development.
// Numbers verified against satisfactory.wiki.gg in May 2026.
export const sampleGameData: GameData = {
  version: "1.1-sample",
  items,
  buildings,
  recipes,
  mineableItemIds,
  resourceWellItemIds,
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
