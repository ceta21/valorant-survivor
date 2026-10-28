// Efectos de habilidades en pixel-art ORIGINAL: sprites pequeños por rejilla de caracteres
// y explosiones "por bloques" que respetan la rejilla de píxeles del juego.
type Ctx = CanvasRenderingContext2D;
type Make = (w: number, h: number) => any;

/** Paletas de frío a caliente (índice 0 = borde/humo, último = núcleo). */
export const PAL: Record<string, string[]> = {
  fire: ['#5a1a10', '#c9301c', '#ff7a3d', '#ffd24a', '#fff6c8'],
  boom: ['#3a3a44', '#7a4a2a', '#ff6a1c', '#ffb02e', '#fff6c8'],
  ice: ['#2a4a7a', '#4f86c6', '#7ab8ff', '#c9e6ff', '#ffffff'],
  holy: ['#7a6a2a', '#e8c35a', '#ffe9a0', '#fffbe6', '#ffffff'],
  heal: ['#1f6f4a', '#2fb88a', '#4de0c0', '#b8ffe8', '#ffffff'],
  soul: ['#2a0a36', '#7a2a9a', '#d946ef', '#ff9cff', '#ffffff'],
  shadow: ['#0c0e22', '#1a1d44', '#2b2f6a', '#6b7cff', '#d2d8ff'],
  electric: ['#0a3a4a', '#1f8fb0', '#2fe6ff', '#c4faff', '#ffffff'],
  scan: ['#1a2a5a', '#3a5fbf', '#5c8bff', '#c9d8ff', '#ffffff'],
  wind: ['#4a6a80', '#8fd9ff', '#bfeaff', '#e6f7ff', '#ffffff'],
  orbital: ['#3a2a1a', '#a0602a', '#ff9f3d', '#ffe0a0', '#ffffff'],
  stim: ['#4a3a20', '#a08050', '#d9a066', '#f4dcbc', '#ffffff'],
  turret: ['#3a3418', '#a08a20', '#ffe14a', '#fff4b0', '#ffffff'],
  smoke: ['#1a1a1f', '#2e2e36', '#4a4a55', '#6e6e7a', '#9a9aa6'],
};

/* ------------------------------------------------------------------ sprites */
// Letras 0-4 = color de la paleta activa (0 oscuro … 4 claro); el resto, colores fijos.
const FIXED: Record<string, string> = { k: '#10151c', h: '#5a3a22', g: '#d8b04a', s: '#cfe8ff', w: '#ffffff', d: '#7d93b0', m: '#8a6a3a', r: '#c9301c', e: '#2a2f3a', y: '#ffd24a', o: '#ff7a3d', l: '#e6e6e6' };
const SPRITES: Record<string, string[]> = {
  dagger: [
    '...g........',
    'hhhgwwwwwwk.',
    'hhhgssssssww',
    'hhhgddddddk.',
    '...g........',
  ],
  arrow: [
    '22........3...',
    '.22.......33..',
    '222mmmmmmm334w',
    '.22.......33..',
    '22........3...',
  ],
  flame: [
    '...1....',
    '...11...',
    '..121...',
    '..1221..',
    '.12221..',
    '.123321.',
    '12233321',
    '12334321',
    '12334431',
    '.123331.',
    '..1111..',
  ],
  grenade: [
    '....ee...',
    '...ekke..',
    '..kkkkk..',
    '.k33333k.',
    'k3443333k',
    'k34rrr33k',
    'k33rrr32k',
    'k3333322k',
    '.k32222k.',
    '..kkkkk..',
  ],
  rocket: [
    '.kk..............',
    'krrk.kkkkkkkkk...',
    'krrrkllllllllkkk.',
    'yorrklwwllllllrok',
    'yorrkllllllllrrok',
    'krrrkddddddddkkk.',
    'krrk.kkkkkkkkk...',
    '.kk..............',
  ],
  turret: [
    '...kkkkkk...',
    '..k333333k..',
    '.k33222233k.',
    'k3322ee2233k',
    'k3322ee2233k',
    '.k33222233k.',
    '..k333333k..',
    '...kkkkkk...',
    '..kk....kk..',
    '.kk......kk.',
  ],
  barrel: [
    'kkkkkkkk',
    'k2222224',
    'kkkkkkkk',
  ],
  eye: [
    '...11111...',
    '.114444411.',
    '14443334441',
    '1443300344w',
    '14443334441',
    '.114444411.',
    '...11111...',
  ],
  plus: [
    '.kkk.',
    'kk3kk',
    'k333k',
    'kk3kk',
    '.kkk.',
  ],
  cross: [
    '..kkk..',
    '..k3k..',
    'kkk3kkk',
    'k33433k',
    'kkk3kkk',
    '..k3k..',
    '..kkk..',
  ],
  chevron: [
    '...4...',
    '..444..',
    '.33.33.',
    '33...33',
  ],
  crystal: [
    '..4..',
    '.434.',
    '.323.',
    '42324',
    '.323.',
    '.434.',
    '..4..',
  ],
  bolt: [
    '..44',
    '.43.',
    '4433',
    '.34.',
    '43..',
  ],
};
export const spriteSize = (name: string) => ({ w: SPRITES[name][0].length, h: SPRITES[name].length });

