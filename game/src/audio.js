// All sound is synthesized with WebAudio: no audio files, no network.
// Footsteps tick softly, a guard's suspicion blips, the alarm stings,
// a manuscript chimes and the win plays a small arpeggio.
export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._step = 0;
  }

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        this.enabled = false;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  _tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  footstep(sprinting) {
    if (!this.enabled || !this.ctx) return;
    this._step += 1;
    // Alternate feet, a soft filtered tick.
    this._tone(sprinting ? 190 : 150, 0.05, 'triangle', sprinting ? 0.05 : 0.028);
  }

  suspicious() {
    this._tone(620, 0.12, 'sine', 0.06, 0, 880);
  }

  alarm() {
    this._tone(440, 0.16, 'square', 0.05, 0, 660);
    this._tone(440, 0.16, 'square', 0.05, 0.18, 660);
  }

  pickup() {
    this._tone(880, 0.1, 'sine', 0.07);
    this._tone(1318, 0.16, 'sine', 0.06, 0.09);
  }

  pebble() {
    this._tone(1200, 0.05, 'triangle', 0.04, 0, 500);
  }

  caught() {
    this._tone(220, 0.35, 'sawtooth', 0.07, 0, 110);
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.22, 'sine', 0.07, i * 0.13));
  }
}
