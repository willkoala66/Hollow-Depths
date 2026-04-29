import { COLORS, PHANTOM_MAX, ROOM_H, ROOM_W, TILE, VIEW_H, VIEW_W } from "./constants";
import type { Enemy } from "./enemies";
import { currentRoom, type GameState, type Hunter } from "./game";
import type { Player } from "./player";

interface MapCell {
  gx: number;
  gy: number;
  sublayer: 1 | 2;
}

const MAP_LAYOUT: Record<string, MapCell> = {
  // Sublayer 1 — Hollow Depths
  cistern: { gx: 0, gy: 0, sublayer: 1 },
  antechamber: { gx: 1, gy: 0, sublayer: 1 },
  tunnel: { gx: 2, gy: 0, sublayer: 1 },
  boss_lair: { gx: 3, gy: 0, sublayer: 1 },
  rift: { gx: 4, gy: 0, sublayer: 1 },
  forge: { gx: 5, gy: 0, sublayer: 1 },
  sanctum: { gx: 6, gy: 0, sublayer: 1 },
  abyss: { gx: 2, gy: 1, sublayer: 1 },
  reach: { gx: 3, gy: 1, sublayer: 1 },
  vault: { gx: 3, gy: 2, sublayer: 1 },
  // Sublayer 2 — The Hollow Labyrinth
  sl2_entry: { gx: 0, gy: 0, sublayer: 2 },
  sl2_north: { gx: 1, gy: 0, sublayer: 2 },
  sl2_pierce_shrine: { gx: 2, gy: 0, sublayer: 2 },
  sl2_west: { gx: 0, gy: 1, sublayer: 2 },
  sl2_hub: { gx: 1, gy: 1, sublayer: 2 },
  sl2_east: { gx: 2, gy: 1, sublayer: 2 },
};

const ABILITY_NAMES: Record<string, string> = {
  doubleJump: "Wraith Wings",
  dash: "Phase Dash",
  blast: "Soul Shard",
  pierce: "Pierce Shard",
  phantom: "Phantom Veil",
  vessel: "Heart Vessel",
  pierceLost: "Pierce Shard Fades",
};
const ABILITY_DESC: Record<string, string> = {
  doubleJump: "Press jump again in the air",
  dash: "Press Shift / X to dash forward",
  blast: "Press C / J to fire energy",
  pierce: "Shots punch through enemies & armor",
  phantom: "Hold Q / F to fade — slip past the Hunter",
  vessel: "Maximum vitality increased",
  pierceLost: "The Sovereign's death has unbound your shard…",
};

const SUBLAYER_TITLES: Record<1 | 2, { name: string; subtitle: string }> = {
  1: { name: "SUBLAYER 1", subtitle: "Hollow Depths" },
  2: { name: "SUBLAYER 2", subtitle: "The Hollow Labyrinth" },
};

