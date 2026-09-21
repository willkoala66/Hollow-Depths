import { TILE } from "./constants";
import type { EnemyKind, EnemySpawn } from "./types";

export interface Enemy {
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  patrolMin: number;
  patrolMax: number;
  facing: 1 | -1;
  cooldown: number;
  alive: boolean;
  hitFlash: number;
  baseY: number;
  baseX: number;
  phase: number;
  state:
    | "idle"
    | "telegraph"
    | "attack"
    | "slam_charge"
    | "slam_jump"
    | "slam_fall"
    | "dash_charge"
    | "dashing"
    | "aim_charge"
    | "spike_volley"
    | "recover";
  damage: number;
  // Kraid only: per-core health tracking (3 cores)
  coreHps?: number[];
}

export function createEnemy(spawn: EnemySpawn): Enemy {
  const base: Enemy = {
    kind: spawn.kind,
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    w: TILE,
    h: TILE,
    hp: spawn.hp ?? 2,
    maxHp: spawn.hp ?? 2,
    patrolMin: spawn.patrolMin ?? spawn.x - TILE * 3,
    patrolMax: spawn.patrolMax ?? spawn.x + TILE * 3,
    facing: 1,
    cooldown: 0,
    alive: true,
    hitFlash: 0,
    baseY: spawn.y,
    baseX: spawn.x,
    phase: Math.random() * Math.PI * 2,
    state: "idle",
    damage: 1,
  };
  switch (spawn.kind) {
    case "slime":
      base.w = 28;
      base.h = 22;
      base.vx = 1.0;
      base.hp = spawn.hp ?? 2;
      base.maxHp = base.hp;
      break;
    case "bat":
      base.w = 26;
      base.h = 20;
      base.hp = spawn.hp ?? 1;
      base.maxHp = base.hp;
      break;
    case "turret":
      base.w = 30;
      base.h = 30;
      base.hp = spawn.hp ?? 3;
      base.maxHp = base.hp;
      break;
    case "redturret":
      base.w = 30;
      base.h = 30;
      base.hp = spawn.hp ?? 3;
      base.maxHp = base.hp;
      break;
    case "boss":
      base.w = 60;
      base.h = 60;
      base.hp = spawn.hp ?? 24;
      base.maxHp = base.hp;
      base.damage = 1;
      base.cooldown = 90;
      break;
    case "wraith":
      base.w = 28;
      base.h = 26;
      base.hp = spawn.hp ?? 2;
      base.maxHp = base.hp;
      base.damage = 1;
      break;
    case "sovereign":
      base.w = 68;
      base.h = 68;
      base.hp = spawn.hp ?? 32;
      base.maxHp = base.hp;
      base.damage = 1;
      base.cooldown = 60;
      break;
    case "kraid": {
      const coreMaxHp = 16;
      base.w = 8 * TILE;
      base.h = 32 * TILE;
      base.hp = coreMaxHp * 3;
      base.maxHp = base.hp;
      base.damage = 1;
      base.cooldown = 100;
      base.coreHps = [coreMaxHp, coreMaxHp, coreMaxHp];
      break;
    }
  }
  return base;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  w: number;
  h: number;
  fromPlayer: boolean;
  damage: number;
  pierce?: boolean;
  hitEnemies?: Set<Enemy>;
  /** If true, this projectile cannot be parried/reflected */
  unparriable?: boolean;
  /** If true, hitting a solid tile spawns a spike hazard instead of just disappearing */
  spike?: boolean;
}
