import type { Input } from '../core/Input';
import type { ControlMode } from '../core/types';
import type { Settings } from '../state/Store';

// On-screen touch controls. Two layouts switched by control mode:
//  - joystick + BOOST (steer / direct)
//  - Left / Right + BRAKE / TURBO buttons (arcade auto-drive)
// Hidden on non-touch devices (keyboard covers desktop).
export class TouchControls {
  readonly root = document.createElement('div');
  private base = document.createElement('div');
  private knob = document.createElement('div');
  private boostBtn = document.createElement('button');
  private steerWrap = document.createElement('div');
  private actionsWrap = document.createElement('div');
  private joyId: number | null = null;
  private maxR = 56;

  constructor(
    private input: Input,
    private settings: Settings,
  ) {
    this.root.className = 'touch';
    const left = document.createElement('div');
    left.className = 'touch-left';
    const right = document.createElement('div');
    right.className = 'touch-right';

    // joystick layout
    this.base.className = 'joy-base';
    this.knob.className = 'joy-knob';
    this.base.appendChild(this.knob);
    this.boostBtn.className = 'pad-btn pad-boost';
    this.boostBtn.textContent = 'BOOST';

    // arcade layout
    this.steerWrap.className = 'arcade-steer';
    const leftBtn = button('pad-btn pad-steer', '◀');
    const rightBtn = button('pad-btn pad-steer', '▶');
    this.steerWrap.append(leftBtn, rightBtn);

    this.actionsWrap.className = 'arcade-actions';
    const brakeBtn = button('pad-btn pad-brake', 'BRAKE');
    const turboBtn = button('pad-btn pad-turbo', 'TURBO');
    this.actionsWrap.append(brakeBtn, turboBtn);

    left.append(this.base, this.steerWrap);
    right.append(this.boostBtn, this.actionsWrap);
    this.root.append(left, right);

    this.applyHandedness();
    this.wireJoystick(left);
    this.wireButton(this.boostBtn, (v) => (this.input.touchBoost = v));
    this.wireButton(leftBtn, (v) => (this.input.btnLeft = v));
    this.wireButton(rightBtn, (v) => (this.input.btnRight = v));
    this.wireButton(brakeBtn, (v) => (this.input.btnBrake = v));
    this.wireButton(turboBtn, (v) => (this.input.touchBoost = v));

    this.setMode(this.settings.control);
  }

  setMode(mode: ControlMode) {
    const arcade = mode === 'arcade';
    this.base.style.display = arcade ? 'none' : '';
    this.boostBtn.style.display = arcade ? 'none' : '';
    this.steerWrap.style.display = arcade ? '' : 'none';
    this.actionsWrap.style.display = arcade ? '' : 'none';
  }

  applyHandedness() {
    this.root.classList.toggle('lefty', this.settings.handedness === 'left');
  }

  setVisible(v: boolean) {
    this.root.style.display = v ? '' : 'none';
  }

  private wireJoystick(zone: HTMLElement) {
    const start = (e: PointerEvent) => {
      // ignore presses that start on the arcade buttons
      if ((e.target as HTMLElement).closest('.arcade-steer')) return;
      if (this.base.style.display === 'none') return;
      this.joyId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      this.move(e);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId === this.joyId) this.move(e);
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.joyId) return;
      this.joyId = null;
      this.input.setJoystick(0, 0);
      this.knob.style.transform = 'translate(0px,0px)';
    };
    zone.addEventListener('pointerdown', start);
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  private move(e: PointerEvent) {
    const rect = this.base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > this.maxR) {
      dx = (dx / d) * this.maxR;
      dy = (dy / d) * this.maxR;
    }
    this.knob.style.transform = `translate(${dx}px,${dy}px)`;
    this.input.setJoystick(dx / this.maxR, -dy / this.maxR);
  }

  private wireButton(btn: HTMLButtonElement, set: (v: boolean) => void) {
    const on = (e: PointerEvent) => {
      e.preventDefault();
      btn.classList.add('held');
      this.input.usingTouch = true;
      set(true);
    };
    const off = (e: PointerEvent) => {
      e.preventDefault();
      btn.classList.remove('held');
      set(false);
    };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);
  }
}

function button(cls: string, label: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = cls;
  b.textContent = label;
  return b;
}
