# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- **api-server** (`artifacts/api-server`) — Express API scaffold (not started by default).
- **mockup-sandbox** (`artifacts/mockup-sandbox`) — Canvas component preview server.
- **metroidvania** (`artifacts/metroidvania`) — "Hollow Depths", a 2D Metroidvania built in React + Vite.
  - Canvas-rendered (no sprite assets), dark purple/teal aesthetic.
  - Game engine in `src/game/`: constants, types, input, physics, player, enemies, world, game, render.
  - Title screen + RAF loop with fixed 60Hz timestep in `src/pages/Game.tsx`.
  - 4 interconnected rooms with ability-gated progression (double jump, dash), save shrines, HP system, and a boss.
  - Controls: arrows/WASD move, Z/K/Space jump, X/L/Shift dash, C/J strike, Esc/P pause.
