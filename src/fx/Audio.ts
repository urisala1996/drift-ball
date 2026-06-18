// Fully synthesized Web Audio — no asset files. Lazily created on first use so
// it satisfies browser autoplay rules (first gesture resumes the context).
export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private _volume = 0.8;
  private muted = false;

  private ensure(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this._volume;
        this.master.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  set volume(v: number) {
    this._volume = v;
    if (this.master) this.master.gain.value = this.muted ? 0 : v;
  }
  get volume() {
    return this._volume;
  }
  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this._volume;
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain = 0.3, slideTo?: number) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  thud(strength: number) {
    this.blip(90 + strength * 40, 0.12 + strength * 0.1, 'sine', 0.18 + strength * 0.25, 50);
  }
  wall() {
    this.blip(180, 0.08, 'triangle', 0.12, 120);
  }
  boost() {
    this.blip(220, 0.25, 'sawtooth', 0.1, 440);
  }
  countdown() {
    this.blip(440, 0.12, 'square', 0.2);
  }
  go() {
    this.blip(660, 0.3, 'square', 0.25, 880);
  }
  goal() {
    this.blip(523, 0.15, 'square', 0.25);
    setTimeout(() => this.blip(659, 0.15, 'square', 0.25), 120);
    setTimeout(() => this.blip(784, 0.3, 'square', 0.25), 240);
  }
  whistle() {
    this.blip(1200, 0.3, 'sine', 0.18, 1500);
  }
  win() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.25, 'square', 0.25), i * 140));
  }
  lose() {
    [440, 392, 330, 262].forEach((f, i) => setTimeout(() => this.blip(f, 0.3, 'sawtooth', 0.2), i * 160));
  }
}
