import {
  AIR_ACCEL,
  COYOTE_FRAMES,
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  FRICTION,
  GRAVITY,
  GROUND_ACCEL,
  JUMP_BUFFER,
  JUMP_VEL,
  MAX_FALL,
  MOVE_SPEED,
  PARRY_COOLDOWN,
  PARRY_DURATION,
  PHANTOM_DRAIN,
  PHANTOM_MAX,
  PHANTOM_MIN_RECHARGE,
  PHANTOM_MOVE_MULT,
  PHANTOM_RECHARGE,
  PROJECTILE_LIFE,
  PROJECTILE_SPEED,
  ROOM_W,
  SHOOT_COOLDOWN,
  TILE,
  VIEW_H,
} from "./constants";
import { createEnemy, type Enemy, type Projectile } from "./enemies";
import { clearPressed, type InputState } from "./input";
import {
  createPlayer,
  damagePlayer,
  type Player,
} from "./player";
import { moveAndCollide, rectOverlap } from "./physics";
import type { AbilityKey, DoorSpawn, RoomDef } from "./types";
import { ROOMS, SL2_ADJ, STARTING_POS, STARTING_ROOM } from "./world";

export interface RoomState {
  def: RoomDef;
  enemies: Enemy[];
  pickupsLeft: typeof ROOMS[string]["pickups"];
}

export interface PendingTransition {
  to: string;
  toX: number;
  toY: number;
  facing: DoorSpawn["facing"];
  progress: number; // 0..1 fade
  phase: "out" | "in";
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  vy: number;
  color: string;
}

export interface Hunter {
  roomId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  travelCooldown: number;
  alertness: number;
  facing: 1 | -1;
  jumpCooldown: number;
  onGround: boolean;
  doorEntryFlash: number;
  crawlSurface: "none" | "floor" | "wallL" | "wallR" | "ceiling";
}

export interface GameState {
  player: Player;
  currentRoomId: string;
  rooms: Record<string, RoomState>;
  projectiles: Projectile[];
  particles: Particle[];
  texts: FloatingText[];
  spikeHazards: SpikeHazard[];
  transition: PendingTransition | null;
  paused: boolean;
  gameTime: number;
  victory: boolean;
  victoryTimer: number;
  shake: number;
  abilityToast: { ability: string; timer: number } | null;
  collectedAll: Set<string>;
  bossDefeated: boolean;
  sovereignDefeated: boolean;
  roomBannerTimer: number;
  sublayerBannerTimer: number;
  lastSublayer: 1 | 2 | 3;
  hunter: Hunter | null;
  hunterAppearTimer: number;
  camY: number;
  hunterDefeated: boolean;
  kraidDefeated: boolean;
  kraidDefeatedTime: number | null;
  // Room entry position for pit-fall respawn
  roomEntryX: number;
  roomEntryY: number;
  pitRespawnTimer: number;
  // Warning banner for unparriable red turrets
  redTurretWarningTimer: number;
  // Run stats — recorded for the leaderboard
  deaths: number;
  hollowDefeatedTime: number | null;
  sovereignDefeatedTime: number | null;
  hunterDefeatedTime: number | null;
  playerHpAtHollow: number;
  playerHpAtSovereign: number;
  playerHpAtHunter: number;
}

export interface SpikeHazard {
  x: number;
  y: number;
  w: number;
  h: number;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
}

export function createGame(): GameState {
  const rooms: Record<string, RoomState> = {};
  for (const [id, def] of Object.entries(ROOMS)) {
    rooms[id] = {
      def,
      enemies: def.enemies.map((e) => createEnemy(e)),
      pickupsLeft: [...def.pickups],
    };
  }
  const player = createPlayer(STARTING_ROOM, STARTING_POS.x, STARTING_POS.y);
  return {
    player,
    currentRoomId: STARTING_ROOM,
    rooms,
    projectiles: [],
    particles: [],
    texts: [],
    transition: null,
    paused: false,
    gameTime: 0,
    victory: false,
    victoryTimer: 0,
    shake: 0,
    abilityToast: null,
    collectedAll: new Set(),
    bossDefeated: false,
    sovereignDefeated: false,
    roomBannerTimer: 300,
    sublayerBannerTimer: 240,
    lastSublayer: 1,
    hunter: null,
    hunterAppearTimer: 0,
    camY: 0,
    hunterDefeated: false,
    kraidDefeated: false,
    kraidDefeatedTime: null,
    spikeHazards: [],
    roomEntryX: STARTING_POS.x,
    roomEntryY: STARTING_POS.y,
    pitRespawnTimer: 0,
    redTurretWarningTimer: 0,
    deaths: 0,
    hollowDefeatedTime: null,
    sovereignDefeatedTime: null,
    hunterDefeatedTime: null,
    playerHpAtHollow: 0,
    playerHpAtSovereign: 0,
    playerHpAtHunter: 0,
  };
}

export function currentRoom(g: GameState): RoomState {
  return g.rooms[g.currentRoomId];
}

export function spawnParticles(
  g: GameState,
  x: number,
  y: number,
  count: number,
  color: string,
  opts: { spread?: number; gravity?: number; life?: number } = {},
) {
  const spread = opts.spread ?? 4;
  const gravity = opts.gravity ?? 0.25;
  const life = opts.life ?? 32;
  for (let i = 0; i < count; i++) {
    g.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * spread,
      vy: (Math.random() - 0.8) * spread,
      life,
      maxLife: life,
      color,
      size: 2 + Math.random() * 2,
      gravity,
    });
  }
}

function tryShoot(g: GameState) {
  const p = g.player;
  if (!p.abilities.blast) return;
  if (p.shootCooldown > 0) return;
  p.shootCooldown = SHOOT_COOLDOWN;
  const px = p.facing === 1 ? p.x + p.w : p.x;
  const py = p.y + p.h * 0.45;
  const pierce = p.abilities.pierce;
  g.projectiles.push({
    x: px - 4,
    y: py - 4,
    vx: PROJECTILE_SPEED * p.facing,
    vy: 0,
    life: PROJECTILE_LIFE,
    w: pierce ? 10 : 8,
    h: pierce ? 10 : 8,
    fromPlayer: true,
    damage: 1,
    pierce,
  });
  spawnParticles(g, px, py, 3, pierce ? "#ffd060" : "#7af0ff", {
    spread: 2,
    gravity: 0,
  });
}

function tryDash(g: GameState) {
  const p = g.player;
  if (!p.abilities.dash) return;
  if (p.dashCooldown > 0) return;
  if (p.dashTimer > 0) return;
  p.dashTimer = DASH_DURATION;
  p.dashCooldown = DASH_COOLDOWN;
  p.dashDir = p.facing;
  p.vy = 0;
  spawnParticles(g, p.x + p.w / 2, p.y + p.h / 2, 8, "#a070ff", {
    spread: 3,
    gravity: 0,
  });
}

function tryJump(g: GameState) {
  const p = g.player;
  if (p.coyote > 0 || p.onGround) {
    p.vy = JUMP_VEL;
    p.jumpsUsed = 1;
    p.coyote = 0;
    p.jumpBuffer = 0;
    spawnParticles(g, p.x + p.w / 2, p.y + p.h, 4, "#a070ff", {
      spread: 2,
      gravity: 0.1,
    });
  } else if (p.abilities.doubleJump && p.jumpsUsed < 2) {
    p.vy = JUMP_VEL * 0.95;
    p.jumpsUsed = 2;
    p.jumpBuffer = 0;
    spawnParticles(g, p.x + p.w / 2, p.y + p.h, 8, "#caa6ff", {
      spread: 3,
      gravity: 0.05,
    });
  }
}

