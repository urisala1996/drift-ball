// Central tuning + dimensions for DRIFT·BALL.
// World units; the pitch is scaled up to suit a car-sized ball (see docs/GAME-PLAN.md).

// ---- Palette: minimalist light mode (beige + whites + dark detail lines) ----
export const COLORS = {
  sky: 0xefe7d6, // warm light-beige background
  deepFloor: 0xe3d8c2, // slightly darker beige far below
  hills: 0xe6dcc8, // subtle light tan horizon
  rocks: 0xd8cdb5, // light taupe
  pitchTop: 0xfbf8f2, // near-white playing surface
  pitchSkirt: 0xe8dfcc, // light beige skirt
  edgeLine: 0x2b2a26, // dark detail lines
  centerMark: 0x2b2a26,
  kerbA: 0xfbf8f2,
  kerbB: 0x2b2a26,
  cabin: 0x2b2a26, // dark "glass"
  brakeLight: 0xff3b30,
  goalPost: 0x2b2a26, // dark minimalist goal frame
  goalGlow: 0x9a9282, // soft neutral goal line
  wall: 0xe8dfcc, // light boards
  wallCap: 0x2b2a26, // dark cap line
  ball: 0xffffff, // white ball
  ballGlow: 0xe8dfcc,
  ballEdge: 0x2b2a26, // dark facet lines on the ball
  ambient: 0xffffff, // bright neutral fill
  sun: 0xfff6e8, // soft warm-white sun
  dust: 0xc9bfa8, // taupe dust (visible on beige)
  dustRam: 0x9a8f78,
  dustBoost: 0xf5b22d, // amber
} as const;

// Team / player slot colors — bright saturated (red, blue, green, amber, purple)
export const TEAM_COLORS = [0xe23b3b, 0x2f6fed] as const;
export const CAR_COLORS = [0xe23b3b, 0x2f6fed, 0x2eb872, 0xf5b22d, 0x8b5cf6] as const;

// ---- Arena dimensions ----
// Tighter, more arcade pitch so the chunky cars + ball fill the frame.
export const PITCH = {
  halfX: 34,
  halfZ: 47,
  wallHeight: 1.2, // low boards: cars sit clearly above them (no occlusion)
  goalHalfWidth: 11, // opening is 22 wide (~2x ball diameter)
  goalHeight: 10,
  goalDepth: 6,
} as const;

// ---- Car tuning (direct world-direction movement, planar) ----
// Chunky toy cars. Twin-stick control: accelerate toward the input direction
// with momentum, body turns to face travel.
export const CAR = {
  bodyW: 3.0,
  bodyH: 1.05,
  bodyL: 5.6,
  radius: 2.7, // collision radius (horizontal)
  topHeight: 2.6, // top of car for height-aware ball strikes
  mass: 1.0,
  accel: 30, // how fast velocity chases the target direction
  maxSpeed: 23,
  boostAccel: 42,
  boostMaxSpeed: 34,
  coastDamp: 2.6, // how quickly the car slows when there's no input
  yawEase: 9, // (direct mode) how fast the body rotates to face travel
  // steer / arcade modes: rotate toward input and drive along facing
  turnRate: 3.4, // rad/s at full authority
  steerEase: 12, // how fast steering eases to target
  grip: 5.2, // lateral velocity bleed (drift)
  // arcade mode: auto-drive + brake/reverse
  brakeDecel: 40,
  reverseSpeed: 13,
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
