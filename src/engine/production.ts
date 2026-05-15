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
