import type { ControlMode, DriveInput } from './types';
import type { Scene } from '../render/Scene';

// Unifies keyboard and touch into a DriveInput. For steer/direct it produces a
// world-direction vector; for arcade it produces steer/brake (the car auto-drives).
export class Input {
  // touch joystick vector in screen space (jx right+, jy up+), each -1..1
  joyScreenX = 0;
  joyScreenY = 0;
  // touch buttons
  touchBoost = false;
  btnLeft = false;
  btnRight = false;
  btnBrake = false;
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

  private has(...codes: string[]): boolean {
    return codes.some((c) => this.keys.has(c));
  }

  getInput(scene: Scene, mode: ControlMode): DriveInput {
    if (mode === 'arcade') {
      // touch buttons OR keyboard both work
      const left = this.btnLeft || this.has('ArrowLeft', 'KeyA');
      const right = this.btnRight || this.has('ArrowRight', 'KeyD');
      const steer = (right ? 1 : 0) - (left ? 1 : 0);
      const brake = this.btnBrake || this.has('ArrowDown', 'KeyS', 'Space');
      const boost = this.touchBoost || this.has('ShiftLeft', 'ShiftRight');
      return { x: 0, z: 0, mag: 0, steer, brake, boost };
    }

    // steer / direct: world-direction
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
      if (this.has('ArrowLeft', 'KeyA')) sx -= 1;
      if (this.has('ArrowRight', 'KeyD')) sx += 1;
      if (this.has('ArrowUp', 'KeyW')) sy += 1;
      if (this.has('ArrowDown', 'KeyS')) sy -= 1;
      mag = sx || sy ? 1 : 0;
      boost = this.has('ShiftLeft', 'ShiftRight', 'Space');
    }

    if (mag < 0.08) return { x: 0, z: 0, mag: 0, steer: 0, brake: false, boost };
    const dir = scene.screenToWorldDir(sx, sy);
    const dl = Math.hypot(dir.x, dir.z) || 1;
    return { x: dir.x / dl, z: dir.z / dl, mag, steer: 0, brake: false, boost };
  }
}