export function renderGame(ctx: CanvasRenderingContext2D, g: GameState) {
  const room = currentRoom(g);
  const def = room.def;

  // Clear background
  ctx.fillStyle = COLORS.bgDeep;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Camera shake
  let sx = 0;
  let sy = 0;
  if (g.shake > 0) {
    sx = (Math.random() - 0.5) * g.shake;
    sy = (Math.random() - 0.5) * g.shake;
  }
  ctx.save();
  ctx.translate(sx, sy);

  // Layered background
  drawBackground(ctx, g);

  // Tiles
  const sublayer = (def.sublayer ?? 1) as 1 | 2;
  for (let y = 0; y < ROOM_H; y++) {
    for (let x = 0; x < ROOM_W; x++) {
      const t = def.tiles[y][x];
      if (t === 1) drawWallTile(ctx, x, y, def.tiles, sublayer);
      else if (t === 2) drawSpike(ctx, x, y);
    }
  }

  // Save points
  if (def.saves) {
    for (const sv of def.saves) {
      drawSavePoint(ctx, sv.x, sv.y, g.gameTime);
    }
  }

  // Doors (subtle indicators)
  for (const d of def.doors) {
    drawDoor(ctx, d, g);
  }

  // Pickups
  for (const pk of room.pickupsLeft) {
    drawPickup(ctx, pk.x, pk.y, g.gameTime, pk.kind);
  }

  // Enemies
  for (const e of room.enemies) {
    if (!e.alive) continue;
    drawEnemy(ctx, e, g.gameTime);
  }

  // Hunter (Sublayer 2 wraith) — only if it's in this room
  if (g.hunter && g.hunter.roomId === g.currentRoomId) {
    drawHunter(ctx, g.hunter, g.gameTime, g.hunterAppearTimer);
  }

  // Projectiles
  for (const pr of g.projectiles) {
    drawProjectile(ctx, pr.x, pr.y, pr.w, pr.h, pr.fromPlayer);
  }

  // Particles
  for (const pa of g.particles) {
    const alpha = pa.life / pa.maxLife;
    ctx.fillStyle = pa.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(pa.x - pa.size / 2, pa.y - pa.size / 2, pa.size, pa.size);
  }
  ctx.globalAlpha = 1;

  // Player
  if (g.player.alive) {
    drawPlayer(ctx, g.player, g.gameTime);
  }

  // Vignette
  const vg = ctx.createRadialGradient(
    VIEW_W / 2,
    VIEW_H / 2,
    VIEW_H * 0.25,
    VIEW_W / 2,
    VIEW_H / 2,
    VIEW_H * 0.7,
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.restore();

  // HUD (no shake)
  drawHUD(ctx, g);

  // Sublayer banner — large, shown briefly when sublayer changes (or game start)
  if (g.sublayerBannerTimer > 0) {
    const alpha = Math.min(1, g.sublayerBannerTimer / 60);
    const info = SUBLAYER_TITLES[g.lastSublayer];
    drawSublayerBanner(ctx, info.name, info.subtitle, alpha);
  }

  // Room name banner on entry — visible for ~5s, fading out over the last second
  if (g.roomBannerTimer > 0) {
    const alpha = Math.min(1, g.roomBannerTimer / 60);
    drawRoomBanner(ctx, def.name, alpha);
  }

  // Ability toast
  if (g.abilityToast) {
    const a = g.abilityToast;
    const t = a.timer;
    const alpha = t > 230 ? (260 - t) / 30 : t < 30 ? t / 30 : 1;
    const lost = a.ability === "pierceLost";
    drawAbilityToast(
      ctx,
      ABILITY_NAMES[a.ability] ?? a.ability,
      ABILITY_DESC[a.ability] ?? "",
      alpha,
      lost,
    );
  }

  // Death overlay
  if (!g.player.alive) {
    const t = 1 - g.player.deathTimer / 90;
    ctx.fillStyle = `rgba(8, 2, 18, ${0.7 * t})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = `rgba(255, 90, 138, ${0.9 * t})`;
    ctx.font = "bold 56px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("YOU FELL", VIEW_W / 2, VIEW_H / 2 - 10);
    ctx.font = "16px sans-serif";
    ctx.fillStyle = `rgba(232, 228, 255, ${0.7 * t})`;
    ctx.fillText("Returning to last shrine…", VIEW_W / 2, VIEW_H / 2 + 32);
  }

  // Transition fade
  if (g.transition) {
    const a =
      g.transition.phase === "out"
        ? g.transition.progress
        : 1 - g.transition.progress;
    ctx.fillStyle = `rgba(5, 2, 8, ${a})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // Pause overlay
  if (g.paused && !g.victory) {
    ctx.fillStyle = "rgba(5, 2, 14, 0.8)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 48px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAUSED", VIEW_W / 2, VIEW_H / 2 - 60);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = COLORS.textDim;
    const lines = [
      "Move    ←  →   or   A  D",
      "Jump    Z   K   or   SPACE",
      "Dash    X   L   or   SHIFT",
      "Shoot   C   J",
      "Phantom Veil    Q   F   (hold)",
      "Pause   ESC   P",
    ];
    let y = VIEW_H / 2;
    for (const line of lines) {
      ctx.fillText(line, VIEW_W / 2, y);
      y += 26;
    }
    ctx.fillStyle = COLORS.textDim;
    ctx.font = "12px sans-serif";
    ctx.fillText("Press ESC to resume", VIEW_W / 2, y + 24);
  }

  // Victory overlay
  if (g.victory) {
    const t = Math.min(1, g.victoryTimer / 60);
    ctx.fillStyle = `rgba(5, 2, 14, ${0.85 * t})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = `rgba(232, 228, 255, ${t})`;
    ctx.font = "bold 56px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("THE HOLLOW IS QUIET", VIEW_W / 2, VIEW_H / 2 - 20);
    ctx.font = "18px sans-serif";
    ctx.fillStyle = `rgba(160, 112, 255, ${t})`;
    ctx.fillText(
      "You have unmade the throne. The depths exhale.",
      VIEW_W / 2,
      VIEW_H / 2 + 28,
    );
    ctx.font = "12px sans-serif";
    ctx.fillStyle = `rgba(120, 100, 160, ${t})`;
    ctx.fillText("Refresh to descend again.", VIEW_W / 2, VIEW_H / 2 + 64);
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, g: GameState) {
  const sl = currentRoom(g).def.sublayer ?? 1;
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  if (sl === 2) {
    grad.addColorStop(0, "#0a0518");
    grad.addColorStop(0.5, "#04020c");
    grad.addColorStop(1, "#020108");
  } else {
    grad.addColorStop(0, "#0e0820");
    grad.addColorStop(0.6, "#08040f");
    grad.addColorStop(1, "#03010a");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Distant pillars (parallax-ish, static per room)
  ctx.fillStyle = sl === 2 ? "rgba(70, 30, 100, 0.55)" : "rgba(40, 22, 70, 0.55)";
  const seed = hash(g.currentRoomId);
  for (let i = 0; i < 6; i++) {
    const x = ((seed * (i + 1) * 73) % (VIEW_W - 80)) + 20;
    const w = 36 + ((seed * (i + 3)) % 28);
    const h = 220 + ((seed * (i + 5)) % 180);
    ctx.fillRect(x, VIEW_H - h, w, h);
  }
  // Floating motes
  ctx.fillStyle = sl === 2 ? "rgba(255, 80, 120, 0.16)" : "rgba(160, 112, 255, 0.18)";
  for (let i = 0; i < 30; i++) {
    const t = g.gameTime * 0.4 + i * 30;
    const x = ((seed * 17 + i * 53) % VIEW_W);
    const y = ((t * 0.3 + seed * 7) % VIEW_H);
    ctx.fillRect(x, y, 2, 2);
  }
  // Distant menacing pulse in Sublayer 2 — the Sovereign's heartbeat
  if (sl === 2) {
    const pulse = 0.05 + Math.sin(g.gameTime * 0.04) * 0.04;
    ctx.fillStyle = `rgba(180, 40, 60, ${pulse})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function drawWallTile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  tiles: number[][],
  sublayer: 1 | 2 = 1,
) {
  const x = cx * TILE;
  const y = cy * TILE;
  const wall = sublayer === 2 ? COLORS.sl2Wall : COLORS.wall;
  const edge = sublayer === 2 ? COLORS.sl2WallEdge : COLORS.wallEdge;
  const hi = sublayer === 2 ? COLORS.sl2WallHi : COLORS.wallHighlight;
  ctx.fillStyle = wall;
  ctx.fillRect(x, y, TILE, TILE);

  // Top edge highlight if open above
  const above = cy > 0 ? tiles[cy - 1][cx] : 1;
  if (above !== 1) {
    ctx.fillStyle = hi;
    ctx.fillRect(x, y, TILE, 4);
    ctx.fillStyle = edge;
    ctx.fillRect(x, y + 4, TILE, 2);
  }
  // Side edges
  const left = cx > 0 ? tiles[cy][cx - 1] : 1;
  const right = cx < tiles[0].length - 1 ? tiles[cy][cx + 1] : 1;
  if (left !== 1) {
    ctx.fillStyle = edge;
    ctx.fillRect(x, y, 2, TILE);
  }
  if (right !== 1) {
    ctx.fillStyle = edge;
    ctx.fillRect(x + TILE - 2, y, 2, TILE);
  }
  // Brick texture
  ctx.fillStyle = sublayer === 2 ? "rgba(0,0,0,0.32)" : "rgba(0,0,0,0.18)";
  ctx.fillRect(x + 6, y + 10, 8, 2);
  ctx.fillRect(x + 18, y + 22, 6, 2);
}

function drawSpike(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const x = cx * TILE;
  const y = cy * TILE;
  ctx.fillStyle = "#1a0a18";
  ctx.fillRect(x, y + TILE - 6, TILE, 6);
  ctx.fillStyle = COLORS.spike;
  for (let i = 0; i < 4; i++) {
    const sx = x + i * 8;
    ctx.beginPath();
    ctx.moveTo(sx, y + TILE);
    ctx.lineTo(sx + 4, y + 4);
    ctx.lineTo(sx + 8, y + TILE);
    ctx.closePath();
    ctx.fill();
  }
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  d: {
    x: number;
    y: number;
    w: number;
    h: number;
    facing: string;
    requires?: string | string[];
    requiresBoss?: boolean;
    requiresSovereign?: boolean;
  },
  g: GameState,
) {
  const t = g.gameTime * 0.04;
  const pulse = 0.6 + Math.sin(t) * 0.2;
  const reqs = d.requires ? (Array.isArray(d.requires) ? d.requires : [d.requires]) : [];
  const lockedAbility = reqs.some((r) => !g.player.abilities[r as never]);
  const lockedBoss = !!d.requiresBoss && !g.bossDefeated;
  const lockedSov = !!d.requiresSovereign && !g.sovereignDefeated;
  const locked = lockedAbility || lockedBoss || lockedSov;
  const color = locked
    ? lockedSov
      ? "#1a0408"
      : COLORS.doorLocked
    : COLORS.door;
  ctx.fillStyle = color;
  ctx.globalAlpha = pulse * (locked ? 0.5 : 0.9);
  if (d.facing === "right" || d.facing === "left") {
    const stripeX = d.facing === "right" ? d.x + d.w - 4 : d.x;
    ctx.fillRect(stripeX, d.y, 4, d.h);
    // Inner glow
    ctx.fillStyle = locked ? "rgba(106,76,32,0.3)" : "rgba(58,160,200,0.3)";
    ctx.fillRect(d.x, d.y, d.w, d.h);
  } else if (d.facing === "down") {
    ctx.fillRect(d.x, d.y + d.h - 4, d.w, 4);
    // Sovereign-locked drop portals get a swirling crimson maw once unlocked.
    if (d.requiresSovereign && g.sovereignDefeated) {
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h / 2;
      const r = Math.min(d.w, d.h) * 0.55;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, `rgba(255, 60, 40, ${0.55 + Math.sin(t * 2) * 0.15})`);
      grad.addColorStop(0.5, "rgba(120, 20, 30, 0.5)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(d.x - 8, d.y - 8, d.w + 16, d.h + 16);
    } else {
      ctx.fillStyle = "rgba(58,160,200,0.18)";
      ctx.fillRect(d.x, d.y - 12, d.w, 12);
    }
  } else if (d.facing === "up") {
    ctx.fillRect(d.x, d.y, d.w, 4);
    ctx.fillStyle = "rgba(58,160,200,0.18)";
    ctx.fillRect(d.x, d.y + 4, d.w, 18);
  }
  ctx.globalAlpha = 1;
  if (locked) {
    ctx.fillStyle = lockedSov
      ? "rgba(255,40,60,0.95)"
      : lockedBoss
        ? "rgba(255,80,40,0.9)"
        : "rgba(255,200,100,0.85)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const symbol = lockedSov ? "✶" : lockedBoss ? "✦" : "◆";
    ctx.fillText(symbol, d.x + d.w / 2, d.y + d.h / 2);
  }
}

function drawSavePoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
) {
  const cx = x + 12;
  const cy = y + 12;
  const pulse = 0.7 + Math.sin(time * 0.08) * 0.3;
  // Glow
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 36);
  g.addColorStop(0, `rgba(122,240,192,${0.4 * pulse})`);
  g.addColorStop(1, "rgba(122,240,192,0)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - 36, cy - 36, 72, 72);
  // Crystal
  ctx.fillStyle = COLORS.save;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 14);
  ctx.lineTo(cx + 8, cy);
  ctx.lineTo(cx, cy + 14);
  ctx.lineTo(cx - 8, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(cx - 2, cy - 8, 2, 8);
}

function drawPickup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  kind: string,
) {
  const cx = x + 9;
  const cy = y + 9 + Math.sin(time * 0.05) * 4;
  const pulse = 0.7 + Math.sin(time * 0.08) * 0.3;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
  g.addColorStop(0, `rgba(255,216,58,${0.5 * pulse})`);
  g.addColorStop(1, "rgba(255,216,58,0)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - 40, cy - 40, 80, 80);
  ctx.fillStyle = kind === "vessel" ? "#ff90c0" : COLORS.pickup;
  ctx.beginPath();
  if (kind === "vessel") {
    // Larger crowned heart with inner sparkle
    ctx.arc(cx - 6, cy - 3, 7, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy - 3, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 13, cy);
    ctx.lineTo(cx + 13, cy);
    ctx.lineTo(cx, cy + 14);
    ctx.closePath();
    ctx.fill();
    // Crown glints
    ctx.fillStyle = "#ffe0a0";
    ctx.fillRect(cx - 10, cy - 12, 3, 3);
    ctx.fillRect(cx - 2, cy - 14, 3, 3);
    ctx.fillRect(cx + 7, cy - 12, 3, 3);
    // Inner sparkle
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cx - 4, cy - 5, 2, 2);
  } else {
    // Diamond
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx, cy + 10);
    ctx.lineTo(cx - 8, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillRect(cx - 1, cy - 6, 2, 6);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, time: number) {
  const flash = p.invuln > 0 && Math.floor(time / 4) % 2 === 0;
  // Phantom Veil aura — soft blue halo behind the player
  if (p.phantomActive) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const r = 28 + Math.sin(time * 0.18) * 4;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, "rgba(144,192,255,0.55)");
    grad.addColorStop(1, "rgba(144,192,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  if (p.phantomActive) {
    ctx.globalAlpha = 0.35;
  } else if (flash) {
    ctx.globalAlpha = 0.45;
  }
  // Trail when dashing
  if (p.dashTimer > 0) {
    ctx.fillStyle = "rgba(160,112,255,0.4)";
    for (let i = 0; i < 4; i++) {
      const offset = i * 6 * -p.dashDir;
      ctx.fillRect(p.x + offset, p.y, p.w, p.h);
    }
  }
  // Body
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  // Cloak
  ctx.fillStyle = COLORS.playerAccent;
  const cloakOffset = p.facing === 1 ? -2 : p.w + 2;
  ctx.fillRect(
    p.x + (p.facing === 1 ? -3 : p.w - 1),
    p.y + 6,
    4,
    p.h - 8,
  );
  // Head
  ctx.fillStyle = "#0a0612";
  ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, 10);
  // Eye
  ctx.fillStyle = "#7af0ff";
  const eyeX = p.facing === 1 ? p.x + p.w - 8 : p.x + 4;
  ctx.fillRect(eyeX, p.y + 7, 4, 3);
  // Walk shimmer
  if (Math.abs(p.vx) > 0.5 && p.onGround) {
    const t = Math.sin(p.walkAnim) * 1.5;
    ctx.fillStyle = "rgba(160,112,255,0.5)";
    ctx.fillRect(p.x + p.w / 2 - 1, p.y + p.h - 2 + t, 2, 2);
  }
  ctx.globalAlpha = 1;
  // Cloak indicator (unused offset variable to silence)
  void cloakOffset;
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
  const flash = e.hitFlash > 0;
  switch (e.kind) {
    case "slime": {
      const wob = Math.sin(time * 0.1) * 2;
      ctx.fillStyle = flash ? "#ffffff" : COLORS.enemySlime;
      ctx.beginPath();
      ctx.ellipse(
        e.x + e.w / 2,
        e.y + e.h / 2 + wob / 2,
        e.w / 2,
        e.h / 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      const eyeX = e.facing === 1 ? e.x + e.w / 2 + 4 : e.x + e.w / 2 - 6;
      ctx.fillRect(eyeX, e.y + e.h / 2 - 3, 3, 3);
      break;
    }
    case "bat": {
      const flap = Math.sin(time * 0.5) * 6;
      ctx.fillStyle = flash ? "#ffffff" : COLORS.enemyBat;
      // Body
      ctx.beginPath();
      ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wings
      ctx.fillStyle = flash ? "#ffffff" : "#8030a0";
      ctx.beginPath();
      ctx.moveTo(e.x + 2, e.y + e.h / 2);
      ctx.lineTo(e.x - 6, e.y + e.h / 2 + flap);
      ctx.lineTo(e.x + 4, e.y + e.h / 2 + 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(e.x + e.w - 2, e.y + e.h / 2);
      ctx.lineTo(e.x + e.w + 6, e.y + e.h / 2 + flap);
      ctx.lineTo(e.x + e.w - 4, e.y + e.h / 2 + 4);
      ctx.closePath();
      ctx.fill();
      // Eyes
      ctx.fillStyle = "#ffffaa";
      ctx.fillRect(e.x + e.w / 2 - 3, e.y + e.h / 2 - 1, 2, 2);
      ctx.fillRect(e.x + e.w / 2 + 1, e.y + e.h / 2 - 1, 2, 2);
      break;
    }
    case "turret": {
      ctx.fillStyle = flash ? "#ffffff" : "#3a1408";
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = flash ? "#ffffff" : COLORS.enemyTurret;
      ctx.fillRect(e.x + 4, e.y + 4, e.w - 8, e.h - 8);
      // Eye/lens
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      ctx.fillStyle = "#1a0408";
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff9080";
      ctx.beginPath();
      ctx.arc(cx + e.facing * 3, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      // HP pips
      drawHpPips(ctx, e);
      break;
    }
    case "wraith": {
      const drift = Math.sin(time * 0.18 + e.phase) * 3;
      // Outer wisp aura
      ctx.fillStyle = flash ? "#ffffff" : "rgba(255,144,80,0.25)";
      ctx.beginPath();
      ctx.ellipse(
        e.x + e.w / 2,
        e.y + e.h / 2 + drift,
        e.w / 2 + 4,
        e.h / 2 + 4,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // Body — flickering ember
      ctx.fillStyle = flash ? "#ffffff" : "#ff7a40";
      ctx.beginPath();
      ctx.ellipse(
        e.x + e.w / 2,
        e.y + e.h / 2 + drift,
        e.w / 2,
        e.h / 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // Tail wisp
      ctx.fillStyle = flash ? "#ffffff" : "rgba(255,180,80,0.6)";
      ctx.beginPath();
      ctx.moveTo(e.x + e.w / 2 - 3, e.y + e.h - 2 + drift);
      ctx.lineTo(e.x + e.w / 2, e.y + e.h + 8 + drift);
      ctx.lineTo(e.x + e.w / 2 + 3, e.y + e.h - 2 + drift);
      ctx.closePath();
      ctx.fill();
      // Eyes
      ctx.fillStyle = "#1a0408";
      ctx.fillRect(e.x + 6, e.y + e.h / 2 - 2 + drift, 4, 4);
      ctx.fillRect(e.x + e.w - 10, e.y + e.h / 2 - 2 + drift, 4, 4);
      ctx.fillStyle = "#ffe080";
      const wex = e.facing === 1 ? 1 : -1;
      ctx.fillRect(e.x + 7 + wex, e.y + e.h / 2 - 1 + drift, 2, 2);
      ctx.fillRect(e.x + e.w - 9 + wex, e.y + e.h / 2 - 1 + drift, 2, 2);
      break;
    }
    case "sovereign":
    case "boss": {
      const isSov = e.kind === "sovereign";
      const pulse = Math.sin(time * 0.08) * 4;
      const armored = e.state === "dash_charge" || e.state === "dashing";
      const slamming =
        e.state === "slam_charge" ||
        e.state === "slam_jump" ||
        e.state === "slam_fall";
      // Outer aura — sovereign has a constant ember halo
      if (isSov && !flash) {
        ctx.fillStyle = `rgba(255,80,32,${0.18 + Math.sin(time * 0.12) * 0.05})`;
        ctx.fillRect(e.x - 10, e.y - 10, e.w + 20, e.h + 20);
      }
      // Armored aura tint
      ctx.fillStyle = flash
        ? "#ffffff"
        : armored
          ? isSov
            ? "#702008"
            : "#5a3008"
          : isSov
            ? "#5a1a08"
            : "#3a0a18";
      ctx.fillRect(e.x - 4, e.y - 4, e.w + 8, e.h + 8);
      ctx.fillStyle = flash
        ? "#ffffff"
        : armored
          ? isSov
            ? "#ff8030"
            : "#ffb050"
          : isSov
            ? "#ff5020"
            : COLORS.enemyBoss;
      ctx.fillRect(e.x, e.y, e.w, e.h);
      // Crown — sovereign has taller spikes
      ctx.fillStyle = flash ? "#ffffff" : isSov ? "#ffd060" : "#ffb060";
      const crownCount = isSov ? 5 : 4;
      const crownSpacing = (e.w - 12) / crownCount;
      const crownH = isSov ? 20 : 14;
      for (let i = 0; i < crownCount; i++) {
        const sx = e.x + 6 + i * crownSpacing;
        ctx.beginPath();
        ctx.moveTo(sx, e.y);
        ctx.lineTo(sx + crownSpacing / 2, e.y - crownH);
        ctx.lineTo(sx + crownSpacing, e.y);
        ctx.closePath();
        ctx.fill();
      }
      // Eyes
      ctx.fillStyle = "#1a0008";
      const eyeY = e.y + (isSov ? 28 : 24);
      ctx.fillRect(e.x + 14, eyeY, 8, 6);
      ctx.fillRect(e.x + e.w - 22, eyeY, 8, 6);
      ctx.fillStyle =
        e.state === "telegraph"
          ? "#ffffaa"
          : e.state === "aim_charge"
            ? "#80ffff"
            : armored
              ? "#fff080"
              : slamming
                ? "#ff90c0"
                : isSov
                  ? "#ffd040"
                  : "#ff5070";
      const ex = e.facing === 1 ? 4 : 0;
      ctx.fillRect(e.x + 14 + ex, eyeY + 1, 4, 4);
      ctx.fillRect(e.x + e.w - 22 + ex, eyeY + 1, 4, 4);
      // Mouth (pulse during telegraph)
      ctx.fillStyle = "#1a0008";
      ctx.fillRect(
        e.x + 16,
        e.y + (isSov ? 46 : 38) + pulse / 4,
        e.w - 32,
        isSov ? 10 : 8,
      );
      // HP bar at top of screen handled in HUD
      break;
    }
  }
}

function drawHpPips(ctx: CanvasRenderingContext2D, e: Enemy) {
  const px = e.x;
  const py = e.y - 8;
  for (let i = 0; i < e.maxHp; i++) {
    ctx.fillStyle = i < e.hp ? "#ff5a8a" : "#3a1830";
    ctx.fillRect(px + i * 6, py, 4, 3);
  }
}

function drawProjectile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fromPlayer: boolean,
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const color = fromPlayer ? COLORS.projectile : "#ff7050";
  const glow = fromPlayer ? COLORS.projectileGlow : "#ffb088";
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w);
  g.addColorStop(0, glow);
  g.addColorStop(0.5, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - w, cy - h, w * 2, h * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 1, cy - 1, 2, 2);
}

function drawHUD(ctx: CanvasRenderingContext2D, g: GameState) {
  const p = g.player;
  // Top-left HP
  for (let i = 0; i < p.maxHp; i++) {
    const x = 16 + i * 22;
    const y = 16;
    if (i < p.hp) {
      ctx.fillStyle = COLORS.hpFull;
      drawHeartShape(ctx, x, y, 16);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillRect(x + 3, y + 3, 3, 3);
    } else {
      ctx.fillStyle = COLORS.hpEmpty;
      drawHeartShape(ctx, x, y, 16);
    }
  }

  // Ability icons
  const ax = 16;
  const ay = 44;
  drawAbilityIcon(ctx, ax, ay, "doubleJump", p.abilities.doubleJump);
  drawAbilityIcon(ctx, ax + 38, ay, "dash", p.abilities.dash);
  drawAbilityIcon(ctx, ax + 76, ay, "blast", p.abilities.blast);
  drawAbilityIcon(ctx, ax + 114, ay, "pierce", p.abilities.pierce);
  drawAbilityIcon(ctx, ax + 152, ay, "phantom", p.abilities.phantom);

  // Phantom meter (under the ability row, only once unlocked)
  if (p.abilities.phantom) {
    const mx = ax;
    const my = ay + 36;
    const mw = 182;
    const mh = 6;
    ctx.fillStyle = "rgba(8,2,18,0.7)";
    ctx.fillRect(mx - 1, my - 1, mw + 2, mh + 2);
    ctx.fillStyle = "rgba(40,30,60,0.6)";
    ctx.fillRect(mx, my, mw, mh);
    const pct = p.phantomMeter / PHANTOM_MAX;
    const grad = ctx.createLinearGradient(mx, my, mx + mw, my);
    if (p.phantomCooldown > 0) {
      grad.addColorStop(0, "#5a3a80");
      grad.addColorStop(1, "#7a5aa0");
    } else {
      grad.addColorStop(0, "#90c0ff");
      grad.addColorStop(1, "#c0e0ff");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(mx, my, mw * pct, mh);
    if (p.phantomActive) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(mx + mw * pct - 2, my, 2, mh);
    }
  }

  // Mini-map (top-right)
  drawMinimap(ctx, g);

  // Hunter HP bar — visible only when in the same room
  if (g.hunter && g.hunter.roomId === g.currentRoomId) {
    const h = g.hunter;
    const w = 360;
    const bh = 14;
    const x = (VIEW_W - w) / 2;
    const y = VIEW_H - 36;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 2, y - 2, w + 4, bh + 4);
    ctx.fillStyle = "#1a0408";
    ctx.fillRect(x, y, w, bh);
    const pct = Math.max(0, h.hp / h.maxHp);
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, "#ff2040");
    grad.addColorStop(1, "#ff6080");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w * pct, bh);
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("THE SOVEREIGN'S WRAITH", VIEW_W / 2, y - 12);
  }

  // Boss HP bar
  const room = currentRoom(g);
  for (const e of room.enemies) {
    if ((e.kind === "boss" || e.kind === "sovereign") && e.alive) {
      const isSov = e.kind === "sovereign";
      const w = 360;
      const h = 14;
      const x = (VIEW_W - w) / 2;
      const y = VIEW_H - 36;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      ctx.fillStyle = isSov ? "#3a1808" : "#3a0818";
      ctx.fillRect(x, y, w, h);
      const pct = Math.max(0, e.hp / e.maxHp);
      const grad = ctx.createLinearGradient(x, y, x + w, y);
      if (isSov) {
        grad.addColorStop(0, "#ff5020");
        grad.addColorStop(1, "#ffb060");
      } else {
        grad.addColorStop(0, "#ff3060");
        grad.addColorStop(1, "#ff7090");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w * pct, h);
      ctx.fillStyle = COLORS.text;
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        isSov ? "THE EMBER SOVEREIGN" : "THE HOLLOW",
        VIEW_W / 2,
        y - 12,
      );
      break;
    }
  }
}

function drawHeartShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const w = size;
  const h = size;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h * 0.95);
  ctx.bezierCurveTo(
    x - w * 0.1,
    y + h * 0.55,
    x + w * 0.1,
    y - h * 0.1,
    x + w / 2,
    y + h * 0.3,
  );
  ctx.bezierCurveTo(
    x + w * 0.9,
    y - h * 0.1,
    x + w * 1.1,
    y + h * 0.55,
    x + w / 2,
    y + h * 0.95,
  );
  ctx.closePath();
  ctx.fill();
}

function drawAbilityIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ability: string,
  unlocked: boolean,
) {
  ctx.fillStyle = unlocked ? "rgba(160,112,255,0.25)" : "rgba(40,30,60,0.5)";
  ctx.fillRect(x, y, 30, 30);
  ctx.strokeStyle = unlocked ? "#a070ff" : "#3a2a50";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, 29, 29);
  ctx.fillStyle = unlocked ? "#e8e4ff" : "#3a2a50";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label =
    ability === "doubleJump"
      ? "▲▲"
      : ability === "dash"
        ? "»"
        : ability === "pierce"
          ? "→✦"
          : ability === "phantom"
            ? "◌"
            : "✦";
  if (ability === "pierce" && unlocked) {
    ctx.fillStyle = "#ffd060";
  } else if (ability === "phantom" && unlocked) {
    ctx.fillStyle = "#90c0ff";
  }
  ctx.fillText(label, x + 15, y + 16);
}