function applyTransition(g: GameState, door: DoorSpawn) {
  g.transition = {
    to: door.toRoom,
    toX: door.toX,
    toY: door.toY,
    facing: door.facing,
    progress: 0,
    phase: "out",
  };
}

function performTransition(g: GameState) {
  const t = g.transition;
  if (!t) return;
  const fromRoom = g.rooms[g.currentRoomId]?.def;
  const toRoom = g.rooms[t.to]?.def;
  g.currentRoomId = t.to;
  g.projectiles = [];
  g.spikeHazards = [];
  g.camY = 0;
  const p = g.player;
  p.x = t.toX;
  p.y = t.toY;
  p.vx = 0;
  p.vy = 0;
  p.dashTimer = 0;
  p.knockback = 0;
  p.transitionCooldown = 30;
  g.roomEntryX = t.toX;
  g.roomEntryY = t.toY;
  p.phantomActive = false;
  if (t.facing === "right") p.facing = 1;
  if (t.facing === "left") p.facing = -1;
  g.roomBannerTimer = 300;

  // Sublayer-change banner. The first time the player drops into Sublayer 2,
  // spawn the Sovereign hunter at the deepest room.
  const newSublayer = (toRoom?.sublayer ?? 1) as 1 | 2 | 3;
  const oldSublayer = (fromRoom?.sublayer ?? 1) as 1 | 2 | 3;
  if (newSublayer !== oldSublayer) {
    g.sublayerBannerTimer = 240;
    g.lastSublayer = newSublayer;
    if (newSublayer === 2 && !g.hunter) {
      g.hunter = createHunter("sl2_pierce_shrine");
      g.hunterAppearTimer = 180;
    }
  }
  if (toRoom?.enemies.some((enemy) => enemy.kind === "redturret")) {
    g.redTurretWarningTimer = 210;
  }
}

function createHunter(roomId: string): Hunter {
  return {
    roomId,
    x: 14 * TILE,
    y: 13 * TILE,
    vx: 0,
    vy: 0,
    w: 30,
    h: 38,
    hp: 28,
    maxHp: 28,
    hitFlash: 0,
    travelCooldown: 150,
    alertness: 0,
    facing: -1,
    jumpCooldown: 0,
    onGround: false,
    doorEntryFlash: 0,
    crawlSurface: "none",
  };
}

function tryParry(g: GameState) {
  const p = g.player;
  if (!p.abilities.parry) return;
  if (p.parryCooldown > 0) return;
  if (p.parryTimer > 0) return;
  p.parryTimer = PARRY_DURATION;
  p.parryCooldown = PARRY_COOLDOWN;
  p.invuln = Math.max(p.invuln, PARRY_DURATION + 4);
  spawnParticles(g, p.x + p.w / 2, p.y + p.h / 2, 14, "#ffffff", {
    spread: 5,
    gravity: 0,
    life: 20,
  });
}

function spawnSpikeHazard(g: GameState, x: number, y: number) {
  const hazard: SpikeHazard = {
    x: Math.max(0, Math.min(x - 12, ROOM_W * TILE - 24)),
    y: y - 12,
    w: 24,
    h: 12,
    life: 360,
  };
  const duplicate = g.spikeHazards.some(
    (existing) =>
      Math.abs(existing.x - hazard.x) < 18 &&
      Math.abs(existing.y - hazard.y) < 18,
  );
  if (!duplicate) {
    g.spikeHazards.push(hazard);
    if (g.spikeHazards.length > 18) g.spikeHazards.shift();
  }
}

function updateSpikeHazards(g: GameState) {
  const p = g.player;
  for (let i = g.spikeHazards.length - 1; i >= 0; i--) {
    const hazard = g.spikeHazards[i];
    hazard.life--;
    if (hazard.life <= 0) {
      g.spikeHazards.splice(i, 1);
      continue;
    }
    if (
      p.alive &&
      p.invuln === 0 &&
      rectOverlap(
        { x: p.x, y: p.y, w: p.w, h: p.h },
        { x: hazard.x, y: hazard.y, w: hazard.w, h: hazard.h },
      )
    ) {
      damagePlayer(p, hazard.x + hazard.w / 2);
      g.shake = Math.max(g.shake, 8);
    }
  }
}

function isTouchingSpikeTile(
  body: { x: number; y: number; w: number; h: number },
  tiles: number[][],
) {
  const minCol = Math.floor(body.x / TILE);
  const maxCol = Math.floor((body.x + body.w - 0.001) / TILE);
  const minRow = Math.floor(body.y / TILE);
  const maxRow = Math.floor((body.y + body.h - 0.001) / TILE);
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (tiles[row]?.[col] === 2) return true;
    }
  }
  return false;
}

function handlePitFall(g: GameState) {
  const room = currentRoom(g);
  const p = g.player;
  if (room.def.sublayer !== 3 || p.y + p.h < room.def.tiles.length * TILE) {
    return false;
  }

  // A pit is a room-entry reset, not a normal enemy hit. Force exactly one
  // heart of damage even if the player was briefly invulnerable from another
  // collision, then let the player visibly leave the room before returning.
  const fallX = p.x + p.w / 2;
  const fallY = p.y + p.h / 2;
  p.invuln = 0;
  damagePlayer(p, fallX);
  if (!p.alive) return true;

  spawnParticles(g, fallX, fallY, 10, "#ff8060", {
    spread: 5,
    gravity: 0.08,
    life: 26,
  });
  g.pitRespawnTimer = 30;
  p.x = -p.w * 2;
  p.y = room.def.tiles.length * TILE + TILE * 2;
  p.vx = 0;
  p.vy = 0;
  p.knockback = 0;
  p.dashTimer = 0;
  p.parryTimer = 0;
  p.phantomActive = false;
  g.projectiles = [];
  g.spikeHazards = [];
  g.shake = Math.max(g.shake, 12);
  g.texts.push({
    x: fallX,
    y: fallY - 16,
    text: "The pit tears at you",
    life: 90,
    vy: -0.25,
    color: "#ff8060",
  });
  return true;
}

function finishPitRespawn(g: GameState) {
  const p = g.player;
  p.x = g.roomEntryX;
  p.y = g.roomEntryY;
  p.vx = 0;
  p.vy = 0;
  p.dashTimer = 0;
  p.dashCooldown = 0;
  p.knockback = 0;
  p.parryTimer = 0;
  p.phantomActive = false;
  p.transitionCooldown = 30;
  p.invuln = 60;
  g.pitRespawnTimer = 0;
  g.projectiles = [];
  g.spikeHazards = [];
  g.camY = 0;
}

// BFS through the Sublayer 2 adjacency graph to pick the next room the hunter
// should move toward in pursuit of the player.
function nextHunterRoom(from: string, target: string): string | null {
  if (from === target) return from;
  const adj = SL2_ADJ;
  if (!adj[from]) return null;
  const visited = new Set<string>([from]);
  const queue: { id: string; first: string }[] = [];
  for (const n of adj[from]) {
    queue.push({ id: n, first: n });
    visited.add(n);
  }
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.id === target) return cur.first;
    for (const n of adj[cur.id] ?? []) {
      if (visited.has(n)) continue;
      visited.add(n);
      queue.push({ id: n, first: cur.first });
    }
  }
  return null;
}

