import type { Input } from '../core/Input';
import type { Settings } from '../state/Store';

// On-screen virtual joystick + boost/brake buttons. Writes to the shared Input.
// Hidden on non-touch devices (keyboard fallback covers desktop).
export class TouchControls {
  readonly root = document.createElement('div');
  private knob = document.createElement('div');
  private base = document.createElement('div');
  private boostBtn = document.createElement('button');
  private joyId: number | null = null;
  private maxR = 56;

  constructor(
    private input: Input,
    private settings: Settings,
  ) {
    this.root.className = 'touch';
    this.base.className = 'joy-base';
    this.knob.className = 'joy-knob';
    this.base.appendChild(this.knob);

    this.boostBtn.className = 'pad-btn pad-boost';
    this.boostBtn.textContent = 'BOOST';

    const left = document.createElement('div');
    left.className = 'touch-left';
    const right = document.createElement('div');
    right.className = 'touch-right';
    left.appendChild(this.base);
    right.appendChild(this.boostBtn);
    this.root.appendChild(left);
    this.root.appendChild(right);

    this.applyHandedness();
    this.wireJoystick(left);
    this.wireButton(this.boostBtn, (v) => (this.input.touchBoost = v));
  }

  applyHandedness() {
    this.root.classList.toggle('lefty', this.settings.handedness === 'left');
  }

  setVisible(v: boolean) {
    this.root.style.display = v ? '' : 'none';
  }

  private wireJoystick(zone: HTMLElement) {
    const start = (e: PointerEvent) => {
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
