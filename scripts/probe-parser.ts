/* eslint-disable @typescript-eslint/no-explicit-any */
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseDocs } from "satisfactory-docs-parser";

async function main() {
  const raw = await fs.readFile(path.resolve(".local-game-data/Docs.json"), "utf-8");
  const parsed: any = parseDocs(raw);
  const sample = {
    itemKeys: Object.keys(parsed.items ?? {}).slice(0, 3),
    item0: Object.values(parsed.items ?? {})[0],
    buildableKeys: Object.keys(parsed.buildables ?? {}).slice(0, 3),
    buildable0: Object.values(parsed.buildables ?? {})[0],
    recipeKeys: Object.keys(parsed.recipes ?? {}).slice(0, 3),
    recipe0: Object.values(parsed.recipes ?? {})[0],
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
