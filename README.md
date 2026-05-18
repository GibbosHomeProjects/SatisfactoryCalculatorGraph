# Satisfactory Calculator

A node-based production planner for [Satisfactory](https://www.satisfactorygame.com/) — visualise and optimise your factory pipelines in a graph editor with real-time bottleneck analysis.

![Tech Stack](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite) ![Tests](https://img.shields.io/badge/tests-53%20passing-brightgreen)

## Features

- **Graph-based planner** — drag-and-drop nodes connected by flow edges; the graph updates live as you wire things together
- **Full extractor support** — Miners, Oil Pumps, Water Extractors, and Resource Wells each have their own node type with correct rate formulas
- **Machine nodes** — pick any recipe, set clock speed (%), assign Somersloops, and see exact machine counts, power draw (MW), and output rates per minute
- **AWESOME Sink node** — tracks points per minute and estimates time to next coupon
- **Bottleneck analysis** — the engine continuously computes under-supply and flags hot nodes; the summary bar and inspector surface coaching tips
- **Inspector panel** — click any node to edit its parameters in a stats grid sidebar
- **Palette** — searchable recipe/extractor palette to add nodes without leaving the canvas
- **Project management** — multiple named projects with auto-save (debounced to 300 ms)
- **Neon theme** — cyan/magenta accent glow, dark grid backdrop

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| Graph canvas | [@xyflow/react](https://reactflow.dev/) 12 |
| State | Zustand 5 |
| Styling | Tailwind CSS 3 |
| Build | Vite 8 + TypeScript 6 |
| Tests | Vitest 4 (53 tests) |
| Game data | satisfactory-docs-parser |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

```
src/
├── engine/          # Pure computation (rates, power, bottleneck, sink points)
├── graph/
│   ├── nodes/       # React Flow node components (Machine, Miner, Sink, …)
│   ├── edges/       # Styled flow edges
│   ├── store.ts     # Zustand graph store
│   ├── useComputed  # Memoised per-node derived values
│   └── useBottleneck# Bottleneck analysis hook
├── ui/              # Inspector, Palette, SummaryBar, ProjectBar
├── storage/         # Project persistence (localStorage)
└── data/            # Generated game data (recipes, buildings, items)
```

## Regenerating Game Data

The recipe/building data is pre-generated from the Satisfactory Docs. To regenerate after a game update:

```bash
npm run gen:data
```

## License

MIT
