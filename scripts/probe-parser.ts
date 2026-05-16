/* eslint-disable @typescript-eslint/no-explicit-any */
import { promises as fs } from "node:fs";
import path from "node:path";
import parseDocs from "satisfactory-docs-parser";

async function main() {
  const raw = await fs.readFile(path.resolve(".local-game-data/Docs.json"));
  const parsed: any = parseDocs(raw);
  const sample = {
    topKeys: Object.keys(parsed),
    itemKeys: Object.keys(parsed.items ?? {}).slice(0, 3),
    item0: Object.values(parsed.items ?? {})[0],
    resourceKeys: Object.keys(parsed.resources ?? {}).slice(0, 3),
    resource0: Object.values(parsed.resources ?? {})[0],
    buildableKeys: Object.keys(parsed.buildables ?? {}).slice(0, 3),
    buildableSmelter: Object.values(parsed.buildables ?? {}).find((b: any) =>
      /smelter/i.test(b.slug ?? ""),
    ),
    buildableHadron: Object.values(parsed.buildables ?? {}).find((b: any) =>
      /hadron|particle/i.test(b.slug ?? ""),
    ),
    productionRecipeKeys: Object.keys(parsed.productionRecipes ?? {}).slice(0, 3),
    productionRecipe0: Object.values(parsed.productionRecipes ?? {})[0],
  };
  await fs.writeFile(
    path.resolve(".local-game-data/parser-probe.json"),
    JSON.stringify(sample, null, 2),
  );
  console.log("Wrote .local-game-data/parser-probe.json — open it to see fields.");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