const cache = new Map<string, any>();
/** Sprite pintado a 1 píxel por celda, con la paleta indicada (cacheado). */
export function sprite(name: string, pal: string, make: Make) {
  const k = `${name}|${pal}`;
  let c = cache.get(k);
  if (c) return c;
  const rows = SPRITES[name], P = PAL[pal] ?? PAL.fire;
  c = make(rows[0].length, rows.length);
  const g = c.getContext('2d') as Ctx;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const col = ch >= '0' && ch <= '4' ? P[+ch] : FIXED[ch];
    if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
  }));
  cache.set(k, c);
  return c;
}

/** Ángulo redondeado a 16 direcciones: los sprites girados siguen pareciendo pixel-art. */
export const snapAng = (a: number) => Math.round(a / (Math.PI / 8)) * (Math.PI / 8);

/** Dibuja un sprite centrado en (x,y). px = unidades de mundo por píxel del sprite. */
export function drawSprite(g: Ctx, img: any, x: number, y: number, px: number, ang = 0, flipX = false) {
  const w = img.width * px, h = img.height * px;
  g.save();
  g.translate(x, y);
  if (ang) g.rotate(snapAng(ang));
  if (flipX) g.scale(-1, 1);
  g.imageSmoothingEnabled = false;
  g.drawImage(img, -w / 2, -h / 2, w, h);
  g.restore();
}

/* ------------------------------------------------------------------ efectos procedurales */
const hash = (a: number, b: number, s: number) => {
  let h = (Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(s, 83492791)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h % 1000) / 1000;
};
/** Tamaño de "bloque" según el radio, para que una explosión grande no cueste demasiado. */
const cellFor = (R: number, px: number, ring = false) => px * Math.max(1, Math.round(R / (ring ? 160 : 90)));

/**
 * Explosión por bloques: un frente irregular que crece (k: 0→1), se ahueca y se disipa.
 * ring = true dibuja solo un anillo fino (escáner, ondas).
 */
export function pixelBlast(g: Ctx, x: number, y: number, R: number, k: number, pal: string, seed: number, px: number, ring = false) {
  const P = PAL[pal] ?? PAL.fire, cell = cellFor(R, px, ring);
  const front = 1 - (1 - k) * (1 - k);              // ease-out
  const thick = ring ? 0.14 : 0.1 + 0.32 * (1 - k) * (1 - k);
  const i0 = Math.floor((x - R * 1.15) / cell), i1 = Math.ceil((x + R * 1.15) / cell);
  const j0 = Math.floor((y - R * 1.15) / cell), j1 = Math.ceil((y + R * 1.15) / cell);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const cx = i * cell + cell / 2, cy = j * cell + cell / 2;
    const d = Math.hypot(cx - x, cy - y) / R;
    const n = hash(i, j, seed);
    const edge = front * (1 + (n - 0.5) * 0.3);
    if (d > edge || d < edge - thick) continue;
    if (n < 0.12 + k * 0.75) continue;                // con huecos, y se deshace al final
    const heat = Math.max(0, 1 - (edge - d) / thick) * (1 - k * 0.75) + (n - 0.5) * 0.25;
    g.fillStyle = P[Math.max(0, Math.min(P.length - 1, Math.floor(heat * P.length)))];
    g.fillRect(i * cell, j * cell, cell, cell);
  }
}

