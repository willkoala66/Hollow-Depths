import { ROOM_H, ROOM_W, TILE } from "./constants";
import type { RoomDef } from "./types";

function parseTiles(rows: string[]): number[][] {
  if (rows.length !== ROOM_H) {
    throw new Error(
      `Room must have ${ROOM_H} rows, got ${rows.length}`,
    );
  }
  return rows.map((row, y) => {
    if (row.length !== ROOM_W) {
      throw new Error(
        `Row ${y} must be ${ROOM_W} cols, got ${row.length}: "${row}"`,
      );
    }
    const out: number[] = new Array(ROOM_W);
    for (let x = 0; x < ROOM_W; x++) {
      const c = row[x];
      if (c === "#") out[x] = 1;
      else if (c === "^") out[x] = 2;
      else out[x] = 0;
    }
    return out;
  });
}

const antechamberRows = [
  "##############################",
  "##############################",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#..............####..........#",
  "#............................#",
  "#......####..................#",
  "#............................#",
  "#............................#",
  " ............................ ",
  " ............................ ",
  "##############################",
  "##############################",
];

const cisternRows = [
  "##############################",
  "##############################",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#......####.........####.....#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#..########............#####.#",
  "#............................#",
  "#............................#",
  "#............................ ",
  "#............................ ",
  "##############################",
  "##############################",
];

const tunnelRows = [
  "##############################",
  "##############################",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#......................####..#",
  "#............................#",
  "#............................#",
  "#..######....................#",
  "#............................#",
  "#............................#",
  "............................. ",
  "............................. ",
  "............................. ",
  "............................. ",
  "##############################",
  "##############################",
];

const abyssRows = [
  "#############...##############",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#......####..................#",
  "#............................#",
  "#............................#",
  "#..................####......#",
  "#............................#",
  "#............................#",
  "#......####..................#",
  "#............................ ",
  "#............................ ",
  "##############################",
  "##############################",
];

const reachRows = [
  "##############################",
  "##############################",
  "#............................#",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#..####................####..#",
  "#............................#",
  "#............................#",
  "#............................#",
  " ............................#",
  " ............................#",
  "##############################",
  "##############################",
];

const vaultRows = [
  "##############...#############",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#......####..................#",
  "#............................#",
  "#............................#",
  "#..................####......#",
  "#............................#",
  "#............................#",
  "#......####..................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "##############################",
  "##############################",
];

const bossLairRows = [
  "##############################",
  "##############################",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............#####...........#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#....####............####....#",
  "#............................#",
  "#............................#",
  "#............................ ",
  "#............................ ",
  "##############################",
  "##############################",
];

const riftRows = [
  "##############################",
  "##############################",
  "#............................#",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............####............#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  " ............................ ",
  " ............................ ",
  "##############################",
  "##############################",
];

const forgeRows = [
  "##############################",
  "##############################",
  "#............................#",
  "#............................#",
  "#............................#",
  "#......####.........#####....#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#..####................####..#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................#",
  " ............................ ",
  " ............................ ",
  "##############################",
  "##############################",
];

// ============================================================================
// SUBLAYER 2 — The Hollow Labyrinth
// A maze of corrupted halls beneath the cistern, hunted by The Sovereign.
// ============================================================================

// Top opening (cols 13-16) for return portal back to cistern.
// Right opening (rows 14-15) to sl2_north.
// Bottom opening (cols 6-9) drops down to sl2_west.
const sl2EntryRows = [
  "#############....#############",
  "#############....#############",
  "#............................#",
  "#............................#",
  "#............................#",
  "#......####.........####.....#",
  "#............................#",
  "#............................#",
  "#............####............#",
  "#............................#",
  "#............................#",
  "#..####................####..#",
  "#............................#",
  "#............................#",
  "#............................ ",
  "#............................ ",
  "######....####################",
  "######....####################",
];

// Left opening to sl2_entry. Right opening to sl2_pierce_shrine.
// Bottom opening (cols 13-16) to sl2_hub.
const sl2NorthRows = [
  "##############################",
  "##############################",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............................#",
  "#............####............#",
  "#............................#",
  "#............................#",
  " ............................ ",
  " ............................ ",
  "#############....#############",
  "#############....#############",
];

// Left opening to sl2_north. Bottom opening (cols 13-16) to sl2_east.
// Pierce shrine pickup at the heart of this room.
const sl2PierceRows = [
  "##############################",
  "##############################",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#..######............######..#",
  "#............................#",
  "#............................#",
  "#............####............#",
  "#............................#",
  "#............................#",
  " ............................#",
  " ............................#",
  "#############....#############",
  "#############....#############",
];

