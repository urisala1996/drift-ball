import { BALL, CAR, PITCH } from '../core/constants';
import type { Difficulty, DriveInput } from '../core/types';
import { Ball } from '../physics/Ball';
import { Car } from '../physics/Car';

interface DiffParams {
  reaction: number; // seconds between decision refreshes
  aimError: number; // radians of random aim jitter
  boost: number; // 0..1 likelihood of using boost when clear
  predict: number; // seconds of ball lookahead
}

const DIFF: Record<Difficulty, DiffParams> = {
  easy: { reaction: 0.3, aimError: 0.45, boost: 0.2, predict: 0.15 },
  normal: { reaction: 0.16, aimError: 0.22, boost: 0.5, predict: 0.35 },
  hard: { reaction: 0.06, aimError: 0.08, boost: 0.85, predict: 0.55 },
};

// Lightweight chase/strike/defend bot. Produces an 'aim' DriveInput so it shares
// the exact movement path with the player.
export class Bot {
  private p: DiffParams;
  private timer = 0;
  private cached: DriveInput = { x: 0, z: 0, mag: 0, steer: 0, brake: false, boost: false };
  private jitter = 0;

  // roleBias: 0 = attacker (commits forward), 1 = defender (holds back). Used in 2v2.
  constructor(
    private car: Car,
    difficulty: Difficulty,
    private roleBias: number,
  ) {
    this.p = DIFF[difficulty];
  }

  private attackGoalZ(): number {
    return this.car.team === 0 ? PITCH.halfZ : -PITCH.halfZ;
  }
  private defendGoalZ(): number {
    return -this.attackGoalZ();
  }

  update(ball: Ball, dt: number): DriveInput {
    this.timer -= dt;
    if (this.timer > 0) return this.cached;
    this.timer = this.p.reaction;
    this.jitter = (Math.random() * 2 - 1) * this.p.aimError;

    // predicted ball ground position
    const bx = ball.x + ball.vx * this.p.predict;
    const bz = ball.z + ball.vz * this.p.predict;

    const goalZ = this.attackGoalZ();
    const dGoalZ = this.defendGoalZ();

    // direction from ball to the enemy goal (aim point at goal center)
    const toGoalX = 0 - bx;
    const toGoalZ = goalZ - bz;
    const toGoalLen = Math.hypot(toGoalX, toGoalZ) || 1;
    const gnx = toGoalX / toGoalLen;
    const gnz = toGoalZ / toGoalLen;

    // ball position relative to our own half (are we defending?)
    const ballOnOurHalf = (this.car.team === 0 && bz < 0) || (this.car.team === 1 && bz > 0);
    const defend = ballOnOurHalf && this.roleBias > 0.5;

    let targetX: number;
    let targetZ: number;

    if (defend) {
      // sit between the ball and our goal
      targetX = bx * 0.5;
      targetZ = (bz + dGoalZ) * 0.5;
    } else {
      // strike point: behind the ball relative to the enemy goal
      const back = CAR.radius + BALL.radius - 0.3;
      targetX = bx - gnx * back;
      targetZ = bz - gnz * back;
    }

    let dx = targetX - this.car.x;
    let dz = targetZ - this.car.z;
    const dist = Math.hypot(dx, dz) || 1;

    // apply aim jitter (rotate target dir)
    const ang = Math.atan2(dx, dz) + this.jitter;
    dx = Math.sin(ang);
    dz = Math.cos(ang);

    // boost if far, roughly facing target, and difficulty allows
    const facing = this.car.forwardX() * dx + this.car.forwardZ() * dz;
    const wantBoost =
      !defend && dist > 22 && facing > 0.6 && Math.random() < this.p.boost;

    // ease off throttle when very close to a defensive hold spot
    const mag = defend && dist < 6 ? 0.3 : 1;

    this.cached = {
      x: dx,
      z: dz,
      mag,
      steer: 0,
      brake: false,
      boost: wantBoost,
    };
    return this.cached;
  }
}
