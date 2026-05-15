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
