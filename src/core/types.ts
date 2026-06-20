// Shared input/control types.

// Unified drive input. Touch joystick and AI produce 'aim' (a world-space
// desired direction). Keyboard produces 'tank' (direct steer + throttle).
// Carries both input shapes; the car reads the fields its control mode needs.
//  - steer/direct: (x, z) world-direction + mag (0..1 strength).
//  - arcade: steer (-1..1) + brake; the car auto-accelerates.
export interface DriveInput {
  x: number;
  z: number;
  mag: number;
  steer: number;
  brake: boolean;
  boost: boolean;
}

export const NEUTRAL_INPUT: DriveInput = {
  x: 0,
  z: 0,
  mag: 0,
  steer: 0,
  brake: false,
  boost: false,
};

export type Team = 0 | 1;
export type GameMode = '1v1' | '2v2';
export type Difficulty = 'easy' | 'normal' | 'hard';
// 'steer'  = original car-steering (turn toward input, drive along facing).
// 'direct' = twin-stick (move directly in the input world direction).
// 'arcade' = auto-accelerate; only Left/Right steer + Brake + Turbo buttons.
export type ControlMode = 'steer' | 'direct' | 'arcade';