const HUNTER_SPEED = 5.0;
const HUNTER_DOOR_RANGE = 22;

function updateHunter(g: GameState) {
  const h = g.hunter;
  if (!h) return;
  if (h.hitFlash > 0) h.hitFlash--;
  if (h.doorEntryFlash > 0) h.doorEntryFlash--;

  const sameRoom = h.roomId === g.currentRoomId;
  const room = g.rooms[h.roomId];
  if (!room) return;

  if (!sameRoom) {
    // Cross-room pursuit: physically move toward the exit door that leads to
    // the player's room, then squeeze through it.
    const nextRoomId = nextHunterRoom(h.roomId, g.currentRoomId);
    if (!nextRoomId || nextRoomId === h.roomId) return;

    const exitDoor = room.def.doors.find((d) => d.toRoom === nextRoomId);
    if (!exitDoor) {
      // Fallback timed hop when there is no directly matching door entry.
      h.travelCooldown--;
      if (h.travelCooldown <= 0) {
        h.roomId = nextRoomId;
        h.x = 14 * TILE;
        h.y = 13 * TILE;
        h.vx = 0;
        h.vy = 0;
        h.doorEntryFlash = 25;
        g.shake = 12;
        h.travelCooldown = 60;
      }
      return;
    }

    // Move toward door centre in the off-screen room.
    const doorCX = exitDoor.x + exitDoor.w / 2 - h.w / 2;
    const doorCY = exitDoor.y + exitDoor.h / 2 - h.h / 2;
    const dx = doorCX - h.x;
    const dy = doorCY - h.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < HUNTER_DOOR_RANGE) {
      // Pass through — appear at the matching entry in the next room.
      h.roomId = nextRoomId;
      h.x = exitDoor.toX;
      h.y = exitDoor.toY;
      h.vx = 0;
      h.vy = 0;
      h.doorEntryFlash = 30;
      h.alertness = 100;
      // Shake only when entering the player's current room.
      if (nextRoomId === g.currentRoomId) g.shake = 16;
    } else {
      const spd = HUNTER_SPEED * 1.1;
      h.vx = (dx / dist) * spd;
      h.vy = (dy / dist) * spd;
      moveAndCollide(h, room.def.tiles);
    }
    return;
  }

  // ── Same room as the player ──────────────────────────────────────────────
  const p = g.player;
  const phantom = p.phantomActive;
  const spawning = g.hunterAppearTimer > 0;

  if (phantom || spawning) {
    // Lost sight — drift to a halt.
    h.vx *= 0.88;
    h.vy *= 0.88;
    h.alertness = Math.max(0, h.alertness - 1);
    moveAndCollide(h, room.def.tiles);
    return;
  }

  h.alertness = Math.min(100, h.alertness + 6);

  const dx = p.x + p.w / 2 - (h.x + h.w / 2);
  const dy = p.y + p.h / 2 - (h.y + h.h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 1) {
    const spd = HUNTER_SPEED + Math.min(1.5, dist / 160);
    h.vx = (dx / dist) * spd;
    h.vy = (dy / dist) * spd;
    h.facing = dx > 0 ? 1 : -1;
  }

  const preVx = h.vx;
  const preVy = h.vy;
  const move = moveAndCollide(h, room.def.tiles);
  h.onGround = move.onGround;

  if (move.hitX && h.onGround && h.jumpCooldown <= 0) {
    h.vy = -13;
    h.jumpCooldown = 28;
  }
  if (h.jumpCooldown > 0) h.jumpCooldown--;

  if (move.hitX && !move.hitY) {
    h.crawlSurface = preVx < 0 ? "wallL" : "wallR";
  } else if (move.hitY && !move.hitX) {
    h.crawlSurface = preVy < 0 ? "ceiling" : "floor";
  } else if (move.onGround) {
    h.crawlSurface = "floor";
  } else {
    h.crawlSurface = "none";
  }

  // Contact damage to the player.
  if (
    !phantom &&
    !spawning &&
    p.invuln === 0 &&
    p.dashTimer === 0 &&
    rectOverlap(
      { x: p.x, y: p.y, w: p.w, h: p.h },
      { x: h.x, y: h.y, w: h.w, h: h.h },
    )
  ) {
    damagePlayer(p, h.x + h.w / 2);
    g.shake = 10;
  }
}

