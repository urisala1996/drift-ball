import { CAR_COLORS, MATCH } from '../core/constants';
import type { Game } from '../core/Game';
import type { Difficulty, GameMode, Team } from '../core/types';
import { saveSettings, settings } from '../state/Store';
import type { TouchControls } from './TouchControls';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  html?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');

// All DOM screens + the in-match HUD. Routes between screens and reacts to
// Game events.
export class UI {
  private root: HTMLElement;
  private screens = new Map<string, HTMLElement>();
  private current = '';
  private activeMode: GameMode = '1v1';

  // HUD elements
  private hud!: HTMLElement;
  private scoreEl!: HTMLElement;
  private timerEl!: HTMLElement;
  private boostFill!: HTMLElement;
  private banner!: HTMLElement;

  constructor(
    root: HTMLElement,
    private game: Game,
    private touch: TouchControls,
  ) {
    this.root = root;
    this.buildScreens();
    this.buildHud();
    this.wireGameEvents();
    this.show('title');

    // auto-pause when the tab/app is backgrounded mid-match
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.current === 'hud') this.pause();
    });
  }

  // ---------- screen plumbing ----------
  private add(name: string, e: HTMLElement) {
    e.classList.add('screen');
    this.screens.set(name, e);
    this.root.appendChild(e);
  }

  show(name: string) {
    for (const [n, e] of this.screens) e.classList.toggle('screen--active', n === name);
    this.current = name;
    const inMatch = name === 'hud';
    this.hud.classList.toggle('hud--active', inMatch);
    this.touch.setVisible(inMatch);
  }

  // ---------- screens ----------
  private buildScreens() {
    this.add('title', this.titleScreen());
    this.add('mode', this.modeScreen());
    this.add('garage', this.garageScreen());
    this.add('settings', this.settingsScreen());
    this.add('howto', this.howtoScreen());
    this.add('pause', this.pauseScreen());
    this.add('result', this.resultScreen());
  }

  private panel(title: string): HTMLElement {
    const p = el('div', 'panel');
    p.appendChild(el('h2', 'panel-title', title));
    return p;
  }

  private titleScreen() {
    const s = el('div', 'center');
    s.appendChild(
      el('h1', 'logo', `DRIFT<span class="dot">·</span><span class="hot">BALL</span>`),
    );
    s.appendChild(el('p', 'tagline', 'ARCADE CAR FOOTBALL'));
    const menu = el('div', 'menu');
    menu.appendChild(this.btn('PLAY', 'primary', () => this.show('mode')));
    menu.appendChild(this.btn('GARAGE', '', () => this.show('garage')));
    menu.appendChild(this.btn('SETTINGS', '', () => this.show('settings')));
    menu.appendChild(this.btn('HOW TO PLAY', '', () => this.show('howto')));
    s.appendChild(menu);
    return s;
  }

  private modeScreen() {
    const s = el('div', 'center');
    const p = this.panel('SELECT MODE');
    const row = el('div', 'choices');
    row.appendChild(
      this.bigChoice('1v1', 'You vs one bot', () => this.startMatch('1v1', settings.difficulty)),
    );
    row.appendChild(
      this.bigChoice('2v2', 'You + bot vs two bots', () =>
        this.startMatch('2v2', settings.difficulty),
      ),
    );
    p.appendChild(row);
    p.appendChild(this.btn('BACK', 'ghost', () => this.show('title')));
    s.appendChild(p);
    return s;
  }

  private garageScreen() {
    const s = el('div', 'center');
    const p = this.panel('GARAGE');
    p.appendChild(el('p', 'label', 'PICK YOUR CAR COLOR'));
    const swatches = el('div', 'swatches');
    const refresh = () => {
      swatches.querySelectorAll('.swatch').forEach((sw) => {
        const c = Number((sw as HTMLElement).dataset.color);
        sw.classList.toggle('selected', c === settings.carColor);
      });
    };
    for (const c of CAR_COLORS) {
      const sw = el('button', 'swatch');
      sw.style.background = hex(c);
      sw.dataset.color = String(c);
      sw.addEventListener('click', () => {
        settings.carColor = c;
        saveSettings();
        refresh();
      });
      swatches.appendChild(sw);
    }
    p.appendChild(swatches);
    refresh();
    p.appendChild(this.btn('BACK', 'ghost', () => this.show('title')));
    s.appendChild(p);
    return s;
  }

  private settingsScreen() {
    const s = el('div', 'center');
    const p = this.panel('SETTINGS');

    // volume
    const volRow = el('div', 'setting-row');
    volRow.appendChild(el('span', 'label', 'VOLUME'));
    const vol = el('input', 'slider') as HTMLInputElement;
    vol.type = 'range';
    vol.min = '0';
    vol.max = '100';
    vol.value = String(Math.round(settings.volume * 100));
    vol.addEventListener('input', () => {
      settings.volume = Number(vol.value) / 100;
      this.game.audio.volume = settings.volume;
      saveSettings();
    });
    volRow.appendChild(vol);
    p.appendChild(volRow);

    // mute
    const muteRow = el('div', 'setting-row');
    muteRow.appendChild(el('span', 'label', 'MUTE'));
    const mute = this.toggle(settings.muted, (v) => {
      settings.muted = v;
      this.game.audio.setMuted(v);
      saveSettings();
    });
    muteRow.appendChild(mute);
    p.appendChild(muteRow);

    // handedness
    const handRow = el('div', 'setting-row');
    handRow.appendChild(el('span', 'label', 'CONTROLS SIDE'));
    const hand = this.btn(settings.handedness === 'right' ? 'RIGHT' : 'LEFT', 'small', () => {
      settings.handedness = settings.handedness === 'right' ? 'left' : 'right';
      hand.textContent = settings.handedness === 'right' ? 'RIGHT' : 'LEFT';
      this.touch.applyHandedness();
      saveSettings();
    });
    handRow.appendChild(hand);
    p.appendChild(handRow);

    // difficulty (cycles easy → normal → hard)
    const diffs: Difficulty[] = ['easy', 'normal', 'hard'];
    const diffRow = el('div', 'setting-row');
    diffRow.appendChild(el('span', 'label', 'DIFFICULTY'));
    const diffBtn = this.btn(settings.difficulty.toUpperCase(), 'small', () => {
      const next = diffs[(diffs.indexOf(settings.difficulty) + 1) % diffs.length];
      settings.difficulty = next;
      diffBtn.textContent = next.toUpperCase();
      saveSettings();
    });
    diffRow.appendChild(diffBtn);
    p.appendChild(diffRow);

    p.appendChild(this.btn('BACK', 'ghost', () => this.show('title')));
    s.appendChild(p);
    return s;
  }

  private howtoScreen() {
    const s = el('div', 'center');
    const p = this.panel('HOW TO PLAY');
    p.appendChild(
      el(
        'div',
        'howto',
        `<p><b>GOAL:</b> ram the big ball into the enemy goal. You never control the ball — it's pure physics.</p>
         <p><b>TOUCH:</b> left joystick steers/drives, right buttons BOOST and BRAKE.</p>
         <p><b>KEYBOARD:</b> WASD / arrows to drive, SHIFT to boost, SPACE to brake.</p>
         <p><b>WIN:</b> first to ${MATCH.goalsToWin} goals, or lead when the ${Math.round(
           MATCH.durationSec / 60,
         )}:00 timer ends. Tie → golden goal.</p>`,
      ),
    );
    p.appendChild(this.btn('BACK', 'ghost', () => this.show('title')));
    s.appendChild(p);
    return s;
  }

  private pauseScreen() {
    const s = el('div', 'center overlay');
    const p = this.panel('PAUSED');
    p.appendChild(this.btn('RESUME', 'primary', () => this.resume()));
    p.appendChild(this.btn('RESTART', '', () => this.restart()));
    p.appendChild(this.btn('QUIT TO MENU', 'ghost', () => this.quit()));
    s.appendChild(p);
    return s;
  }

  private resultScreen() {
    const s = el('div', 'center overlay');
    const p = this.panel('');
    p.id = 'result-panel';
    s.appendChild(p);
    return s;
  }

  // ---------- HUD ----------
  private buildHud() {
    this.hud = el('div', 'hud');
    const top = el('div', 'hud-top');
    this.scoreEl = el('div', 'scoreboard');
    this.timerEl = el('div', 'timer', '5:00');
    const pauseBtn = this.btn('II', 'pause-btn', () => this.pause());
    top.appendChild(this.scoreEl);
    top.appendChild(this.timerEl);
    top.appendChild(pauseBtn);
    this.hud.appendChild(top);

    const boostWrap = el('div', 'boost-wrap');
    this.boostFill = el('div', 'boost-fill');
    boostWrap.appendChild(this.boostFill);
    this.hud.appendChild(boostWrap);

    this.banner = el('div', 'banner');
    this.hud.appendChild(this.banner);

    this.root.appendChild(this.hud);
    this.renderScore(0, 0);
  }

  private renderScore(a: number, b: number) {
    this.scoreEl.innerHTML = `
      <span class="team-pip" style="background:${hex(settings.carColor)}"></span>
      <span class="score-num">${a}</span>
      <span class="score-sep">–</span>
      <span class="score-num">${b}</span>
      <span class="team-pip" style="background:${hex(this.game.awayColor)}"></span>`;
  }

  private flashBanner(text: string, hot = false) {
    this.banner.textContent = text;
    this.banner.classList.toggle('banner--hot', hot);
    this.banner.classList.remove('banner--show');
    void this.banner.offsetWidth; // reflow to restart animation
    this.banner.classList.add('banner--show');
  }

  // ---------- game wiring ----------
  private wireGameEvents() {
    this.game.events = {
      onScore: (a, b) => this.renderScore(a, b),
      onTime: (s) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        this.timerEl.textContent = `${m}:${sec.toString().padStart(2, '0')}`;
        this.timerEl.classList.toggle('timer--low', s <= 30);
      },
      onBoost: (m) => {
        this.boostFill.style.width = `${Math.round(m * 100)}%`;
      },
      onCountdown: (n) => this.flashBanner(n === 0 ? 'GO!' : String(n), n === 0),
      onGoal: (t) => this.flashBanner(t === 0 ? 'GOAL!' : 'CONCEDED', t === 0),
      onGolden: () => this.flashBanner('GOLDEN GOAL', true),
      onEnd: (w) => this.showResult(w),
    };
  }

  private startMatch(mode: GameMode, diff: Difficulty) {
    this.activeMode = mode;
    this.game.startMatch(mode, diff, settings.carColor);
    this.game.audio.volume = settings.volume;
    this.game.audio.setMuted(settings.muted);
    this.renderScore(0, 0);
    this.show('hud');
  }

  private pause() {
    this.game.paused = true;
    this.show('pause');
  }
  private resume() {
    this.game.paused = false;
    this.show('hud');
  }
  private restart() {
    this.game.paused = false;
    this.startMatch(this.activeMode, settings.difficulty);
  }
  private quit() {
    this.game.paused = false;
    this.game.quitToMenu();
    this.show('title');
  }

  private showResult(winner: Team | 'draw') {
    const p = this.screens.get('result')!.querySelector('#result-panel') as HTMLElement;
    const title = winner === 'draw' ? 'DRAW' : winner === 0 ? 'YOU WIN!' : 'YOU LOSE';
    p.innerHTML = `<h2 class="panel-title ${winner === 0 ? 'win' : 'lose'}">${title}</h2>`;
    p.appendChild(this.btn('REMATCH', 'primary', () => this.restart()));
    p.appendChild(this.btn('CHANGE MODE', '', () => this.show('mode')));
    p.appendChild(this.btn('MAIN MENU', 'ghost', () => this.quit()));
    this.show('result');
  }

  // ---------- widgets ----------
  private btn(label: string, cls: string, onClick: () => void): HTMLButtonElement {
    const b = el('button', `btn ${cls}`.trim(), label);
    b.addEventListener('click', () => {
      this.game.audio.countdown();
      onClick();
    });
    return b;
  }

  private bigChoice(title: string, sub: string, onClick: () => void): HTMLElement {
    const b = el('button', 'big-choice');
    b.appendChild(el('span', 'big-choice-title', title));
    if (sub) b.appendChild(el('span', 'big-choice-sub', sub));
    b.addEventListener('click', onClick);
    return b;
  }

  private toggle(initial: boolean, onChange: (v: boolean) => void): HTMLElement {
    const t = el('button', 'toggle' + (initial ? ' on' : ''));
    let v = initial;
    t.addEventListener('click', () => {
      v = !v;
      t.classList.toggle('on', v);
      onChange(v);
    });
    return t;
  }
}
