// Everything the eye sees: the moonlit floor, the shelves and tables,
// the lamp pools, the guards and their cones, Wren, and the HUD.
// All art is drawn with the canvas; no image files are loaded.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, PALETTE, TUNING } from './config.js';

const BOOK_COLORS = [PALETTE.shelfBookA, PALETTE.shelfBookB, PALETTE.shelfBookC];

export class Render {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
  }

  // Deterministic pseudo-random from tile coords, so the floor pattern
  // never changes between runs.
  _hash(x, y) {
    let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }

  draw(game) {
    const ctx = this.ctx;
    const { world } = game;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this._floor(world);
    this._lamps(world);
    this._furniture(world, game.time);
    this._manuscripts(world, game.time);
    this._exit(world, game);
    for (const g of game.guards) this._cone(g);
    for (const g of game.guards) this._guard(g, game.time);
    this._player(game);
    this._noiseRings(game);
    this._pebble(game);
    this._vignette(game);
    this._hud(game);
    if (game.state === 'title') this._title(game);
    if (game.state === 'caught') this._caught(game);
    if (game.state === 'win') this._win(game);
    if (game.state === 'lose') this._lose(game);
  }

  _floor(world) {
    const ctx = this.ctx;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = world.tileAt(x, y);
        if (c === '#') continue;
        const h = this._hash(x, y);
        ctx.fillStyle = h > 0.5 ? PALETTE.floorLight : PALETTE.floorDark;
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        // Moonlight falls in soft diagonal bands across the floor.
        if ((x + y) % 7 === 0) {
          ctx.fillStyle = PALETTE.moon;
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE - 1, TILE - 1);
      }
    }
  }

  _lamps(world) {
    const ctx = this.ctx;
    for (const lamp of world.lamps) {
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, TUNING.lampRadius);
      g.addColorStop(0, PALETTE.lampGlow);
      g.addColorStop(1, 'rgba(255,196,110,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, TUNING.lampRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.lampCore;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a6a3a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  _furniture(world, time) {
    const ctx = this.ctx;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = world.tileAt(x, y);
        const px = x * TILE;
        const py = y * TILE;
        if (c === '#') {
          ctx.fillStyle = PALETTE.wall;
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = PALETTE.wallTop;
          ctx.fillRect(px, py, TILE, 5);
        } else if (c === 'S') {
          ctx.fillStyle = PALETTE.shelf;
          ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
          ctx.fillStyle = PALETTE.shelfTop;
          ctx.fillRect(px + 1, py + 1, TILE - 2, 4);
          // Book spines in three rows, colours from the tile hash.
          for (let row = 0; row < 3; row++) {
            for (let i = 0; i < 5; i++) {
              const h = this._hash(x * 5 + i, y * 3 + row);
              ctx.fillStyle = BOOK_COLORS[Math.floor(h * 3)];
              ctx.fillRect(px + 3 + i * 6, py + 7 + row * 8, 4, 7);
            }
          }
        } else if (c === 'T') {
          ctx.fillStyle = PALETTE.table;
          ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
          ctx.fillStyle = PALETTE.tableTop;
          ctx.fillRect(px + 3, py + 3, TILE - 6, 6);
          ctx.fillStyle = '#c9b98a';
          ctx.fillRect(px + 12, py + 13, 8, 6); // a forgotten letter
        } else if (c === 'P') {
          const sway = Math.sin(time * 0.8 + x + y) * 2;
          ctx.fillStyle = '#6b4a2a';
          ctx.fillRect(px + 12, py + 20, 8, 9);
          ctx.fillStyle = PALETTE.plant;
          ctx.beginPath();
          ctx.arc(px + 16 + sway, py + 13, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px + 10 + sway, py + 17, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px + 22 + sway, py + 17, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  _manuscripts(world, time) {
    const ctx = this.ctx;
    for (const m of world.manuscripts) {
      if (m.taken) continue;
      const cx = (m.tx + 0.5) * TILE;
      const cy = (m.ty + 0.5) * TILE + Math.sin(time * 2 + m.tx) * 2;
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
      g.addColorStop(0, 'rgba(255,233,168,0.5)');
      g.addColorStop(1, 'rgba(255,233,168,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.3);
      ctx.fillStyle = PALETTE.manuscript;
      ctx.fillRect(-8, -11, 16, 22);
      ctx.strokeStyle = '#8a6a3a';
      ctx.lineWidth = 1;
      ctx.strokeRect(-8, -11, 16, 22);
      ctx.beginPath();
      ctx.moveTo(-5, -4); ctx.lineTo(5, -4);
      ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
      ctx.moveTo(-5, 4); ctx.lineTo(2, 4);
      ctx.stroke();
      ctx.restore();
    }
  }

  _exit(world, game) {
    const ctx = this.ctx;
    const e = world.exit;
    const open = world.manuscriptsLeft() === 0;
    const pulse = open ? 0.5 + 0.3 * Math.sin(game.time * 3) : 0.18;
    ctx.fillStyle = `rgba(122,224,138,${pulse})`;
    ctx.fillRect(e.tx * TILE, e.ty * TILE, TILE, TILE);
    ctx.strokeStyle = PALETTE.exit;
    ctx.lineWidth = 3;
    ctx.strokeRect(e.tx * TILE + 2, e.ty * TILE + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = PALETTE.exit;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    // Below the door: above it is the HUD bar.
    ctx.fillText(open ? 'EXIT' : 'LOCKED', e.x, e.y + 28);
  }

  _cone(guard) {
    const ctx = this.ctx;
    const poly = guard.conePolygon();
    let fill = PALETTE.coneCalm;
    if (guard.state === 'chase') fill = PALETTE.coneAlarm;
    else if (guard.suspicion > 25 || guard.state === 'investigate') fill = PALETTE.coneSuspicious;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.coneEdge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _guard(guard, time) {
    const ctx = this.ctx;
    const bob = Math.sin(time * 6 + guard.x) * 1.5;
    // Body: a night watchman in a red coat with a brass helmet.
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y + bob, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guardHelm;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y - 4 + bob, 6, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(guard.x - 8, guard.y - 5 + bob, 16, 2);
    // The direction he faces: a small lantern glint.
    const fx = guard.x + Math.cos(guard.facing) * 13;
    const fy = guard.y + Math.sin(guard.facing) * 13 + bob;
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion: a "?" that fills as he grows sure, "!" at the alarm.
    if (guard.state === 'chase') {
      this._marker(guard.x, guard.y - 24 + bob, '!', '#ff5a4a');
    } else if (guard.suspicion > 25) {
      this._marker(guard.x, guard.y - 24 + bob, '?', '#ffcf5e');
    }
  }

  _marker(x, y, text, color) {
    const ctx = this.ctx;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  _player(game) {
    const ctx = this.ctx;
    const p = game.player;
    // A soft shadow pool under Wren when she crouches in the dark.
    ctx.fillStyle = p.crouched ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 8, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // A pale ring so Wren stays readable against the dark floor.
    ctx.strokeStyle = 'rgba(232,217,160,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.facing);
    ctx.fillStyle = '#a86ab8';
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(-9, -9);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-9, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.facing) * 2, p.y + Math.sin(p.facing) * 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  _noiseRings(game) {
    const ctx = this.ctx;
    for (const ring of game.rings) {
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ring.age / ring.life)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r * (0.4 + 0.6 * (ring.age / ring.life)), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  _pebble(game) {
    const ctx = this.ctx;
    for (const pb of game.pebblesFlying) {
      ctx.fillStyle = '#c9c9c9';
      ctx.beginPath();
      ctx.arc(pb.x, pb.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _vignette(game) {
    const ctx = this.ctx;
    // Darkness gathers at the edges, and deeper while a guard hunts.
    const dark = game.anyChasing ? 0.34 : 0.22;
    const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${dark})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  _hud(game) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10,8,6,0.72)';
    ctx.fillRect(0, 0, VIEW_W, 30);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    const got = TUNING.manuscripts - game.world.manuscriptsLeft();
    ctx.fillText(`Star-charts  ${got} / ${TUNING.manuscripts}`, 12, 20);
    ctx.fillText(`Pebbles  ${game.player.pebbles}`, 170, 20);
    // Lives as small moons.
    for (let i = 0; i < TUNING.lives; i++) {
      ctx.fillStyle = i < game.player.lives ? '#e8d9a0' : 'rgba(232,217,160,0.25)';
      ctx.beginPath();
      ctx.arc(300 + i * 20, 15, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Alarm meter: the archive's patience.
    const alarm = Math.max(...game.guards.map((g) => g.suspicion), 0) / 100;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(380, 10, 150, 10);
    ctx.fillStyle = alarm > 0.66 ? '#ff5a4a' : alarm > 0.33 ? '#ffcf5e' : '#7ae08a';
    ctx.fillRect(380, 10, 150 * alarm, 10);
    ctx.fillStyle = PALETTE.hud;
    ctx.fillText('ALARM', 535, 20);
    ctx.textAlign = 'right';
    const mins = Math.floor(game.time / 60);
    const secs = Math.floor(game.time % 60).toString().padStart(2, '0');
    ctx.fillText(`${mins}:${secs}`, VIEW_W - 12, 20);
    ctx.textAlign = 'left';
    // Hint line at the bottom while playing.
    if (game.state === 'playing' && game.time < 14) {
      ctx.fillStyle = 'rgba(232,221,192,0.85)';
      ctx.font = '12px sans-serif';
      ctx.fillText('WASD move · Shift sprint (loud) · C crouch (hard to see) · Click to toss a pebble · Reach the exit with all 3 star-charts', 12, VIEW_H - 10);
    }
  }

  _panel(title, lines, accent) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(8,6,5,0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = accent;
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 60);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '15px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 18 + i * 24));
    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(232,221,192,0.75)';
    ctx.fillText('Press Enter or click to continue', VIEW_W / 2, VIEW_H / 2 + 90);
    ctx.textAlign = 'left';
  }

  _title(game) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(8,6,5,0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE MOONLIT ARCHIVE', VIEW_W / 2, 150);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '16px sans-serif';
    ctx.fillText('A stealth game in one night, three star-charts and four watchmen', VIEW_W / 2, 185);
    ctx.font = '14px sans-serif';
    const lines = [
      'You are Wren, courier-thief. Slip through the archive unseen.',
      'Stay out of the lantern cones. Shelves block sight; tables and plants hide a crouching thief.',
      'Lamp-light makes you easy to spot; shadow and crouching make you hard to see.',
      'Collect all 3 star-charts, then reach the green EXIT door.',
      '',
      'WASD / arrows — move      Shift — sprint (loud)      C — crouch',
      'Click — toss a pebble to lure a guard away      3 lives',
    ];
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 235 + i * 24));
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(game.time % 1 < 0.6 ? '— Press Enter or click to begin —' : '', VIEW_W / 2, 430);
    ctx.textAlign = 'left';
  }

  _caught(game) {
    this._panel('SPOTTED!', [`A watchman caught you in the open.`, `Lives left: ${game.player.lives}`], '#ff5a4a');
  }

  _win(game) {
    this._panel('THE ARCHIVE IS YOURS', [
      `All ${TUNING.manuscripts} star-charts stolen, and never once caught flat-footed.`,
      `Time: ${Math.floor(game.time / 60)}:${Math.floor(game.time % 60).toString().padStart(2, '0')}   ·   Lives left: ${game.player.lives}`,
    ], '#7ae08a');
  }

  _lose(game) {
    this._panel('THE ARCHIVE KEEPS ITS SECRETS', [
      'Three times caught, and the watchmen bolted the doors.',
      'Press Enter to try the night again.',
    ], '#ff5a4a');
  }
}