export function updateGame(g: GameState, input: InputState) {
  g.gameTime++;
  if (g.shake > 0) g.shake -= 0.5;
  if (g.shake < 0) g.shake = 0;
  if (g.roomBannerTimer > 0) g.roomBannerTimer--;
  if (g.sublayerBannerTimer > 0) g.sublayerBannerTimer--;
  if (g.hunterAppearTimer > 0) g.hunterAppearTimer--;

  if (input.pausePressed) g.paused = !g.paused;

  if (g.victory) {
    g.victoryTimer++;
    clearPressed(input);
    return;
  }

  if (g.paused) {
    clearPressed(input);
    return;
  }

  const p = g.player;

  // Transition handling
  if (g.transition) {
    const t = g.transition;
    if (t.phase === "out") {
      t.progress += 0.08;
      if (t.progress >= 1) {
        performTransition(g);
        t.phase = "in";
        t.progress = 0;
      }
    } else {
      t.progress += 0.08;
      if (t.progress >= 1) {
        g.transition = null;
      }
    }
    clearPressed(input);
    return;
  }

  if (g.abilityToast) {
    g.abilityToast.timer--;
    if (g.abilityToast.timer <= 0) g.abilityToast = null;
  }
  if (g.redTurretWarningTimer > 0) g.redTurretWarningTimer--;

  if (g.pitRespawnTimer > 0) {
    g.projectiles = [];
    g.spikeHazards = [];
    g.pitRespawnTimer--;
    if (g.pitRespawnTimer <= 0) {
      finishPitRespawn(g);
    }
    clearPressed(input);
    return;
  }

  if (!p.alive) {
    // Remove all combat entities immediately on death. Waiting for the
    // respawn timer would let enemy shots remain visible during the death
    // animation and potentially carry into the next room state.
    g.projectiles = [];
    g.spikeHazards = [];
    p.deathTimer--;
    if (p.deathTimer <= 0) {
      respawnPlayer(g);
    }
    clearPressed(input);
    return;
  }

  const room = currentRoom(g);

  // Input → player intent
  if (p.dashTimer > 0) {
    p.vx = DASH_SPEED * p.dashDir;
    p.vy = 0;
    p.dashTimer--;
    if (g.gameTime % 3 === 0) {
      spawnParticles(g, p.x + p.w / 2, p.y + p.h / 2, 1, "#caa6ff", {
        spread: 1,
        gravity: 0,
        life: 18,
      });
    }
  } else if (p.knockback > 0) {
    p.knockback--;
    p.vy += GRAVITY;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
  } else {
    // Phantom Veil: held key while ability unlocked and meter has charge.
    // Halves movement speed but lets the player slip past the Sovereign hunter.
    const wantPhantom =
      p.abilities.phantom &&
      input.phantom &&
      p.phantomMeter > 0 &&
      p.phantomCooldown === 0;
    p.phantomActive = wantPhantom;
    const speedMult = p.phantomActive ? PHANTOM_MOVE_MULT : 1;

    const accel = p.onGround ? GROUND_ACCEL : AIR_ACCEL;
    let target = 0;
    if (input.left) target -= MOVE_SPEED * speedMult;
    if (input.right) target += MOVE_SPEED * speedMult;
    if (target !== 0) {
      p.vx += Math.sign(target - p.vx) * accel;
      if (Math.abs(p.vx - target) < accel) p.vx = target;
      p.facing = target > 0 ? 1 : -1;
    } else if (p.onGround) {
      p.vx *= FRICTION;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    } else {
      p.vx *= 0.97;
    }

    p.vy += GRAVITY;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    // Variable jump height
    if (!input.jump && p.vy < -2) p.vy *= 0.86;
  }

  // Phantom meter drain / recharge.
  if (p.phantomActive) {
    p.phantomMeter -= PHANTOM_DRAIN;
    if (p.phantomMeter <= 0) {
      p.phantomMeter = 0;
      p.phantomActive = false;
      p.phantomCooldown = PHANTOM_MIN_RECHARGE;
    }
    // Wisp particles trailing behind the player
    if (g.gameTime % 4 === 0) {
      spawnParticles(g, p.x + p.w / 2, p.y + p.h / 2, 1, "#90c0ff", {
        spread: 0.6,
        gravity: -0.05,
        life: 28,
      });
    }
  } else {
    if (p.phantomCooldown > 0) p.phantomCooldown--;
    if (p.phantomMeter < PHANTOM_MAX) {
      p.phantomMeter += PHANTOM_RECHARGE;
      if (p.phantomMeter > PHANTOM_MAX) p.phantomMeter = PHANTOM_MAX;
    }
  }

  if (input.jumpPressed) p.jumpBuffer = JUMP_BUFFER;
  if (p.jumpBuffer > 0) {
    if (p.coyote > 0 || p.onGround || (p.abilities.doubleJump && p.jumpsUsed < 2)) {
      tryJump(g);
    }
    p.jumpBuffer--;
  }

  if (input.dashPressed) tryDash(g);
  if (input.parryPressed) tryParry(g);
  if (input.shoot || input.shootPressed) tryShoot(g);

  if (p.parryTimer > 0) {
    p.parryTimer--;
    if (g.gameTime % 2 === 0) {
      spawnParticles(g, p.x + p.w / 2, p.y + p.h / 2, 2, "#ffffff", {
        spread: 3,
        gravity: 0,
        life: 12,
      });
    }
  }
  if (p.parryCooldown > 0) p.parryCooldown--;
  if (p.shootCooldown > 0) p.shootCooldown--;
  if (p.dashCooldown > 0) p.dashCooldown--;
  if (p.invuln > 0) p.invuln--;
  if (p.flashTimer > 0) p.flashTimer--;

  const wasOnGround = p.onGround;
  const move = moveAndCollide(p, room.def.tiles);
  p.onGround = move.onGround;
  if (p.onGround) {
    p.jumpsUsed = 0;
    p.coyote = COYOTE_FRAMES;
  } else if (wasOnGround) {
    p.coyote = COYOTE_FRAMES;
  } else if (p.coyote > 0) {
    p.coyote--;
  }

  if (move.spike || isTouchingSpikeTile(p, room.def.tiles)) {
    damagePlayer(p, p.x + p.w / 2);
    g.shake = 8;
  }
  updateSpikeHazards(g);
  if (handlePitFall(g)) {
    clearPressed(input);
    return;
  }

  // Check doors
  if (p.transitionCooldown > 0) {
    p.transitionCooldown--;
  } else {
    for (const door of room.def.doors) {
      if (door.requires) {
        const reqs = Array.isArray(door.requires) ? door.requires : [door.requires];
        if (reqs.some((r) => !p.abilities[r])) continue;
      }
      if (door.requiresBoss && !g.bossDefeated) continue;
      if (door.requiresSovereign && !g.sovereignDefeated) continue;
      if (door.requiresHunter && !g.hunterDefeated) continue;
      const overlap = rectOverlap(
        { x: p.x, y: p.y, w: p.w, h: p.h },
        { x: door.x, y: door.y, w: door.w, h: door.h },
      );
      if (overlap) {
        // Direction filter
        let goes = true;
        if (door.facing === "right" && p.vx < 0.5 && !input.right) goes = false;
        if (door.facing === "left" && p.vx > -0.5 && !input.left) goes = false;
        if (door.facing === "up" && !input.up) goes = false;
        // Drop-through doors require explicit down-press while grounded above
        if (door.facing === "down" && !input.down) goes = false;
        if (goes) {
          applyTransition(g, door);
          return;
        }
      }
    }
  }

  // Check pickups
  for (let i = room.pickupsLeft.length - 1; i >= 0; i--) {
    const pk = room.pickupsLeft[i];
    if (g.collectedAll.has(pk.id)) {
      room.pickupsLeft.splice(i, 1);
      continue;
    }
    const r = { x: pk.x, y: pk.y, w: 18, h: 18 };
    if (rectOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, r)) {
      room.pickupsLeft.splice(i, 1);
      g.collectedAll.add(pk.id);
      if (pk.kind === "ability" && pk.ability) {
        p.abilities[pk.ability] = true;
        g.abilityToast = { ability: pk.ability, timer: 180 };
        spawnParticles(g, pk.x + 9, pk.y + 9, 24, "#ffd83a", {
          spread: 5,
          gravity: -0.1,
          life: 50,
        });
        g.shake = 6;
      } else if (pk.kind === "vessel") {
        p.maxHp += 1;
        p.hp = p.maxHp;
        g.abilityToast = { ability: "vessel", timer: 180 };
        spawnParticles(g, pk.x + 9, pk.y + 9, 28, "#ff5a8a", {
          spread: 5,
          gravity: -0.1,
          life: 55,
        });
        g.shake = 8;
      }
    }
  }

  // Save points
  if (room.def.saves) {
    for (const sv of room.def.saves) {
      const r = { x: sv.x, y: sv.y, w: 24, h: 28 };
      if (rectOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, r)) {
        if (
          p.spawnRoom !== g.currentRoomId ||
          Math.abs(p.spawnX - sv.x) > 4
        ) {
          p.spawnRoom = g.currentRoomId;
          p.spawnX = sv.x;
          p.spawnY = sv.y - 2;
          p.hp = p.maxHp;
          spawnParticles(g, sv.x + 12, sv.y + 8, 14, "#7af0c0", {
            spread: 3,
            gravity: -0.1,
            life: 40,
          });
        }
      }
    }
  }

  // Update enemies
  for (const e of room.enemies) {
    if (!e.alive) continue;
    updateEnemy(g, e, room.def.tiles);
    const isBossKind =
      e.kind === "boss" || e.kind === "sovereign" || e.kind === "kraid";
    // Phantom veil hides player from non-boss enemies
    if (!isBossKind && p.phantomActive) continue;
    // Player collision (dashing grants i-frames so dash can be used to escape)
    if (
      p.invuln === 0 &&
      p.dashTimer === 0 &&
      rectOverlap(
        { x: p.x, y: p.y, w: p.w, h: p.h },
        { x: e.x, y: e.y, w: e.w, h: e.h },
      )
    ) {
      // Parry stun: briefly stun non-boss melee enemies on contact while parrying
      if (p.parryTimer > 0 && !isBossKind) {
        e.cooldown = Math.max(e.cooldown, 70);
        if (e.state !== "dashing") e.state = "recover";
        spawnParticles(g, e.x + e.w / 2, e.y + e.h / 2, 8, "#ffffff", {
          spread: 3,
          gravity: 0,
          life: 16,
        });
      } else {
        damagePlayer(p, e.x + e.w / 2);
        g.shake = 6;
      }
    }
  }
  if (!p.alive) {
    g.projectiles = [];
    g.spikeHazards = [];
    clearPressed(input);
    return;
  }

  // Update projectiles
  for (let i = g.projectiles.length - 1; i >= 0; i--) {
    const pr = g.projectiles[i];
    pr.x += pr.vx;
    pr.y += pr.vy;
    pr.life--;
    // Wall collision
    const col = Math.floor((pr.x + pr.w / 2) / TILE);
    const row = Math.floor((pr.y + pr.h / 2) / TILE);
    const outOfBounds =
      col < 0 ||
      col >= room.def.tiles[0].length ||
      row < 0 ||
      row >= room.def.tiles.length;
    const hitSolid =
      !outOfBounds && room.def.tiles[row]?.[col] === 1;
    if (outOfBounds || hitSolid) {
      if (hitSolid && pr.spike) {
        spawnSpikeHazard(
          g,
          pr.x + pr.w / 2,
          row * TILE,
        );
      }
      spawnParticles(g, pr.x + pr.w / 2, pr.y + pr.h / 2, 4, pr.unparriable ? "#ff4020" : "#caf6ff", {
        spread: 2,
        gravity: 0,
        life: 14,
      });
      g.projectiles.splice(i, 1);
      continue;
    }
    if (pr.life <= 0) {
      g.projectiles.splice(i, 1);
      continue;
    }
    if (pr.fromPlayer) {
      let consumed = false;
      for (const e of room.enemies) {
        if (!e.alive) continue;
        if (pr.hitEnemies && pr.hitEnemies.has(e)) continue;
        if (
          !rectOverlap(
            { x: pr.x, y: pr.y, w: pr.w, h: pr.h },
            { x: e.x, y: e.y, w: e.w, h: e.h },
          )
        ) {
          continue;
        }
        // The Ancient Terror is only vulnerable through its three individual cores.
        // Regular shots can damage a living core; Pierce is not required here.
        if (e.kind === "kraid") {
          const coreHps = e.coreHps ?? [];
          const coreCenters = [
            e.y + 4 * TILE + TILE / 2,
            e.y + 16 * TILE + TILE / 2,
            e.y + 28 * TILE + TILE / 2,
          ];
          let coreIndex = -1;
          let closest = Number.POSITIVE_INFINITY;
          for (let ci = 0; ci < coreCenters.length; ci++) {
            if (coreHps[ci] <= 0) continue;
            const distance = Math.abs(pr.y + pr.h / 2 - coreCenters[ci]);
            if (distance < closest) {
              closest = distance;
              coreIndex = ci;
            }
          }
          if (coreIndex < 0 || closest > TILE * 1.5) {
            spawnParticles(g, pr.x + pr.w / 2, pr.y + pr.h / 2, 4, "#8a4010", {
              spread: 2,
              gravity: 0,
              life: 12,
            });
            g.projectiles.splice(i, 1);
            consumed = true;
            break;
          }
          coreHps[coreIndex] -= pr.damage;
          e.hp = coreHps.reduce((total, hp) => total + Math.max(0, hp), 0);
          e.hitFlash = 8;
          spawnParticles(
            g,
            pr.x + pr.w / 2,
            pr.y + pr.h / 2,
            coreHps[coreIndex] <= 0 ? 14 : 6,
            coreHps[coreIndex] <= 0 ? "#ff4010" : "#ffd060",
            { spread: 3, gravity: 0, life: 20 },
          );
        }
        // Sovereign: always armored. Boss: armored only while charging/dashing.
        // Sovereign: always armored. Boss: armored only while charging/dashing.
        const armored =
          e.kind !== "kraid" &&
          (e.kind === "sovereign" ||
            (e.kind === "boss" && (e.state === "dash_charge" || e.state === "dashing")));
        if (e.kind !== "kraid" && armored && !pr.pierce) {
          spawnParticles(g, pr.x + pr.w / 2, pr.y + pr.h / 2, 5, "#ffb060", {
            spread: 3,
            gravity: 0,
            life: 14,
          });
          g.projectiles.splice(i, 1);
          consumed = true;
          break;
        }
        if (e.kind !== "kraid") e.hp -= pr.damage;
        e.hitFlash = 8;
        spawnParticles(
          g,
          pr.x + pr.w / 2,
          pr.y + pr.h / 2,
          6,
          pr.pierce ? "#ffd060" : "#caf6ff",
          { spread: 3, gravity: 0, life: 16 },
        );
        if (e.hp <= 0) {
          e.alive = false;
          spawnParticles(
            g,
            e.x + e.w / 2,
            e.y + e.h / 2,
            16,
            enemyColor(e.kind),
            { spread: 4, gravity: 0.1, life: 38 },
          );
          if (e.kind === "sovereign") {
            // First Sovereign defeat opens Sublayer 2 and drains the Pierce
            // Shard from the player. The true ending requires descending further.
            g.sovereignDefeated = true;
            g.sovereignDefeatedTime = g.gameTime;
            g.playerHpAtSovereign = g.player.hp;
            g.player.abilities.pierce = false;
            g.abilityToast = { ability: "pierceLost", timer: 260 };
            g.shake = 36;
          } else if (e.kind === "boss") {
            g.bossDefeated = true;
            g.hollowDefeatedTime = g.gameTime;
            g.playerHpAtHollow = g.player.hp;
            g.shake = 30;
          } else if (e.kind === "kraid") {
            // True ending — the Ancient Terror is slain.
            g.kraidDefeated = true;
            g.kraidDefeatedTime = g.gameTime;
            g.victory = true;
            g.victoryTimer = 0;
            g.shake = 60;
            spawnParticles(
              g,
              e.x + e.w / 2,
              e.y + e.h / 2,
              56,
              "#ff8040",
              { spread: 10, gravity: -0.05, life: 90 },
            );
          } else {
            g.shake = Math.max(g.shake, 3);
          }
        }
        if (pr.pierce) {
          // Track to avoid hitting the same target multiple times this frame
          pr.hitEnemies ??= new Set();
          pr.hitEnemies.add(e);
          // Continue iterating so the bolt can hit additional enemies
        } else {
          g.projectiles.splice(i, 1);
          consumed = true;
          break;
        }
      }
      if (consumed) {
        // already removed
      }
    } else {
      // enemy projectile hits player (dashing grants i-frames)
      if (
        rectOverlap(
          { x: pr.x, y: pr.y, w: pr.w, h: pr.h },
          { x: p.x, y: p.y, w: p.w, h: p.h },
        )
      ) {
        if (p.parryTimer > 0 && !pr.unparriable) {
          // Parry: reflect the projectile back as a piercing player shot
          pr.fromPlayer = true;
          pr.vx = -pr.vx * 1.4;
          pr.vy = -pr.vy * 1.4;
          pr.damage = 2;
          pr.pierce = true;
          pr.life = 90;
          spawnParticles(g, pr.x + pr.w / 2, pr.y + pr.h / 2, 10, "#ffffff", {
            spread: 4,
            gravity: 0,
            life: 18,
          });
        } else if (p.invuln === 0 && p.dashTimer === 0) {
          damagePlayer(p, pr.x + pr.w / 2);
          g.projectiles.splice(i, 1);
          g.shake = 6;
        }
      }
    }
  }
  if (!p.alive) {
    g.projectiles = [];
    g.spikeHazards = [];
  }

  // Hunter (Sovereign wraith) — only present in Sublayer 2
  if (g.hunter) {
    updateHunter(g);
    // Player projectile vs. hunter
    if (g.hunter.roomId === g.currentRoomId) {
      const h = g.hunter;
      for (let i = g.projectiles.length - 1; i >= 0; i--) {
        const pr = g.projectiles[i];
        if (!pr.fromPlayer) continue;
        if (pr.hitEnemies && pr.hitEnemies.has(h as unknown as Enemy)) continue;
        if (
          !rectOverlap(
            { x: pr.x, y: pr.y, w: pr.w, h: pr.h },
            { x: h.x, y: h.y, w: h.w, h: h.h },
          )
        ) {
          continue;
        }
        if (!pr.pierce) {
          // Without the Pierce Shard, bolts ping off the wraith harmlessly.
          spawnParticles(g, pr.x + pr.w / 2, pr.y + pr.h / 2, 6, "#ffb060", {
            spread: 3,
            gravity: 0,
            life: 16,
          });
          g.projectiles.splice(i, 1);
          continue;
        }
        h.hp -= pr.damage;
        h.hitFlash = 8;
        spawnParticles(g, pr.x + pr.w / 2, pr.y + pr.h / 2, 8, "#ffd060", {
          spread: 3,
          gravity: 0,
          life: 18,
        });
        if (h.hp <= 0) {
          // The Sovereign's wraith is unmade — but this is not the true ending.
          // The Wound below stirs. Pierce Shard dissolves from the killing blow.
          g.hunterDefeated = true;
          g.hunterDefeatedTime = g.gameTime;
          g.playerHpAtHunter = g.player.hp;
          g.player.abilities.pierce = false;
          g.abilityToast = { ability: "pierceLostHunter", timer: 300 };
          g.shake = 48;
          spawnParticles(g, h.x + h.w / 2, h.y + h.h / 2, 32, "#ff5020", {
            spread: 5,
            gravity: 0.05,
            life: 60,
          });
          g.hunter = null;
          break;
        }
        pr.hitEnemies ??= new Set();
        pr.hitEnemies.add(h as unknown as Enemy);
      }
    }
  }

  // Update particles
  for (let i = g.particles.length - 1; i >= 0; i--) {
    const pa = g.particles[i];
    pa.vy += pa.gravity;
    pa.x += pa.vx;
    pa.y += pa.vy;
    pa.life--;
    if (pa.life <= 0) g.particles.splice(i, 1);
  }

  // Walk anim
  if (Math.abs(p.vx) > 0.5 && p.onGround) {
    p.walkAnim += 0.25;
  } else {
    p.walkAnim *= 0.9;
  }

  // Smooth camera for tall rooms
  {
    const roomTileH = room.def.tiles.length * TILE;
    if (roomTileH > VIEW_H) {
      const targetCamY = Math.max(0, Math.min(
        p.y + p.h / 2 - VIEW_H / 2,
        roomTileH - VIEW_H,
      ));
      g.camY += (targetCamY - g.camY) * 0.12;
      if (Math.abs(g.camY - targetCamY) < 0.5) g.camY = targetCamY;
    } else {
      g.camY = 0;
    }
  }

  clearPressed(input);
}

