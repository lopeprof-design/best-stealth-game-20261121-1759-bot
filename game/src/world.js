// The archive itself: parses the level map into tiles, answers
// "can I stand here?", "can this guard see that spot?" and "is this
// spot lit?", and hands the renderer the furniture to draw.
import { MAP, COLS, ROWS, TILE, TUNING } from './config.js';

export const SOLID = new Set(['#', 'S', 'T', 'P']);
// Tall cover blocks a guard's sight even when the player stands up.
export const SIGHT_BLOCK = new Set(['#', 'S']);
// Low cover blocks sight only for a crouched player hiding behind it.
export const LOW_COVER = new Set(['T', 'P']);

export class World {
  constructor() {
    this.tiles = MAP.map((row) => row.split(''));
    this.manuscripts = [];
    this.lamps = [];
    this.exit = null;
    this.playerStart = null;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = this.tiles[y][x];
        if (c === 'M') this.manuscripts.push({ tx: x, ty: y, taken: false });
        if (c === 'L') this.lamps.push({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE });
        if (c === 'E') this.exit = { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE, tx: x, ty: y };
        if (c === '@') this.playerStart = { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE };
      }
    }
  }

  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
    return this.tiles[ty][tx];
  }

  isSolidTile(tx, ty) {
    return SOLID.has(this.tileAt(tx, ty));
  }

  // Circle (px) against solid tiles: true when the spot is free.
  freeAt(x, y, r) {
    const x0 = Math.floor((x - r) / TILE);
    const x1 = Math.floor((x + r) / TILE);
    const y0 = Math.floor((y - r) / TILE);
    const y1 = Math.floor((y + r) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.isSolidTile(tx, ty)) continue;
        const cx = Math.max(tx * TILE, Math.min(x, (tx + 1) * TILE));
        const cy = Math.max(ty * TILE, Math.min(y, (ty + 1) * TILE));
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return false;
      }
    }
    return true;
  }

  // Move a circle, sliding along walls. Returns the new position.
  moveCircle(x, y, r, dx, dy) {
    if (dx !== 0 && this.freeAt(x + dx, y, r)) x += dx;
    if (dy !== 0 && this.freeAt(x, y + dy, r)) y += dy;
    return { x, y };
  }

  // Line of sight between two points, optionally treating low cover as
  // blocking too (a crouched player behind a table or plant).
  hasLineOfSight(x0, y0, x1, y1, crouched) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist / 6));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const tx = Math.floor((x0 + (x1 - x0) * t) / TILE);
      const ty = Math.floor((y0 + (y1 - y0) * t) / TILE);
      const c = this.tileAt(tx, ty);
      if (SIGHT_BLOCK.has(c)) return false;
      if (crouched && LOW_COVER.has(c)) return false;
    }
    return true;
  }

  // Is the point inside a lamp's pool of light?
  litAt(x, y) {
    for (const lamp of this.lamps) {
      if (Math.hypot(x - lamp.x, y - lamp.y) < TUNING.lampRadius) return true;
    }
    return false;
  }

  manuscriptsLeft() {
    return this.manuscripts.filter((m) => !m.taken).length;
  }

  reset() {
    for (const m of this.manuscripts) m.taken = false;
  }
}
