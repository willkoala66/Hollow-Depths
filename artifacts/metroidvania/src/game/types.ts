export type Vec = { x: number; y: number };

export type Rect = { x: number; y: number; w: number; h: number };

export type AbilityKey = "doubleJump" | "dash" | "blast";

export type Abilities = Record<AbilityKey, boolean>;

export type EnemyKind = "slime" | "bat" | "turret" | "boss";

export interface EnemySpawn {
  kind: EnemyKind;
  x: number;
  y: number;
  patrolMin?: number;
  patrolMax?: number;
  hp?: number;
}

export interface PickupSpawn {
  kind: "ability" | "heart" | "vessel";
  ability?: AbilityKey;
  x: number;
  y: number;
  id: string;
}

export interface DoorSpawn {
  x: number;
  y: number;
  w: number;
  h: number;
  toRoom: string;
  toX: number;
  toY: number;
  facing: "left" | "right" | "up" | "down";
  requires?: AbilityKey | AbilityKey[];
}

export interface SaveSpawn {
  x: number;
  y: number;
}

export interface RoomDef {
  id: string;
  name: string;
  bg?: string;
  tiles: number[][];
  enemies: EnemySpawn[];
  pickups: PickupSpawn[];
  doors: DoorSpawn[];
  saves?: SaveSpawn[];
}

export type Tile = 0 | 1 | 2;

export const TILE_EMPTY = 0;
export const TILE_SOLID = 1;
export const TILE_SPIKE = 2;
