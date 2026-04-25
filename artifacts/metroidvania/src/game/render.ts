import { COLORS, ROOM_H, ROOM_W, TILE, VIEW_H, VIEW_W } from "./constants";
import type { Enemy } from "./enemies";
import { currentRoom, type GameState } from "./game";
import type { Player } from "./player";

const MAP_LAYOUT: Record<string, { gx: number; gy: number }> = {
  antechamber: { gx: 0, gy: 0 },
  tunnel: { gx: 1, gy: 0 },
  abyss: { gx: 1, gy: 1 },
  boss_lair: { gx: 2, gy: 0 },
};

const ABILITY_NAMES: Record<string, string> = {
  doubleJump: "Wraith Wings",
  dash: "Phase Dash",
  blast: "Soul Shard",
};
const ABILITY_DESC: Record<string, string> = {
  doubleJump: "Press jump again in the air",
  dash: "Press Shift / X to dash forward",
  blast: "Press C / J to fire energy",
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
  for (let y = 0; y < ROOM_H; y++) {
    for (let x = 0; x < ROOM_W; x++) {
      const t = def.tiles[y][x];
      if (t === 1) drawWallTile(ctx, x, y, def.tiles);
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

  // Room name banner on entry
  if (g.transition && g.transition.phase === "in") {
    drawRoomBanner(ctx, def.name, 1 - g.transition.progress);
  } else if (g.gameTime < 180) {
    drawRoomBanner(ctx, def.name, Math.min(1, (180 - g.gameTime) / 60));
  }

  // Ability toast
  if (g.abilityToast) {
    const a = g.abilityToast;
    const t = a.timer;
    const alpha = t > 150 ? (180 - t) / 30 : t < 30 ? t / 30 : 1;
    drawAbilityToast(
      ctx,
      ABILITY_NAMES[a.ability] ?? a.ability,
      ABILITY_DESC[a.ability] ?? "",
      alpha,
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
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, "#0e0820");
  grad.addColorStop(0.6, "#08040f");
  grad.addColorStop(1, "#03010a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Distant pillars (parallax-ish, static per room)
  ctx.fillStyle = "rgba(40, 22, 70, 0.55)";
  const seed = hash(g.currentRoomId);
  for (let i = 0; i < 6; i++) {
    const x = ((seed * (i + 1) * 73) % (VIEW_W - 80)) + 20;
    const w = 36 + ((seed * (i + 3)) % 28);
    const h = 220 + ((seed * (i + 5)) % 180);
    ctx.fillRect(x, VIEW_H - h, w, h);
  }
  // Floating motes
  ctx.fillStyle = "rgba(160, 112, 255, 0.18)";
  for (let i = 0; i < 30; i++) {
    const t = g.gameTime * 0.4 + i * 30;
    const x = ((seed * 17 + i * 53) % VIEW_W);
    const y = ((t * 0.3 + seed * 7) % VIEW_H);
    ctx.fillRect(x, y, 2, 2);
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
) {
  const x = cx * TILE;
  const y = cy * TILE;
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(x, y, TILE, TILE);

  // Top edge highlight if open above
  const above = cy > 0 ? tiles[cy - 1][cx] : 1;
  if (above !== 1) {
    ctx.fillStyle = COLORS.wallHighlight;
    ctx.fillRect(x, y, TILE, 4);
    ctx.fillStyle = COLORS.wallEdge;
    ctx.fillRect(x, y + 4, TILE, 2);
  }
  // Side edges
  const left = cx > 0 ? tiles[cy][cx - 1] : 1;
  const right = cx < tiles[0].length - 1 ? tiles[cy][cx + 1] : 1;
  if (left !== 1) {
    ctx.fillStyle = COLORS.wallEdge;
    ctx.fillRect(x, y, 2, TILE);
  }
  if (right !== 1) {
    ctx.fillStyle = COLORS.wallEdge;
    ctx.fillRect(x + TILE - 2, y, 2, TILE);
  }
  // Brick texture
  ctx.fillStyle = "rgba(0,0,0,0.18)";
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
  d: { x: number; y: number; w: number; h: number; facing: string; requires?: string | string[] },
  g: GameState,
) {
  const t = g.gameTime * 0.04;
  const pulse = 0.6 + Math.sin(t) * 0.2;
  const reqs = d.requires ? (Array.isArray(d.requires) ? d.requires : [d.requires]) : [];
  const locked = reqs.some((r) => !g.player.abilities[r as never]);
  const color = locked ? COLORS.doorLocked : COLORS.door;
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
    ctx.fillStyle = "rgba(58,160,200,0.18)";
    ctx.fillRect(d.x, d.y - 12, d.w, 12);
  } else if (d.facing === "up") {
    ctx.fillRect(d.x, d.y, d.w, 4);
    ctx.fillStyle = "rgba(58,160,200,0.18)";
    ctx.fillRect(d.x, d.y + 4, d.w, 18);
  }
  ctx.globalAlpha = 1;
  if (locked) {
    ctx.fillStyle = "rgba(255,200,100,0.85)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("◆", d.x + d.w / 2, d.y + d.h / 2);
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
  ctx.fillStyle = kind === "heart" ? "#ff5a8a" : COLORS.pickup;
  ctx.beginPath();
  if (kind === "heart") {
    ctx.arc(cx - 4, cy - 2, 5, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy);
    ctx.lineTo(cx + 9, cy);
    ctx.lineTo(cx, cy + 10);
    ctx.closePath();
    ctx.fill();
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
  if (flash) {
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
    case "boss": {
      const pulse = Math.sin(time * 0.08) * 4;
      const armored = e.state === "dash_charge" || e.state === "dashing";
      const slamming =
        e.state === "slam_charge" ||
        e.state === "slam_jump" ||
        e.state === "slam_fall";
      // Armored aura tint
      ctx.fillStyle = flash
        ? "#ffffff"
        : armored
          ? "#5a3008"
          : "#3a0a18";
      ctx.fillRect(e.x - 4, e.y - 4, e.w + 8, e.h + 8);
      ctx.fillStyle = flash
        ? "#ffffff"
        : armored
          ? "#ffb050"
          : COLORS.enemyBoss;
      ctx.fillRect(e.x, e.y, e.w, e.h);
      // Crown
      ctx.fillStyle = flash ? "#ffffff" : "#ffb060";
      for (let i = 0; i < 4; i++) {
        const sx = e.x + 6 + i * 14;
        ctx.beginPath();
        ctx.moveTo(sx, e.y);
        ctx.lineTo(sx + 6, e.y - 14);
        ctx.lineTo(sx + 12, e.y);
        ctx.closePath();
        ctx.fill();
      }
      // Eyes
      ctx.fillStyle = "#1a0008";
      const eyeY = e.y + 24;
      ctx.fillRect(e.x + 14, eyeY, 8, 6);
      ctx.fillRect(e.x + e.w - 22, eyeY, 8, 6);
      ctx.fillStyle =
        e.state === "telegraph"
          ? "#ffffaa"
          : armored
            ? "#fff080"
            : slamming
              ? "#ff90c0"
              : "#ff5070";
      const ex = e.facing === 1 ? 4 : 0;
      ctx.fillRect(e.x + 14 + ex, eyeY + 1, 4, 4);
      ctx.fillRect(e.x + e.w - 22 + ex, eyeY + 1, 4, 4);
      // Mouth (pulse during telegraph)
      ctx.fillStyle = "#1a0008";
      ctx.fillRect(e.x + 16, e.y + 38 + pulse / 4, e.w - 32, 8);
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

  // Mini-map (top-right)
  drawMinimap(ctx, g);

  // Boss HP bar
  const room = currentRoom(g);
  for (const e of room.enemies) {
    if (e.kind === "boss" && e.alive) {
      const w = 360;
      const h = 14;
      const x = (VIEW_W - w) / 2;
      const y = VIEW_H - 36;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      ctx.fillStyle = "#3a0818";
      ctx.fillRect(x, y, w, h);
      const pct = Math.max(0, e.hp / e.maxHp);
      const grad = ctx.createLinearGradient(x, y, x + w, y);
      grad.addColorStop(0, "#ff3060");
      grad.addColorStop(1, "#ff7090");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w * pct, h);
      ctx.fillStyle = COLORS.text;
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("THE HOLLOW SOVEREIGN", VIEW_W / 2, y - 12);
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
    ability === "doubleJump" ? "▲▲" : ability === "dash" ? "»" : "✦";
  ctx.fillText(label, x + 15, y + 16);
}

function drawMinimap(ctx: CanvasRenderingContext2D, g: GameState) {
  const cell = 26;
  const gap = 4;
  const padding = 8;
  const maxGx = Math.max(...Object.values(MAP_LAYOUT).map((m) => m.gx));
  const maxGy = Math.max(...Object.values(MAP_LAYOUT).map((m) => m.gy));
  const w = (maxGx + 1) * (cell + gap) - gap + padding * 2;
  const h = (maxGy + 1) * (cell + gap) - gap + padding * 2;
  const x = VIEW_W - w - 16;
  const y = 16;
  ctx.fillStyle = "rgba(8,2,18,0.7)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(160,112,255,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  for (const [id, pos] of Object.entries(MAP_LAYOUT)) {
    const cx = x + padding + pos.gx * (cell + gap);
    const cy = y + padding + pos.gy * (cell + gap);
    const visited = g.rooms[id]?.def != null;
    const current = id === g.currentRoomId;
    ctx.fillStyle = current
      ? "#a070ff"
      : visited
        ? "rgba(82,48,120,0.7)"
        : "rgba(40,30,60,0.4)";
    ctx.fillRect(cx, cy, cell, cell);
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
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const w = 380;
  const h = 70;
  const x = (VIEW_W - w) / 2;
  const y = VIEW_H * 0.34;
  ctx.fillStyle = "rgba(20,10,40,0.92)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#ffd83a";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = "#ffd83a";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("ABILITY ACQUIRED", x + w / 2, y + 10);
  ctx.fillStyle = COLORS.text;
  ctx.font = "italic 22px serif";
  ctx.fillText(name, x + w / 2, y + 24);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = "12px sans-serif";
  ctx.fillText(desc, x + w / 2, y + 50);
  ctx.restore();
}
