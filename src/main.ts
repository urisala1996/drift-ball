import { Game } from './core/Game';
import { Loop } from './core/Loop';
import { settings } from './state/Store';
import { TouchControls } from './ui/TouchControls';
import { UI } from './ui/UI';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui') as HTMLElement;

const game = new Game(canvas);
game.audio.volume = settings.volume;
game.audio.setMuted(settings.muted);

const touch = new TouchControls(game.input, settings);
uiRoot.appendChild(touch.root);

new UI(uiRoot, game, touch);

const loop = new Loop((dt) => game.frame(dt));
loop.start();

// prevent context menu / scroll on the game surface
window.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
