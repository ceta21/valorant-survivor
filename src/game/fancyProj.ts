// Proyectiles con efectos de elemento (prototipo: fuego, rayo y agua). Cada uno tiene un núcleo brillante, un halo
// que ilumina lo de debajo (mezcla aditiva) y un movimiento propio: la bola de fuego chisporrotea y suelta ascuas, el
// rayo deja una estela en zigzag con ramas, y la gota de agua se estira con la velocidad y suelta gotitas.
// Al golpear, cada uno tiene su impacto (estallido de ascuas, chispazo en estrella, salpicadura).
// Todo se pinta a píxeles (cuadrados alineados a la rejilla) para que encaje con el resto del juego.

type Ctx = CanvasRenderingContext2D;
/** Aspectos que se pintan con este sistema. El fuego se dejó con su dibujo de antes (gusta más así); su versión
 *  nueva sigue abajo por si se quiere probar otra vez (añadir 'flame' aquí y en GameEngine, donde se apuntan los impactos). */
export const FANCY_LOOKS = new Set(['bolt', 'water', 'ice', 'leaf', 'rock', 'star', 'dagger', 'arrow', 'wisp']);

/** Número pseudoaleatorio estable a partir de una semilla. */
const rnd = (s: number) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const sq = (g: Ctx, x: number, y: number, size: number, px: number) => {
  const s = Math.max(px, Math.round(size / px) * px);
  g.fillRect(Math.round(x / px) * px - s / 2, Math.round(y / px) * px - s / 2, s, s);
};
/** Bola de píxeles: anillos de colores de fuera adentro. */
function pixelBall(g: Ctx, x: number, y: number, r: number, cols: string[], px: number, sx = 1, sy = 1) {
  for (let k = 0; k < cols.length; k++) {
    const rr = r * (1 - k / cols.length);
    g.fillStyle = cols[k];
    for (let yy = -rr; yy <= rr; yy += px) {
      const w = Math.sqrt(Math.max(0, rr * rr - yy * yy));
      const y0 = Math.round((y + yy * sy) / px) * px, x0 = Math.round((x - w * sx) / px) * px, x1 = Math.round((x + w * sx) / px) * px;
      if (x1 > x0) g.fillRect(x0, y0, x1 - x0, px);
    }
  }
}
function glow(g: Ctx, x: number, y: number, r: number, rgb: string, a: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}

export interface FancyProj { x: number; y: number; vx: number; vy: number; r: number; look: string; crit: boolean; color?: string }

/** Polígono relleno a píxeles (filas horizontales), en coordenadas locales ya giradas por quien llama. */
function pixelPoly(g: Ctx, pts: [number, number][], col: string, px: number) {
  const ys = pts.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
  g.fillStyle = col;
  for (let y = Math.floor(y0 / px) * px; y <= y1; y += px) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) { const a = Math.round(xs[i] / px) * px, c = Math.round(xs[i + 1] / px) * px; if (c > a) g.fillRect(a, Math.round(y / px) * px, c - a, px); }
  }
}
const scale = (pts: [number, number][], k: number): [number, number][] => pts.map(([x, y]) => [x * k, y * k]);
/** Dibuja algo girado y centrado en (x, y): dentro, el eje x apunta a `ang`. */
function rotated(g: Ctx, x: number, y: number, ang: number, fn: () => void) { g.save(); g.translate(x, y); g.rotate(ang); fn(); g.restore(); }

