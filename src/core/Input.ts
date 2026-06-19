import type { DriveInput } from './types';
import type { Scene } from '../render/Scene';

// Unifies keyboard and touch joystick into a direct world-direction DriveInput.
// Both map a screen-space direction to a world ground direction via the camera,
// so "up" always means "away into the pitch" regardless of car facing.
export class Input {
  // touch joystick vector in screen space (jx right+, jy up+), each -1..1
  joyScreenX = 0;
  joyScreenY = 0;
  touchBoost = false;
  usingTouch = false;

  private keys = new Set<string>();

  constructor() {
    addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this.usingTouch = false;
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }

  setJoystick(jx: number, jy: number) {
    this.joyScreenX = jx;
    this.joyScreenY = jy;
    this.usingTouch = true;
  }

  getInput(scene: Scene): DriveInput {
    let sx: number;
    let sy: number;
    let mag: number;
    let boost: boolean;

    if (this.usingTouch) {
      sx = this.joyScreenX;
      sy = this.joyScreenY;
      mag = Math.min(1, Math.hypot(sx, sy));
      boost = this.touchBoost;
    } else {
      sx = 0;
      sy = 0;
      if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) sx -= 1;
      if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) sx += 1;
      if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) sy += 1;
      if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) sy -= 1;
      mag = sx || sy ? 1 : 0;
      boost = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('Space');
    }

    if (mag < 0.08) {
      return { x: 0, z: 0, mag: 0, boost };
    }
    const dir = scene.screenToWorldDir(sx, sy);
    const dl = Math.hypot(dir.x, dir.z) || 1;
    return { x: dir.x / dl, z: dir.z / dl, mag, boost };
  }
}
