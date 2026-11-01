// Mando (Gamepad API, mandos de Xbox/PlayStation o compatibles). Dos usos:
// - En la partida, Input lo lee cada fotograma: stick izquierdo o cruceta para moverse, A/RB habilidad principal,
//   X/LB secundaria, Y/RT definitiva, Start pausa y Select/Back mapa grande.
// - Fuera de la partida (menús, mejoras al subir de nivel, pausa, resultado) mueve el foco entre botones con la
//   cruceta o el stick, A pulsa el botón con foco y B vuelve atrás (el botón «Volver» de la pantalla o Escape).
export const PAD = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, SELECT: 8, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
const DEAD = 0.25;

/** Primer mando conectado (o null). */
export function pad(): Gamepad | null {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
  for (const p of navigator.getGamepads()) if (p && p.connected) return p;
  return null;
}
/** Dirección del stick izquierdo (con zona muerta) o de la cruceta. */
export function padMove(p: Gamepad): { x: number; y: number } {
  let x = p.axes[0] ?? 0, y = p.axes[1] ?? 0;
  const l = Math.hypot(x, y);
  if (l < DEAD) { x = 0; y = 0; } else if (l > 1) { x /= l; y /= l; }
  const b = (i: number) => !!p.buttons[i]?.pressed;
  if (x === 0 && y === 0) {
    x = (b(PAD.RIGHT) ? 1 : 0) - (b(PAD.LEFT) ? 1 : 0); y = (b(PAD.DOWN) ? 1 : 0) - (b(PAD.UP) ? 1 : 0);
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
  }
  return { x, y };
}
/** Botones recién pulsados desde la última llamada (cada lector lleva su propio estado). */
export function pressedEdges(p: Gamepad, prev: boolean[]): number[] {
  const out: number[] = [];
  p.buttons.forEach((bt, i) => { if (bt.pressed && !prev[i]) out.push(i); prev[i] = bt.pressed; });
  return out;
}

/** true mientras la partida está en juego y el mando lo maneja Input (entonces no se navega por botones). */
let inGame = false;
export function setPadInGame(v: boolean) { inGame = v; }

/* ------------------------------------------------------------------ navegación por menús */
const visible = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
function focusables(): HTMLElement[] {
  // si hay una ventana encima (pasos de instalar, confirmaciones…), solo sus botones
  const layer = document.querySelector('[role="dialog"]') ?? document.body;
  return [...layer.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select')].filter(visible);
}
/** Pone el foco en un botón y lo marca (clase pad-focus: se ve aunque la ventana no tenga el foco del sistema). */
function focusEl(el: HTMLElement) {
  document.querySelectorAll('.pad-focus').forEach(x => x.classList.remove('pad-focus'));
  el.classList.add('pad-focus'); el.focus(); el.scrollIntoView({ block: 'nearest' });
}
/** El botón más cercano en esa dirección desde el que tiene el foco. */
function moveFocus(dx: number, dy: number) {
  const list = focusables();
  if (!list.length) return;
  const cur = document.activeElement as HTMLElement | null;
  if (!cur || !list.includes(cur)) { focusEl(list[0]); return; }
  const a = cur.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best: HTMLElement | null = null, score = Infinity;
  for (const el of list) {
    if (el === cur) continue;
    const r = el.getBoundingClientRect(), vx = r.left + r.width / 2 - ax, vy = r.top + r.height / 2 - ay;
    const along = vx * dx + vy * dy;
    if (along <= 4) continue;
    const side = Math.abs(vx * dy - vy * dx);
    const s = along + side * 2.5;
    if (s < score) { score = s; best = el; }
  }
  if (best) focusEl(best);
}
function back() {
  const v = focusables().find(el => /^(volver|back)$/i.test(el.innerText.trim()));
  if (v) v.click(); else window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' }));
}

/** Arranca la navegación con mando por los menús (una vez, al cargar el juego). */
export function startPadNav() {
  if (typeof window === 'undefined') return;
  const prev: boolean[] = [];
  window.addEventListener('pointerdown', () => { document.body.classList.remove('pad'); document.querySelectorAll('.pad-focus').forEach(x => x.classList.remove('pad-focus')); });
  let repeatT = 0, lastDir = '';
  const tick = (now: number) => {
    const p = pad();
    if (p && !inGame) {
      const edges = pressedEdges(p, prev);
      const m = padMove(p);
      const dir = Math.abs(m.x) > 0.5 || Math.abs(m.y) > 0.5 ? (Math.abs(m.x) > Math.abs(m.y) ? (m.x > 0 ? 'R' : 'L') : (m.y > 0 ? 'D' : 'U')) : '';
      // primera pulsación al momento; si se mantiene, se repite cada 0,18 s tras 0,4 s
      // mientras se usa el mando, el botón con foco lleva un marco dorado (body.pad); al usar ratón o dedo se quita
      if (dir || edges.length) document.body.classList.add('pad');
      if (dir && (dir !== lastDir || now > repeatT)) {
        moveFocus(dir === 'R' ? 1 : dir === 'L' ? -1 : 0, dir === 'D' ? 1 : dir === 'U' ? -1 : 0);
        repeatT = now + (dir !== lastDir ? 400 : 180);
      }
      lastDir = dir;
      if (edges.includes(PAD.A)) (document.activeElement as HTMLElement | null)?.click?.();
      if (edges.includes(PAD.B)) back();
      if (edges.includes(PAD.START)) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' }));
    } else if (p) pressedEdges(p, prev);   // en partida: solo se recuerda el estado para no pulsar dos veces al salir
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