/** Círculo punteado por bloques (retículas y bordes de campos). */
export function pixelCircle(g: Ctx, x: number, y: number, r: number, color: string, px: number, dash = 2, rot = 0) {
  const cell = px * 2, n = Math.max(12, Math.floor((r * Math.PI * 2) / (cell * 2)));
  g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    if (Math.floor(i / dash) % 2) continue;
    const a = (i / n) * Math.PI * 2 + rot;
    g.fillRect(Math.round((x + Math.cos(a) * r) / cell) * cell - cell / 2, Math.round((y + Math.sin(a) * r) / cell) * cell - cell / 2, cell, cell);
  }
}

/** Línea de píxeles (paso fijo de px) entre dos puntos. */
export function pixelLine(g: Ctx, x0: number, y0: number, x1: number, y1: number, color: string, px: number, size = 1) {
  const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(len / px)), s = px * size;
  g.fillStyle = color;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    g.fillRect(Math.round((x0 + (x1 - x0) * t) / px) * px - s / 2, Math.round((y0 + (y1 - y0) * t) / px) * px - s / 2, s, s);
  }
}

/** Rayo en zigzag (Neon): exterior de color y núcleo blanco. */
export function pixelBolt(g: Ctx, x0: number, y0: number, x1: number, y1: number, seed: number, pal: string, px: number) {
  const P = PAL[pal] ?? PAL.electric, segs = 5, pts: [number, number][] = [[x0, y0]];
  const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
  for (let i = 1; i < segs; i++) {
    const o = (hash(i, seed, 7) - 0.5) * 0.5 * l;
    pts.push([x0 + (x1 - x0) * (i / segs) + (nx / l) * o * 0.35, y0 + (y1 - y0) * (i / segs) + (ny / l) * o * 0.35]);
  }
  pts.push([x1, y1]);
  for (let i = 1; i < pts.length; i++) pixelLine(g, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], P[2], px, 2);
  for (let i = 1; i < pts.length; i++) pixelLine(g, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], P[4], px, 1);
}

/** Columna de luz que cae del cielo (ataque orbital, resurrección, Rematch). */
export function pixelBeam(g: Ctx, x: number, y: number, w: number, k: number, pal: string, time: number, px: number) {
  const P = PAL[pal] ?? PAL.holy, cell = px * 2, half = Math.max(cell, w * (1 - k * 0.6) / 2);
  const cols = Math.ceil(half / cell);
  for (let c = -cols; c <= cols; c++) {
    const f = 1 - Math.abs(c) / (cols + 1);
    const flick = hash(c, Math.floor(time * 30), 3) * 0.3;
    const idx = Math.max(0, Math.min(P.length - 1, Math.floor((f * (1 - k * 0.5) + flick) * P.length)));
    g.fillStyle = P[idx];
    g.fillRect(Math.round(x / cell) * cell + c * cell - cell / 2, y - 700, cell, 700);
  }
}

/** Campo persistente con cristales (Orbe ralentizador). */
export function pixelField(g: Ctx, x: number, y: number, R: number, life: number, seed: number, pal: string, make: Make, px: number, time: number) {
  const a = Math.min(1, life * 3);
  g.globalAlpha = a * 0.9;
  pixelCircle(g, x, y, R, PAL[pal][2], px, 2, time * 0.4);
  const img = sprite('crystal', pal, make), n = Math.round(R / 16);
  for (let i = 0; i < n; i++) {
    const ang = hash(i, seed, 1) * Math.PI * 2, d = Math.sqrt(hash(i, seed, 2)) * R * 0.9;
    const bob = Math.round(Math.sin(time * 3 + i) * 1.5) * px;
    g.globalAlpha = a * (0.55 + 0.45 * hash(i, seed, 3));
    drawSprite(g, img, Math.round((x + Math.cos(ang) * d) / px) * px, Math.round((y + Math.sin(ang) * d) / px) * px + bob, px);
  }
  g.globalAlpha = 1;
}
