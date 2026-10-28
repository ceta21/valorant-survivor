import { GameEngine } from './GameEngine';
import { DEFAULT_KEYS, KeyMap } from './controls';

/** Teclado → motor. Gestiona y limpia sus propios listeners. */
export class Input {
  private keys = new Set<string>();
  private stick = { x: 0, y: 0 };
  private engine: GameEngine;
  private onPause: () => void;
  /** Lanzar habilidad: por defecto en el motor; en cooperativo el invitado la envía al anfitrión. */
  private castFn: (slot: 'special' | 'secondary' | 'ultimate') => void;
  private handlers: [string, (ev: any) => void][] = [];

  private map: KeyMap;

  constructor(engine: GameEngine, onPause: () => void, castFn?: (slot: 'special' | 'secondary' | 'ultimate') => void, keys: KeyMap = DEFAULT_KEYS) {
    this.engine = engine;
    this.map = keys;
    this.onPause = onPause;
    this.castFn = castFn ?? (slot => { this.engine.cast(slot); });
    const down = (ev: KeyboardEvent) => {
      const k = ev.code;
      const m = this.map;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', m.special, m.secondary, m.ultimate].includes(k)) ev.preventDefault();
      if (ev.repeat) return;
      this.keys.add(k);
      if (k === m.special) this.castFn('special');
      else if (k === m.secondary) this.castFn('secondary');
      else if (k === m.ultimate) this.castFn('ultimate');
      else if (k === 'Escape' || k === m.pause) this.onPause();
    };
    const up = (ev: KeyboardEvent) => { this.keys.delete(ev.code); };
    const blur = () => this.keys.clear();
    this.handlers = [['keydown', down], ['keyup', up], ['blur', blur]];
    for (const [n, h] of this.handlers) window.addEventListener(n, h);
  }

  setStick(x: number, y: number) { this.stick.x = x; this.stick.y = y; }

  /** Se llama una vez por fotograma: vuelca el movimiento al motor. */
  poll() {
    const k = this.keys;
    let x = 0, y = 0;
    const m = this.map;
    if (k.has(m.left) || k.has('ArrowLeft')) x -= 1;
    if (k.has(m.right) || k.has('ArrowRight')) x += 1;
    if (k.has(m.up) || k.has('ArrowUp')) y -= 1;
    if (k.has(m.down) || k.has('ArrowDown')) y += 1;
    if (x === 0 && y === 0) { x = this.stick.x; y = this.stick.y; }
    else if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    this.engine.inputMove.x = x; this.engine.inputMove.y = y;
  }

  destroy() {
    for (const [n, h] of this.handlers) window.removeEventListener(n, h);
    this.handlers = [];
  }
}
