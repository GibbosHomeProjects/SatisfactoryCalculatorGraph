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
