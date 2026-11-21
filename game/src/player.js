// Wren, the courier-thief: walks, crouches and sprints through the
// archive, makes noise as she moves, and tosses pebbles to distract
// guards. She is a small circle the world slides along walls.
import { TUNING } from './config.js';

export class Player {
  constructor(world) {
    this.world = world;
    this.reset();
    this.pebbles = TUNING.pebbles;
    this.lives = TUNING.lives;
  }

  reset() {
    this.x = this.world.playerStart.x;
    this.y = this.world.playerStart.y;
    this.crouched = false;
    this.sprinting = false;
    this.moving = false;
    this.noiseR = 0;
    this.stepAcc = 0;
    this.facing = -Math.PI / 2; // facing up the archive
  }

  update(dt, input, audio) {
    const ix = input.moveX;
    const iy = input.moveY;
    this.moving = ix !== 0 || iy !== 0;
    this.crouched = input.crouch && !input.sprint;
    this.sprinting = input.sprint && this.moving && !this.crouched;
    let speed = TUNING.playerWalk;
    if (this.crouched) speed = TUNING.playerCrouch;
    if (this.sprinting) speed = TUNING.playerSprint;
    if (this.moving) {
      const len = Math.hypot(ix, iy);
      const nx = (ix / len) * speed * dt;
      const ny = (iy / len) * speed * dt;
      const moved = this.world.moveCircle(this.x, this.y, 11, nx, ny);
      this.x = moved.x;
      this.y = moved.y;
      this.facing = Math.atan2(iy, ix);
      this.noiseR = this.crouched ? TUNING.noiseCrouch : this.sprinting ? TUNING.noiseSprint : TUNING.noiseWalk;
      // Footsteps: one soft tick per stride.
      this.stepAcc += speed * dt;
      const stride = this.sprinting ? 34 : this.crouched ? 22 : 28;
      if (this.stepAcc >= stride) {
        this.stepAcc = 0;
        audio.footstep(this.sprinting);
      }
    } else {
      this.noiseR = 0;
    }
  }

  // Toss a pebble toward the mouse: it lands, rings, and guards nearby
  // go to look. Returns the landing point or null.
  tossPebble(mx, my) {
    if (this.pebbles <= 0) return null;
    this.pebbles -= 1;
    const dx = mx - this.x;
    const dy = my - this.y;
    const dist = Math.hypot(dx, dy);
    const maxThrow = 190;
    const t = Math.min(1, maxThrow / Math.max(1, dist));
    let lx = this.x + dx * t;
    let ly = this.y + dy * t;
    // The pebble stops at the first wall in its path.
    const steps = Math.ceil(Math.hypot(lx - this.x, ly - this.y) / 6);
    for (let i = 1; i <= steps; i++) {
      const px = this.x + (lx - this.x) * (i / steps);
      const py = this.y + (ly - this.y) * (i / steps);
      if (this.world.isSolidTile(Math.floor(px / 32), Math.floor(py / 32))) {
        lx = this.x + (lx - this.x) * ((i - 1) / steps);
        ly = this.y + (ly - this.y) * ((i - 1) / steps);
        break;
      }
    }
    return { x: lx, y: ly };
  }
}
