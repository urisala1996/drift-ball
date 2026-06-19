import { CAR } from '../core/constants';
import type { DriveInput, Team } from '../core/types';

// Direct world-direction (twin-stick) car. Lives on the ground plane (y = 0) and
// never leaves it (no jump/fly). The input vector is the world direction to
// travel; velocity accelerates toward that target with a capped rate so there's
// still weight/momentum, and the body orients to its direction of travel.
export class Car {
  team: Team;
  isPlayer: boolean;
  color: number;
  mass = CAR.mass;

  // pose
  x = 0;
  z = 0;
  yaw = 0; // forward = (sin yaw, cos yaw) = current travel facing

  // motion
  vx = 0;
  vz = 0;
  steer = 0; // visual front-wheel turn (-1..1)
  speedForward = 0; // current speed (for HUD/fx)

  // state
  boostMeter = 1;
  boosting = false;
  braking = false; // retained for FX hooks; unused without a brake control

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
  }

  step(input: DriveInput, dt: number) {
    const boostAvail = input.boost && this.boostMeter > 0.02;
    this.boosting = boostAvail;
    const maxSpeed = boostAvail ? CAR.boostMaxSpeed : CAR.maxSpeed;
    const accel = boostAvail ? CAR.boostAccel : CAR.accel;

    // Resolve the desired world-direction + strength.
    let dirX = input.x;
    let dirZ = input.z;
    let mag = input.mag;
    const len = Math.hypot(dirX, dirZ);
    if (len > 0.0001) {
      dirX /= len;
      dirZ /= len;
    }

    // Boost with no joystick drives along current facing (useful at kickoff).
    if (boostAvail && mag <= 0.08) {
      dirX = this.forwardX();
      dirZ = this.forwardZ();
      mag = 1;
    }

    if (mag > 0.08) {
      // accelerate velocity toward the target velocity, capped per frame so
      // direction changes still carry momentum (a little slide).
      const targetVx = dirX * maxSpeed * mag;
      const targetVz = dirZ * maxSpeed * mag;
      const dvx = targetVx - this.vx;
      const dvz = targetVz - this.vz;
      const dvm = Math.hypot(dvx, dvz);
      const maxDelta = accel * dt;
      if (dvm > maxDelta && dvm > 0) {
        this.vx += (dvx / dvm) * maxDelta;
        this.vz += (dvz / dvm) * maxDelta;
      } else {
        this.vx = targetVx;
        this.vz = targetVz;
      }
    } else {
      // coast to a stop
      const keep = Math.exp(-CAR.coastDamp * dt);
      this.vx *= keep;
      this.vz *= keep;
    }

    // boost meter
    if (boostAvail) this.boostMeter = Math.max(0, this.boostMeter - CAR.boostDrain * dt);
    else this.boostMeter = Math.min(1, this.boostMeter + CAR.boostRegen * dt);

    // clamp speed
    const sp = Math.hypot(this.vx, this.vz);
    if (sp > maxSpeed) {
      this.vx *= maxSpeed / sp;
      this.vz *= maxSpeed / sp;
    }
    this.speedForward = sp;

    // orient the body toward travel direction (or input dir when nearly stopped)
    let desiredYaw = this.yaw;
    if (sp > 0.6) desiredYaw = Math.atan2(this.vx, this.vz);
    else if (mag > 0.08) desiredYaw = Math.atan2(dirX, dirZ);
    let diff = desiredYaw - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.yaw += diff * Math.min(1, CAR.yawEase * dt);
    this.steer = Math.max(-1, Math.min(1, diff / 0.6));

    // integrate
    this.x += this.vx * dt;
    this.z += this.vz * dt;
  }
}