function respawnPlayer(g: GameState) {
  g.deaths++;
  const p = g.player;
  g.pitRespawnTimer = 0;
  p.alive = true;
  p.hp = p.maxHp;
  p.invuln = 60;
  p.vx = 0;
  p.vy = 0;
  p.dashTimer = 0;
  p.dashCooldown = 0;
  p.knockback = 0;
  p.parryTimer = 0;
  p.phantomActive = false;
  g.projectiles = [];
  g.spikeHazards = [];
  p.x = p.spawnX;
  p.y = p.spawnY;
  // Reset enemies in current room
  if (p.spawnRoom !== g.currentRoomId) {
    g.currentRoomId = p.spawnRoom;
  }
  g.roomEntryX = p.spawnX;
  g.roomEntryY = p.spawnY;
  for (const room of Object.values(g.rooms)) {
    for (let i = 0; i < room.enemies.length; i++) {
      const spawn = room.def.enemies[i];
      // Bosses stay dead once defeated — no second descent into a fresh fight.
      if (spawn.kind === "boss" && g.bossDefeated) {
        room.enemies[i] = { ...createEnemy(spawn), alive: false, hp: 0 };
        continue;
      }
      if (spawn.kind === "sovereign" && g.sovereignDefeated) {
        room.enemies[i] = { ...createEnemy(spawn), alive: false, hp: 0 };
        continue;
      }
      if (spawn.kind === "kraid" && g.kraidDefeated) {
        room.enemies[i] = { ...createEnemy(spawn), alive: false, hp: 0 };
        continue;
      }
      room.enemies[i] = createEnemy(spawn);
    }
  }
}