// Top opening (cols 6-9) from sl2_entry. Right opening to sl2_hub.
const sl2WestRows = [
  "######....####################",
  "######....####################",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............................#",
  "#............####............#",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................ ",
  "#............................ ",
  "##############################",
  "##############################",
];

// Top opening (cols 13-16) from sl2_north. Left opening to sl2_west.
// Right opening to sl2_east. Save shrine here at the labyrinth's heart.
const sl2HubRows = [
  "#############....#############",
  "#############....#############",
  "#............................#",
  "#............................#",
  "#..####.................####.#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............................#",
  "#............####............#",
  "#............................#",
  "#............................#",
  " ............................ ",
  " ............................ ",
  "##############################",
  "##############################",
];

// Top opening (cols 13-16) from sl2_pierce_shrine. Left opening to sl2_hub.
const sl2EastRows = [
  "#############....#############",
  "#############....#############",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............................#",
  "#............####............#",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............####............#",
  "#............................#",
  " ............................#",
  " ............................#",
  "##############################",
  "##############################",
];

const sanctumRows = [
  "##############################",
  "##############################",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............####............#",
  "#............................#",
  "#............................#",
  "#......####..........####....#",
  "#............................#",
  "#............................#",
  " ............................#",
  " ............................#",
  "##############################",
  "##############################",
];