/** Pinta un proyectil de elemento. `t` = tiempo de juego; `low` = calidad baja (sin halos y menos partículas). */
export function drawFancyProj(g: Ctx, b: FancyProj, t: number, px: number, low: boolean) {
  const sp = Math.hypot(b.vx, b.vy) || 1, dx = b.vx / sp, dy = b.vy / sp, nx = -dy, ny = dx;
  const seed = Math.floor(b.x * 0.37 + b.y * 0.73);
  const size = Math.max(6, b.r * 2.1) * (b.crit ? 1.25 : 1);
  if (b.look === 'flame') {
    // halo cálido
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, b.x, b.y, size * 3.2, '255,120,40', 0.35); g.globalCompositeOperation = 'source-over'; }
    // cola de llama: bolas que se encogen y enfrían hacia atrás, temblando
    const n = low ? 4 : 7;
    for (let i = n; i >= 1; i--) {
      const k = i / n, d = i * size * 0.75, wob = Math.sin(t * 30 + i * 1.9 + seed) * size * 0.25 * k;
      const cx = b.x - dx * d + nx * wob, cy = b.y - dy * d + ny * wob;
      pixelBall(g, cx, cy, size * (1 - k * 0.7), [k > 0.6 ? '#7a1a10' : '#c9301c', '#ff7a3d', k > 0.5 ? '#ff9f3d' : '#ffd24a'], px);
    }
    // núcleo que palpita
    const pulse = 1 + Math.sin(t * 25 + seed) * 0.12;
    pixelBall(g, b.x, b.y, size * 1.05 * pulse, ['#c9301c', '#ff7a3d', '#ffd24a', '#fff6c8'], px);
    // ascuas sueltas que se quedan atrás y suben
    if (!low) for (let i = 0; i < 4; i++) {
      const life = (t * 3 + rnd(seed + i)) % 1, d = size * (2 + life * 5), off = (rnd(seed * 3 + i) - 0.5) * size * 2.5;
      g.fillStyle = life < 0.5 ? '#ffd24a' : '#ff7a3d';
      sq(g, b.x - dx * d + nx * off, b.y - dy * d + ny * off - life * 10, px * (life < 0.6 ? 2 : 1), px);
    }
    return;
  }
  if (b.look === 'bolt') {
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, b.x, b.y, size * 3.5, '80,220,255', 0.4); }
    // estela en zigzag que cambia muy rápido (como una descarga), con una rama
    const frame = Math.floor(t * 30) + seed, segs = 6, len = size * 9;
    const pts: [number, number][] = [[b.x, b.y]];
    for (let i = 1; i <= segs; i++) {
      const d = (i / segs) * len, j = (rnd(frame * 7 + i) - 0.5) * size * 1.6 * (i / segs + 0.3);
      pts.push([b.x - dx * d + nx * j, b.y - dy * d + ny * j]);
    }
    const line = (p: [number, number][], col: string, w: number) => {
      g.fillStyle = col;
      for (let i = 0; i < p.length - 1; i++) {
        const [x0, y0] = p[i], [x1, y1] = p[i + 1], steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / px));
        for (let s = 0; s <= steps; s++) sq(g, x0 + (x1 - x0) * (s / steps), y0 + (y1 - y0) * (s / steps), w, px);
      }
    };
    line(pts, '#1f8fb0', px * 3);
    line(pts, '#2fe6ff', px * 2);
    line(pts.slice(0, 4), '#ffffff', px);
    if (!low) {
      const k = 2 + Math.floor(rnd(frame) * 3), [bx, by] = pts[k], side = rnd(frame + 5) < 0.5 ? -1 : 1;
      line([[bx, by], [bx - dx * size * 1.5 + nx * side * size * 1.6, by - dy * size * 1.5 + ny * side * size * 1.6]], '#2fe6ff', px);
    }
    g.globalCompositeOperation = 'source-over';
    // núcleo: rombo blanco con borde cian y chispitas alrededor
    pixelBall(g, b.x, b.y, size * 0.95, ['#1f8fb0', '#2fe6ff', '#c4faff', '#ffffff'], px);
    if (!low) for (let i = 0; i < 3; i++) {
      const a = rnd(frame * 3 + i) * 6.28, d = size * (1.4 + rnd(frame + i * 9));
      g.fillStyle = '#c4faff'; sq(g, b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, px, px);
    }
    return;
  }
  const ang = Math.atan2(dy, dx);
  if (b.look === 'ice') {
    // esquirla de hielo: rombo alargado con canto blanco, halo frío y escarcha que se queda flotando
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, b.x, b.y, size * 2.6, '150,210,255', 0.3); g.globalCompositeOperation = 'source-over'; }
    if (!low) for (let i = 0; i < 5; i++) {
      const life = (t * 2 + rnd(seed + i)) % 1, d = size * (1.2 + life * 5), off = (rnd(seed * 7 + i) - 0.5) * size * 2;
      g.globalAlpha = 1 - life; g.fillStyle = i % 2 ? '#ffffff' : '#c9e6ff';
      sq(g, b.x - dx * d + nx * off, b.y - dy * d + ny * off, px, px);
    }
    g.globalAlpha = 1;
    rotated(g, b.x, b.y, ang, () => {
      const L = size * 2.6, W = size * 1.05;
      pixelPoly(g, [[L, 0], [0, -W], [-L * 0.8, 0], [0, W]], '#2a4a7a', px);
      pixelPoly(g, scale([[L, 0], [0, -W], [-L * 0.8, 0], [0, W]], 0.8), '#7ab8ff', px);
      pixelPoly(g, [[L * 0.75, 0], [0, -W * 0.55], [-L * 0.3, 0]], '#c9e6ff', px);
      g.fillStyle = '#ffffff'; sq(g, L * 0.45, -W * 0.15, px * 2, px);
    });
    return;
  }
  if (b.look === 'leaf') {
    // hoja que gira sobre sí misma (se estrecha al girar) y suelta hojitas que caen dando vueltas
    if (!low) for (let i = 0; i < 4; i++) {
      const life = (t * 1.6 + rnd(seed + i)) % 1, d = size * (1.5 + life * 6), off = (rnd(seed * 3 + i) - 0.5) * size * 2.5;
      g.globalAlpha = 1 - life * 0.8; g.fillStyle = i % 2 ? '#3fbf5a' : '#9aff9a';
      sq(g, b.x - dx * d + nx * off + Math.sin(t * 8 + i) * 3, b.y - dy * d + ny * off + life * 8, px * (life < 0.5 ? 2 : 1), px);
    }
    g.globalAlpha = 1;
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, b.x, b.y, size * 2.6, '93,255,154', 0.3); g.globalCompositeOperation = 'source-over'; }
    const spin = t * 14 + seed, flat = 0.45 + 0.55 * Math.abs(Math.cos(spin * 0.5));
    rotated(g, b.x, b.y, spin * 0.6, () => {
      const L = size * 2.2, W = size * 1.05 * flat;
      pixelPoly(g, [[L, 0], [L * 0.2, -W], [-L * 0.7, -W * 0.3], [-L, 0], [-L * 0.7, W * 0.3], [L * 0.2, W]], '#0f2a14', px);
      pixelPoly(g, scale([[L, 0], [L * 0.2, -W], [-L * 0.7, -W * 0.3], [-L, 0], [-L * 0.7, W * 0.3], [L * 0.2, W]], 0.8), '#3fbf5a', px);
      pixelPoly(g, [[L * 0.7, -W * 0.1], [L * 0.1, -W * 0.7], [-L * 0.5, -W * 0.2]], '#9aff9a', px);
      g.fillStyle = '#1f6a2a'; for (let xx = -L * 0.8; xx < L * 0.8; xx += px) sq(g, xx, 0, px, px);   // nervio
    });
    return;
  }
  if (b.look === 'rock') {
    // piedra que rueda (gira), con luces y sombras, y deja polvo detrás
    if (!low) for (let i = 0; i < 5; i++) {
      const life = (t * 2.2 + rnd(seed + i)) % 1, d = size * (1 + life * 4.5), off = (rnd(seed * 5 + i) - 0.5) * size * 1.6;
      g.globalAlpha = 0.6 * (1 - life); g.fillStyle = '#a08a6a';
      sq(g, b.x - dx * d + nx * off, b.y - dy * d + ny * off, px * (2 + life * 2), px);
    }
    g.globalAlpha = 1;
    const spin = t * 9 + seed;
    rotated(g, b.x, b.y, spin, () => {
      const R = size * 1.25, pts: [number, number][] = [];
      for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28, r = R * (0.8 + rnd(seed + i * 3) * 0.3); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
      pixelPoly(g, pts, '#3a2c1e', px);
      pixelPoly(g, scale(pts, 0.82), '#8a6a48', px);
      pixelPoly(g, scale(pts.slice(0, 4), 0.6), '#c8a070', px);
      g.fillStyle = '#e8d0a8'; sq(g, -R * 0.2, -R * 0.35, px * 2, px);
      g.fillStyle = '#3a2c1e'; sq(g, R * 0.3, R * 0.2, px, px);
    });
    return;
  }
  if (b.look === 'star') {
    // estrella de 4 puntas que gira y palpita, con destellos que titilan detrás
    const col = b.color ?? '#7a9cff';
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, b.x, b.y, size * 3, '200,210,255', 0.35); g.globalCompositeOperation = 'source-over'; }
    if (!low) for (let i = 0; i < 5; i++) {
      const life = (t * 2.5 + rnd(seed + i)) % 1, d = size * (1.5 + life * 5), off = (rnd(seed * 9 + i) - 0.5) * size * 2.2;
      const on = Math.sin(t * 30 + i * 2) > 0;
      g.fillStyle = on ? '#ffffff' : col;
      const xx = b.x - dx * d + nx * off, yy = b.y - dy * d + ny * off;
      sq(g, xx, yy, px, px); if (on && life < 0.5) { sq(g, xx - px, yy, px, px); sq(g, xx + px, yy, px, px); sq(g, xx, yy - px, px, px); sq(g, xx, yy + px, px, px); }
    }
    const pulse = 1 + Math.sin(t * 16 + seed) * 0.12;
    rotated(g, b.x, b.y, t * 6 + seed, () => {
      const R = size * 1.6 * pulse, r = R * 0.35, pts: [number, number][] = [];
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28, rr = i % 2 ? r : R; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      pixelPoly(g, pts, '#1a2a5a', px);
      pixelPoly(g, scale(pts, 0.8), col, px);
      pixelPoly(g, scale(pts, 0.5), '#e2e8ff', px);
      g.fillStyle = '#ffffff'; sq(g, 0, 0, px * 2, px);
    });
    return;
  }
  if (b.look === 'dagger') {
    // daga de acero con líneas de velocidad y un destello que recorre el filo
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, b.x, b.y, size * 2.4, '191,234,255', 0.3); g.globalCompositeOperation = 'source-over'; }
    g.fillStyle = 'rgba(220,240,255,0.55)';
    for (let i = -1; i <= 1; i++) for (let k = 0; k < (low ? 2 : 4); k++) {
      const d = size * (2 + k * 1.6 + rnd(seed + k + i * 5)), o = i * size * 0.6;
      sq(g, b.x - dx * d + nx * o, b.y - dy * d + ny * o, px, px);
    }
    rotated(g, b.x, b.y, ang, () => {
      const L = size * 2.7, W = size * 0.6;
      pixelPoly(g, [[L, 0], [-L * 0.1, -W], [-L * 0.1, W]], '#1a2030', px);
      pixelPoly(g, [[L * 0.88, 0], [-L * 0.02, -W * 0.65], [-L * 0.02, W * 0.65]], '#bfeaff', px);
      pixelPoly(g, [[L * 0.8, 0], [0, -W * 0.5], [0, 0]], '#ffffff', px);
      g.fillStyle = '#a07a3a'; for (let yy = -W * 1.3; yy <= W * 1.3; yy += px) sq(g, -L * 0.15, yy, px, px);   // guarda
      g.fillStyle = '#5a3a1a'; for (let xx = -L * 0.65; xx < -L * 0.15; xx += px) sq(g, xx, 0, px * 2, px);    // mango
      const shine = ((t * 3 + seed) % 1) * L;   // destello que recorre la hoja
      g.fillStyle = '#ffffff'; sq(g, shine - L * 0.1, -W * 0.2, px * 2, px);
    });
    return;
  }
  if (b.look === 'arrow') {
    // flecha con astil, punta de metal y plumas, y una estela del color del poder
    const col = b.color ?? '#9aff9a', holy = col === '#ffffff';
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, b.x, b.y, size * 2.2, holy ? '255,240,180' : '120,255,150', 0.3); g.globalCompositeOperation = 'source-over'; }
    for (let i = 1; i <= (low ? 3 : 6); i++) {
      g.globalAlpha = 0.7 * (1 - i / 7); g.fillStyle = holy ? '#ffe9a0' : col;
      sq(g, b.x - dx * size * (1.6 + i * 1.1), b.y - dy * size * (1.6 + i * 1.1), px * (i < 3 ? 2 : 1), px);
    }
    g.globalAlpha = 1;
    rotated(g, b.x, b.y, ang, () => {
      const L = size * 2.8;
      g.fillStyle = '#7a5a2a'; for (let xx = -L; xx < L * 0.6; xx += px) sq(g, xx, 0, px * 2, px);   // astil
      pixelPoly(g, [[L, 0], [L * 0.5, -size * 0.75], [L * 0.5, size * 0.75]], holy ? '#ffe9a0' : '#d0d8e0', px);   // punta
      g.fillStyle = '#ffffff'; sq(g, L * 0.8, 0, px, px);
      const fc = holy ? '#ffffff' : col;
      pixelPoly(g, [[-L * 0.55, 0], [-L, -size * 0.85], [-L * 0.82, 0]], fc, px);   // plumas
      pixelPoly(g, [[-L * 0.55, 0], [-L, size * 0.85], [-L * 0.82, 0]], fc, px);
    });
    return;
  }
  if (b.look === 'wisp') {
    // alma: bola fantasma morada con cola ondulante y dos ojitos, que va dejando chispas
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, b.x, b.y, size * 3, '217,70,239', 0.35); g.globalCompositeOperation = 'source-over'; }
    const n = low ? 5 : 9;
    for (let i = n; i >= 1; i--) {
      const k = i / n, d = i * size * 0.55, wave = Math.sin(t * 14 - i * 0.9 + seed) * size * 0.7 * k;
      g.globalAlpha = 0.85 * (1 - k * 0.7);
      pixelBall(g, b.x - dx * d + nx * wave, b.y - dy * d + ny * wave, size * (1 - k * 0.75), ['#7a2a9a', '#d946ef'], px);
    }
    g.globalAlpha = 1;
    pixelBall(g, b.x, b.y, size * 1.15, ['#2a0a36', '#7a2a9a', '#d946ef', '#ff9cff'], px);
    rotated(g, b.x, b.y, ang, () => { g.fillStyle = '#ffffff'; sq(g, size * 0.3, -size * 0.35, px * 2, px); sq(g, size * 0.3, size * 0.35, px * 2, px); });
    return;
  }
  if (b.look === 'water') {
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, b.x, b.y, size * 2.8, '79,240,224', 0.25); g.globalCompositeOperation = 'source-over'; }
    // gotitas que se quedan atrás y caen
    const n = low ? 3 : 6;
    for (let i = 1; i <= n; i++) {
      const life = ((t * 2.5 + i / n + rnd(seed + i)) % 1), d = size * (1.5 + life * 6), off = (rnd(seed * 5 + i) - 0.5) * size * 1.8;
      g.fillStyle = life < 0.5 ? '#c4fff8' : '#4ff0e0';
      sq(g, b.x - dx * d + nx * off, b.y - dy * d + ny * off + life * life * 12, px * (life < 0.4 ? 2 : 1), px);
    }
    // la gota se estira en la dirección del movimiento y tiembla
    const wob = 1 + Math.sin(t * 18 + seed) * 0.08;
    g.save(); g.translate(b.x, b.y); g.rotate(Math.atan2(dy, dx));
    // estela de agua: dos copias más pequeñas y transparentes detrás
    if (!low) for (let i = 2; i >= 1; i--) { g.globalAlpha = 0.25 * (3 - i); pixelBall(g, -size * 1.4 * i, 0, size * (1.1 - i * 0.3), ['#1f6a8a', '#4ff0e0'], px, 1.4, 0.8); }
    g.globalAlpha = 1;
    pixelBall(g, 0, 0, size * 1.45, ['#c4fff8', '#1f6a8a', '#2fb8d0', '#4ff0e0', '#c4fff8'], px, 1.35 * wob, 0.85 / wob);
    g.fillStyle = '#ffffff'; sq(g, size * 0.35, -size * 0.45, px * 2, px); sq(g, size * 0.7, -size * 0.2, px, px);   // brillos
    g.restore();
  }
}

