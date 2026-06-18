import { BALL, CAR, PITCH } from '../core/constants';
import type { Team } from '../core/types';
import { Ball } from './Ball';
import { Car } from './Car';

export interface CollisionEvent {
  x: number;
  z: number;
  strength: number; // 0..1
  kind: 'car-car' | 'car-ball' | 'ball-wall';
  boosted?: boolean;
}

export interface StepResult {
  goal: Team | null; // team that scored, if any
  collisions: CollisionEvent[];
}

// Resolves inter-entity collisions and arena boundaries after each entity has
// integrated its own motion. Cars are confined to the rectangle (they bounce off
// all four walls incl. across goal mouths); only the ball can enter the goals.
export class World {
  step(cars: Car[], ball: Ball): StepResult {
    const collisions: CollisionEvent[] = [];

    // --- car vs car ---
    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        this.resolveCarCar(cars[i], cars[j], collisions);
      }
    }

    // --- car vs ball (height-aware) ---
    for (const car of cars) {
      this.resolveCarBall(car, ball, collisions);
    }

    // --- walls ---
    for (const car of cars) this.confineCar(car);
    const goal = this.handleBallWalls(ball, collisions);

    return { goal, collisions };
  }

  private resolveCarCar(a: Car, b: Car, out: CollisionEvent[]) {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const dist = Math.hypot(dx, dz) || 0.0001;
    const minDist = CAR.radius * 2;
    if (dist >= minDist) return;

    const nx = dx / dist;
    const nz = dz / dist;
    const overlap = minDist - dist;

    // positional separation by inverse mass
    const invA = 1 / a.mass;
    const invB = 1 / b.mass;
    const totalInv = invA + invB;
    a.x -= nx * overlap * (invA / totalInv);
    a.z -= nz * overlap * (invA / totalInv);
    b.x += nx * overlap * (invB / totalInv);
    b.z += nz * overlap * (invB / totalInv);

    // relative velocity along normal
    let rvn = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
    // enforce a minimum approach so even slow grinds pop
    if (rvn > -CAR.minBump) rvn = -CAR.minBump;

    const imp = (-(1 + CAR.restitution) * rvn) / totalInv;
    a.vx -= imp * invA * nx;
    a.vz -= imp * invA * nz;
    b.vx += imp * invB * nx;
    b.vz += imp * invB * nz;

    out.push({
      x: (a.x + b.x) / 2,
      z: (a.z + b.z) / 2,
      strength: Math.min(1, Math.abs(imp) / 60),
      kind: 'car-car',
      boosted: a.boosting || b.boosting,
    });
  }

  private resolveCarBall(car: Car, ball: Ball, out: CollisionEvent[]) {
    const dx = ball.x - car.x;
    const dz = ball.z - car.z;
    const horiz = Math.hypot(dx, dz) || 0.0001;
    const minDist = CAR.radius + BALL.radius;
    if (horiz >= minDist) return;

    // height-aware: only strike if the ball overlaps the car's body height.
    // Ball bottom = y - radius; car spans 0..topHeight.
    if (ball.y - BALL.radius > CAR.topHeight) return;

    const nx = dx / horiz;
    const nz = dz / horiz;
    const overlap = minDist - horiz;

    // push ball out horizontally
    ball.x += nx * overlap;
    ball.z += nz * overlap;

    // impulse: ball is light, so it mostly takes the car's push.
    const relVx = ball.vx - car.vx;
    const relVz = ball.vz - car.vz;
    let rvn = relVx * nx + relVz * nz;
    if (rvn > 0) rvn = 0; // separating already

    const invBall = 1 / BALL.mass;
    const invCar = 1 / car.mass;
    const imp = (-(1 + BALL.carRestitution) * rvn) / (invBall + invCar);

    ball.vx += imp * invBall * nx;
    ball.vz += imp * invBall * nz;
    // car barely reacts (heavy vs light ball) but feels a nudge
    car.vx -= imp * invCar * nx * 0.5;
    car.vz -= imp * invCar * nz * 0.5;

    // add a little of the car's own velocity so pushing the ball works at low speed
    ball.vx += car.vx * 0.18;
    ball.vz += car.vz * 0.18;

    // low pop: convert some horizontal impulse into upward bounce
    const hImp = (Math.abs(imp) * invBall);
    ball.vy += hImp * BALL.kickLift;

    out.push({
      x: ball.x,
      z: ball.z,
      strength: Math.min(1, hImp / 30),
      kind: 'car-ball',
      boosted: car.boosting,
    });
  }

  private confineCar(car: Car) {
    const limX = PITCH.halfX - CAR.radius;
    const limZ = PITCH.halfZ - CAR.radius;
    if (car.x < -limX) {
      car.x = -limX;
      car.vx = Math.abs(car.vx) * 0.3;
    } else if (car.x > limX) {
      car.x = limX;
      car.vx = -Math.abs(car.vx) * 0.3;
    }
    if (car.z < -limZ) {
      car.z = -limZ;
      car.vz = Math.abs(car.vz) * 0.3;
    } else if (car.z > limZ) {
      car.z = limZ;
      car.vz = -Math.abs(car.vz) * 0.3;
    }
  }

  // Returns scoring team if the ball crossed a goal line, else null.
  private handleBallWalls(ball: Ball, out: CollisionEvent[]): Team | null {
    const limX = PITCH.halfX - BALL.radius;
    const limZ = PITCH.halfZ - BALL.radius;

    // side walls (always solid)
    if (ball.x < -limX) {
      ball.x = -limX;
      ball.vx = Math.abs(ball.vx) * BALL.wallRestitution;
      this.pushWall(ball, out);
    } else if (ball.x > limX) {
      ball.x = limX;
      ball.vx = -Math.abs(ball.vx) * BALL.wallRestitution;
      this.pushWall(ball, out);
    }

    // The goal mouth is open: ball within goal width and below the crossbar.
    const inGoalMouth =
      Math.abs(ball.x) < PITCH.goalHalfWidth && ball.y - BALL.radius < PITCH.goalHeight;

    // +Z end
    if (ball.z > PITCH.halfZ && inGoalMouth) return 0; // team 0 attacks +Z
    if (ball.z > limZ && !inGoalMouth) {
      ball.z = limZ;
      ball.vz = -Math.abs(ball.vz) * BALL.wallRestitution;
      this.pushWall(ball, out);
    }

    // -Z end
    if (ball.z < -PITCH.halfZ && inGoalMouth) return 1; // team 1 attacks -Z
    if (ball.z < -limZ && !inGoalMouth) {
      ball.z = -limZ;
      ball.vz = Math.abs(ball.vz) * BALL.wallRestitution;
      this.pushWall(ball, out);
    }

    return null;
  }

  private pushWall(ball: Ball, out: CollisionEvent[]) {
    out.push({
      x: ball.x,
      z: ball.z,
      strength: Math.min(1, Math.hypot(ball.vx, ball.vz) / 30),
      kind: 'ball-wall',
    });
  }
}
