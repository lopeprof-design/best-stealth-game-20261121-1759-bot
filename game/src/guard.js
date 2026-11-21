// A night guard: walks a patrol, watches a cone of sight, grows
// suspicious when something crosses it, investigates noises, and chases
// when the alarm sounds. The cone is clipped by walls, so cover works.
import { TILE, TUNING } from './config.js';

const TAU = Math.PI * 2;

function angleDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

export class Guard {
  constructor(def, world) {
    this.world = world;
    this.waypoints = def.waypoints.map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }));
    this.speed = def.speed;
    this.wp = 0;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.facing = Math.PI / 2; // start looking down the aisle
    this.state = 'patrol'; // patrol | pause | investigate | chase | return
    this.suspicion = 0;
    this.pauseT = 0;
    this.target = null; // {x, y} being investigated or chased
    this.lastSeen = null;
    this.alarmT = 0;
    this.rayCount = 26;
  }

  // How well this guard can see the player right now: 0 when the player
  // is out of the cone, behind cover or too far; up to 1 up close in light.
  visibilityOf(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    let range = TUNING.visionRange;
    if (!this.world.litAt(player.x, player.y)) range = TUNING.visionRangeDark;
    if (player.crouched) range = Math.min(range, TUNING.visionRangeCrouched);
    if (dist > range) return 0;
    const angle = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(angle, this.facing)) > TUNING.visionHalfAngle) return 0;
    if (!this.world.hasLineOfSight(this.x, this.y, player.x, player.y, player.crouched)) return 0;
    // Closer and better lit means seen faster; crouching buys time.
    let v = 1 - dist / range;
    if (player.crouched) v *= 0.55;
    if (this.world.litAt(player.x, player.y)) v *= 1.35;
    return Math.min(1, Math.max(0.12, v));
  }

  hearNoise(x, y, radius) {
    if (this.state === 'chase') return;
    if (Math.hypot(x - this.x, y - this.y) > radius + 30) return;
    this.target = { x, y };
    this.state = 'investigate';
    this.pauseT = 0;
  }

  raiseAlarm(x, y) {
    this.state = 'chase';
    this.lastSeen = { x, y };
    this.alarmT = TUNING.alarmDuration;
    this.target = { x, y };
  }

  calmDown() {
    this.state = 'return';
    this.suspicion = 0;
    this.target = null;
  }

  _moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    const moved = this.world.moveCircle(this.x, this.y, 12, nx - this.x, ny - this.y);
    this.x = moved.x;
    this.y = moved.y;
    const want = Math.atan2(dy, dx);
    this.facing += angleDiff(want, this.facing) * Math.min(1, dt * 8);
    return dist - step < 2;
  }

  update(dt, player, alarmed) {
    // Suspicion rises only while the player is actually visible.
    const vis = this.visibilityOf(player);
    if (vis > 0) {
      this.suspicion = Math.min(100, this.suspicion + TUNING.suspicionGain * vis * dt);
      this.lastSeen = { x: player.x, y: player.y };
    } else {
      this.suspicion = Math.max(0, this.suspicion - TUNING.suspicionDecay * dt);
    }
    if (this.suspicion >= 100 && this.state !== 'chase') {
      this.raiseAlarm(player.x, player.y);
    }

    if (this.state === 'chase') {
      this.alarmT -= dt;
      if (vis > 0) this.target = { x: player.x, y: player.y };
      if (this.target) this._moveToward(this.target.x, this.target.y, TUNING.guardChase, dt);
      if (this.alarmT <= 0 && vis <= 0) this.calmDown();
      if (this.alarmT <= 0 && vis > 0) this.alarmT = 1.5; // still sees you: keep hunting
      return;
    }
    if (this.state === 'investigate') {
      if (vis > 0) {
        // Spotted while investigating: keep the suspicion, stay put and stare.
        this.facing += angleDiff(Math.atan2(player.y - this.y, player.x - this.x), this.facing) * Math.min(1, dt * 6);
        return;
      }
      if (this.target && this._moveToward(this.target.x, this.target.y, TUNING.guardInvestigate, dt)) {
        this.state = 'pause';
        this.pauseT = 1.6;
      }
      return;
    }
    if (this.state === 'pause') {
      this.pauseT -= dt;
      // Look around while pausing: sweep the cone slowly.
      this.facing += dt * 0.9;
      if (this.pauseT <= 0) {
        this.state = this.target ? 'return' : 'patrol';
        this.target = null;
      }
      return;
    }
    if (this.state === 'return') {
      // Walk back to the nearest waypoint, then resume the patrol.
      let best = 0;
      let bestD = Infinity;
      this.waypoints.forEach((w, i) => {
        const d = Math.hypot(w.x - this.x, w.y - this.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      this.wp = best;
      if (this._moveToward(this.waypoints[this.wp].x, this.waypoints[this.wp].y, TUNING.guardInvestigate, dt)) {
        this.state = 'patrol';
      }
      return;
    }
    // patrol
    const wp = this.waypoints[this.wp];
    if (this._moveToward(wp.x, wp.y, this.speed, dt)) {
      this.wp = (this.wp + 1) % this.waypoints.length;
      this.state = 'pause';
      this.pauseT = 1.1;
    }
  }

  // The vision cone as a polygon, clipped by walls ray by ray.
  conePolygon() {
    const pts = [{ x: this.x, y: this.y }];
    const range = TUNING.visionRange;
    for (let i = 0; i <= this.rayCount; i++) {
      const a = this.facing - TUNING.visionHalfAngle + (2 * TUNING.visionHalfAngle * i) / this.rayCount;
      let r = range;
      const step = 6;
      for (let d = step; d <= range; d += step) {
        const px = this.x + Math.cos(a) * d;
        const py = this.y + Math.sin(a) * d;
        const tx = Math.floor(px / TILE);
        const ty = Math.floor(py / TILE);
        const c = this.world.tileAt(tx, ty);
        if (c === '#' || c === 'S') { r = d; break; }
      }
      pts.push({ x: this.x + Math.cos(a) * r, y: this.y + Math.sin(a) * r });
    }
    return pts;
  }
}
