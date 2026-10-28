import { Rect } from './types';
import { CS, STREET, ChunkData, World, hash2, mulberry } from './World';

// Arte pixelado: cada chunk se dibuja en baja resolución (1 píxel = U unidades de mundo)
// y el renderizador lo escala sin suavizado. Las baldosas se calculan con coordenadas de mundo,
// así que los chunks vecinos encajan sin costuras.
export const U = 4;
export const CPX = CS / U;        // 160 px por chunk
const SPX = STREET / U;           // 30 px de calle a cada lado
const OUT = '#14110f';
const TILE = 8;                   // 8 px = 32 unidades

interface Theme { g1: string; g2: string; dark: string; road: string; road2: string; wallF: string; wallS: string; roof: string; roofD: string; trim: string; crate: string; crateD: string; stone: string; light: string }
const THEMES: Record<string, Theme> = {
  ascent: { g1: '#575d6c', g2: '#626879', dark: '#454a57', road: '#3a3e49', road2: '#434853', wallF: '#d8c3a0', wallS: '#a88e68', roof: '#c4623a', roofD: '#9a4426', trim: '#7a4a2e', crate: '#a9733f', crateD: '#6e4624', stone: '#bfb8a8', light: '#ffd9a0' },
  bind: { g1: '#c9945a', g2: '#bf8a52', dark: '#a8763f', road: '#d9ab76', road2: '#c99a64', wallF: '#d98a4a', wallS: '#a8622a', roof: '#f0b872', roofD: '#cf9250', trim: '#2a9d8f', crate: '#9a6a38', crateD: '#5e3c1c', stone: '#e2c08a', light: '#ff9a3d' },
  haven: { g1: '#4f7a4f', g2: '#5a8858', dark: '#3f6a41', road: '#9a9a8c', road2: '#a8a89a', wallF: '#8a3b3b', wallS: '#5e2626', roof: '#c94c4c', roofD: '#9a3434', trim: '#e8c35a', crate: '#a9733f', crateD: '#6e4624', stone: '#9a9a8c', light: '#ffb347' },
};
const GLYPH: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
};

export type MakeCanvas = (w: number, h: number) => any;

