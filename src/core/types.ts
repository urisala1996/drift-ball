// Shared input/control types.

// Unified drive input. Touch joystick and AI produce 'aim' (a world-space
// desired direction). Keyboard produces 'tank' (direct steer + throttle).
// Direct, world-direction movement: (x, z) is the world-space direction the
// player/AI wants the car to travel, mag is 0..1 strength. The car drives that
// way directly (twin-stick style) and orients its body to its travel direction.
export interface DriveInput {
  x: number;
  z: number;
  mag: number;
  boost: boolean;
}

export const NEUTRAL_INPUT: DriveInput = {
  x: 0,
  z: 0,
  mag: 0,
  boost: false,
};

export type Team = 0 | 1;
export type GameMode = '1v1' | '2v2';
export type Difficulty = 'easy' | 'normal' | 'hard';
// 'steer' = original car-steering (turn toward input, drive along facing).
// 'direct' = twin-stick (move directly in the input world direction).
export type ControlMode = 'steer' | 'direct';
