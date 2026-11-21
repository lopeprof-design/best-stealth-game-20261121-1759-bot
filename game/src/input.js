// Keyboard and mouse, in one place: the game asks this object what
// the player is doing, never the DOM events directly.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.moveX = 0;
    this.moveY = 0;
    this.sprint = false;
    this.crouch = false;
    this.pebbleQueued = false;
    this.mouse = { x: 0, y: 0 };
    this.anyKey = false;
    this._down = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this.keys.add(e.key.toLowerCase());
      this.anyKey = true;
      this._recompute();
    };
    this._up = (e) => {
      this.keys.delete(e.key.toLowerCase());
      this._recompute();
    };
    this._mouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    };
    this._click = (e) => {
      this._mouse(e);
      this.pebbleQueued = true;
      this.anyKey = true;
    };
    window.addEventListener('keydown', this._down);
    window.addEventListener('keyup', this._up);
    canvas.addEventListener('mousemove', this._mouse);
    canvas.addEventListener('mousedown', this._click);
  }

  _recompute() {
    const k = this.keys;
    this.moveX = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    this.moveY = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0);
    this.sprint = k.has('shift');
    this.crouch = k.has('c') || k.has('control');
  }

  consumePebble() {
    const p = this.pebbleQueued;
    this.pebbleQueued = false;
    return p;
  }

  consumeAnyKey() {
    const a = this.anyKey;
    this.anyKey = false;
    return a;
  }
}
