import { GameEngine } from './GameEngine';

/** Teclado → motor. Gestiona y limpia sus propios listeners. */
export class Input {
  private keys = new Set<string>();
  private stick = { x: 0, y: 0 };
  private engine: GameEngine;
  private onPause: () => void;
  /** Lanzar habilidad: por defecto en el motor; en cooperativo el invitado la envía al anfitrión. */
  private castFn: (slot: 'special' | 'secondary' | 'ultimate') => void;
  private handlers: [string, (ev: any) => void][] = [];

  constructor(engine: GameEngine, onPause: () => void, castFn?: (slot: 'special' | 'secondary' | 'ultimate') => void) {
    this.engine = engine;
    this.onPause = onPause;
    this.castFn = castFn ?? (slot => { this.engine.cast(slot); });
    const down = (ev: KeyboardEvent) => {
      const k = ev.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) ev.preventDefault();
      if (ev.repeat) return;
      this.keys.add(k);
      if (k === 'Space') this.castFn('special');
      else if (k === 'KeyE') this.castFn('secondary');
      else if (k === 'KeyQ') this.castFn('ultimate');
      else if (k === 'Escape' || k === 'KeyP') this.onPause();
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
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (k.has('KeyW') || k.has('ArrowUp')) y -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y += 1;
    if (x === 0 && y === 0) { x = this.stick.x; y = this.stick.y; }
    else if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    this.engine.inputMove.x = x; this.engine.inputMove.y = y;
  }

  destroy() {
    for (const [n, h] of this.handlers) window.removeEventListener(n, h);
    this.handlers = [];
  }
}
