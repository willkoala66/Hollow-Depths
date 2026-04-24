import { ROOM_H, ROOM_W, TILE } from "./constants";
import type { Rect } from "./types";

export function tileAt(tiles: number[][], col: number, row: number): number {
  if (col < 0 || col >= ROOM_W || row < 0 || row >= ROOM_H) return 1;
  return tiles[row][col];
}

export function rectOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export interface MoveResult {
  hitX: boolean;
  hitY: boolean;
  spike: boolean;
  onGround: boolean;
}

export function moveAndCollide(
  body: { x: number; y: number; vx: number; vy: number; w: number; h: number },
  tiles: number[][],
): MoveResult {
  const result: MoveResult = {
    hitX: false,
    hitY: false,
    spike: false,
    onGround: false,
  };

  // Move X
  body.x += body.vx;
  let hitTilesX = collideAxis(body, tiles, "x");
  if (hitTilesX.solid) result.hitX = true;
  if (hitTilesX.spike) result.spike = true;

  // Move Y
  body.y += body.vy;
  let hitTilesY = collideAxis(body, tiles, "y");
  if (hitTilesY.solid) result.hitY = true;
  if (hitTilesY.spike) result.spike = true;
  if (hitTilesY.solid && body.vy > 0) result.onGround = true;

  // Probe one pixel below to confirm grounded
  body.y += 1;
  if (overlapsSolid(body, tiles)) result.onGround = true;
  body.y -= 1;

  return result;
}

function overlapsSolid(
  body: { x: number; y: number; w: number; h: number },
  tiles: number[][],
) {
  const minCol = Math.floor(body.x / TILE);
  const maxCol = Math.floor((body.x + body.w - 0.001) / TILE);
  const minRow = Math.floor(body.y / TILE);
  const maxRow = Math.floor((body.y + body.h - 0.001) / TILE);
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (tileAt(tiles, c, r) === 1) return true;
    }
  }
  return false;
}

function collideAxis(
  body: { x: number; y: number; vx: number; vy: number; w: number; h: number },
  tiles: number[][],
  axis: "x" | "y",
): { solid: boolean; spike: boolean } {
  const out = { solid: false, spike: false };
  const minCol = Math.floor(body.x / TILE);
  const maxCol = Math.floor((body.x + body.w - 0.001) / TILE);
  const minRow = Math.floor(body.y / TILE);
  const maxRow = Math.floor((body.y + body.h - 0.001) / TILE);
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const t = tileAt(tiles, c, r);
      if (t === 1) {
        out.solid = true;
        if (axis === "x") {
          if (body.vx > 0) {
            body.x = c * TILE - body.w;
          } else if (body.vx < 0) {
            body.x = (c + 1) * TILE;
          }
          body.vx = 0;
        } else {
          if (body.vy > 0) {
            body.y = r * TILE - body.h;
          } else if (body.vy < 0) {
            body.y = (r + 1) * TILE;
          }
          body.vy = 0;
        }
      } else if (t === 2) {
        out.spike = true;
      }
    }
  }
  return out;
}
