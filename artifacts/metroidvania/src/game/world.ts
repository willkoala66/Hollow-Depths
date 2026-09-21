import { ROOM_H, ROOM_W, TALL_ROOM_H, TILE } from "./constants";
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

function parseTilesTall(rows: string[]): number[][] {
  if (rows.length !== TALL_ROOM_H) {
    throw new Error(
      `Tall room must have ${TALL_ROOM_H} rows, got ${rows.length}`,
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
  "#............................#",
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
  " ............................ ",
  " ............................ ",
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
// Bottom center opening (cols 13-16) drops down to sl3_entry after Hunter falls.
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
  "#############....#############",
  "#############....#############",
];

// ============================================================================
// SUBLAYER 3 — The Sunken Wound
// Ten rooms descending to the Ancient Terror (Kraid) — a vast wall boss.
// ============================================================================

// SL3 Room 1: Entry. Top opening (cols 13-16) back to sl2_hub. Right door.
const sl3EntryRows = [
  "#############....#############",
  "#############....#############",
  "#............................#",
  "#............................#",
  "#....######.........######...#",
  "#............................#",
  "#............................#",
  "#...######.........######....#",
  "#............................#",
  "#............................#",
  "#....######.........######...#",
  "#............................#",
  "#............................#",
  "#............................#",
  "#............................ ",
  "#............................ ",
  "##############################",
  "##############################",
];

// Shared helper rows for the advanced Sublayer 3 traversal rooms.
// The route alternates height and direction so players must use the double
// jump and dash deliberately. Landing surfaces remain 4-6 tiles wide.
type Sl3Platform = {
  row: number;
  start: number;
  width: number;
  spikes?: number[];
};

function makeSl3TraversalRows(platforms: Sl3Platform[]) {
  const rows = Array.from({ length: ROOM_H }, (_, row) => {
    if (row < 2) return "#".repeat(ROOM_W);
    if (row >= 14) return " ".repeat(ROOM_W);
    return `#${".".repeat(ROOM_W - 2)}#`;
  });

  // Side landings leave a safe reset point at either door.
  rows[16] = "######" + ".".repeat(18) + "######";
  rows[17] = "######" + ".".repeat(18) + "######";
  rows[14] = " " + ".".repeat(28) + " ";
  rows[15] = " " + ".".repeat(28) + " ";

  for (const platform of platforms) {
    const chars = rows[platform.row].split("");
    for (let x = platform.start; x < platform.start + platform.width; x++) {
      chars[x] = platform.spikes?.includes(x) ? "^" : "#";
    }
    rows[platform.row] = chars.join("");
  }
  return rows;
}

// SL3 Room 2: Hall A — a rising route, then a controlled drop to the exit.
const sl3HallARows = makeSl3TraversalRows([
  { row: 13, start: 6, width: 5 },
  { row: 10, start: 13, width: 5 },
  { row: 12, start: 21, width: 5 },
]);

// SL3 Room 3: Hall B — high/low zigzag with a double-jump opening.
const sl3HallBRows = makeSl3TraversalRows([
  { row: 11, start: 6, width: 5 },
  { row: 8, start: 13, width: 5 },
  { row: 12, start: 21, width: 5, spikes: [23] },
]);

// SL3 Room 4: Hall C — a three-stage climb with a high final landing.
const sl3HallCRows = makeSl3TraversalRows([
  { row: 13, start: 6, width: 5 },
  { row: 10, start: 12, width: 4 },
  { row: 7, start: 19, width: 5, spikes: [19] },
  { row: 11, start: 25, width: 4 },
]);

// SL3 Room 5: Parry Room — the pickup sits on the elevated middle route.
const sl3ParryRoomRows = makeSl3TraversalRows([
  { row: 12, start: 6, width: 5 },
  { row: 9, start: 13, width: 5 },
  { row: 12, start: 22, width: 5 },
]);

// SL3 Room 6: Lava Hall — four staggered platforms over the turret gauntlet.
const sl3LavaHallRows = makeSl3TraversalRows([
  { row: 13, start: 6, width: 5 },
  { row: 10, start: 12, width: 4, spikes: [14] },
  { row: 12, start: 18, width: 5 },
  { row: 9, start: 24, width: 4 },
]);

// SL3 Room 7: Hall D — alternating low/high landings punish a flat jump arc.
const sl3HallDRows = makeSl3TraversalRows([
  { row: 10, start: 6, width: 5 },
  { row: 13, start: 13, width: 5 },
  { row: 8, start: 20, width: 5 },
  { row: 12, start: 25, width: 4 },
]);

// SL3 Room 8: Ascent — a broad staircase that demands repeated double jumps.
const sl3AscentRows = makeSl3TraversalRows([
  { row: 13, start: 6, width: 5 },
  { row: 10, start: 11, width: 5 },
  { row: 7, start: 17, width: 5 },
  { row: 10, start: 24, width: 5, spikes: [26] },
]);

// SL3 Room 9: Approach — the final sustained climb before the Terror.
const sl3ApproachRows = makeSl3TraversalRows([
  { row: 12, start: 6, width: 5 },
  { row: 9, start: 12, width: 5 },
  { row: 6, start: 19, width: 4 },
  { row: 10, start: 24, width: 5 },
]);

// SL3 Room 10: Boss — tall 36-row arena. Kraid fills the right wall.
// Left door only (rows 16-17). Camera scrolls vertically to follow player.
// Three glowing cores: rows 8, 19, 31 (aligned with Kraid's weak spots).
const sl3BossRows = [
  "##############################",  //  0 ceiling
  "##############################",  //  1 ceiling
  "#............................#",  //  2
  "#............................#",  //  3
  "#............................#",  //  4
  "#............................#",  //  5
  "#............................#",  //  6
  "#............................#",  //  7
  "#.######.....................#",  //  8 LEFT platform — Core 1 height
  "#............................#",  //  9
  "#............................#",  // 10
  "#.######.....................#",  // 11 LEFT platform — climbing step
  "#............................#",  // 12
  "#.........#######............#",  // 13 RIGHT platform — near door
  "#............................#",  // 14
  "#.........#######............#",  // 15 RIGHT platform — near door
  " ............................#",  // 16 LEFT DOOR
  " ............................#",  // 17 LEFT DOOR
  "#............................#",  // 18
  "#.######.....................#",  // 19 LEFT platform — Core 2 height
  "#............................#",  // 20
  "#............................#",  // 21
  "#............................#",  // 22
  "#............................#",  // 23
  "#............................#",  // 24
  "#.........#######............#",  // 25 RIGHT platform — mid step
  "#............................#",  // 26
  "#............................#",  // 27
  "#............................#",  // 28
  "#............................#",  // 29
  "#............................#",  // 30
  "#.######.....................#",  // 31 LEFT platform — Core 3 height
  "#............................#",  // 32
  "#............................#",  // 33
  "##############################",  // 34 floor
  "##############################",  // 35 floor
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
        y: 14 * TILE,
        w: TILE,
        h: TILE * 2,
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
        x: 22 * TILE - 34,
        y: 14 * TILE - 36,
        hp: 27,
      },
    ],
    pickups: [],
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
      // Drop down into Sublayer 3 — opens once the Sovereign's Wraith is slain.
      {
        x: 13 * TILE,
        y: 15 * TILE,
        w: TILE * 4,
        h: TILE * 3,
        toRoom: "sl3_entry",
        toX: 14 * TILE,
        toY: 4 * TILE,
        facing: "down",
        requiresHunter: true,
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
  // ─── Sublayer 3 — The Sunken Wound (10 rooms) ────────────────────────────
  sl3_entry: {
    id: "sl3_entry",
    name: "The Sunken Wound",
    sublayer: 3,
    tiles: parseTiles(sl3EntryRows),
    enemies: [
      { kind: "wraith", x: 8 * TILE, y: 8 * TILE, patrolMin: 3 * TILE, patrolMax: 13 * TILE },
      { kind: "wraith", x: 20 * TILE, y: 8 * TILE, patrolMin: 15 * TILE, patrolMax: 26 * TILE },
    ],
    pickups: [],
    doors: [
      { x: 29 * TILE, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_hall_a", toX: 2 * TILE, toY: 14 * TILE, facing: "right" },
      { x: 13 * TILE, y: 0, w: TILE * 4, h: TILE * 2, toRoom: "sl2_hub", toX: 14 * TILE, toY: 13 * TILE, facing: "up" },
    ],
    saves: [{ x: 20 * TILE, y: 15 * TILE - 4 }],
  },
  sl3_hall_a: {
    id: "sl3_hall_a",
    name: "Sunken Corridor",
    sublayer: 3,
    tiles: parseTiles(sl3HallARows),
    enemies: [
      { kind: "bat", x: 6 * TILE, y: 5 * TILE, patrolMin: 2 * TILE, patrolMax: 10 * TILE },
      { kind: "bat", x: 22 * TILE, y: 5 * TILE, patrolMin: 16 * TILE, patrolMax: 27 * TILE },
      { kind: "slime", x: 14 * TILE, y: 15 * TILE, patrolMin: 8 * TILE, patrolMax: 22 * TILE },
    ],
    pickups: [],
    doors: [
      { x: 0, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_entry", toX: 27 * TILE, toY: 14 * TILE, facing: "left" },
      { x: 29 * TILE, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_hall_b", toX: 2 * TILE, toY: 14 * TILE, facing: "right" },
    ],
  },
  sl3_hall_b: {
    id: "sl3_hall_b",
    name: "Crumbling Gallery",
    sublayer: 3,
    tiles: parseTiles(sl3HallBRows),
    enemies: [
      { kind: "wraith", x: 7 * TILE, y: 8 * TILE, patrolMin: 3 * TILE, patrolMax: 12 * TILE },
      { kind: "wraith", x: 20 * TILE, y: 8 * TILE, patrolMin: 15 * TILE, patrolMax: 26 * TILE },
      { kind: "redturret", x: 14 * TILE, y: 14 * TILE, hp: 4 },
    ],
    pickups: [],
    doors: [
      { x: 0, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_hall_a", toX: 27 * TILE, toY: 14 * TILE, facing: "left" },
      { x: 29 * TILE, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_hall_c", toX: 2 * TILE, toY: 14 * TILE, facing: "right" },
    ],
  },
  sl3_hall_c: {
    id: "sl3_hall_c",
    name: "The Wound Widens",
    sublayer: 3,
    tiles: parseTiles(sl3HallCRows),
    enemies: [
      { kind: "bat", x: 5 * TILE, y: 4 * TILE, patrolMin: 2 * TILE, patrolMax: 9 * TILE },
      { kind: "bat", x: 24 * TILE, y: 4 * TILE, patrolMin: 19 * TILE, patrolMax: 27 * TILE },
      { kind: "slime", x: 14 * TILE, y: 15 * TILE, patrolMin: 9 * TILE, patrolMax: 21 * TILE },
    ],
    pickups: [],
    doors: [
      { x: 0, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_hall_b", toX: 27 * TILE, toY: 14 * TILE, facing: "left" },
      { x: 29 * TILE, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_parry_room", toX: 2 * TILE, toY: 14 * TILE, facing: "right" },
    ],
  },
  sl3_parry_room: {
    id: "sl3_parry_room",
    name: "Echo of the Unbroken",
    sublayer: 3,
    tiles: parseTiles(sl3ParryRoomRows),
    enemies: [
      { kind: "bat", x: 10 * TILE, y: 8 * TILE, patrolMin: 3 * TILE, patrolMax: 16 * TILE },
      { kind: "bat", x: 20 * TILE, y: 6 * TILE, patrolMin: 12 * TILE, patrolMax: 26 * TILE },
    ],
    pickups: [
      // Parry pickup on the elevated middle platform (cols 13-17, row 9)
      { kind: "ability", ability: "parry", x: 16 * TILE, y: 9 * TILE - 4, id: "parry-sl3" },
    ],
    doors: [
      { x: 0, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_hall_c", toX: 27 * TILE, toY: 14 * TILE, facing: "left" },
      { x: 29 * TILE, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_lava_hall", toX: 2 * TILE, toY: 14 * TILE, facing: "right" },
    ],
  },
  sl3_lava_hall: {
    id: "sl3_lava_hall",
    name: "Ember Veins",
    sublayer: 3,
    tiles: parseTiles(sl3LavaHallRows),
    enemies: [
      { kind: "redturret", x: 4 * TILE, y: 14 * TILE, hp: 4 },
      { kind: "redturret", x: 25 * TILE, y: 14 * TILE, hp: 4 },
      { kind: "bat", x: 13 * TILE, y: 5 * TILE, patrolMin: 8 * TILE, patrolMax: 20 * TILE },
      { kind: "bat", x: 19 * TILE, y: 9 * TILE, patrolMin: 12 * TILE, patrolMax: 26 * TILE },
    ],
    pickups: [],
    doors: [
      { x: 0, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_parry_room", toX: 27 * TILE, toY: 14 * TILE, facing: "left" },
      { x: 29 * TILE, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_hall_d", toX: 2 * TILE, toY: 14 * TILE, facing: "right" },
    ],
  },
  sl3_hall_d: {
    id: "sl3_hall_d",
    name: "Deepening Dark",
    sublayer: 3,
    tiles: parseTiles(sl3HallDRows),
    enemies: [
      { kind: "wraith", x: 8 * TILE, y: 8 * TILE, patrolMin: 4 * TILE, patrolMax: 12 * TILE },
      { kind: "wraith", x: 21 * TILE, y: 8 * TILE, patrolMin: 17 * TILE, patrolMax: 26 * TILE },
      { kind: "redturret", x: 14 * TILE, y: 14 * TILE, hp: 4 },
    ],
    pickups: [],
    doors: [
      { x: 0, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_lava_hall", toX: 27 * TILE, toY: 14 * TILE, facing: "left" },
      { x: 29 * TILE, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_ascent", toX: 2 * TILE, toY: 14 * TILE, facing: "right" },
    ],
  },
  sl3_ascent: {
    id: "sl3_ascent",
    name: "The Descent Path",
    sublayer: 3,
    tiles: parseTiles(sl3AscentRows),
    enemies: [
      { kind: "bat", x: 14 * TILE, y: 3 * TILE, patrolMin: 4 * TILE, patrolMax: 24 * TILE },
      { kind: "slime", x: 6 * TILE, y: 15 * TILE, patrolMin: 2 * TILE, patrolMax: 14 * TILE },
    ],
    pickups: [],
    doors: [
      { x: 0, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_hall_d", toX: 27 * TILE, toY: 14 * TILE, facing: "left" },
      { x: 29 * TILE, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_approach", toX: 2 * TILE, toY: 14 * TILE, facing: "right" },
    ],
  },
  sl3_approach: {
    id: "sl3_approach",
    name: "Before the Terror",
    sublayer: 3,
    tiles: parseTiles(sl3ApproachRows),
    enemies: [
      { kind: "wraith", x: 10 * TILE, y: 8 * TILE, patrolMin: 4 * TILE, patrolMax: 16 * TILE },
      { kind: "wraith", x: 20 * TILE, y: 8 * TILE, patrolMin: 14 * TILE, patrolMax: 26 * TILE },
    ],
    pickups: [],
    doors: [
      { x: 0, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_ascent", toX: 27 * TILE, toY: 14 * TILE, facing: "left" },
      { x: 29 * TILE, y: 14 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_boss", toX: 6 * TILE, toY: 16 * TILE, facing: "right" },
    ],
    saves: [{ x: 3 * TILE, y: 16 * TILE - 4 }],
  },
  sl3_boss: {
    id: "sl3_boss",
    name: "The Ancient Terror",
    sublayer: 3,
    tiles: parseTilesTall(sl3BossRows),
    enemies: [
      // Kraid — fully immobile wall boss. Occupies right side of the tall room.
      { kind: "kraid", x: 21 * TILE, y: 2 * TILE, hp: 48 },
    ],
    pickups: [],
    doors: [
      { x: 0, y: 16 * TILE, w: TILE, h: TILE * 2, toRoom: "sl3_approach", toX: 27 * TILE, toY: 14 * TILE, facing: "left" },
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
