import { Bot } from '../ai/Bot';
import { Audio } from '../fx/Audio';
import { Particles } from '../fx/Particles';
import { Ball } from '../physics/Ball';
import { Car } from '../physics/Car';
import { World } from '../physics/World';
import { buildArena } from '../render/Arena';
import { BallView } from '../render/BallView';
import { CarView } from '../render/CarView';
import { Scene } from '../render/Scene';
import { COLORS, FIXED_DT, MATCH, PITCH, TEAM_COLORS } from './constants';
import { Input } from './Input';
import type { Difficulty, GameMode, Team } from './types';

export type Phase = 'idle' | 'kickoff' | 'play' | 'goal' | 'ended';

export interface GameEvents {
  onScore?: (a: number, b: number) => void;
  onTime?: (secondsLeft: number) => void;
  onBoost?: (meter: number) => void;
  onCountdown?: (n: number) => void; // 0 = "GO"
  onGoal?: (team: Team) => void;
  onEnd?: (winner: Team | 'draw') => void;
  onGolden?: () => void;
}

interface Unit {
  car: Car;
  view: CarView;
  bot?: Bot;
}

export class Game {
  readonly scene: Scene;
  readonly input: Input;
  readonly audio = new Audio();
  events: GameEvents = {};

  private world = new World();
  private particles = new Particles();
  private arenaGroup = buildArena();
  private units: Unit[] = [];
  private ball = new Ball();
  private ballView = new BallView();

  private mode: GameMode = '1v1';
  phase: Phase = 'idle';
  paused = false;