function enemyColor(kind: Enemy["kind"]): string {
  switch (kind) {
    case "slime":
      return "#7adc5a";
    case "bat":
      return "#c050e0";
    case "turret":
      return "#ff7050";
    case "redturret":
      return "#e21f18";
    case "boss":
      return "#ff3060";
    case "wraith":
      return "#ff9050";
    case "sovereign":
      return "#ff5020";
    case "kraid":
      return "#c06020";
  }
}

function updateEnemy(g: GameState, e: Enemy, tiles: number[][]) {
  if (e.hitFlash > 0) e.hitFlash--;
  const p = g.player;
  switch (e.kind) {
    case "slime": {
      e.vy += 0.5;
      if (e.vy > 12) e.vy = 12;
      // Patrol
      if (e.x <= e.patrolMin) {
        e.vx = Math.abs(e.vx);
        e.facing = 1;
      } else if (e.x + e.w >= e.patrolMax) {
        e.vx = -Math.abs(e.vx);
        e.facing = -1;
      }
      if (Math.abs(e.vx) < 0.5) e.vx = 1.0 * e.facing;
      const r = moveAndCollide(e, tiles);
      if (r.hitX) {
        e.vx *= -1;
        e.facing = (e.facing === 1 ? -1 : 1) as 1 | -1;
      }
      break;
    }
    case "bat": {
      // Sine wave hover, drift toward player when in range (phantom hides player)
      e.phase += 0.08;
      const distX = p.x - e.x;
      const seek = !p.phantomActive && Math.abs(distX) < 200 ? Math.sign(distX) * 1.2 : 0;
      e.vx = seek;
      // Patrol bounds
      if (seek === 0) {
        if (e.x < e.patrolMin) e.vx = 0.6;
        else if (e.x > e.patrolMax) e.vx = -0.6;
        else e.vx = 0.6 * e.facing;
      }
      e.facing = e.vx >= 0 ? 1 : -1;
      const oscY = Math.sin(e.phase) * 0.6;
      e.vy = oscY;
      e.x += e.vx;
      e.y += e.vy;
      // Soft tile collision
      const minCol = Math.floor(e.x / TILE);
      const maxCol = Math.floor((e.x + e.w - 0.001) / TILE);
      const minRow = Math.floor(e.y / TILE);
      const maxRow = Math.floor((e.y + e.h - 0.001) / TILE);
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (
            r >= 0 &&
            r < tiles.length &&
            c >= 0 &&
            c < tiles[0].length &&
            tiles[r][c] === 1
          ) {
            // Push out vertically
            if (e.vy > 0) e.y = r * TILE - e.h;
            else e.y = (r + 1) * TILE;
            e.vy = -e.vy * 0.5;
          }
        }
      }
      break;
    }
    case "turret": {
      e.cooldown--;
      const dx = p.x + p.w / 2 - (e.x + e.w / 2);
      const dy = p.y + p.h / 2 - (e.y + e.h / 2);
      e.facing = dx >= 0 ? 1 : -1;
      const dist = Math.hypot(dx, dy);
      // Phantom veil hides player from turrets
      if (!p.phantomActive && dist < 320 && e.cooldown <= 0) {
        e.cooldown = 90;
        const norm = 1 / (dist || 1);
        g.projectiles.push({
          x: e.x + e.w / 2 - 5,
          y: e.y + e.h / 2 - 5,
          vx: dx * norm * 4.5,
          vy: dy * norm * 4.5,
          life: 110,
          w: 10,
          h: 10,
          fromPlayer: false,
          damage: 1,
        });
      }
      break;
    }
    case "redturret": {
      e.cooldown--;
      const dx = p.x + p.w / 2 - (e.x + e.w / 2);
      const dy = p.y + p.h / 2 - (e.y + e.h / 2);
      e.facing = dx >= 0 ? 1 : -1;
      const dist = Math.hypot(dx, dy);
      if (!p.phantomActive && dist < 360 && e.cooldown <= 0) {
        e.cooldown = 78;
        const norm = 1 / (dist || 1);
        g.projectiles.push({
          x: e.x + e.w / 2 - 6,
          y: e.y + e.h / 2 - 6,
          vx: dx * norm * 5.2,
          vy: dy * norm * 5.2,
          life: 125,
          w: 12,
          h: 12,
          fromPlayer: false,
          damage: 1,
          unparriable: true,
        });
        g.redTurretWarningTimer = Math.max(g.redTurretWarningTimer, 150);
        spawnParticles(g, e.x + e.w / 2, e.y + e.h / 2, 5, "#ff3020", {
          spread: 2,
          gravity: 0,
          life: 14,
        });
      }
      break;
    }
    case "wraith": {
      // Floats freely toward the player on both axes; ignores gravity.
      // Phantom veil makes player invisible to wraiths — they hover in place.
      e.phase += 0.05;
      const dx = p.x + p.w / 2 - (e.x + e.w / 2);
      const dy = p.y + p.h / 2 - (e.y + e.h / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const speed = p.phantomActive ? 0 : 1.4;
      e.vx = (dx / dist) * speed;
      e.vy = (dy / dist) * speed + Math.sin(e.phase) * 0.4;
      if (p.phantomActive) { e.vx *= 0.85; e.vy *= 0.85; }
      e.facing = dx >= 0 ? 1 : -1;
      // Use the common collision solver so the wraith cannot tunnel through
      // tall-room walls or get stuck inside a corner.
      moveAndCollide(e, tiles);
      break;
    }
    case "kraid": {
      // Ancient Terror — fully immobile wall boss. Its three cores are the
      // only targets, and every core must be destroyed before it can die.
      e.phase += 0.015;
      e.cooldown--;
      // No movement whatsoever — permanently affixed to the right wall.
      e.vx = 0;
      e.vy = 0;
      e.facing = -1;

      const hpPct2 = e.hp / e.maxHp;
      const cores = [e.y + 4 * TILE, e.y + 16 * TILE, e.y + 28 * TILE];

      if (e.state === "idle") {
        if (e.cooldown <= 0) {
          const r = Math.random();
          if (r < 0.38) {
            e.state = "telegraph";
            e.cooldown = 36;
          } else if (r < 0.70) {
            e.state = "aim_charge";
            e.cooldown = 28;
          } else {
            e.state = "slam_charge";
            e.cooldown = 42;
          }
        }
      } else if (e.state === "telegraph") {
        if (e.cooldown <= 0) {
          // Fan of projectiles from each core leftward toward player
          const shots = hpPct2 < 0.5 ? 5 : 3;
          const half = (shots - 1) / 2;
          for (let ci = 0; ci < cores.length; ci++) {
            if ((e.coreHps?.[ci] ?? 0) <= 0) continue;
            const cy = cores[ci];
            for (let fi = -half; fi <= half; fi++) {
              const ang = Math.PI + fi * 0.24;
              g.projectiles.push({
                x: e.x - 7, y: cy + TILE / 2 - 7,
                vx: Math.cos(ang) * 4.5, vy: Math.sin(ang) * 4.5,
                life: 180, w: 14, h: 14,
                 fromPlayer: false, damage: 1,
                 unparriable: Math.random() < (hpPct2 < 0.5 ? 0.34 : 0.2),
                 spike: true,
              });
            }
          }
          e.state = "recover";
          e.cooldown = hpPct2 < 0.5 ? 50 : 72;
        }
      } else if (e.state === "aim_charge") {
        if (e.cooldown <= 0) {
          // Each core fires an aimed shot at player position
          for (const cy of cores) {
            const ox = e.x + 16;
            const oy = cy + TILE / 2;
            const ang = Math.atan2(p.y + p.h / 2 - oy, p.x + p.w / 2 - ox);
            const speed = hpPct2 < 0.5 ? 7.5 : 6.0;
            g.projectiles.push({
              x: ox - 7, y: oy - 7,
              vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
              life: 190, w: 14, h: 14,
               fromPlayer: false, damage: 1,
               unparriable: Math.random() < (hpPct2 < 0.5 ? 0.38 : 0.22),
               spike: true,
            });
          }
          e.state = "recover";
          e.cooldown = hpPct2 < 0.5 ? 45 : 65;
        }
      } else if (e.state === "slam_charge") {
        if (e.cooldown <= 0) {
          // Dense left-side barrage
          const spawnCount = hpPct2 < 0.5 ? 8 : 5;
          for (let si = 0; si < spawnCount; si++) {
            const oy = e.y + (si + 0.5) * (e.h / spawnCount);
            g.projectiles.push({
              x: e.x - 14, y: oy - 7,
              vx: -6, vy: (Math.random() - 0.5) * 3.5,
              life: 140, w: 14, h: 14,
               fromPlayer: false, damage: 1,
               unparriable: Math.random() < (hpPct2 < 0.5 ? 0.42 : 0.25),
               spike: true,
            });
          }
          g.shake = Math.max(g.shake, 14);
          e.state = "recover";
          e.cooldown = hpPct2 < 0.5 ? 55 : 82;
        }
      } else if (e.state === "recover") {
        if (e.cooldown <= 0) {
          e.state = "idle";
          e.cooldown = hpPct2 < 0.5 ? 30 : 60;
        }
      }
      // Completely immobile — no moveAndCollide call
      break;
    }
    case "sovereign":
    case "boss": {
      e.phase += 0.04;
      e.cooldown--;
      e.vy += 0.5;
      if (e.vy > 14) e.vy = 14;

      const dx = p.x + p.w / 2 - (e.x + e.w / 2);
      e.facing = dx >= 0 ? 1 : -1;

      const isSovereign = e.kind === "sovereign";
      // Phase-based behavior — Sovereign is permanently in phase 2
      const hpPct = e.hp / e.maxHp;
      const phase2 = isSovereign || hpPct < 0.5;
      const moveSpeed = isSovereign ? 3.6 : phase2 ? 3.2 : 1.8;
      const tg = isSovereign ? 14 : phase2 ? 16 : 30;

      const pickAttack = () => {
        const r = Math.random();
        if (phase2 && r < 0.18) {
          e.state = "aim_charge";
          e.cooldown = tg;
        } else if (r < 0.4) {
          e.state = "telegraph";
          e.cooldown = tg;
        } else if (r < 0.75) {
          e.state = "slam_charge";
          e.cooldown = tg;
        } else {
          e.state = "dash_charge";
          e.cooldown = tg;
        }
      };

      if (e.state === "idle") {
        e.vx = Math.sign(dx) * moveSpeed * 0.6;
        if (e.cooldown <= 0) {
          pickAttack();
        }
      } else if (e.state === "aim_charge") {
        e.vx *= 0.8;
        if (e.cooldown <= 0) {
          // Fast aimed bolt(s) at player position; sovereign fires triple
          const tx = p.x + p.w / 2;
          const ty = p.y + p.h / 2;
          const ox = e.x + e.w / 2;
          const oy = e.y + e.h / 2;
          const baseAng = Math.atan2(ty - oy, tx - ox);
          const speed = phase2 ? 9 : 7.5;
          const offsets = isSovereign ? [-0.18, 0, 0.18] : [0];
          for (const off of offsets) {
            const ang = baseAng + off;
            g.projectiles.push({
              x: ox - 7,
              y: oy - 7,
              vx: Math.cos(ang) * speed,
              vy: Math.sin(ang) * speed,
              life: 160,
              w: 14,
              h: 14,
              fromPlayer: false,
              damage: 1,
              unparriable: Math.random() < (isSovereign ? 0.18 : phase2 ? 0.16 : 0.08),
            });
          }
          e.state = "recover";
          e.cooldown = phase2 ? 22 : 40;
        }
      } else if (e.state === "telegraph") {
        e.vx *= 0.85;
        if (e.cooldown <= 0) {
          // Spread shot fan (5 in phase 2, 3 in phase 1)
          const shots = phase2 ? 5 : 3;
          const half = (shots - 1) / 2;
          const speed = phase2 ? 6 : 5;
          for (let i = -half; i <= half; i++) {
            const angle = i * 0.22;
            g.projectiles.push({
              x: e.x + e.w / 2 - 6,
              y: e.y + e.h / 2 - 6,
              vx: Math.cos(angle) * speed * e.facing,
              vy: Math.sin(angle) * speed,
              life: 140,
              w: 12,
              h: 12,
              fromPlayer: false,
              damage: 1,
              unparriable: Math.random() < (isSovereign ? 0.14 : phase2 ? 0.12 : 0.06),
            });
          }
          e.state = "recover";
          e.cooldown = phase2 ? 50 : 70;
        }
      } else if (e.state === "slam_charge") {
        // Crouch/wind up before leaping
        e.vx *= 0.7;
        if (e.cooldown <= 0) {
          // Phase 2 leaps higher so it can land on the arena platforms
          e.vy = phase2 ? -16 : -11;
          e.vx = Math.sign(dx) * (phase2 ? 4 : 3);
          e.state = "slam_jump";
          e.cooldown = 80;
        }
      } else if (e.state === "slam_jump") {
        // Track horizontally toward player while airborne
        e.vx = Math.sign(dx) * (phase2 ? 4 : 3);
        if (e.vy >= 0) {
          // In phase 2, fall normally so the boss can settle on platforms;
          // in phase 1, fast-fall to ground for the classic slam.
          if (!phase2) {
            e.vy = 14;
          }
          e.state = "slam_fall";
        }
      } else if (e.state === "slam_fall") {
        // Falling fast — collision below triggers shockwave
        if (!phase2) e.vy = Math.max(e.vy, 12);
        e.vx *= 0.9;
      } else if (e.state === "dash_charge") {
        // Telegraph then dash horizontally across the arena
        e.vx *= 0.6;
        if (e.cooldown <= 0) {
          e.vx = e.facing * (phase2 ? 11 : 9);
          e.state = "dashing";
          e.cooldown = 35;
        }
      } else if (e.state === "dashing") {
        // Maintain charge speed, decay slowly
        e.vx *= 0.96;
        if (Math.abs(e.vx) < 1.5 || e.cooldown <= 0) {
          e.state = "recover";
          e.cooldown = phase2 ? 35 : 55;
        }
      } else if (e.state === "recover") {
        e.vx *= 0.88;
        if (e.cooldown <= 0) {
          // Phase 2 enraged: 60% chance to chain immediately into another attack
          if (phase2 && Math.random() < 0.6) {
            pickAttack();
          } else {
            e.state = "idle";
            e.cooldown = phase2 ? 28 : 90;
          }
        }
      }

      const r = moveAndCollide(e, tiles);
      if (r.hitX) {
        e.vx = 0;
        // Bonking a wall mid-dash ends it early
        if (e.state === "dashing") {
          e.state = "recover";
          e.cooldown = phase2 ? 35 : 55;
        }
      }
      // Shockwaves on slam landing
      if (e.state === "slam_fall" && r.onGround) {
        g.shake = Math.max(g.shake, 18);
        for (const dir of [-1, 1]) {
          g.projectiles.push({
            x: e.x + e.w / 2 - 9,
            y: e.y + e.h - 18,
            vx: dir * 5,
            vy: 0,
            life: 110,
            w: 18,
            h: 18,
            fromPlayer: false,
            damage: 1,
          });
          // Phase 2: extra slow inner shockwave pair
          if (phase2) {
            g.projectiles.push({
              x: e.x + e.w / 2 - 9,
              y: e.y + e.h - 18,
              vx: dir * 2.5,
              vy: 0,
              life: 160,
              w: 18,
              h: 18,
              fromPlayer: false,
              damage: 1,
            });
          }
          // Sovereign: third extra-fast shockwave pair
          if (isSovereign) {
            g.projectiles.push({
              x: e.x + e.w / 2 - 9,
              y: e.y + e.h - 18,
              vx: dir * 7.5,
              vy: 0,
              life: 90,
              w: 18,
              h: 18,
              fromPlayer: false,
              damage: 1,
            });
          }
        }
        spawnParticles(
          g,
          e.x + e.w / 2,
          e.y + e.h,
          22,
          "#ff3060",
          { spread: 5, gravity: -0.05, life: 32 },
        );
        e.state = "recover";
        e.cooldown = phase2 ? 30 : 50;
      }
      break;
    }
  }
}