export const ROOMS: Record<string, RoomDef> = {
  antechamber: {
    id: "antechamber",
    name: "Antechamber",
    sublayer: 1,
    tiles: parseTiles(antechamberRows),
    enemies: [],
    pickups: [
      // Early dash relic on the higher platform (row 9, cols 14-17)
      {
        kind: "ability",
        ability: "dash",
        x: 16 * TILE - 9,
        y: 8 * TILE + 6,
        id: "dash-antechamber",
      },
    ],
    doors: [
      {
        x: 29 * TILE,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "tunnel",
        toX: 2 * TILE,
        toY: 14 * TILE,
        facing: "right",
      },
      {
        x: 0,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "cistern",
        toX: 27 * TILE,
        toY: 14 * TILE,
        facing: "left",
      },
    ],
    saves: [{ x: 4 * TILE, y: 15 * TILE - 4 }],
  },
  cistern: {
    id: "cistern",
    name: "The Still Cistern",
    sublayer: 1,
    tiles: parseTiles(cisternRows),
    enemies: [
      {
        kind: "slime",
        x: 18 * TILE,
        y: 15 * TILE,
        patrolMin: 14 * TILE,
        patrolMax: 26 * TILE,
      },
    ],
    pickups: [],
    doors: [
      {
        x: 29 * TILE,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "antechamber",
        toX: 2 * TILE,
        toY: 14 * TILE,
        facing: "right",
      },
      // Abyssal portal — opens after the Sovereign falls.
      // Drop straight down into Sublayer 2.
      {
        x: 5 * TILE,
        y: 15 * TILE,
        w: TILE * 4,
        h: TILE * 3,
        toRoom: "sl2_entry",
        toX: 14 * TILE,
        toY: 4 * TILE,
        facing: "down",
        requiresSovereign: true,
      },
    ],
  },
  tunnel: {
    id: "tunnel",
    name: "Cracked Tunnel",
    sublayer: 1,
    tiles: parseTiles(tunnelRows),
    enemies: [
      {
        kind: "slime",
        x: 18 * TILE,
        y: 15 * TILE,
        patrolMin: 20 * TILE,
        patrolMax: 28 * TILE,
      },
      {
        kind: "bat",
        x: 15 * TILE,
        y: 4 * TILE,
        patrolMin: 12 * TILE,
        patrolMax: 18 * TILE,
      },
    ],
    pickups: [],
    doors: [
      {
        x: 0,
        y: 12 * TILE,
        w: TILE,
        h: TILE * 4,
        toRoom: "antechamber",
        toX: 27 * TILE,
        toY: 14 * TILE,
        facing: "left",
      },
      {
        x: 29 * TILE,
        y: 12 * TILE,
        w: TILE,
        h: TILE * 4,
        toRoom: "boss_lair",
        toX: 2 * TILE,
        toY: 14 * TILE,
        facing: "right",
        requires: ["doubleJump", "dash"],
      },
      // Drop down at cracked floor (cols 10-19); rect extends above so a
      // grounded player overlaps it and can press down to fall through.
      {
        x: 10 * TILE,
        y: 15 * TILE,
        w: TILE * 10,
        h: TILE * 3,
        toRoom: "abyss",
        toX: 14 * TILE,
        toY: 2 * TILE,
        facing: "down",
      },
    ],
  },
  abyss: {
    id: "abyss",
    name: "The Abyss",
    sublayer: 1,
    tiles: parseTiles(abyssRows),
    enemies: [
      {
        kind: "bat",
        x: 8 * TILE,
        y: 9 * TILE,
        patrolMin: 4 * TILE,
        patrolMax: 12 * TILE,
      },
      {
        kind: "bat",
        x: 22 * TILE,
        y: 6 * TILE,
        patrolMin: 18 * TILE,
        patrolMax: 26 * TILE,
      },
      {
        kind: "turret",
        x: 27 * TILE,
        y: 14 * TILE,
        hp: 3,
      },
    ],
    pickups: [
      {
        kind: "ability",
        ability: "doubleJump",
        x: 14 * TILE,
        y: 15 * TILE - 4,
        id: "dj-abyss",
      },
    ],
    doors: [
      {
        x: 13 * TILE,
        y: 0,
        w: TILE * 3,
        h: TILE,
        toRoom: "tunnel",
        toX: 14 * TILE,
        toY: 14 * TILE,
        facing: "up",
        requires: "doubleJump",
      },
      {
        x: 29 * TILE,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "reach",
        toX: 2 * TILE,
        toY: 14 * TILE,
        facing: "right",
        requires: "doubleJump",
      },
    ],
    saves: [{ x: 2 * TILE, y: 15 * TILE - 4 }],
  },
  reach: {
    id: "reach",
    name: "Wraith's Reach",
    sublayer: 1,
    tiles: parseTiles(reachRows),
    enemies: [
      {
        kind: "bat",
        x: 10 * TILE,
        y: 7 * TILE,
        patrolMin: 4 * TILE,
        patrolMax: 14 * TILE,
      },
      {
        kind: "bat",
        x: 22 * TILE,
        y: 4 * TILE,
        patrolMin: 18 * TILE,
        patrolMax: 26 * TILE,
      },
      {
        kind: "turret",
        x: 26 * TILE,
        y: 9 * TILE,
        hp: 3,
      },
    ],
    pickups: [],
    doors: [
      {
        x: 0,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "abyss",
        toX: 27 * TILE,
        toY: 14 * TILE,
        facing: "left",
      },
      // Drop down through the floor into the Sunken Vault
      {
        x: 12 * TILE,
        y: 15 * TILE,
        w: TILE * 6,
        h: TILE * 3,
        toRoom: "vault",
        toX: 14 * TILE,
        toY: 2 * TILE,
        facing: "down",
      },
    ],
  },
  vault: {
    id: "vault",
    name: "Sunken Vault",
    sublayer: 1,
    tiles: parseTiles(vaultRows),
    enemies: [
      {
        kind: "turret",
        x: 4 * TILE,
        y: 14 * TILE,
        hp: 3,
      },
    ],
    pickups: [
      {
        kind: "vessel",
        x: 26 * TILE - 9,
        y: 15 * TILE - 18,
        id: "vessel-vault",
      },
    ],
    doors: [
      {
        x: 14 * TILE,
        y: 0,
        w: TILE * 3,
        h: TILE,
        toRoom: "reach",
        toX: 14 * TILE,
        toY: 14 * TILE,
        facing: "up",
        requires: "doubleJump",
      },
    ],
    saves: [{ x: 15 * TILE, y: 15 * TILE - 4 }],
  },
  boss_lair: {
    id: "boss_lair",
    name: "Hollow's Throne",
    sublayer: 1,
    tiles: parseTiles(bossLairRows),
    enemies: [
      {
        kind: "boss",
        x: 15 * TILE - 30,
        y: 14 * TILE - 28,
        hp: 24,
      },
    ],
    pickups: [],
    doors: [
      {
        x: 0,
        y: 12 * TILE,
        w: TILE,
        h: TILE * 4,
        toRoom: "tunnel",
        toX: 27 * TILE,
        toY: 14 * TILE,
        facing: "left",
      },
      {
        x: 29 * TILE,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "rift",
        toX: 2 * TILE,
        toY: 14 * TILE,
        facing: "right",
        requiresBoss: true,
      },
    ],
  },
  rift: {
    id: "rift",
    name: "Cinder Rift",
    sublayer: 1,
    tiles: parseTiles(riftRows),
    enemies: [
      {
        kind: "wraith",
        x: 12 * TILE,
        y: 7 * TILE,
        patrolMin: 4 * TILE,
        patrolMax: 18 * TILE,
      },
      {
        kind: "wraith",
        x: 22 * TILE,
        y: 4 * TILE,
        patrolMin: 16 * TILE,
        patrolMax: 26 * TILE,
      },
    ],
    pickups: [],
    doors: [
      {
        x: 0,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "boss_lair",
        toX: 27 * TILE,
        toY: 14 * TILE,
        facing: "left",
      },
      {
        x: 29 * TILE,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "forge",
        toX: 2 * TILE,
        toY: 14 * TILE,
        facing: "right",
      },
    ],
  },
  forge: {
    id: "forge",
    name: "Ember Forge",
    sublayer: 1,
    tiles: parseTiles(forgeRows),
    enemies: [
      {
        kind: "turret",
        x: 7 * TILE,
        y: 8 * TILE,
        hp: 3,
      },
      {
        kind: "wraith",
        x: 18 * TILE,
        y: 6 * TILE,
        patrolMin: 12 * TILE,
        patrolMax: 26 * TILE,
      },
    ],
    pickups: [
      {
        kind: "ability",
        ability: "pierce",
        x: 22 * TILE - 9,
        y: 8 * TILE + 6,
        id: "pierce-forge",
      },
      {
        kind: "vessel",
        x: 4 * TILE,
        y: 15 * TILE - 18,
        id: "vessel-forge",
      },
    ],
    doors: [
      {
        x: 0,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "rift",
        toX: 27 * TILE,
        toY: 14 * TILE,
        facing: "left",
      },
      {
        x: 29 * TILE,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "sanctum",
        toX: 2 * TILE,
        toY: 14 * TILE,
        facing: "right",
        requiresBoss: true,
      },
    ],
    saves: [{ x: 15 * TILE, y: 15 * TILE - 4 }],
  },
  sanctum: {
    id: "sanctum",
    name: "Sovereign's Sanctum",
    sublayer: 1,
    tiles: parseTiles(sanctumRows),
    enemies: [
      {
        kind: "sovereign",
        x: 15 * TILE - 34,
        y: 14 * TILE - 36,
        hp: 32,
      },
    ],
    pickups: [],
    saves: [{ x: 14 * TILE, y: 15 * TILE - 4 }],
    doors: [
      {
        x: 0,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "forge",
        toX: 27 * TILE,
        toY: 14 * TILE,
        facing: "left",
      },
    ],
  },
  // ================== SUBLAYER 2 ==================
  sl2_entry: {
    id: "sl2_entry",
    name: "Hollow Threshold",
    sublayer: 2,
    tiles: parseTiles(sl2EntryRows),
    enemies: [],
    pickups: [
      // Phantom Veil — central platform at row 8 (cols 12-15)
      {
        kind: "ability",
        ability: "phantom",
        x: 14 * TILE,
        y: 7 * TILE - 2,
        id: "phantom-sl2",
      },
    ],
    doors: [
      // Return portal up to cistern (top opening, cols 13-16)
      {
        x: 13 * TILE,
        y: 0,
        w: TILE * 4,
        h: TILE * 2,
        toRoom: "cistern",
        toX: 6 * TILE,
        toY: 13 * TILE,
        facing: "up",
      },
      // Right corridor to sl2_north
      {
        x: 29 * TILE,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "sl2_north",
        toX: 2 * TILE,
        toY: 13 * TILE,
        facing: "right",
      },
      // Drop down to sl2_west (bottom opening, cols 6-9)
      {
        x: 6 * TILE,
        y: 15 * TILE,
        w: TILE * 4,
        h: TILE * 3,
        toRoom: "sl2_west",
        toX: 7 * TILE,
        toY: 3 * TILE,
        facing: "down",
      },
    ],
    saves: [{ x: 22 * TILE, y: 13 * TILE }],
  },
  sl2_north: {
    id: "sl2_north",
    name: "Whispering Halls",
    sublayer: 2,
    tiles: parseTiles(sl2NorthRows),
    enemies: [],
    pickups: [],
    doors: [
      // Left back to sl2_entry
      {
        x: 0,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "sl2_entry",
        toX: 27 * TILE,
        toY: 13 * TILE,
        facing: "left",
      },
      // Right to pierce shrine
      {
        x: 29 * TILE,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "sl2_pierce_shrine",
        toX: 2 * TILE,
        toY: 13 * TILE,
        facing: "right",
      },
      // Drop down to hub (bottom opening, cols 13-16)
      {
        x: 13 * TILE,
        y: 15 * TILE,
        w: TILE * 4,
        h: TILE * 3,
        toRoom: "sl2_hub",
        toX: 14 * TILE,
        toY: 3 * TILE,
        facing: "down",
      },
    ],
  },
  sl2_pierce_shrine: {
    id: "sl2_pierce_shrine",
    name: "Shard Sanctum",
    sublayer: 2,
    tiles: parseTiles(sl2PierceRows),
    enemies: [],
    pickups: [
      // Recovered Pierce Shard — central platform at row 11 (cols 12-15)
      {
        kind: "ability",
        ability: "pierce",
        x: 14 * TILE,
        y: 10 * TILE - 2,
        id: "pierce-sl2",
      },
    ],
    doors: [
      // Left back to sl2_north
      {
        x: 0,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "sl2_north",
        toX: 27 * TILE,
        toY: 13 * TILE,
        facing: "left",
      },
      // Drop down to sl2_east (cols 13-16)
      {
        x: 13 * TILE,
        y: 15 * TILE,
        w: TILE * 4,
        h: TILE * 3,
        toRoom: "sl2_east",
        toX: 14 * TILE,
        toY: 3 * TILE,
        facing: "down",
      },
    ],
  },
  sl2_west: {
    id: "sl2_west",
    name: "Veiled Drift",
    sublayer: 2,
    tiles: parseTiles(sl2WestRows),
    enemies: [],
    pickups: [],
    doors: [
      // Up portal back to sl2_entry (top opening, cols 6-9)
      {
        x: 6 * TILE,
        y: 0,
        w: TILE * 4,
        h: TILE * 2,
        toRoom: "sl2_entry",
        toX: 7 * TILE,
        toY: 13 * TILE,
        facing: "up",
      },
      // Right to hub
      {
        x: 29 * TILE,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "sl2_hub",
        toX: 2 * TILE,
        toY: 13 * TILE,
        facing: "right",
      },
    ],
  },
  sl2_hub: {
    id: "sl2_hub",
    name: "Heart of the Labyrinth",
    sublayer: 2,
    tiles: parseTiles(sl2HubRows),
    enemies: [],
    pickups: [],
    doors: [
      // Up to sl2_north (top opening, cols 13-16)
      {
        x: 13 * TILE,
        y: 0,
        w: TILE * 4,
        h: TILE * 2,
        toRoom: "sl2_north",
        toX: 14 * TILE,
        toY: 13 * TILE,
        facing: "up",
      },
      // Left to sl2_west
      {
        x: 0,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "sl2_west",
        toX: 27 * TILE,
        toY: 13 * TILE,
        facing: "left",
      },
      // Right to sl2_east
      {
        x: 29 * TILE,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "sl2_east",
        toX: 2 * TILE,
        toY: 13 * TILE,
        facing: "right",
      },
    ],
    saves: [{ x: 14 * TILE, y: 13 * TILE }],
  },
  sl2_east: {
    id: "sl2_east",
    name: "Echoing Conduit",
    sublayer: 2,
    tiles: parseTiles(sl2EastRows),
    enemies: [],
    pickups: [],
    doors: [
      // Up to pierce shrine (top opening, cols 13-16)
      {
        x: 13 * TILE,
        y: 0,
        w: TILE * 4,
        h: TILE * 2,
        toRoom: "sl2_pierce_shrine",
        toX: 14 * TILE,
        toY: 13 * TILE,
        facing: "up",
      },
      // Left to hub
      {
        x: 0,
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
        toRoom: "sl2_hub",
        toX: 27 * TILE,
        toY: 13 * TILE,
        facing: "left",
      },
    ],
  },
};

// Adjacency map for the Sovereign hunter to BFS-pathfind through Sublayer 2.
export const SL2_ADJ: Record<string, string[]> = {
  sl2_entry: ["sl2_north", "sl2_west"],
  sl2_north: ["sl2_entry", "sl2_pierce_shrine", "sl2_hub"],
  sl2_pierce_shrine: ["sl2_north", "sl2_east"],
  sl2_west: ["sl2_entry", "sl2_hub"],
  sl2_hub: ["sl2_north", "sl2_west", "sl2_east"],
  sl2_east: ["sl2_pierce_shrine", "sl2_hub"],
};

export const STARTING_ROOM = "antechamber";
export const STARTING_POS = { x: 4 * TILE, y: 14 * TILE };