/** Impacto de un proyectil de elemento. `k` = 0 al golpear → 1 al terminar. */
export function drawImpact(g: Ctx, x: number, y: number, look: string, k: number, ang: number, seed: number, px: number, low: boolean) {
  const n = low ? 5 : 9;
  if (look === 'flame') {
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, x, y, 26 * (1 - k * 0.5), '255,140,40', 0.5 * (1 - k)); g.globalCompositeOperation = 'source-over'; }
    for (let i = 0; i < n; i++) {
      const a = rnd(seed + i) * 6.28, d = 6 + k * (14 + rnd(seed * 2 + i) * 16);
      g.fillStyle = k < 0.35 ? '#fff6c8' : k < 0.7 ? '#ffd24a' : '#ff7a3d';
      sq(g, x + Math.cos(a) * d, y + Math.sin(a) * d - k * 8, px * (k < 0.5 ? 2 : 1), px);
    }
    if (k < 0.4) pixelBall(g, x, y, 9 * (1 - k * 1.5), ['#ff7a3d', '#ffd24a', '#fff6c8'], px);
  } else if (look === 'bolt') {
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, x, y, 24, '80,220,255', 0.6 * (1 - k)); g.globalCompositeOperation = 'source-over'; }
    // chispazo en estrella: rayitas que salen y se acortan
    const rays = low ? 4 : 6;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * 6.28 + rnd(seed) * 3, len = (1 - k) * (10 + rnd(seed + i) * 12);
      for (let s = 2; s < len; s += px) { g.fillStyle = s < len * 0.5 ? '#ffffff' : '#2fe6ff'; sq(g, x + Math.cos(a) * s, y + Math.sin(a) * s, px, px); }
    }
  } else if (look === 'ice') {
    // esquirlas que salen disparadas y un anillo de escarcha
    for (let i = 0; i < n; i++) {
      const a = rnd(seed + i) * 6.28, d = 4 + k * (14 + rnd(seed * 2 + i) * 12);
      g.fillStyle = i % 2 ? '#ffffff' : '#9ad8ff';
      sq(g, x + Math.cos(a) * d, y + Math.sin(a) * d, px * (k < 0.5 ? 2 : 1), px);
    }
    if (!low) { g.fillStyle = 'rgba(201,230,255,' + (0.6 * (1 - k)).toFixed(2) + ')'; const r = 5 + k * 14; for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.28; sq(g, x + Math.cos(a) * r, y + Math.sin(a) * r, px, px); } }
  } else if (look === 'leaf') {
    for (let i = 0; i < n; i++) {
      const a = rnd(seed + i) * 6.28, d = 3 + k * (12 + rnd(seed * 4 + i) * 10);
      g.fillStyle = i % 3 ? '#3fbf5a' : '#9aff9a';
      sq(g, x + Math.cos(a) * d + Math.sin(k * 9 + i) * 2, y + Math.sin(a) * d + k * k * 10, px * 2, px);
    }
  } else if (look === 'rock') {
    // polvo que se abre y cascotes que caen
    if (!low) { g.fillStyle = 'rgba(160,138,106,' + (0.5 * (1 - k)).toFixed(2) + ')'; g.beginPath(); g.arc(x, y, 6 + k * 18, 0, 7); g.fill(); }
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (rnd(seed + i) - 0.5) * 2.8, d = k * (10 + rnd(seed * 6 + i) * 14);
      g.fillStyle = i % 2 ? '#8a6a48' : '#c8a070';
      sq(g, x + Math.cos(a) * d, y + Math.sin(a) * d + k * k * 22, px * 2, px);
    }
  } else if (look === 'star') {
    if (!low) { g.globalCompositeOperation = 'lighter'; glow(g, x, y, 22, '200,210,255', 0.6 * (1 - k)); g.globalCompositeOperation = 'source-over'; }
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28 + rnd(seed), d = 4 + k * 18, on = (i + Math.floor(k * 10)) % 2 === 0;
      g.fillStyle = on ? '#ffffff' : '#c9d8ff';
      const xx = x + Math.cos(a) * d, yy = y + Math.sin(a) * d;
      sq(g, xx, yy, px, px); if (on && k < 0.6) { sq(g, xx - px, yy, px, px); sq(g, xx + px, yy, px, px); sq(g, xx, yy - px, px, px); sq(g, xx, yy + px, px, px); }
    }
  } else if (look === 'dagger') {
    // corte en X que se desvanece
    g.fillStyle = 'rgba(255,255,255,' + (1 - k).toFixed(2) + ')';
    const L = 14 * (0.6 + k * 0.6);
    for (const a of [ang + 0.8, ang - 0.8]) for (let s2 = -L; s2 <= L; s2 += px) sq(g, x + Math.cos(a) * s2, y + Math.sin(a) * s2, Math.abs(s2) < L * 0.5 ? px * 2 : px, px);
  } else if (look === 'arrow') {
    for (let i = 0; i < n; i++) {
      const a = ang + Math.PI + (rnd(seed + i) - 0.5) * 2, d = 3 + k * (10 + rnd(seed * 8 + i) * 10);
      g.fillStyle = i % 2 ? '#ffffff' : '#9aff9a';
      sq(g, x + Math.cos(a) * d, y + Math.sin(a) * d, px, px);
    }
  } else if (look === 'wisp') {
    // nube morada que se abre y se desvanece
    for (let i = 0; i < n; i++) {
      const a = rnd(seed + i) * 6.28, d = 3 + k * (10 + rnd(seed * 3 + i) * 12);
      g.globalAlpha = 1 - k;
      pixelBall(g, x + Math.cos(a) * d, y + Math.sin(a) * d - k * 8, 3 * (1 - k * 0.5), ['#7a2a9a', '#d946ef'], px);
    }
    g.globalAlpha = 1;
  } else if (look === 'water') {
    // salpicadura: gotas en abanico hacia atrás y un anillo que se abre
    for (let i = 0; i < n; i++) {
      const a = ang + Math.PI + (rnd(seed + i) - 0.5) * 2.4, d = 4 + k * (12 + rnd(seed * 3 + i) * 14);
      g.fillStyle = i % 3 ? '#4ff0e0' : '#c4fff8';
      sq(g, x + Math.cos(a) * d, y + Math.sin(a) * d + k * k * 10, px * (k < 0.6 ? 2 : 1), px);
    }
    if (!low) {
      g.fillStyle = 'rgba(196,255,248,' + (0.7 * (1 - k)).toFixed(2) + ')';
      const r = 6 + k * 16;
      for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.28; sq(g, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, px, px); }
    }
  }
}