function drawMinimap(ctx: CanvasRenderingContext2D, g: GameState) {
  const cell = 26;
  const gap = 4;
  const padding = 8;
  const sl = g.lastSublayer;
  const visibleEntries = Object.entries(MAP_LAYOUT).filter(
    ([, pos]) => pos.sublayer === sl,
  );
  const maxGx = Math.max(...visibleEntries.map(([, m]) => m.gx));
  const maxGy = Math.max(...visibleEntries.map(([, m]) => m.gy));
  const w = (maxGx + 1) * (cell + gap) - gap + padding * 2;
  const labelH = 14;
  const h = (maxGy + 1) * (cell + gap) - gap + padding * 2 + labelH;
  const x = VIEW_W - w - 16;
  const y = 16;
  ctx.fillStyle = "rgba(8,2,18,0.7)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = sl === 2 ? "rgba(255,80,120,0.55)" : "rgba(160,112,255,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  // Sublayer label
  ctx.fillStyle = sl === 2 ? "#ff80a0" : "#a070ff";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`SUBLAYER ${sl}`, x + w / 2, y + 3);
  // Hunter indicator on minimap (only meaningful in sl2)
  for (const [id, pos] of visibleEntries) {
    const cx = x + padding + pos.gx * (cell + gap);
    const cy = y + padding + labelH + pos.gy * (cell + gap);
    const visited = g.rooms[id]?.def != null;
    const current = id === g.currentRoomId;
    const hunterHere = g.hunter && g.hunter.roomId === id;
    ctx.fillStyle = current
      ? sl === 2
        ? "#ff80a0"
        : "#a070ff"
      : visited
        ? "rgba(82,48,120,0.7)"
        : "rgba(40,30,60,0.4)";
    ctx.fillRect(cx, cy, cell, cell);
    if (hunterHere) {
      ctx.fillStyle = "rgba(255,40,60,0.85)";
      ctx.fillRect(cx + cell - 8, cy + 2, 6, 6);
    }
    if (current) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx + cell / 2 - 2, cy + cell / 2 - 2, 4, 4);
    }
  }
}

