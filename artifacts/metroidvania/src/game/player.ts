import {
  AIR_ACCEL,
  COYOTE_FRAMES,
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  FRICTION,
  GRAVITY,
  GROUND_ACCEL,
  INVULN_FRAMES,
  JUMP_BUFFER,
  JUMP_VEL,
  KNOCKBACK_X,
  KNOCKBACK_Y,
  MAX_FALL,
  MAX_HP,
  MOVE_SPEED,
  PARRY_COOLDOWN,
  PARRY_DURATION,
  PLAYER_H,
  PLAYER_W,
  SHOOT_COOLDOWN,
} from "./constants";
import type { Abilities } from "./types";

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  onGround: boolean;
  jumpsUsed: number;
  coyote: number;
  jumpBuffer: number;
  dashTimer: number;
  dashCooldown: number;
  dashDir: 1 | -1;
  shootCooldown: number;
  hp: number;
  maxHp: number;
  invuln: number;
  knockback: number;
  transitionCooldown: number;
  abilities: Abilities;
  collectedPickups: Set<string>;
  alive: boolean;
  deathTimer: number;
  flashTimer: number;
  walkAnim: number;
  spawnRoom: string;
  spawnX: number;
  spawnY: number;
  phantomActive: boolean;
  phantomMeter: number;
  phantomCooldown: number;
  parryTimer: number;
  parryCooldown: number;
}

export function createPlayer(spawnRoom: string, x: number, y: number): Player {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    w: PLAYER_W,
    h: PLAYER_H,
    facing: 1,
    onGround: false,
    jumpsUsed: 0,
    coyote: 0,
    jumpBuffer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashDir: 1,
    shootCooldown: 0,
    hp: MAX_HP,
    maxHp: MAX_HP,
    invuln: 0,
    knockback: 0,
    transitionCooldown: 0,
    abilities: {
      doubleJump: false,
      dash: false,
      blast: true,
      pierce: false,
      phantom: false,
      parry: false,
    },
    collectedPickups: new Set(),
    alive: true,
    deathTimer: 0,
    flashTimer: 0,
    walkAnim: 0,
    spawnRoom,
    spawnX: x,
    spawnY: y,
    phantomActive: false,
    phantomMeter: 240,
    phantomCooldown: 0,
    parryTimer: 0,
    parryCooldown: 0,
  };
}

export function damagePlayer(p: Player, fromX: number) {
  if (p.invuln > 0 || !p.alive) return;
  p.hp -= 1;
  p.invuln = INVULN_FRAMES;
  p.knockback = 12;
  p.flashTimer = 14;
  const dir = p.x + p.w / 2 < fromX ? -1 : 1;
  p.vx = KNOCKBACK_X * dir;
  p.vy = KNOCKBACK_Y;
  p.dashTimer = 0;
  if (p.hp <= 0) {
    p.alive = false;
    p.deathTimer = 90;
  }
}

export {
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
  MAX_HP,
  MOVE_SPEED,
  PARRY_COOLDOWN,
  PARRY_DURATION,
  SHOOT_COOLDOWN,
};
