import { CAR } from '../core/constants';
import type { ControlMode, DriveInput, Team } from '../core/types';

// Planar car (ground plane only, no jump/fly). The input vector is the world
// direction to travel. Two control feels, switchable per match:
//  - 'steer': turn the body toward the input dir and drive along facing (drift).
//  - 'direct': accelerate velocity straight toward the input dir (twin-stick).
export class Car {
  team: Team;
  isPlayer: boolean;
  color: number;
  mass = CAR.mass;
  controlMode: ControlMode = 'steer';

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
    if (this.controlMode === 'arcade') {
      this.driveArcade(input.steer, input.brake, maxSpeed, accel, dt);
    } else {
      // Boost with no joystick drives along current facing (useful at kickoff).
      if (boostAvail && mag <= 0.08) {
        dirX = this.forwardX();
        dirZ = this.forwardZ();
        mag = 1;
      }
      if (this.controlMode === 'steer') this.driveSteer(dirX, dirZ, mag, maxSpeed, accel, dt);
      else this.driveDirect(dirX, dirZ, mag, maxSpeed, accel, dt);
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

    // integrate
    this.x += this.vx * dt;
    this.z += this.vz * dt;
  }

  // Original car-steering: turn the body toward the input dir (authority scales
  // with speed), drive forward along facing, drift lateral velocity off.
  private driveSteer(
    dirX: number,
    dirZ: number,
    mag: number,
    maxSpeed: number,
    accel: number,
    dt: number,
  ) {
    const fx = this.forwardX();
    const fz = this.forwardZ();
    let vForward = this.vx * fx + this.vz * fz;
    let latX = this.vx - vForward * fx;
    let latZ = this.vz - vForward * fz;

    let targetSteer = 0;
    let throttle = 0;
    if (mag > 0.08) {
      const desired = Math.atan2(dirX, dirZ);
      let diff = desired - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      targetSteer = Math.max(-1, Math.min(1, diff / 0.6));
      throttle = mag;
    }
    this.steer += (targetSteer - this.steer) * Math.min(1, CAR.steerEase * dt);
    const speedNorm = 0.45 + 0.55 * Math.min(1, this.speed / 7);
    this.yaw += this.steer * CAR.turnRate * speedNorm * dt;

    if (throttle > 0) {
      vForward = Math.min(maxSpeed, vForward + accel * throttle * dt);
    } else {
      vForward *= Math.exp(-CAR.coastDamp * dt);
    }

    const nfx = this.forwardX();
    const nfz = this.forwardZ();
    const keep = Math.exp(-CAR.grip * dt);
    latX *= keep;
    latZ *= keep;
    this.vx = nfx * vForward + latX;
    this.vz = nfz * vForward + latZ;
  }

  // Arcade auto-drive: the car always accelerates forward; Left/Right steer it,
  // Brake slows then reverses. Boost raises top speed/accel.
  private driveArcade(
    steerInput: number,
    brake: boolean,
    maxSpeed: number,
    accel: number,
    dt: number,
  ) {
    this.braking = brake;
    const fx = this.forwardX();
    const fz = this.forwardZ();
    let vForward = this.vx * fx + this.vz * fz;
    let latX = this.vx - vForward * fx;
    let latZ = this.vz - vForward * fz;

    this.steer += (steerInput - this.steer) * Math.min(1, CAR.steerEase * dt);
    const speedNorm = 0.45 + 0.55 * Math.min(1, Math.abs(vForward) / 7);
    this.yaw += this.steer * CAR.turnRate * speedNorm * dt;

    if (brake) {
      if (vForward > 0.2) vForward = Math.max(0, vForward - CAR.brakeDecel * dt);
      else vForward = Math.max(-CAR.reverseSpeed, vForward - accel * dt);
    } else {
      vForward = Math.min(maxSpeed, vForward + accel * dt);
    }

    const nfx = this.forwardX();
    const nfz = this.forwardZ();
    const keep = Math.exp(-CAR.grip * dt);
    latX *= keep;
    latZ *= keep;
    this.vx = nfx * vForward + latX;
    this.vz = nfz * vForward + latZ;
  }

  // Twin-stick: accelerate velocity straight toward the input dir, body faces travel.
  private driveDirect(
    dirX: number,
    dirZ: number,
    mag: number,
    maxSpeed: number,
    accel: number,
    dt: number,
  ) {
    if (mag > 0.08) {
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
      const keep = Math.exp(-CAR.coastDamp * dt);
      this.vx *= keep;
      this.vz *= keep;
    }

    const sp = Math.hypot(this.vx, this.vz);
    let desiredYaw = this.yaw;
    if (sp > 0.6) desiredYaw = Math.atan2(this.vx, this.vz);
    else if (mag > 0.08) desiredYaw = Math.atan2(dirX, dirZ);
    let diff = desiredYaw - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.yaw += diff * Math.min(1, CAR.yawEase * dt);
    this.steer = Math.max(-1, Math.min(1, diff / 0.6));
  }
}
