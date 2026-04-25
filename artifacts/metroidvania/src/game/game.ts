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
import { ROOMS, STARTING_POS, STARTING_ROOM } from "./world";

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
  abilityToast: { ability: AbilityKey; timer: number } | null;
  collectedAll: Set<string>;
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
  g.projectiles.push({
    x: px - 4,
    y: py - 4,
    vx: PROJECTILE_SPEED * p.facing,
    vy: 0,
    life: PROJECTILE_LIFE,
    w: 8,
    h: 8,
    fromPlayer: true,
    damage: 1,
  });
  spawnParticles(g, px, py, 3, "#7af0ff", { spread: 2, gravity: 0 });
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
  g.currentRoomId = t.to;
  const p = g.player;
  p.x = t.toX;
  p.y = t.toY;
  p.vx = 0;
  p.vy = 0;
  p.dashTimer = 0;
  p.knockback = 0;
  p.transitionCooldown = 30;
  if (t.facing === "right") p.facing = 1;
  if (t.facing === "left") p.facing = -1;
}

export function updateGame(g: GameState, input: InputState) {
  g.gameTime++;
  if (g.shake > 0) g.shake -= 0.5;
  if (g.shake < 0) g.shake = 0;

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
    const accel = p.onGround ? GROUND_ACCEL : AIR_ACCEL;
    let target = 0;
    if (input.left) target -= MOVE_SPEED;
    if (input.right) target += MOVE_SPEED;
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
      } else if (pk.kind === "heart") {
        p.hp = Math.min(p.maxHp, p.hp + 1);
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
    // Player collision
    if (
      p.invuln === 0 &&
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
      for (const e of room.enemies) {
        if (!e.alive) continue;
        if (
          rectOverlap(
            { x: pr.x, y: pr.y, w: pr.w, h: pr.h },
            { x: e.x, y: e.y, w: e.w, h: e.h },
          )
        ) {
          e.hp -= pr.damage;
          e.hitFlash = 8;
          spawnParticles(g, pr.x + pr.w / 2, pr.y + pr.h / 2, 6, "#caf6ff", {
            spread: 3,
            gravity: 0,
            life: 16,
          });
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
            if (e.kind === "boss") {
              g.victory = true;
              g.victoryTimer = 0;
              g.shake = 30;
            } else {
              g.shake = Math.max(g.shake, 3);
            }
          }
          g.projectiles.splice(i, 1);
          break;
        }
      }
    } else {
      // enemy projectile hits player
      if (
        p.invuln === 0 &&
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
    case "boss": {
      e.phase += 0.04;
      e.cooldown--;
      e.vy += 0.5;
      if (e.vy > 12) e.vy = 12;

      const dx = p.x + p.w / 2 - (e.x + e.w / 2);
      e.facing = dx >= 0 ? 1 : -1;

      // Phase-based behavior
      const hpPct = e.hp / e.maxHp;
      const moveSpeed = hpPct < 0.5 ? 2.4 : 1.6;

      if (e.state === "idle") {
        e.vx = Math.sign(dx) * moveSpeed;
        if (e.cooldown <= 0 && Math.abs(dx) < 360) {
          e.state = "telegraph";
          e.cooldown = 30;
        }
      } else if (e.state === "telegraph") {
        e.vx *= 0.85;
        if (e.cooldown <= 0) {
          e.state = "attack";
          e.cooldown = 1;
          // Triple shot fan
          for (let i = -1; i <= 1; i++) {
            const angle = i * 0.25;
            const speed = 5;
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
          // Dash toward player
          e.vx = e.facing * 6;
        }
      } else if (e.state === "attack") {
        e.cooldown++;
        e.vx *= 0.95;
        if (e.cooldown > 40) {
          e.state = "idle";
          e.cooldown = 80 + Math.random() * 40;
        }
      }

      const r = moveAndCollide(e, tiles);
      if (r.hitX) e.vx = 0;
      break;
    }
  }
}
