// Simple requestAnimationFrame driver with a clamped delta.
export class Loop {
  private last = 0;
  private running = false;
  private cb: (dt: number) => void;

  constructor(cb: (dt: number) => void) {
    this.cb = cb;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.cb(dt);
    requestAnimationFrame(this.tick);
  };
}