export function renderChunk(world: World, ch: ChunkData, make: MakeCanvas) {
  const id = world.map.id;
  const T = THEMES[id] ?? THEMES.ascent;
  const cv = make(CPX, CPX), g = cv.getContext('2d');
  const wx0 = ch.cx * CPX, wy0 = ch.cy * CPX;           // origen del chunk en píxeles de mundo
  const rnd = mulberry(ch.seed ^ 0x9e3779b9);
  let lastC = '';
  const lpx = (x: number, y: number, w: number, h: number, c: string) => { if (c !== lastC) { g.fillStyle = c; lastC = c; } g.fillRect(x, y, w, h); };
  const disc = (cx: number, cy: number, rad: number, c: string) => { for (let dy = -rad; dy <= rad; dy++) { const hw = Math.floor(Math.sqrt(rad * rad - dy * dy)); lpx(cx - hw, cy + dy, hw * 2 + 1, 1, c); } };
  const ell = (cx: number, cy: number, rx: number, ry: number, c: string) => { for (let dy = -ry; dy <= ry; dy++) { const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))); lpx(cx - hw, cy + dy, hw * 2 + 1, 1, c); } };
  const lx = (wx: number) => Math.round((wx - ch.cx * CS) / U);   // mundo → píxel local
  const ly = (wy: number) => Math.round((wy - ch.cy * CS) / U);
  const tileH = (tx: number, ty: number) => hash2(Math.floor((wx0 + tx) / TILE), Math.floor((wy0 + ty) / TILE), world.seed ^ 0x51ed);
  const streetCol = (x: number) => x < SPX || x >= CPX - SPX;
  const streetRow = (y: number) => y < SPX || y >= CPX - SPX;
  const inObs = (x: number, y: number, m: number) => ch.obstacles.some(o => x > o.x - m && x < o.x + o.w + m && y > o.y - m && y < o.y + o.h + m);

  // ---------- suelo por baldosas (continuo entre chunks) ----------
  for (let ty = 0; ty < CPX; ty += TILE) for (let tx = 0; tx < CPX; tx += TILE) {
    const h = tileH(tx, ty);
    lpx(tx, ty, TILE, TILE, h < 0.5 ? T.g1 : T.g2);
    if (id === 'ascent') { lpx(tx, ty, TILE, 1, T.dark); lpx(tx, ty, 1, TILE, T.dark); if (h > 0.82) lpx(tx + 3, ty + 3, 2, 1, 'rgba(255,255,255,0.12)'); }
    else if (id === 'haven') { if (h > 0.55) lpx(tx + ((h * 40) | 0) % 6, ty + ((h * 90) | 0) % 6, 1, 2, '#6aa066'); }
  }
  if (id === 'bind') for (let i = 0; i < 160; i++) lpx((rnd() * CPX) | 0, (rnd() * CPX) | 0, 1 + ((rnd() * 3) | 0), 1, rnd() < 0.5 ? '#d8a76e' : '#b07a42');
  if (id === 'haven') for (let i = 0; i < 90; i++) lpx((rnd() * CPX) | 0, (rnd() * CPX) | 0, 1, 1, rnd() < 0.5 ? '#436a43' : '#6c9a68');

  // ---------- calles (4 franjas, pintadas por baldosa) ----------
  const strips: number[][] = [[0, 0, CPX, SPX], [0, CPX - SPX, CPX, SPX], [0, 0, SPX, CPX], [CPX - SPX, 0, SPX, CPX]];
  for (let ty = 0; ty < CPX; ty += TILE) for (let tx = 0; tx < CPX; tx += TILE) {
    if (tx >= SPX && tx + TILE <= CPX - SPX && ty >= SPX && ty + TILE <= CPX - SPX) continue; // baldosa de manzana
    const h = tileH(tx, ty), par = ((Math.floor((wx0 + tx) / TILE) + Math.floor((wy0 + ty) / TILE)) & 1) === 0;
    const col = id === 'haven' ? (h < 0.5 ? T.road : T.road2) : par ? T.road : T.road2;
    for (const [sx, sy, sw, sh] of strips) {
      const x0 = Math.max(tx, sx), y0 = Math.max(ty, sy), x1 = Math.min(tx + TILE, sx + sw), y1 = Math.min(ty + TILE, sy + sh);
      if (x1 > x0 && y1 > y0) lpx(x0, y0, x1 - x0, y1 - y0, col);
    }
    if (id !== 'ascent') {   // juntas de baldosa en calles
      const jc = id === 'bind' ? 'rgba(90,50,20,0.35)' : '#6f6f64';
      for (const [sx, sy, sw, sh] of strips) {
        const x0 = Math.max(tx, sx), y0 = Math.max(ty, sy), x1 = Math.min(tx + TILE, sx + sw), y1 = Math.min(ty + TILE, sy + sh);
        if (x1 > x0 && y1 > y0) { if (x0 === tx) lpx(tx, y0, 1, y1 - y0, jc); if (y0 === ty) lpx(x0, ty, x1 - x0, 1, jc); }
      }
    }
  }
  // bordillo solo en el contorno de cada manzana (nunca cruza las calles)
  const curb = id === 'ascent' ? '#7a8192' : id === 'bind' ? '#a8763f' : '#6f6f64', B0 = SPX, B1 = CPX - SPX;
  lpx(B0, B0, B1 - B0, 1, curb); lpx(B0, B1 - 1, B1 - B0, 1, curb); lpx(B0, B0, 1, B1 - B0, curb); lpx(B1 - 1, B0, 1, B1 - B0, curb);
  if (id === 'ascent') {
    for (let i = 0; i < 70; i++) { const x = (rnd() * CPX) | 0, y = (rnd() * CPX) | 0; if (streetCol(x) || streetRow(y)) lpx(x, y, 1, 1, 'rgba(255,255,255,0.08)'); }
    // línea discontinua en el centro de cada avenida (columna 0 y fila 0 del chunk)
    for (let t = SPX; t < CPX - SPX - 4; t += 14) { lpx(0, t, 1, 8, '#d8d2a8'); lpx(t, 0, 8, 1, '#d8d2a8'); }
    // pasos de cebra en los cruces
    for (let k = 0; k < 5; k++) { lpx(SPX + 2 + k * 5, 2, 3, 8, 'rgba(255,255,255,0.25)'); lpx(2, SPX + 2 + k * 5, 8, 3, 'rgba(255,255,255,0.25)'); }
  }

  // ---------- elementos grandes (plaza / estanque / alfombras) ----------
  for (const d of ch.deco) {
    const cx = lx(d.x), cy = ly(d.y), rx = Math.round(d.rx / U), ry = Math.round(d.ry / U);
    if (d.type === 'fountain') {
      disc(cx, cy, rx + 12, '#6a7080'); disc(cx, cy, rx + 8, '#5d6372'); disc(cx, cy, rx - 6, '#6a7080'); disc(cx, cy, rx - 8, '#4fd0e0'); disc(cx, cy, rx - 12, '#3aa7bb');
      disc(cx, cy, 4, '#e6f7ff'); disc(cx, cy, 2, '#4fd0e0');
      for (let i = 0; i < 26; i++) lpx(cx - rx + 8 + ((rnd() * (rx * 2 - 16)) | 0), cy - rx + 8 + ((rnd() * (rx * 2 - 16)) | 0), 2, 1, 'rgba(255,255,255,0.35)');
      for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; for (let k = rx + 2; k < rx + 12; k += 2) lpx(Math.round(cx + Math.cos(an) * k), Math.round(cy + Math.sin(an) * k), 1, 1, '#8a91a2'); }
    } else if (d.type === 'pond') {
      ell(cx, cy, rx + 3, ry + 3, '#6f6f64'); ell(cx, cy, rx, ry, '#3b78b8'); ell(cx, cy, rx - 5, ry - 4, '#4b8fd0');
      for (let i = 0; i < 22; i++) lpx(cx - rx + 6 + ((rnd() * (rx * 2 - 12)) | 0), cy - ry + 4 + ((rnd() * (ry * 2 - 8)) | 0), 3, 1, 'rgba(255,255,255,0.35)');
      for (let i = 0; i < 4; i++) { const px = cx - rx + 10 + ((rnd() * (rx * 2 - 20)) | 0), py = cy - ry + 6 + ((rnd() * (ry * 2 - 12)) | 0); disc(px, py, 3, '#3f8a4a'); lpx(px - 1, py - 1, 2, 2, '#ffb0c4'); }
    } else {
      // alfombras grandes
      const w = rx, h = ry;
      lpx(cx - w, cy - h, w * 2, h * 2, '#8c2f39'); lpx(cx - w + 2, cy - h + 2, w * 2 - 4, h * 2 - 4, '#d9a441'); lpx(cx - w + 5, cy - h + 5, w * 2 - 10, h * 2 - 10, '#2a9d8f'); lpx(cx - w + 9, cy - h + 9, w * 2 - 18, h * 2 - 18, '#8c2f39');
      for (let k = 0; k < Math.floor((w * 2 - 22) / 6); k++) lpx(cx - w + 12 + k * 6, cy - 3, 3, 6, k % 2 ? '#d9a441' : '#2a9d8f');
      for (let k = cx - w; k < cx + w; k += 3) { lpx(k, cy - h - 2, 1, 2, '#d9a441'); lpx(k, cy + h, 1, 2, '#d9a441'); }
    }
  }

  // ---------- decoración suelta (sin colisión) ----------
  for (let i = 0; i < 26; i++) {
    const x = 8 + ((rnd() * (CPX - 16)) | 0), y = 8 + ((rnd() * (CPX - 16)) | 0), k = rnd();
    if (inObs(x * U + ch.cx * CS, y * U + ch.cy * CS, 32)) continue;
    if (ch.deco.some(d => Math.abs(lx(d.x) - x) < d.rx / U + 14 && Math.abs(ly(d.y) - y) < d.ry / U + 14)) continue;
    const road = streetCol(x) || streetRow(y);
    if (id === 'ascent') {
      if (!road && k < 0.5) { lpx(x, y + 3, 5, 4, '#9a4a2a'); lpx(x - 1, y, 7, 4, '#3f8f4a'); lpx(x + 1, y - 1, 3, 2, '#58b060'); }   // macetas
      else if (!road) { lpx(x, y, 4, 4, '#3a3f4a'); lpx(x + 1, y + 1, 2, 2, '#ffd9a0'); }                                              // farolas
    } else if (id === 'bind') {
      if (!road && k < 0.5) { lpx(x, y + 2, 5, 5, '#8a4a2a'); lpx(x + 1, y, 3, 2, '#b8693a'); lpx(x + 1, y + 3, 3, 1, '#2a9d8f'); }     // vasijas
      else if (!road) { lpx(x, y, 2, 6, '#5e3c1c'); lpx(x - 1, y - 1, 4, 2, '#ffcf70'); }                                              // antorchas
    } else {
      if (k < 0.55) { lpx(x - 1, y, 7, 5, '#2f6a3a'); lpx(x, y - 1, 5, 2, '#3f8a4a'); lpx(x + 1, y + 1, 1, 1, '#ff9ab0'); lpx(x + 4, y + 2, 1, 1, '#fff0a0'); } // arbustos
      else if (!road) { lpx(x, y + 2, 4, 5, '#8c8c84'); lpx(x - 1, y, 6, 3, '#a8a89a'); lpx(x + 1, y - 1, 2, 1, '#ffb347'); }           // linternas
    }
  }

  // ---------- zona de sitio A/B/C ----------
  if (ch.zone) {
    const zx = lx(ch.zone.x), zy = ly(ch.zone.y), zr = Math.round(ch.zone.r / U);
    for (let dy = -zr; dy <= zr; dy++) { const hw = Math.floor(Math.sqrt(zr * zr - dy * dy)); for (let dx = -hw; dx <= hw; dx++) lpx(zx + dx, zy + dy, 1, 1, ((dx + dy + 400) % 12 < 4) ? 'rgba(255,214,74,0.22)' : 'rgba(255,214,74,0.07)'); }
    for (let a = 0; a < Math.PI * 2; a += 0.012) if (((a * zr) | 0) % 9 < 6) lpx(Math.round(zx + Math.cos(a) * zr), Math.round(zy + Math.sin(a) * zr), 1, 1, 'rgba(255,214,74,0.85)');
    const gl = GLYPH[ch.zone.label];
    if (gl) { const s = Math.max(3, Math.floor(zr / 9)); const gx = zx - Math.floor(2.5 * s), gy = zy - Math.floor(3.5 * s); gl.forEach((row, j) => [...row].forEach((c, i) => { if (c === '1') lpx(gx + i * s, gy + j * s, s, s, 'rgba(255,214,74,0.7)'); })); }
  }

  // ---------- obstáculos (sombra + volumen) ----------
  const L = 3;
  const sorted = [...ch.obstacles].sort((a, b) => a.y + a.h - (b.y + b.h));
  const R = (v: number) => Math.round(v / U);
  for (const o of sorted) lpx(lx(o.x) + 3, ly(o.y) + 3, R(o.w), R(o.h), 'rgba(0,0,0,0.34)');
  for (const o of sorted) drawObstacle(o);

  function drawObstacle(o: Rect) {
    const x = lx(o.x), y = ly(o.y), ow = Math.max(2, R(o.w)), oh = Math.max(2, R(o.h)), k = o.k ?? 'b';
    if (k === 'b') {
      lpx(x - 1, y - L - 1, ow + 2, oh + L + 2, OUT);
      lpx(x, y, ow, oh, T.wallF); lpx(x, y + oh - 3, ow, 3, T.wallS);
      for (let wx = x + 4; wx < x + ow - 5; wx += 9) { lpx(wx, y + oh - 3, 3, 2, OUT); lpx(wx, y + oh - 3, 3, 1, T.trim); }
      lpx(x, y - L, ow, oh, T.roof);
      for (let ry = 0; ry < oh; ry += 3) { lpx(x, y - L + ry, ow, 1, T.roofD); for (let rx = (ry / 3) % 2 ? 2 : 0; rx < ow; rx += 5) lpx(x + rx, y - L + ry + 1, 1, 2, T.roofD); }
      lpx(x, y - L, ow, 1, T.trim); lpx(x, y - L, 1, oh, T.trim); lpx(x + ow - 1, y - L, 1, oh, T.roofD);
      lpx(x + 1, y - L + 1, ow - 2, 1, 'rgba(255,255,255,0.22)');
      if (ow > 24 && oh > 18) { const mx = x + (ow >> 1), my = y - L + (oh >> 1); lpx(mx - 3, my - 3, 6, 6, T.roofD); lpx(mx - 2, my - 2, 4, 4, T.trim); }
    } else if (k === 'w') {
      lpx(x - 1, y - 3, ow + 2, oh + 4, OUT);
      lpx(x, y - 2, ow, oh + 2, T.wallF);
      for (let ry = 0; ry < oh + 2; ry += 3) { lpx(x, y - 2 + ry, ow, 1, T.wallS); for (let rx = ((ry / 3) % 2 ? 3 : 0); rx < ow; rx += 6) lpx(x + rx, y - 2 + ry, 1, 3, T.wallS); }
      lpx(x, y - 2, ow, 1, 'rgba(255,255,255,0.35)'); lpx(x, y + oh - 1, ow, 1, T.wallS);
    } else if (k === 'c') {
      lpx(x - 1, y - 3, ow + 2, oh + 4, OUT);
      lpx(x, y - 2, ow, oh, T.crate);
      lpx(x, y - 2, ow, 1, T.crateD); lpx(x, y - 2 + oh - 1, ow, 1, T.crateD); lpx(x, y - 2, 1, oh, T.crateD); lpx(x + ow - 1, y - 2, 1, oh, T.crateD);
      for (let i = 1; i < Math.min(ow, oh) - 1; i++) { lpx(x + i, y - 2 + i, 1, 1, T.crateD); lpx(x + ow - 1 - i, y - 2 + i, 1, 1, T.crateD); }
      lpx(x, y - 2 + oh, ow, 2, T.crateD);
    } else if (k === 'p') {
      lpx(x - 1, y - 4, ow + 2, oh + 5, OUT);
      lpx(x, y - 3, ow, oh + 3, T.stone); lpx(x, y - 3, ow, 2, 'rgba(255,255,255,0.35)'); lpx(x + ow - 2, y - 3, 2, oh + 3, 'rgba(0,0,0,0.25)'); lpx(x + 2, y - 1, ow - 4, oh - 2, 'rgba(0,0,0,0.12)');
      lpx(x + (ow >> 1) - 1, y - 3 + (oh >> 1), 2, 2, T.trim);
    } else {
      const bx = x + (ow >> 1), by = y + (oh >> 1);
      disc(bx, by - 1, (ow >> 1) + 1, OUT); disc(bx, by - 1, ow >> 1, '#7a5230'); lpx(bx - (ow >> 1), by - 3, ow, 1, '#4a3018'); lpx(bx - (ow >> 1), by + 1, ow, 1, '#4a3018'); lpx(bx - 2, by - (oh >> 1), 2, 2, 'rgba(255,255,255,0.35)');
    }
  }

  // ---------- luces cálidas en las esquinas de edificios y pilares ----------
  g.globalCompositeOperation = 'lighter';
  for (const o of ch.obstacles) {
    if (o.k !== 'b' && o.k !== 'p') continue;
    for (const ex of [o.x, o.x + o.w]) {
      const px = lx(ex), py = ly(o.y + o.h);
      for (const [rad, a] of [[16, 0.04], [10, 0.05], [5, 0.07]] as number[][]) { g.globalAlpha = a; disc(px, py, rad, T.light); }
    }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return cv;
}
