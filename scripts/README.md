# Data Generation Scripts

These scripts produce `src/data/satisfactory-1.1.json` from the official Satisfactory
`Docs.json` distributed with the game. Until you run them, the app falls back to the
hand-curated `src/data/sample.ts` fixture (a small subset of items, buildings, and recipes
sufficient for tests and basic UI work).

## How to run

1. **Get `Docs.json`.** Two options:
   - **From your game install:** copy from
     `<SATISFACTORY-INSTALL>/CommunityResources/Docs/Docs.json` to `.local-game-data/Docs.json`
     in this project (`.local-game-data/` is gitignored).
   - **From a pre-extracted dump:** download from
     <https://github.com/dmryabov/satisfactory-docs-files> and save as
     `.local-game-data/Docs.json`.

2. **Probe the parser output once** to confirm field names match this codebase's
   expectations (the `satisfactory-docs-parser` package occasionally renames fields
   between versions):

   ```bash
   npx tsx scripts/probe-parser.ts
   ```

   Open `.local-game-data/parser-probe.json` and compare its `item0`, `buildable0`,
   `recipe0` keys against the `FIELDS` map in `scripts/generate-data.ts`. Update any
   accessor whose path doesn't match.

3. **Generate the bundle:**

   ```bash
   npm run gen:data
   ```

   This writes `src/data/satisfactory-1.1.json`. The bundle is committed; re-run only when
   the game updates or you change the parser.

## Resource-Well satellite outputs

The generator does **not** auto-populate `resourceWellSatellitePerMin`. Per-satellite
output by purity and fluid type isn't directly exposed in `Docs.json` in a format the
parser surfaces; verify against the
[Satisfactory Wiki](https://satisfactory.wiki.gg/wiki/Resource_Well) and either
hand-edit the generated JSON or extend `generate-data.ts` to fill the table.

## Swapping the app to the generated bundle

Once `src/data/satisfactory-1.1.json` exists with the full data, replace the
`@/data/sample` imports across `src/` with a single barrel:

```ts
// src/data/index.ts
import data from "./satisfactory-1.1.json";
import type { GameData } from "./types";
export const gameData = data as unknown as GameData;
```

Then global-replace `sampleGameData` → `gameData` and `@/data/sample` → `@/data`.
Keep `sample.ts` for unit tests so they're stable across game patches.