function drawRoomBanner(
  ctx: CanvasRenderingContext2D,
  name: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(8,2,18,0.6)";
  ctx.fillRect(0, VIEW_H * 0.12 - 24, VIEW_W, 48);
  ctx.fillStyle = COLORS.text;
  ctx.font = "italic 28px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, VIEW_W / 2, VIEW_H * 0.12);
  ctx.restore();
}

function drawAbilityToast(
  ctx: CanvasRenderingContext2D,
  name: string,
  desc: string,
  alpha: number,
  lost = false,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const w = 420;
  const h = 70;
  const x = (VIEW_W - w) / 2;
  const y = VIEW_H * 0.34;
  ctx.fillStyle = lost ? "rgba(40,8,12,0.94)" : "rgba(20,10,40,0.92)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = lost ? "#ff4060" : "#ffd83a";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = lost ? "#ff4060" : "#ffd83a";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(lost ? "ABILITY LOST" : "ABILITY ACQUIRED", x + w / 2, y + 10);
  ctx.fillStyle = COLORS.text;
  ctx.font = "italic 22px serif";
  ctx.fillText(name, x + w / 2, y + 24);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = "12px sans-serif";
  ctx.fillText(desc, x + w / 2, y + 50);
  ctx.restore();
}

function drawSublayerBanner(
  ctx: CanvasRenderingContext2D,
  name: string,
  subtitle: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  // Wide horizontal band lower than the room banner, with subtle vignette
  const bandY = VIEW_H * 0.78;
  ctx.fillStyle = "rgba(4,2,10,0.55)";
  ctx.fillRect(0, bandY - 28, VIEW_W, 64);
  ctx.fillStyle = "#a070ff";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, VIEW_W / 2, bandY - 8);
  ctx.fillStyle = COLORS.text;
  ctx.font = "italic 24px serif";
  ctx.fillText(subtitle, VIEW_W / 2, bandY + 16);
  ctx.restore();
}

