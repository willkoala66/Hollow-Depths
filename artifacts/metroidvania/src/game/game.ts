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
  PHANTOM_DRAIN,
  PHANTOM_MAX,
  PHANTOM_MIN_RECHARGE,
  PHANTOM_MOVE_MULT,
  PHANTOM_RECHARGE,
  PROJECTILE_LIFE,
  PROJECTILE_SPEED,
  SHOOT_COOLDOWN,
  TILE,
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
}

export interface GameState {
  player: Player;
  currentRoomId: string;
  rooms: Record<string, RoomState>;
  projectiles: Projectile[];
  particles: Particle[];
  texts: FloatingText[];
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
  lastSublayer: 1 | 2;
  hunter: Hunter | null;
  hunterAppearTimer: number;
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
  const p = g.player;
  p.x = t.toX;
  p.y = t.toY;
  p.vx = 0;
  p.vy = 0;
  p.dashTimer = 0;
  p.knockback = 0;
  p.transitionCooldown = 30;
  p.phantomActive = false;
  if (t.facing === "right") p.facing = 1;
  if (t.facing === "left") p.facing = -1;
  g.roomBannerTimer = 300;

  // Sublayer-change banner. The first time the player drops into Sublayer 2,
  // spawn the Sovereign hunter at the deepest room.
  const newSublayer = (toRoom?.sublayer ?? 1) as 1 | 2;
  const oldSublayer = (fromRoom?.sublayer ?? 1) as 1 | 2;
  if (newSublayer !== oldSublayer) {
    g.sublayerBannerTimer = 240;
    g.lastSublayer = newSublayer;
    if (newSublayer === 2 && !g.hunter) {
      g.hunter = createHunter("sl2_pierce_shrine");
      g.hunterAppearTimer = 180;
    }
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
  };
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

function updateHunter(g: GameState) {
  const h = g.hunter;
  if (!h) return;
  if (h.hitFlash > 0) h.hitFlash--;

  const sameRoom = h.roomId === g.currentRoomId;
  const room = g.rooms[h.roomId];
  if (!room) return;

  if (!sameRoom) {
    // Cross-room pursuit: drift through the labyrinth toward the player.
    h.travelCooldown--;
    if (h.travelCooldown <= 0) {
      const next = nextHunterRoom(h.roomId, g.currentRoomId);
      if (next && next !== h.roomId) {
        h.roomId = next;
        h.x = 14 * TILE;
        h.y = 13 * TILE;
        h.vx = 0;
        h.vy = 0;
      }
      h.travelCooldown = 130;
    }
    return;
  }

  // Same room as the player — physical chase.
  const p = g.player;
  const phantom = p.phantomActive;
  const spawning = g.hunterAppearTimer > 0;

  // Gravity
  h.vy += GRAVITY * 0.85;
  if (h.vy > MAX_FALL) h.vy = MAX_FALL;

  if (phantom || spawning) {
    // Lost sight — drifts and slows.
    h.vx *= 0.9;
    h.alertness = Math.max(0, h.alertness - 1);
  } else {
    h.alertness = Math.min(100, h.alertness + 4);
    const dx = p.x + p.w / 2 - (h.x + h.w / 2);
    const dy = p.y + p.h / 2 - (h.y + h.h / 2);
    const speed = 3.2;
    h.vx = Math.sign(dx) * speed;
    h.facing = dx > 0 ? 1 : -1;
    // Try to hop when player is above and hunter is grounded.
    if (h.onGround && dy < -24 && h.jumpCooldown <= 0) {
      h.vy = -10;
      h.jumpCooldown = 30;
    }
  }
  if (h.jumpCooldown > 0) h.jumpCooldown--;

  const move = moveAndCollide(h, room.def.tiles);
  h.onGround = move.onGround;

  // Contact damage to the player (only when visible & not phantom)
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
    g.shake = 8;
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

  if (!p.alive) {
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
  if (input.shoot || input.shootPressed) tryShoot(g);

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

  if (move.spike) {
    damagePlayer(p, p.x + p.w / 2);
    g.shake = 8;
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
    // Player collision (dashing grants i-frames so dash can be used to escape)
    if (
      p.invuln === 0 &&
      p.dashTimer === 0 &&
      rectOverlap(
        { x: p.x, y: p.y, w: p.w, h: p.h },
        { x: e.x, y: e.y, w: e.w, h: e.h },
      )
    ) {
      damagePlayer(p, e.x + e.w / 2);
      g.shake = 6;
    }
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
    if (
      col < 0 ||
      col >= room.def.tiles[0].length ||
      row < 0 ||
      row >= room.def.tiles.length ||
      room.def.tiles[row][col] === 1
    ) {
      spawnParticles(g, pr.x + pr.w / 2, pr.y + pr.h / 2, 4, "#caf6ff", {
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
        // Boss/Sovereign is armored while winding up or executing a dash
        // charge. Pierce shots punch right through the armor.
        const armored =
          (e.kind === "boss" || e.kind === "sovereign") &&
          (e.state === "dash_charge" || e.state === "dashing");
        if (armored && !pr.pierce) {
          spawnParticles(g, pr.x + pr.w / 2, pr.y + pr.h / 2, 5, "#ffb060", {
            spread: 3,
            gravity: 0,
            life: 14,
          });
          g.projectiles.splice(i, 1);
          consumed = true;
          break;
        }
        e.hp -= pr.damage;
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
            // Shard from the player. The true ending requires hunting down
            // the Sovereign's wraith in the labyrinth below.
            g.sovereignDefeated = true;
            g.player.abilities.pierce = false;
            g.abilityToast = { ability: "pierceLost", timer: 260 };
            g.shake = 36;
          } else if (e.kind === "boss") {
            g.bossDefeated = true;
            g.shake = 30;
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
        p.invuln === 0 &&
        p.dashTimer === 0 &&
        rectOverlap(
          { x: pr.x, y: pr.y, w: pr.w, h: pr.h },
          { x: p.x, y: p.y, w: p.w, h: p.h },
        )
      ) {
        damagePlayer(p, pr.x + pr.w / 2);
        g.projectiles.splice(i, 1);
        g.shake = 6;
      }
    }
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
          // True ending — the wraith is unmade.
          g.victory = true;
          g.victoryTimer = 0;
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

  clearPressed(input);
}

function respawnPlayer(g: GameState) {
  const p = g.player;
  p.alive = true;
  p.hp = p.maxHp;
  p.invuln = 60;
  p.vx = 0;
  p.vy = 0;
  p.dashTimer = 0;
  p.dashCooldown = 0;
  p.knockback = 0;
  p.x = p.spawnX;
  p.y = p.spawnY;
  // Reset enemies in current room
  if (p.spawnRoom !== g.currentRoomId) {
    g.currentRoomId = p.spawnRoom;
  }
  for (const room of Object.values(g.rooms)) {
    for (let i = 0; i < room.enemies.length; i++) {
      room.enemies[i] = createEnemy(room.def.enemies[i]);
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
    case "boss":
      return "#ff3060";
    case "wraith":
      return "#ff9050";
    case "sovereign":
      return "#ff5020";
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
      // Sine wave hover, drift toward player when in range
      e.phase += 0.08;
      const distX = p.x - e.x;
      const seek = Math.abs(distX) < 200 ? Math.sign(distX) * 1.2 : 0;
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
      if (dist < 320 && e.cooldown <= 0) {
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
    case "wraith": {
      // Floats freely toward the player on both axes; ignores gravity.
      e.phase += 0.05;
      const dx = p.x + p.w / 2 - (e.x + e.w / 2);
      const dy = p.y + p.h / 2 - (e.y + e.h / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const speed = 1.4;
      e.vx = (dx / dist) * speed;
      e.vy = (dy / dist) * speed + Math.sin(e.phase) * 0.4;
      e.facing = dx >= 0 ? 1 : -1;
      // Soft tile collision (push out without sticking)
      e.x += e.vx;
      e.y += e.vy;
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
            if (e.vx > 0) e.x = c * TILE - e.w;
            else if (e.vx < 0) e.x = (c + 1) * TILE;
            if (e.vy > 0) e.y = r * TILE - e.h;
            else if (e.vy < 0) e.y = (r + 1) * TILE;
          }
        }
      }
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
