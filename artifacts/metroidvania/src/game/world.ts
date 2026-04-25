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

export const ROOMS: Record<string, RoomDef> = {
  antechamber: {
    id: "antechamber",
    name: "Antechamber",
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
    pickups: [
      {
        kind: "heart",
        x: 14 * TILE,
        y: 10 * TILE,
        id: "heart-cistern",
      },
    ],
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
    ],
  },
  tunnel: {
    id: "tunnel",
    name: "Cracked Tunnel",
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
      },
    ],
    saves: [{ x: 2 * TILE, y: 15 * TILE - 4 }],
  },
  reach: {
    id: "reach",
    name: "Wraith's Reach",
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
    pickups: [
      {
        kind: "heart",
        x: 15 * TILE - 9,
        y: 9 * TILE - 9,
        id: "heart-reach",
      },
    ],
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
    tiles: parseTiles(bossLairRows),
    enemies: [
      {
        kind: "boss",
        x: 15 * TILE - 30,
        y: 14 * TILE - 28,
        hp: 18,
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
    ],
  },
};

export const STARTING_ROOM = "antechamber";
export const STARTING_POS = { x: 4 * TILE, y: 14 * TILE };
