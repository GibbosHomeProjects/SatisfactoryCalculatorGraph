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
