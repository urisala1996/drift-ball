import { BALL } from '../core/constants';

// Pure-physics, car-sized ball with real (but low) 3D bounces.
// The player never controls it directly — it only responds to collisions.
export class Ball {
  x = 0;
  y = BALL.radius; // height of center above ground
  z = 0;
  vx = 0;
  vy = 0;
  vz = 0;
  spin = 0; // visual roll accumulator

  // Per-step flag consumed by FX/audio.
  bouncedFloor = false;

  get onGround(): boolean {
    return this.y <= BALL.radius + 0.02 && Math.abs(this.vy) < 1.5;
  }

  reset() {
    this.x = 0;
    this.z = 0;
    this.y = BALL.radius;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.spin = 0;
  }

  step(dt: number) {
    this.bouncedFloor = false;

    // gravity
    this.vy -= BALL.gravity * dt;

    // friction
    const onGround = this.y <= BALL.radius + 0.02;
    const fric = onGround ? BALL.rollFriction : BALL.airFriction;
    const keep = Math.exp(-fric * dt);
    this.vx *= keep;
    this.vz *= keep;

    // integrate
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;

    // floor bounce
    if (this.y < BALL.radius) {
      this.y = BALL.radius;
      if (this.vy < 0) {
        this.vy = -this.vy * BALL.floorRestitution;
        if (this.vy < 1.2) this.vy = 0; // settle
        else this.bouncedFloor = true;
      }
    }

    // clamp speed (horizontal)
    const h = Math.hypot(this.vx, this.vz);
    if (h > BALL.maxSpeed) {
      const s = BALL.maxSpeed / h;
      this.vx *= s;
      this.vz *= s;
    }

    // spin from horizontal speed
    this.spin += h * dt * 0.4;
  }
}
