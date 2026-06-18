import type { DriveInput } from './types';
import type { Scene } from '../render/Scene';

// Unifies keyboard (tank steer) and touch joystick (aim) into a DriveInput for
// the player car. TouchControls writes the joystick/buttons fields directly.
export class Input {
  // touch joystick vector in screen space (jx right+, jy up+), each -1..1
  joyScreenX = 0;
  joyScreenY = 0;
  touchBoost = false;
  touchBrake = false;
  usingTouch = false;

  private keys = new Set<string>();

  constructor() {
    addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this.usingTouch = false;
      if (e.code === 'Space') e.preventDefault();
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
    if (this.usingTouch) {
      const mag = Math.min(1, Math.hypot(this.joyScreenX, this.joyScreenY));
      const dir = scene.screenToWorldDir(this.joyScreenX, this.joyScreenY);
      const dl = Math.hypot(dir.x, dir.z) || 1;
      return {
        kind: 'aim',
        x: dir.x / dl,
        z: dir.z / dl,
        mag,
        boost: this.touchBoost,
        brake: this.touchBrake,
      };
    }

    let steer = 0;
    let throttle = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) steer -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) steer += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) throttle += 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) throttle -= 1;
    const boost = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const brake = this.keys.has('Space');
    return { kind: 'tank', steer, throttle, boost, brake };
  }
}