// The Sovereign's wraith — gaunt, predatory, and sketched in fluid ember-and-shadow.
function drawHunter(
  ctx: CanvasRenderingContext2D,
  h: Hunter,
  time: number,
  appearTimer: number,
) {
  const flash = h.hitFlash > 0;
  const cx = h.x + h.w / 2;
  const cy = h.y + h.h / 2;

  // Phasing-in alpha while spawning
  const baseAlpha = appearTimer > 0 ? 0.25 + (180 - appearTimer) / 180 * 0.75 : 1;
  ctx.save();
  ctx.globalAlpha = baseAlpha;

  // Outer aura — pulses with menace
  const auraR = 36 + Math.sin(time * 0.1) * 4;
  const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraR);
  aura.addColorStop(0, `rgba(255, 64, 80, 0.55)`);
  aura.addColorStop(1, `rgba(255, 64, 80, 0)`);
  ctx.fillStyle = aura;
  ctx.fillRect(cx - auraR, cy - auraR, auraR * 2, auraR * 2);

  // Body — tall, gaunt silhouette
  ctx.fillStyle = flash ? "#ffffff" : "#1a0410";
  ctx.fillRect(h.x, h.y + 6, h.w, h.h - 6);

  // Tattered cloak edges
  ctx.fillStyle = flash ? "#ffffff" : "#3a0a14";
  for (let i = 0; i < 5; i++) {
    const fx = h.x + (i / 4) * (h.w - 4) + 2;
    const fy = h.y + h.h - 4 + Math.sin(time * 0.15 + i) * 3;
    ctx.fillRect(fx - 2, fy, 4, 6);
  }

  // Crown of ember spikes
  ctx.fillStyle = flash ? "#ffffff" : COLORS.hunter;
  for (let i = 0; i < 4; i++) {
    const cx2 = h.x + 4 + i * 7;
    ctx.beginPath();
    ctx.moveTo(cx2, h.y + 2);
    ctx.lineTo(cx2 + 3, h.y + 12);
    ctx.lineTo(cx2 + 6, h.y + 2);
    ctx.closePath();
    ctx.fill();
  }

  // Glowing eyes — track the player by hunter facing
  const eyeY = h.y + 14;
  const eyeOff = h.facing === 1 ? 4 : -4;
  const eyeColor = h.alertness > 60 ? "#ffe040" : "#ff6040";
  ctx.fillStyle = eyeColor;
  ctx.fillRect(h.x + 6 + eyeOff, eyeY, 4, 3);
  ctx.fillRect(h.x + h.w - 10 + eyeOff, eyeY, 4, 3);
  // Eye glow
  ctx.globalAlpha = baseAlpha * 0.5;
  ctx.fillRect(h.x + 4 + eyeOff, eyeY - 1, 8, 5);
  ctx.fillRect(h.x + h.w - 12 + eyeOff, eyeY - 1, 8, 5);
  ctx.globalAlpha = baseAlpha;

  // Heart-ember in the chest
  const heartPulse = 0.6 + Math.sin(time * 0.18) * 0.4;
  ctx.fillStyle = `rgba(255, 80, 40, ${heartPulse})`;
  ctx.fillRect(cx - 3, cy + 2, 6, 8);

  ctx.restore();

  // Smoldering particles on the ground beneath
  if (time % 6 === 0 && appearTimer === 0) {
    // Just a visual hint — actual particles are spawned by game logic if desired
  }
}
