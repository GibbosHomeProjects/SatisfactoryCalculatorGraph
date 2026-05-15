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

  it("miner Mk3 pure at 300% caps at 1200/min (Mk6 belt limit)", () => {
    // raw would be 480 * 3 = 1440, but game caps at 1200
    expect(minerOutput(sampleGameData, "mk3", "pure", 300)).toBe(1200);
  });

  it("miner Mk3 pure at 250% = 1200/min (at the cap)", () => {
    expect(minerOutput(sampleGameData, "mk3", "pure", 250)).toBe(1200);
  });

  it("miner Mk3 normal at 300% = 720/min (under cap, no clamp)", () => {
    expect(minerOutput(sampleGameData, "mk3", "normal", 300)).toBe(720);
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
