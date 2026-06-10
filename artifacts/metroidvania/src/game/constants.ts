export const TILE = 32;
export const ROOM_W = 30;
export const ROOM_H = 18;
export const VIEW_W = TILE * ROOM_W;
export const VIEW_H = TILE * ROOM_H;

export const GRAVITY = 0.5;
export const MAX_FALL = 14;
export const JUMP_VEL = -12.2;
export const MOVE_SPEED = 4.0;
export const AIR_ACCEL = 0.55;
export const GROUND_ACCEL = 0.9;
export const FRICTION = 0.78;
export const DASH_SPEED = 9.5;
export const DASH_DURATION = 14;
export const DASH_COOLDOWN = 30;
export const COYOTE_FRAMES = 6;
export const JUMP_BUFFER = 6;
export const INVULN_FRAMES = 60;
export const KNOCKBACK_X = 4.5;
export const KNOCKBACK_Y = -5.5;
export const PROJECTILE_SPEED = 7.5;
export const PROJECTILE_LIFE = 60;
export const SHOOT_COOLDOWN = 18;

export const PHANTOM_MAX = 240;
export const PHANTOM_DRAIN = 1.0;
export const PHANTOM_RECHARGE = 0.45;
export const PHANTOM_MOVE_MULT = 0.45;
export const PHANTOM_MIN_RECHARGE = 60;

export const PARRY_DURATION = 12;
export const PARRY_COOLDOWN = 45;

export const PLAYER_W = 22;
export const PLAYER_H = 30;
export const MAX_HP = 5;

export const COLORS = {
  bg: "#0a0612",
  bgDeep: "#050208",
  fog: "#1a0e2a",
  wall: "#2a1840",
  wallEdge: "#523078",
  wallHighlight: "#7a4ab0",
  spike: "#e63370",
  door: "#3aa0c8",
  doorLocked: "#6a4c20",
  save: "#7af0c0",
  pickup: "#fce46a",
  pickupGlow: "#ffd83a",
  player: "#e8e4ff",
  playerAccent: "#a070ff",
  projectile: "#7af0ff",
  projectileGlow: "#caf6ff",
  enemySlime: "#7adc5a",
  enemyBat: "#c050e0",
  enemyTurret: "#ff7050",
  enemyBoss: "#ff3060",
  sl2Bg: "#04020a",
  sl2BgDeep: "#01010a",
  sl2Wall: "#1a0a30",
  sl2WallEdge: "#3a1a60",
  sl2WallHi: "#5a3aa0",
  hunter: "#ff2040",
  hunterAura: "#ff6080",
  phantomAura: "#90c0ff",
  hpFull: "#ff5a8a",
  hpEmpty: "#3a1830",
  text: "#e8e4ff",
  textDim: "#7864a0",
} as const;
