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

  it("Iron Ingot recipe at 100% needs 30 ore/min/machine", () => {
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

  it("machineCount limited by minimum input: Pure Iron Ingot 60 ore + 4 water -> 0.2 machines", () => {
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
