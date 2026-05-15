import type { Building, GameData, Item, Recipe } from "./types";

import itemsJson from "./items.json";
import recipesJson from "./recipes.json";
import infoJson from "./game-info.json";

/**
 * Assembled game data the app consumes at runtime. Backed by three JSON
 * files generated from greeny's Update-6 dump plus 1.0+ hand-patches:
 *
 *   src/data/items.json     - 131 items (every item referenced by a recipe
 *                              or available as a mineable / fluid source)
 *   src/data/recipes.json   - 211 machine-craftable recipes (default + alt)
 *   src/data/game-info.json - 17 production buildings, miner output table,
 *                              belt / pipe tiers, mineable + resource-well ids
 *
 * To regenerate from your own game's Docs.json (1.1) once we wire the
 * proper parser through, see scripts/transform-greeny.ts and the per-Mk
 * power / cap constants below. Tests use `sampleGameData` (a small curated
 * subset) so they remain stable across game patches.
 */
export const gameData: GameData = {
  version: infoJson.version,
  items: itemsJson as Record<string, Item>,
  recipes: recipesJson as Record<string, Recipe>,
  buildings: infoJson.buildings as Record<string, Building>,
  mineableItemIds: infoJson.mineableItemIds,
  resourceWellItemIds: infoJson.resourceWellItemIds,
  minerOutputPerMin: infoJson.minerOutputPerMin,
  beltTierPerMin: infoJson.beltTierPerMin,
  pipeTierPerMin: infoJson.pipeTierPerMin,
  waterExtractorPerMin: infoJson.waterExtractorPerMin,
  oilPumpPerMin: infoJson.oilPumpPerMin,
  resourceWellSatellitePerMin: infoJson.resourceWellSatellitePerMin,
};
