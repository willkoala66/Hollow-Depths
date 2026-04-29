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
  - Canvas-rendered (no sprite assets), dark purple/teal (Sublayer 1) and crimson (Sublayer 2) aesthetic.
  - Game engine in `src/game/`: constants, types, input, physics, player, enemies, world, game, render.
  - Title screen + RAF loop with fixed 60Hz timestep in `src/pages/Game.tsx`.
  - **Sublayer 1 — Hollow Depths**: 10 interconnected rooms (cistern, antechamber, tunnel, boss_lair, rift, forge, sanctum, abyss, reach, vault) with ability-gated progression (double jump, dash, soul shard, pierce shard), save shrines, vessels, the Hollow boss, and the Ember Sovereign.
  - **Sublayer 2 — The Hollow Labyrinth**: 6 rooms (sl2_entry, sl2_north, sl2_pierce_shrine, sl2_west, sl2_hub, sl2_east) unlocked by defeating the Sovereign in Sanctum (drop portal in cistern). Defeating the Sovereign costs the player the Pierce Shard. Sublayer 2 introduces the **Phantom Veil** ability (hold Q/F to fade and slow — slip past the Hunter) and re-grants pierce at the Pierce Shrine. The Sovereign returns as a roving wraith Hunter that pursues the player across rooms via BFS adjacency; only Pierce Shard projectiles damage it. Killing the Hunter is the true ending.
  - Controls: arrows/WASD move, Z/K/Space jump, X/L/Shift dash, C/J strike, Q/F phantom veil (hold), Esc/P pause.
