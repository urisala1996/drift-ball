import { CAR } from '../core/constants';
import type { DriveInput, Team } from '../core/types';

// Planar arcade-drift car. Lives on the ground plane (y = 0). Never leaves it
// (no jump/fly). Velocity is split into forward/lateral each step; lateral
// bleeds off via grip for the drifty feel.
export class Car {
  team: Team;
  isPlayer: boolean;
  color: number;
  mass = CAR.mass;

  // pose
  x = 0;
  z = 0;
  yaw = 0; // forward = (sin yaw, cos yaw)

  // motion
  vx = 0;
  vz = 0;
  steer = 0; // eased steering state (-1..1)
  speedForward = 0; // signed forward speed (for HUD/fx)

  // state
  boostMeter = 1;
  boosting = false;
  braking = false;
  reverseTimer = 0;
  inReverse = false;

  constructor(team: Team, color: number, isPlayer: boolean) {
    this.team = team;
    this.color = color;
    this.isPlayer = isPlayer;
  }

  get speed(): number {
    return Math.hypot(this.vx, this.vz);
  }

  forwardX(): number {
    return Math.sin(this.yaw);
  }
  forwardZ(): number {
    return Math.cos(this.yaw);
  }

  reset(x: number, z: number, yaw: number) {
    this.x = x;
    this.z = z;
    this.yaw = yaw;
    this.vx = 0;
    this.vz = 0;
    this.steer = 0;
    this.speedForward = 0;
    this.boostMeter = 1;
    this.boosting = false;
    this.braking = false;
    this.reverseTimer = 0;
    this.inReverse = false;
  }

  step(input: DriveInput, dt: number) {
    const fx = this.forwardX();
    const fz = this.forwardZ();

    // current forward/lateral split
    let vForward = this.vx * fx + this.vz * fz;
    let latX = this.vx - vForward * fx;
    let latZ = this.vz - vForward * fz;

    // --- steering target + throttle from input ---
    let targetSteer = 0;
    let throttle = 0;
    this.braking = input.brake;

    if (input.kind === 'aim') {
      if (input.mag > 0.08) {
        const desired = Math.atan2(input.x, input.z);
        let diff = desired - this.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        targetSteer = Math.max(-1, Math.min(1, diff / 0.6));
        throttle = input.mag;
      }
    } else {
      targetSteer = input.steer;
      throttle = input.throttle;
    }

    // ease steering toward target
    this.steer += (targetSteer - this.steer) * Math.min(1, CAR.steerEase * dt);

    // steering authority scales with speed
    const speedNorm = Math.min(1, this.speed / 12);
    this.yaw += this.steer * CAR.turnRate * speedNorm * dt;

    // --- reverse handling ---
    if (input.brake) {
      this.reverseTimer += dt;
    } else {
      this.reverseTimer = 0;
      this.inReverse = false;
    }
    if (this.reverseTimer > CAR.reverseHold && vForward < 1) {
      this.inReverse = true;
    }

    // --- longitudinal accel ---
    const boostAvail = input.boost && this.boostMeter > 0.02 && !this.inReverse;
    this.boosting = boostAvail;
    const maxSpeed = boostAvail ? CAR.boostMaxSpeed : CAR.maxSpeed;
    const accel = boostAvail ? CAR.boostAccel : CAR.accel;

    if (this.inReverse) {
      vForward -= CAR.accel * dt;
      if (vForward < -CAR.reverseSpeed) vForward = -CAR.reverseSpeed;
    } else if (input.brake) {
      // braking: strong decel, keep direction
      const dec = CAR.brakeDecel * dt;
      if (vForward > 0) vForward = Math.max(0, vForward - dec);
      else vForward = Math.min(0, vForward + dec);
    } else {
      vForward += accel * throttle * dt;
      if (vForward > maxSpeed) vForward = maxSpeed;
      if (vForward < -CAR.reverseSpeed) vForward = -CAR.reverseSpeed;
    }

    // boost meter
    if (boostAvail) this.boostMeter = Math.max(0, this.boostMeter - CAR.boostDrain * dt);
    else this.boostMeter = Math.min(1, this.boostMeter + CAR.boostRegen * dt);

    // --- grip: bleed lateral velocity ---
    const grip = input.brake ? CAR.brakeGrip : CAR.grip;
    const keep = Math.exp(-grip * dt);
    latX *= keep;
    latZ *= keep;

    // recombine
    this.speedForward = vForward;
    this.vx = fx * vForward + latX;
    this.vz = fz * vForward + latZ;

    // integrate
    this.x += this.vx * dt;
    this.z += this.vz * dt;
  }
}
