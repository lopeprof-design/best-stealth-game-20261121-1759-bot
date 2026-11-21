// The Moonlit Archive — entry point: the game loop, the states
// (title, playing, caught, win, lose), the noise the player makes,
// and the ?shot= modes that pose the game for its screenshots.
import { TILE, VIEW_W, VIEW_H, TUNING, GUARDS } from './config.js';
import { World } from './world.js';
import { Guard } from './guard.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { Render } from './render.js';

const params = new URLSearchParams(window.location.search);
const SHOT = params.get('shot'); // start | play | end — poses the game for screenshots

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.world = new World();
    this.player = new Player(this.world);
    this.guards = GUARDS.map((g) => new Guard(g, this.world));
    this.input = new Input(canvas);
    this.audio = new Audio();
    this.render = new Render(canvas);
    this.state = 'title';
    this.time = 0;
    this.playTime = 0;
    this.rings = []; // expanding noise rings
    this.pebblesFlying = [];
    this.caughtT = 0;
    this.anyChasing = false;
    this._last = performance.now();
    this._heardSuspicion = new Set();
    if (SHOT) this._poseShot(SHOT);
  }

  // Pose the game for a screenshot: real states of the real game, with
  // fixed positions, so the screenshots are honest renders of the code.
  _poseShot(shot) {
    if (shot === 'start') {
      this.state = 'title';
      return;
    }
    if (shot === 'play') {
      this.state = 'playing';
      // Wren crouched behind a shelf, one chart taken, a guard's cone
      // sweeping past her and a second guard growing suspicious.
      this.player.x = 4.5 * TILE;
      this.player.y = 10.5 * TILE;
      this.player.crouched = true;
      this.player.facing = Math.PI / 2;
      this.world.manuscripts[0].taken = true;
      const g0 = this.guards[0];
      g0.x = 4.5 * TILE; g0.y = 13.5 * TILE; g0.facing = -Math.PI / 2;
      g0.suspicion = 55; g0.state = 'pause'; g0.pauseT = 9;
      const g1 = this.guards[1];
      g1.x = 10.5 * TILE; g1.y = 7.5 * TILE; g1.facing = Math.PI;
      g1.suspicion = 20; g1.state = 'pause'; g1.pauseT = 9;
      this.rings.push({ x: 10.5 * TILE, y: 8.5 * TILE, r: 60, age: 0.2, life: 1 });
      return;
    }
    if (shot === 'end') {
      this.state = 'win';
      for (const m of this.world.manuscripts) m.taken = true;
      this.player.x = 27.5 * TILE;
      this.player.y = 1.5 * TILE;
      this.player.facing = 0;
      this.playTime = 187;
      this.time = 187;
      const g3 = this.guards[3];
      g3.x = 24.5 * TILE; g3.y = 10.5 * TILE; g3.facing = Math.PI / 2;
      g3.state = 'pause'; g3.pauseT = 9;
    }
  }

  start() {
    const loop = (now) => {
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now;
      this.update(dt);
      this.render.draw(this);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    this.time += dt;
    if (this.state === 'title') {
      // Guards keep patrolling behind the title, so the first screenshot
      // shows a living archive.
      for (const g of this.guards) g.update(dt, this.player, false);
      if (this.input.consumeAnyKey()) {
        this.audio.ensure();
        this.state = 'playing';
      }
      return;
    }
    if (this.state === 'win' || this.state === 'lose') {
      if (this.input.consumeAnyKey() && this.time > 1) this._restart();
      return;
    }
    if (this.state === 'caught') {
      this.caughtT -= dt;
      if (this.caughtT <= 0) {
        if (this.player.lives <= 0) {
          this.state = 'lose';
        } else {
          this.player.reset();
          for (const g of this.guards) g.calmDown();
          this.state = 'playing';
        }
      }
      return;
    }

    // --- playing ---
    this.playTime += dt;
    this.audio.ensure();
    this.player.update(dt, this.input, this.audio);

    // Pebble toss: a click throws toward the mouse.
    if (this.input.consumePebble()) {
      const landing = this.player.tossPebble(this.input.mouse.x, this.input.mouse.y);
      if (landing) {
        this.audio.pebble();
        this.rings.push({ x: landing.x, y: landing.y, r: TUNING.pebbleNoise, age: 0, life: 0.9 });
        for (const g of this.guards) g.hearNoise(landing.x, landing.y, TUNING.pebbleNoise);
      }
    }

    // Footstep noise: guards nearby come to look.
    if (this.player.noiseR > 0) {
      for (const g of this.guards) {
        g.hearNoise(this.player.x, this.player.y, this.player.noiseR);
      }
    }

    // Guards watch, suspect, chase.
    this.anyChasing = false;
    for (const g of this.guards) {
      const wasSuspicious = g.suspicion > 25;
      g.update(dt, this.player, this.anyChasing);
      if (g.state === 'chase') this.anyChasing = true;
      if (g.suspicion > 25 && !wasSuspicious && !this._heardSuspicion.has(g)) {
        this._heardSuspicion.add(g);
        this.audio.suspicious();
      }
      if (g.suspicion <= 10) this._heardSuspicion.delete(g);
    }
    if (this.anyChasing) this.audio.alarm();

    // Caught: a chasing guard touches Wren.
    for (const g of this.guards) {
      if (g.state === 'chase' && Math.hypot(g.x - this.player.x, g.y - this.player.y) < TUNING.catchDistance) {
        this.player.lives -= 1;
        this.audio.caught();
        this.state = 'caught';
        this.caughtT = 1.6;
        return;
      }
    }

    // Manuscripts: walk over one to pocket it.
    for (const m of this.world.manuscripts) {
      if (m.taken) continue;
      const mx = (m.tx + 0.5) * TILE;
      const my = (m.ty + 0.5) * TILE;
      if (Math.hypot(mx - this.player.x, my - this.player.y) < 22) {
        m.taken = true;
        this.audio.pickup();
      }
    }

    // The exit opens once every star-chart is pocketed.
    if (this.world.manuscriptsLeft() === 0) {
      const e = this.world.exit;
      if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < 24) {
        this.state = 'win';
        this.audio.win();
        return;
      }
    }

    // Age the noise rings.
    for (const ring of this.rings) ring.age += dt;
    this.rings = this.rings.filter((r) => r.age < r.life);
  }

  _restart() {
    this.world.reset();
    this.player = new Player(this.world);
    this.guards = GUARDS.map((g) => new Guard(g, this.world));
    this.state = 'title';
    this.time = 0;
    this.playTime = 0;
    this.rings = [];
    this._heardSuspicion = new Set();
  }
}

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const game = new Game(canvas);
window.__game = game; // for play-testing from the console
game.start();
