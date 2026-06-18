// Central tuning + dimensions for DRIFT·BALL.
// World units; the pitch is scaled up to suit a car-sized ball (see docs/GAME-PLAN.md).

// ---- Palette (from docs/ART-DIRECTION.md) ----
export const COLORS = {
  sky: 0x2a1e4f,
  deepFloor: 0x1c1340,
  hills: 0x3a2d6b,
  rocks: 0x7a6aa8,
  pitchTop: 0x3d3170, // dusk-violet disc (matches the art-direction palette)
  pitchSkirt: 0x2b2150,
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
  ball: 0xf5ead7, // warm off-white "paper" (on-palette)
  ballGlow: 0xffd9a0, // warm cream glow
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
// Tighter, more arcade pitch so the chunky cars + ball fill the frame.
export const PITCH = {
  halfX: 34,
  halfZ: 47,
  wallHeight: 6,
  goalHalfWidth: 11, // opening is 22 wide (~2x ball diameter)
  goalHeight: 10,
  goalDepth: 6,
} as const;

// ---- Car tuning (arcade drift, planar) ----
// Chunkier toy cars, snappier control, less sticky grip, quicker reverse.
export const CAR = {
  bodyW: 3.0,
  bodyH: 1.05,
  bodyL: 5.6,
  radius: 2.7, // collision radius (horizontal)
  topHeight: 2.6, // top of car for height-aware ball strikes
  mass: 1.0,
  accel: 26,
  maxSpeed: 23,
  boostAccel: 38,
  boostMaxSpeed: 34,
  reverseSpeed: 14,
  turnRate: 3.4, // rad/s at full authority
  steerEase: 12, // how fast steering eases to target (snappier)
  grip: 5.2, // lateral velocity bleed (lower = more responsive turn-in)
  brakeGrip: 2.4, // grip while braking (lower = more scrub)
  brakeDecel: 46,
  reverseHold: 0.26, // seconds of brake before reverse engages (quicker)
  boostDrain: 0.55, // per second
  boostRegen: 0.22, // per second
  restitution: 1.4, // car-car pop
  minBump: 6, // minimum approach speed enforced on car-car hits
} as const;

// ---- Ball tuning (pure physics, 3D low bounces, car-sized) ----
export const BALL = {
  radius: 2.9, // ~car-sized (diameter ≈ car length)
  mass: 0.4, // light: cars throw it around (tunable)
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