  private scores: [number, number] = [0, 0];
  private timeLeft = MATCH.durationSec;
  private countdown = 0;
  private celebrate = 0;
  private golden = false;
  private acc = 0;
  private prevCountInt = -1;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new Scene(canvas);
    this.input = new Input();
    this.scene.scene.add(this.arenaGroup);
    this.scene.scene.add(this.particles.group);
    this.scene.scene.add(this.ballView.group);
  }

  // ---- setup ----
  startMatch(mode: GameMode, difficulty: Difficulty, playerColor: number) {
    this.mode = mode;
    this.scores = [0, 0];
    this.timeLeft = MATCH.durationSec;
    this.golden = false;
    this.clearUnits();

    const perTeam = mode === '2v2' ? 2 : 1;
    for (let t = 0 as Team; t <= 1; t = (t + 1) as Team) {
      for (let i = 0; i < perTeam; i++) {
        const isPlayer = t === 0 && i === 0;
        const color = isPlayer ? playerColor : TEAM_COLORS[t];
        const car = new Car(t, color, isPlayer);
        const view = new CarView(color);
        this.scene.scene.add(view.group);
        const unit: Unit = { car, view };
        if (!isPlayer) {
          const roleBias = perTeam === 2 ? i : 0; // 2nd car defends in 2v2
          unit.bot = new Bot(car, difficulty, roleBias);
        }
        this.units.push(unit);
      }
    }

    this.events.onScore?.(0, 0);
    this.scene.setOrbit(false);
    this.beginKickoff();
  }

  private clearUnits() {
    for (const u of this.units) this.scene.scene.remove(u.view.group);
    this.units = [];
  }

  quitToMenu() {
    this.clearUnits();
    this.phase = 'idle';
    this.scene.setOrbit(true);
  }

  private spawnPositions(): { x: number; z: number; yaw: number }[][] {
    const z0 = PITCH.halfZ * 0.42;
    if (this.mode === '2v2') {
      return [
        [
          { x: -12, z: -z0, yaw: 0 },
          { x: 12, z: -z0 * 1.3, yaw: 0 },
        ],
        [
          { x: 12, z: z0, yaw: Math.PI },
          { x: -12, z: z0 * 1.3, yaw: Math.PI },
        ],
      ];
    }
    return [[{ x: 0, z: -z0, yaw: 0 }], [{ x: 0, z: z0, yaw: Math.PI }]];
  }

  private beginKickoff() {
    const spawns = this.spawnPositions();
    const idx: [number, number] = [0, 0];
    for (const u of this.units) {
      const t = u.car.team;
      const s = spawns[t][idx[t]++];
      u.car.reset(s.x, s.z, s.yaw);
      u.view.sync(u.car);
    }
    this.ball.reset();
    this.ballView.sync(this.ball);
    this.countdown = MATCH.kickoffCountdown;
    this.prevCountInt = -1;
    this.phase = 'kickoff';
  }

  // ---- main frame ----
  frame(dt: number) {
    if (!this.paused) {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= FIXED_DT && steps < 5) {
        this.fixedStep(FIXED_DT);
        this.acc -= FIXED_DT;
        steps++;
      }
    }
    this.render(dt);
  }

  private fixedStep(dt: number) {
    if (this.phase === 'kickoff') {
      this.countdown -= dt;
      const n = Math.ceil(this.countdown);
      if (n !== this.prevCountInt) {
        this.prevCountInt = n;
        if (n > 0) {
          this.events.onCountdown?.(n);
          this.audio.countdown();
        }
      }
      if (this.countdown <= 0) {
        this.phase = 'play';
        this.events.onCountdown?.(0);
        this.audio.go();
      }
      return;
    }

    if (this.phase === 'goal') {
      this.celebrate -= dt;
      if (this.celebrate <= 0) this.afterGoal();
      return;
    }

    if (this.phase !== 'play') return;

    // --- timer ---
    this.timeLeft -= dt;
    this.events.onTime?.(Math.max(0, this.timeLeft));
    if (this.timeLeft <= 0) {
      this.handleTimeUp();
      return;
    }

    // --- drive cars ---
    for (const u of this.units) {
      let drive;
      if (u.car.isPlayer) {
        drive = this.input.getInput(this.scene);
      } else {
        drive = u.bot!.update(this.ball, dt);
      }
      const wasBoosting = u.car.boosting;
      u.car.step(drive, dt);
      if (u.car.boosting && !wasBoosting) this.audio.boost();
      // drift smoke
      if (u.car.speed > 12 && Math.abs(u.car.steer) > 0.5 && Math.random() < 0.4) {
        this.particles.spawn(u.car.x, u.car.z, COLORS.dust, 0.7);
      }
      if (u.car.boosting && Math.random() < 0.5) {
        this.particles.spawn(
          u.car.x - u.car.forwardX() * 2,
          u.car.z - u.car.forwardZ() * 2,
          COLORS.dustBoost,
          0.6,
        );
      }
    }

    // --- ball ---
    this.ball.step(dt);
    if (this.ball.bouncedFloor) {
      this.particles.spawn(this.ball.x, this.ball.z, COLORS.dust, 0.6);
    }

    // --- collisions / walls / goals ---
    const cars = this.units.map((u) => u.car);
    const res = this.world.step(cars, this.ball);
    for (const c of res.collisions) {
      if (c.kind === 'car-car') {
        this.particles.burst(c.x, c.z, c.boosted ? COLORS.dustRam : COLORS.dust, 3, 0.8 + c.strength);
        this.audio.thud(c.strength);
      } else if (c.kind === 'car-ball') {
        if (c.strength > 0.15) {
          this.particles.burst(c.x, c.z, c.boosted ? COLORS.dustRam : COLORS.dustBoost, 2, 0.6 + c.strength);
          this.audio.thud(c.strength * 0.8);
        }
      } else if (c.kind === 'ball-wall') {
        this.audio.wall();
      }
    }
    if (res.goal !== null) this.handleGoal(res.goal);

    this.events.onBoost?.(this.playerCar?.boostMeter ?? 0);
  }

  private get playerCar(): Car | undefined {
    return this.units.find((u) => u.car.isPlayer)?.car;
  }

  private handleGoal(team: Team) {
    this.scores[team]++;
    this.events.onScore?.(this.scores[0], this.scores[1]);
    this.events.onGoal?.(team);
    this.audio.goal();
    this.particles.burst(this.ball.x, this.ball.z, COLORS.goalGlow, 12, 1.4);

    if (this.golden || this.scores[team] >= MATCH.goalsToWin) {
      this.endMatch();
      return;
    }
    this.celebrate = MATCH.goalCelebrationSec;
    this.phase = 'goal';
  }

  private afterGoal() {
    this.beginKickoff();
  }

  private handleTimeUp() {
    if (this.scores[0] === this.scores[1]) {
      // golden goal
      this.golden = true;
      this.timeLeft = MATCH.goldenGoalCapSec;
      this.events.onGolden?.();
      this.audio.whistle();
      this.beginKickoff();
    } else {
      this.endMatch();
    }
  }

  private endMatch() {
    this.phase = 'ended';
    let winner: Team | 'draw';
    if (this.scores[0] === this.scores[1]) winner = 'draw';
    else winner = this.scores[0] > this.scores[1] ? 0 : 1;
    if (winner === 0) this.audio.win();
    else this.audio.lose();
    this.events.onEnd?.(winner);
  }

  // ---- render ----
  private render(dt: number) {
    for (const u of this.units) u.view.sync(u.car);
    this.ballView.sync(this.ball);
    this.particles.update(dt);

    // camera follows centroid of cars + ball
    if (this.phase !== 'idle') {
      let cx = this.ball.x;
      let cz = this.ball.z;
      let n = 1;
      for (const u of this.units) {
        cx += u.car.x;
        cz += u.car.z;
        n++;
      }
      this.scene.follow(cx / n, cz / n, dt);
    }
    this.scene.update(dt);
    this.scene.render();
  }
}
