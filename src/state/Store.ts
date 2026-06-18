import type { Difficulty } from '../core/types';

export interface Settings {
  carColor: number;
  volume: number;
  muted: boolean;
  handedness: 'right' | 'left';
  difficulty: Difficulty;
}

const KEY = 'driftball.settings.v1';

const DEFAULTS: Settings = {
  carColor: 0xff8e3c,
  volume: 0.8,
  muted: false,
  handedness: 'right',
  difficulty: 'normal',
};

export const settings: Settings = load();

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

export function saveSettings() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
