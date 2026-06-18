// Central tuning + dimensions for DRIFT·BALL.
// World units; the pitch is scaled up to suit a car-sized ball (see docs/GAME-PLAN.md).

// ---- Palette (from docs/ART-DIRECTION.md) ----
export const COLORS = {
  sky: 0x2a1e4f,
  deepFloor: 0x1c1340,
  hills: 0x3a2d6b,
  rocks: 0x7a6aa8,
  pitchTop: 0x2f5a3d, // green-tinted disc (football map identity)
  pitchSkirt: 0x223f2c,
  edgeLine: 0xf5ead7,
  centerMark: 0xffd9a0,
  kerbA: 0xf5ead7,
  kerbB: 0xff3d6e,
  cabin: 0x241a44,
  brakeLight: 0xffe066,
  goalPost: 0xffd93d,
  goalGlow: 0xff3d6e,
  wall: 0x4a3d85,
  wallCap: 0xff3d6e,
  ball: 0xf5ead7,
  ballGlow: 0xffd9a0,
  ambient: 0x8877cc,
  sun: 0xffd9a0,
  dust: 0xf5ead7,
  dustRam: 0xff3d6e,
  dustBoost: 0xffd93d,
} as const;

// Team / player slot colors (orange, mint, violet, gold)
export const TEAM_COLORS = [0xff8e3c, 0x3ddbb4] as const;
export const CAR_COLORS = [0xff8e3c, 0x3ddbb4, 0xff3d6e, 0x6c5ce7, 0xffd93d] as const;

// ---- Arena dimensions ----
export const PITCH = {
  halfX: 44,
  halfZ: 64,
  wallHeight: 6,
  goalHalfWidth: 12, // opening is 24 wide (~2.5x ball diameter)
  goalHeight: 11,
  goalDepth: 7,
} as const;

// ---- Car tuning (arcade drift, planar) ----
export const CAR = {
  bodyW: 2.4,
  bodyH: 0.9,
  bodyL: 4.4,
  radius: 2.0, // collision radius (horizontal)
  topHeight: 2.2, // top of car for height-aware ball strikes
  mass: 1.0,
  accel: 34,
  maxSpeed: 30,
  boostAccel: 46,
  boostMaxSpeed: 44,
  reverseSpeed: 13,
  turnRate: 3.0, // rad/s at full authority
  steerEase: 8, // how fast steering eases to target
  grip: 6.5, // lateral velocity bleed (higher = more planted)
  brakeGrip: 3.0, // grip while braking (lower = more scrub)
  brakeDecel: 40,
  reverseHold: 0.55, // seconds of brake before reverse engages
  boostDrain: 0.55, // per second
  boostRegen: 0.22, // per second
  restitution: 1.4, // car-car pop
  minBump: 6, // minimum approach speed enforced on car-car hits
} as const;

// ---- Ball tuning (pure physics, 3D low bounces, car-sized) ----
export const BALL = {
  radius: 2.2,
  mass: 0.35, // light: cars throw it around (tunable)
  gravity: 38,
  floorRestitution: 0.62, // low, brief bounces
  wallRestitution: 0.78,
  carRestitution: 1.25, // pops off cars
  rollFriction: 0.8, // ground horizontal damping (per second factor)
  airFriction: 0.08,
  maxSpeed: 60,
  kickLift: 0.22, // fraction of horizontal impulse converted to upward pop
} as const;

// ---- Match rules ----
export const MATCH = {
  goalsToWin: 3,
  durationSec: 5 * 60,
  goldenGoalCapSec: 90,
  kickoffCountdown: 3,
  goalCelebrationSec: 2.2,
} as const;

// Fixed physics timestep
export const FIXED_DT = 1 / 60;
