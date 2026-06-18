// Shared input/control types.

// Unified drive input. Touch joystick and AI produce 'aim' (a world-space
// desired direction). Keyboard produces 'tank' (direct steer + throttle).
export type DriveInput =
  | {
      kind: 'aim';
      x: number; // desired direction X (world)
      z: number; // desired direction Z (world)
      mag: number; // 0..1 throttle / strength
      boost: boolean;
      brake: boolean;
    }
  | {
      kind: 'tank';
      steer: number; // -1..1
      throttle: number; // -1..1 (negative = reverse intent)
      boost: boolean;
      brake: boolean;
    };

export const NEUTRAL_INPUT: DriveInput = {
  kind: 'aim',
  x: 0,
  z: 0,
  mag: 0,
  boost: false,
  brake: false,
};

export type Team = 0 | 1;
export type GameMode = '1v1' | '2v2';
export type Difficulty = 'easy' | 'normal' | 'hard';
