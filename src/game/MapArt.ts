import { Rect } from './types';
import { CS, CELL, CN, Cell, ChunkData, Deco, World, hash2, mulberry, noise } from './World';
import { MAPS } from '../data/maps';

// Arte pixelado del terreno: cada chunk se dibuja en baja resolución (1 píxel = U unidades de mundo) y el
// renderizador lo escala sin suavizado. Todo se calcula con coordenadas de mundo, así que los chunks vecinos
// encajan sin costuras. Cada zona tiene su tema (suelo, caminos, rocas, árboles, edificios).
export const U = 4;
export const CPX = CS / U;        // 160 px por chunk
const CP = CELL / U;              // 8 px por celda
const OUT = '#14110f';
/** (compatibilidad) ancho del camino en píxeles. */
export const PB = 10;

export interface Theme {
  g1: string; g2: string; g3: string; dirt: string; dirt2: string; blade: string; bladeL: string; flowers: string[];
  road: string; road2: string; joint: string;
  wallF: string; wallS: string; roof: string; roofD: string; trim: string; crate: string; crateD: string; stone: string; stoneD: string; light: string;
  rock: string; rockL: string; rockD: string;
  leaf: string; leafD: string; leafL: string; trunk: string; cliff: string; cliffD: string;
}
export const THEMES: Record<string, Theme> = {
  reino: { g1: '#3f6a34', g2: '#45713a', g3: '#36602e', dirt: '#6a5038', dirt2: '#5e4630', blade: '#2f5a2a', bladeL: '#5a8a42', flowers: ['#ffe14a', '#c4a8ff', '#ff9a3d', '#ffffff'],
    road: '#8a8270', road2: '#7a7262', joint: '#5e5848',
    wallF: '#cfc4a8', wallS: '#9a9078', roof: '#3a5ab0', roofD: '#2a428a', trim: '#e8c35a', crate: '#a9733f', crateD: '#6e4624', stone: '#bfb8a8', stoneD: '#8a8478', light: '#ffe0a0',
    rock: '#5a5068', rockL: '#6e6480', rockD: '#3a3446', leaf: '#3f8a3a', leafD: '#2a6a2a', leafL: '#6ab84a', trunk: '#5a3e24', cliff: '#6a5a44', cliffD: '#3e3428' },
  glaciar: { g1: '#dfe9f5', g2: '#d4e0ef', g3: '#e8f0fa', dirt: '#c4d4e8', dirt2: '#b8cae2', blade: '#9ab0c8', bladeL: '#ffffff', flowers: ['#9ad8ff', '#ffffff'],
    road: '#a8c0dc', road2: '#9cb6d4', joint: '#7a98c0',
    wallF: '#a8c8e8', wallS: '#7a9ac4', roof: '#f4f8ff', roofD: '#c4d4ea', trim: '#7ad7ff', crate: '#8a6a4a', crateD: '#5a4030', stone: '#9ad8ff', stoneD: '#4f9ad0', light: '#c9f0ff',
    rock: '#8aa4c8', rockL: '#e6eef8', rockD: '#5a7aa8', leaf: '#2f5a4a', leafD: '#1f4034', leafL: '#f0f6ff', trunk: '#5a4030', cliff: '#9ab8da', cliffD: '#5a7aa8' },
  infierno: { g1: '#3a2220', g2: '#40261f', g3: '#331c1a', dirt: '#2a1816', dirt2: '#22120f', blade: '#1e1010', bladeL: '#5a2a1a', flowers: ['#ff6a1c', '#ffd24a'],
    road: '#2a2224', road2: '#322a2c', joint: '#1a1416',
    wallF: '#2a1e20', wallS: '#1a1012', roof: '#3a1414', roofD: '#2a0c0c', trim: '#ff6a1c', crate: '#5a3a2a', crateD: '#2a1a12', stone: '#3a2a2a', stoneD: '#1e1414', light: '#ff6a1c',
    rock: '#2e2226', rockL: '#3e2e32', rockD: '#1a1214', leaf: '#2a1a1a', leafD: '#140c0c', leafL: '#ff8a3d', trunk: '#241618', cliff: '#3a2420', cliffD: '#1e1010' },
  ciudad: { g1: '#5a6070', g2: '#626879', g3: '#545a6a', dirt: '#4a5060', dirt2: '#444a58', blade: '#3a6a3a', bladeL: '#58a058', flowers: ['#ffe14a', '#ff9ab0'],
    road: '#33363f', road2: '#3a3d47', joint: '#2a2c34',
    wallF: '#9aa4b4', wallS: '#6a7484', roof: '#4a5466', roofD: '#3a4252', trim: '#4fd0ff', crate: '#a9733f', crateD: '#6e4624', stone: '#bfb8a8', stoneD: '#8a8478', light: '#ffe8a8',
    rock: '#5a5e6a', rockL: '#6e7280', rockD: '#383c46', leaf: '#3f8f4a', leafD: '#2a6a34', leafL: '#58b060', trunk: '#6a4a2a', cliff: '#5a5e6a', cliffD: '#383c46' },
};

export type MakeCanvas = (w: number, h: number) => any;

export function renderChunk(world: World, ch: ChunkData, make: MakeCanvas) {
  const cv = make(CPX, CPX), g = cv.getContext('2d');
  const rnd = mulberry(ch.seed ^ 0x9e3779b9);
  let lastC = '';
  const lpx = (x: number, y: number, w: number, h: number, c: string) => { if (c !== lastC) { g.fillStyle = c; lastC = c; } g.fillRect(x, y, w, h); };
  const disc = (cx: number, cy: number, rad: number, c: string) => { for (let dy = -rad; dy <= rad; dy++) { const hw = Math.floor(Math.sqrt(rad * rad - dy * dy)); lpx(cx - hw, cy + dy, hw * 2 + 1, 1, c); } };
  const ell = (cx: number, cy: number, rx: number, ry: number, c: string) => { for (let dy = -ry; dy <= ry; dy++) { const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))); lpx(cx - hw, cy + dy, hw * 2 + 1, 1, c); } };
  const lx = (wx: number) => Math.round((wx - ch.cx * CS) / U);   // mundo → píxel local
  const ly = (wy: number) => Math.round((wy - ch.cy * CS) / U);
  const WX = ch.cx * CPX, WY = ch.cy * CPX;                          // origen del chunk en píxeles de mundo
  /** Tipo de celda (i, j) relativa a este chunk; sale a los vecinos si hace falta. */
  const cellAt = (i: number, j: number) => {
    if (i >= 0 && j >= 0 && i < CN && j < CN) return ch.cells[j * CN + i];
    const cx = ch.cx + Math.floor(i / CN), cy = ch.cy + Math.floor(j / CN);
    const n = world.chunk(cx, cy); return n.cells[(((j % CN) + CN) % CN) * CN + (((i % CN) + CN) % CN)];
  };

  const id = ch.zone >= 0 ? MAPS[ch.zone].id : 'reino', T = THEMES[id];
  const seedW = world.seed ^ 0x51ed;

  // ---------- suelo continuo con textura (bloques de 2 px) y manchas de tierra ----------
  for (let y = 0; y < CPX; y += 2) for (let x = 0; x < CPX; x += 2) {
    const wx = WX + x, wy = WY + y, h = hash2(wx >> 1, wy >> 1, seedW);
    const dirt = noise(wx / 70, wy / 70, seedW + 3) * 0.7 + noise(wx / 18, wy / 18, seedW + 4) * 0.3;
    let c = h < 0.33 ? T.g1 : h < 0.66 ? T.g2 : T.g3;
    if (dirt > 0.72) c = h < 0.5 ? T.dirt : T.dirt2;
    else if (dirt > 0.69 && h < 0.5) c = T.dirt;
    lpx(x, y, 2, 2, c);
  }

  // ---------- celdas especiales ----------
  for (let j = 0; j < CN; j++) for (let i = 0; i < CN; i++) {
    const t = ch.cells[j * CN + i];
    if (t === Cell.Ground) continue;
    const x = i * CP, y = j * CP;
    const same = (di: number, dj: number) => { const n = cellAt(i + di, j + dj); return n === t || (t === Cell.Water && n === Cell.Bridge) || (t === Cell.Lava && n === Cell.Bridge); };
    // esquinas redondeadas: si los dos vecinos de una esquina son distintos, se recorta
    const corner = (fill: (px: number, py: number) => void) => {
      for (let py = 0; py < CP; py++) for (let px = 0; px < CP; px++) {
        const cl = px < 2 && py < 2 && !same(-1, 0) && !same(0, -1), cr = px > CP - 3 && py < 2 && !same(1, 0) && !same(0, -1);
        const bl = px < 2 && py > CP - 3 && !same(-1, 0) && !same(0, 1), br = px > CP - 3 && py > CP - 3 && !same(1, 0) && !same(0, 1);
        if ((cl || cr || bl || br) && (px + py) % 3 !== 1) continue;
        fill(px, py);
      }
    };
    const wx = WX + x, wy = WY + y;
    switch (t) {
      case Cell.Path: case Cell.Road: case Cell.Sand: {
        corner((px, py) => {
          const hh = hash2((wx + px) >> 1, (wy + py) >> 1, seedW + 8);
          let c = t === Cell.Sand ? (hh < 0.5 ? '#e0c890' : '#d4b878') : hh < 0.5 ? T.road : T.road2;
          if (t === Cell.Path && (((wx + px) % 6 === 0 && hh < 0.6) || ((wy + py) % 5 === 0 && hh > 0.4))) c = T.joint;   // adoquines
          lpx(x + px, y + py, 1, 1, c);
        });
        if (t === Cell.Road) {   // bordillo de la acera donde acaba la calle
          if (!same(0, -1)) lpx(x, y, CP, 1, '#8a8e9a'); if (!same(0, 1)) lpx(x, y + CP - 1, CP, 1, '#8a8e9a');
          if (!same(-1, 0)) lpx(x, y, 1, CP, '#8a8e9a'); if (!same(1, 0)) lpx(x + CP - 1, y, 1, CP, '#8a8e9a');
          if (hash2(WX / CP + i, WY / CP + j, seedW + 5) > 0.93) lpx(x + 2, y + 3, 3, 2, '#2a2c34');   // bache
        }
        break;
      }
      case Cell.Water: case Cell.Sea: {
        const deep = t === Cell.Sea;
        corner((px, py) => {
          const edge = (!same(-1, 0) && px < 1) || (!same(1, 0) && px > CP - 2) || (!same(0, -1) && py < 1) || (!same(0, 1) && py > CP - 2);
          const wave = noise((wx + px) / 6, (wy + py) / 3, seedW + 12);
          lpx(x + px, y + py, 1, 1, edge ? (deep ? '#2a6a9a' : '#5a9ad0') : wave > 0.72 ? '#8ac4f0' : deep ? (wave < 0.3 ? '#174a78' : '#1f5a8a') : wave < 0.3 ? '#2f6aa8' : '#3b78b8');
        });
        if (!same(0, -1)) lpx(x, y, CP, 1, deep ? '#e0c890' : T.dirt2);   // orilla
        break;
      }
      case Cell.Lava: {
        corner((px, py) => {
          const n = noise((wx + px) / 7, (wy + py) / 7, seedW + 21), edge = (!same(-1, 0) && px < 1) || (!same(1, 0) && px > CP - 2) || (!same(0, -1) && py < 1) || (!same(0, 1) && py > CP - 2);
          lpx(x + px, y + py, 1, 1, edge ? '#8a1a0a' : n > 0.75 ? '#fff0a0' : n > 0.55 ? '#ffd24a' : n > 0.3 ? '#ff8a1c' : n > 0.18 ? '#e04a10' : '#3a1414');
        });
        break;
      }
      case Cell.Ice: {
        corner((px, py) => {
          const n = hash2((wx + px) >> 1, (wy + py) >> 1, seedW + 31);
          lpx(x + px, y + py, 1, 1, n < 0.5 ? '#a8e0ff' : '#b8e8ff');
        });
        if (hash2(WX / CP + i, WY / CP + j, seedW + 32) > 0.6) { lpx(x + 1, y + 3, 4, 1, '#ffffff'); lpx(x + 4, y + 4, 2, 1, '#ffffff'); }   // grietas
        break;
      }
      case Cell.Bridge: {
        // tablones de madera (o losas de basalto sobre la lava)
        const vertical = cellAt(i, j - 1) === Cell.Bridge || cellAt(i, j + 1) === Cell.Bridge || cellAt(i, j - 1) === Cell.Path || cellAt(i, j + 1) === Cell.Path;
        const wood = id !== 'infierno', a = wood ? '#8a5a30' : '#2a2224', b = wood ? '#6a4224' : '#1a1416';
        lpx(x, y, CP, CP, a);
        for (let k = 0; k < CP; k += 3) vertical ? lpx(x, y + k, CP, 1, b) : lpx(x + k, y, 1, CP, b);
        break;
      }
      case Cell.Grass: {
        // hierba alta (como en la referencia): matas de briznas
        if (id === 'ciudad') { corner((px, py) => lpx(x + px, y + py, 1, 1, hash2((wx + px) >> 1, (wy + py) >> 1, seedW) < 0.5 ? '#4a8a3e' : '#3f7a36')); }
        break;
      }
      case Cell.Rock: {
        // meseta de roca: cara superior con textura, cara frontal más oscura donde termina y contorno
        const below = cellAt(i, j + 1) === Cell.Rock, above = cellAt(i, j - 1) === Cell.Rock;
        const left = cellAt(i - 1, j) === Cell.Rock, right = cellAt(i + 1, j) === Cell.Rock;
        for (let py = 0; py < CP; py++) for (let px = 0; px < CP; px++) {
          const n = hash2((wx + px), (wy + py), seedW + 41);
          let c = n < 0.15 ? T.rockL : n > 0.9 ? T.rockD : T.rock;
          if (!below && py >= CP - 3) c = py === CP - 1 ? OUT : (n < 0.5 ? T.rockD : T.cliffD);   // cara frontal
          if ((!above && py === 0) || (!left && px === 0) || (!right && px === CP - 1)) c = OUT;
          lpx(x + px, y + py, 1, 1, c);
        }
        if (!below) lpx(x, y + CP, CP, 1, 'rgba(0,0,0,0.3)');
        break;
      }
      case Cell.Void: {
        lpx(x, y, CP, CP, '#0a0c18');
        if (hash2(WX / CP + i, WY / CP + j, seedW + 51) > 0.85) lpx(x + 3, y + 4, 1, 1, '#4a4e7a');
        const up = cellAt(i, j - 1);
        if (up !== Cell.Void) {   // acantilado: la tierra de arriba se ve colgando sobre el abismo
          const z = world.zoneOfPoint(ch.cx * CS + i * CELL + 4, ch.cy * CS + (j - 1) * CELL + 4), Tz = THEMES[MAPS[Math.max(0, z)].id];
          for (let px = 0; px < CP; px++) {
            const hh = 4 + Math.floor(hash2(WX + x + px, WY + y, 77) * 4);
            lpx(x + px, y, 1, hh, Tz.cliff); lpx(x + px, y + hh - 1, 1, 1, Tz.cliffD);
            if (hash2(WX + x + px, WY, 91) > 0.93) lpx(x + px, y + hh, 1, 2, '#7a4ab0');
          }
        }
        break;
      }
    }
  }
  if (ch.zone < 0) return cv;

  // ---------- detalles sueltos del suelo (hierba alta, flores, piedrecitas, nieve, brasas…) ----------
  const groundAt = (x: number, y: number) => { const t = ch.cells[Math.min(CN - 1, Math.floor(y / CP)) * CN + Math.min(CN - 1, Math.floor(x / CP))]; return t === Cell.Ground || t === Cell.Grass; };
  const tuft = (x: number, y: number) => {   // mata de hierba alta
    for (let k = 0; k < 6; k++) { const hh = 3 + ((k * 7 + x) % 3); lpx(x + k, y - hh, 1, hh, k % 2 ? T.blade : T.bladeL); }
    lpx(x - 1, y, 8, 1, T.g3);
  };
  const tall = id === 'reino' || id === 'ciudad';
  for (let j = 0; j < CN; j++) for (let i = 0; i < CN; i++) if (ch.cells[j * CN + i] === Cell.Grass && tall) {
    for (let k = 0; k < 2; k++) { const x = i * CP + Math.floor(rnd() * 3), y = j * CP + 3 + k * 4; tuft(x, y); }
  }
  for (let k = 0; k < 40; k++) {
    const x = 2 + Math.floor(rnd() * (CPX - 6)), y = 4 + Math.floor(rnd() * (CPX - 6)), v = rnd();
    if (!groundAt(x, y)) continue;
    if (id === 'reino') {
      if (v < 0.35) { const c = T.flowers[Math.floor(rnd() * T.flowers.length)]; lpx(x, y, 1, 1, c); lpx(x - 1, y + 1, 3, 1, c); lpx(x, y + 2, 1, 1, c); }
      else if (v < 0.5) tuft(x, y);
      else if (v < 0.6) lpx(x, y, 2, 1, T.stoneD);
    } else if (id === 'glaciar') {
      if (v < 0.4) { lpx(x, y + 1, 5, 2, '#ffffff'); lpx(x + 1, y, 3, 1, '#ffffff'); lpx(x, y + 3, 5, 1, T.dirt2); }
      else if (v < 0.55) { lpx(x, y, 1, 3, '#9ad8ff'); lpx(x - 1, y + 1, 3, 1, '#c9f0ff'); }
    } else if (id === 'infierno') {
      if (v < 0.35) lpx(x, y, 1, 1, T.flowers[Math.floor(rnd() * 2)]);
      else if (v < 0.45) { lpx(x, y, 4, 3, '#e8dcc0'); lpx(x + 1, y + 1, 1, 1, OUT); lpx(x + 3, y + 1, 1, 1, OUT); }   // calavera
      else if (v < 0.6) { for (let s = 0; s < 6; s++) lpx(x + s, y + ((s * 3) % 2), 1, 1, '#ff6a1c'); }   // grieta
    } else if (v < 0.3) tuft(x, y);
  }

  // ---------- decoración de los monumentos ----------
  for (const d of ch.deco) drawDeco(d);

  // ---------- objetos (sombra + volumen), de arriba abajo ----------
  const sorted = ch.obstacles.filter(o => o.k !== 'v' && o.k !== 'r' && o.k !== 'h').sort((a, b) => a.y + a.h - (b.y + b.h));
  const RR = (v: number) => Math.round(v / U);
  for (const o of sorted) if (o.k !== 'a' && o.k !== 'o') lpx(lx(o.x) + 3, ly(o.y) + 3, RR(o.w), RR(o.h), 'rgba(0,0,0,0.3)');
  for (const o of sorted) drawObstacle(o);

  // ---------- resplandor de la lava y de los braseros ----------
  g.globalCompositeOperation = 'lighter';
  for (let j = 0; j < CN; j += 2) for (let i = 0; i < CN; i += 2) if (ch.cells[j * CN + i] === Cell.Lava) { g.globalAlpha = 0.05; disc(i * CP + 4, j * CP + 4, 10, '#ff6a1c'); }
  for (const d of ch.deco) if (d.type === 'brazier' || d.type === 'campfire' || d.type === 'lamp') { g.globalAlpha = 0.06; disc(lx(d.x), ly(d.y), 14, T.light); g.globalAlpha = 0.08; disc(lx(d.x), ly(d.y), 7, T.light); }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return cv;

  /* ------------------------------------------------------------------ dibujos */
  function drawDeco(d: Deco) {
    const cx = lx(d.x), cy = ly(d.y), rx = Math.round(d.rx / U), ry = Math.round(d.ry / U);
    switch (d.type) {
      case 'fountain':
        disc(cx, cy, rx + 3, OUT); disc(cx, cy, rx + 2, '#8a8478'); disc(cx, cy, rx, '#a8a090'); disc(cx, cy, rx - 3, '#3aa7bb'); disc(cx, cy, rx - 5, '#4fd0e0');
        for (let i = 0; i < 20; i++) lpx(cx - rx + 6 + ((rnd() * (rx * 2 - 12)) | 0), cy - rx + 6 + ((rnd() * (rx * 2 - 12)) | 0), 2, 1, 'rgba(255,255,255,0.4)');
        statue(cx, cy, '#bfc4cc');
        break;
      case 'statue': disc(cx, cy, rx, '#6a7080'); disc(cx, cy, rx - 2, d.c ?? '#bfc4cc'); disc(cx, cy, rx - 5, '#8a91a2'); statue(cx, cy, d.c ?? '#bfc4cc'); break;
      case 'windmill':
        for (const [ax, ay] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) for (let k = 5; k < rx + 4; k++) { lpx(cx + ax * k - 1, cy + ay * k - 6, 3, 3, OUT); }
        for (const [ax, ay] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) for (let k = 5; k < rx + 3; k++) { lpx(cx + ax * k, cy + ay * k - 5, 2, 2, k % 4 ? '#e8dcc0' : '#6a4a2a'); }
        disc(cx, cy - 5, 3, '#6a4a2a');
        break;
      case 'campfire':
        disc(cx, cy, 5, '#5a4030'); lpx(cx - 4, cy, 8, 2, '#6a4a2a'); lpx(cx - 1, cy - 5, 3, 5, '#ff8a1c'); lpx(cx, cy - 7, 1, 3, '#ffd24a');
        break;
      case 'banner':
        lpx(cx, cy - 10, 1, 12, OUT); lpx(cx + 1, cy - 10, 5, 7, d.c ?? '#3a5ab0'); lpx(cx + 2, cy - 8, 3, 2, '#e8c35a'); lpx(cx + 1, cy - 3, 2, 1, d.c ?? '#3a5ab0'); lpx(cx + 4, cy - 3, 2, 1, d.c ?? '#3a5ab0');
        break;
      case 'lamp': lpx(cx - 1, cy - 6, 2, 8, OUT); lpx(cx - 2, cy - 8, 4, 3, '#3a3f4a'); lpx(cx - 1, cy - 7, 2, 1, '#ffe0a0'); break;
      case 'stall':
        lpx(cx - rx, cy - ry, rx * 2, ry * 2, OUT); lpx(cx - rx + 1, cy - ry + 1, rx * 2 - 2, ry * 2 - 2, '#a9733f');
        for (let k = 0; k < rx * 2 - 2; k += 3) lpx(cx - rx + 1 + k, cy - ry + 1, 2, ry, k % 6 ? '#ffffff' : d.c ?? '#c4262e');
        break;
      case 'brazier':
        if (rx > 10) { disc(cx, cy, rx, OUT); disc(cx, cy, rx - 1, '#2a1a1a'); disc(cx, cy, rx - 4, '#e04a10'); disc(cx, cy, rx - 7, '#ffd24a'); }
        else { disc(cx, cy, 4, OUT); disc(cx, cy, 3, '#2a1a1a'); lpx(cx - 1, cy - 4, 3, 3, '#ff8a1c'); lpx(cx, cy - 6, 1, 2, '#ffd24a'); }
        break;
      case 'skull':
        ell(cx, cy, 8, 7, OUT); ell(cx, cy, 7, 6, '#e8dcc0'); disc(cx - 3, cy - 1, 2, OUT); disc(cx + 3, cy - 1, 2, OUT); lpx(cx - 1, cy + 3, 1, 2, OUT); lpx(cx + 1, cy + 3, 1, 2, OUT);
        break;
      case 'crystal': crystal(cx, cy + 4, 4, 9); break;
      case 'helipad':
        disc(cx, cy, rx, '#3a3e49'); disc(cx, cy, rx - 2, '#4a4f5c');
        for (let a = 0; a < Math.PI * 2; a += 0.04) if (((a * 20) | 0) % 2) lpx(Math.round(cx + Math.cos(a) * (rx - 4)), Math.round(cy + Math.sin(a) * (rx - 4)), 1, 1, '#ffd24a');
        lpx(cx - 6, cy - 7, 2, 14, '#e6e9ee'); lpx(cx + 4, cy - 7, 2, 14, '#e6e9ee'); lpx(cx - 6, cy - 1, 12, 2, '#e6e9ee');
        break;
      case 'billboard': lpx(cx - rx / 2, cy - 2, 1, 6, OUT); lpx(cx + rx / 2, cy - 2, 1, 6, OUT); lpx(cx - rx / 2 - 1, cy - ry - 2, rx + 3, ry + 2, OUT); lpx(cx - rx / 2, cy - ry - 1, rx + 1, ry, d.c ?? '#ff3d81'); lpx(cx - rx / 2 + 2, cy - ry + 1, rx - 3, 1, '#ffffff'); break;
    }
  }
  function statue(cx: number, cy: number, c: string) {
    disc(cx, cy, 5, '#5a6070'); disc(cx, cy, 4, c); lpx(cx - 1, cy - 11, 3, 9, c); lpx(cx - 3, cy - 9, 7, 2, c); lpx(cx - 1, cy - 13, 3, 2, '#e6e9ee'); lpx(cx + 3, cy - 14, 1, 6, '#e6e9ee');
  }
  function crystal(cx: number, cy: number, w: number, h: number, c1 = T.stone, c2 = T.stoneD) {
    for (let j = 0; j < h + 1; j++) { const hw = Math.max(0, Math.round(w * (1 - Math.abs(j - h * 0.6) / (h * 0.6 + 1)))); lpx(cx - hw - 1, cy - j, hw * 2 + 3, 1, OUT); }
    for (let j = 0; j < h; j++) { const hw = Math.max(0, Math.round((w - 1) * (1 - Math.abs(j - h * 0.6) / (h * 0.6 + 1)))); lpx(cx - hw, cy - j, hw + 1, 1, c1); lpx(cx + 1, cy - j, hw, 1, c2); }
    lpx(cx - 1, cy - h + 2, 1, 3, '#ffffff');
  }
  function roofStripes(x: number, y: number, w: number, h: number, c: string, d: string) {
    lpx(x, y, w, h, c);
    for (let ry = 0; ry < h; ry += 3) { lpx(x, y + ry, w, 1, d); for (let rx = (ry / 3) % 2 ? 2 : 0; rx < w; rx += 5) lpx(x + rx, y + ry + 1, 1, 2, d); }
  }

  function drawObstacle(o: Rect) {
    const x = lx(o.x), y = ly(o.y), ow = Math.max(2, RR(o.w)), oh = Math.max(2, RR(o.h)), k = o.k ?? 'b', s = o.s ?? '';
    if (k === 'b') {
      const L = s.endsWith('keep') ? 8 : s === 'skyscraper' ? 10 : 3;
      lpx(x - 1, y - L - 1, ow + 2, oh + L + 2, OUT);
      if (s === 'dome') {
        // estadio: anillo de gradas y campo en el centro
        lpx(x, y - L, ow, oh + L, '#6a7484');
        ell(x + (ow >> 1), y + (oh >> 1) - L, (ow >> 1) - 2, (oh >> 1) - 2, '#9aa4b4'); ell(x + (ow >> 1), y + (oh >> 1) - L, (ow >> 1) - 8, (oh >> 1) - 8, '#c4ccd8');
        ell(x + (ow >> 1), y + (oh >> 1) - L, (ow >> 1) - 18, (oh >> 1) - 16, '#3f8a3a'); lpx(x + (ow >> 1), y + 18 - L, 1, oh - 36, '#ffffff');
        for (let a = 0; a < Math.PI * 2; a += 0.2) lpx(Math.round(x + (ow >> 1) + Math.cos(a) * ((ow >> 1) - 5)), Math.round(y + (oh >> 1) - L + Math.sin(a) * ((oh >> 1) - 5)), 2, 2, '#4fd0ff');
        return;
      }
      // fachada
      lpx(x, y, ow, oh, T.wallF); lpx(x, y + oh - 3, ow, 3, T.wallS);
      for (let wx = x + 4; wx < x + ow - 5; wx += 9) { lpx(wx, y + oh - 3, 3, 2, OUT); lpx(wx, y + oh - 3, 3, 1, s === 'demonio-keep' ? '#ff6a1c' : T.trim); }
      if (id === 'ciudad' && s !== 'keep') {
        // azotea plana con unidades de aire, claraboyas y (tiendas) toldo de color
        lpx(x, y - L, ow, oh, s === 'skyscraper' ? '#3a4a6a' : T.roof);
        lpx(x, y - L, ow, 2, T.wallS); lpx(x, y - L + oh - 2, ow, 2, T.wallS); lpx(x, y - L, 2, oh, T.wallS); lpx(x + ow - 2, y - L, 2, oh, T.wallS);
        const r2 = mulberry((o.x * 7 + o.y) | 0);
        if (s === 'skyscraper') { for (let gy = 4; gy < oh - 4; gy += 4) for (let gx = 4; gx < ow - 4; gx += 4) lpx(x + gx, y - L + gy, 2, 2, r2() < 0.4 ? '#ffe8a8' : '#2a6a8a'); lpx(x + (ow >> 1), y - L - 6, 1, 6, OUT); lpx(x + (ow >> 1), y - L - 7, 1, 1, '#ff4655'); }
        else for (let i = 0; i < Math.max(1, (ow * oh) / 260); i++) { const ux = x + 4 + ((r2() * (ow - 12)) | 0), uy = y - L + 4 + ((r2() * (oh - 12)) | 0); lpx(ux, uy, 6, 5, '#8a94a4'); lpx(ux + 1, uy + 1, 4, 3, '#5a6474'); }
        if (s === 'shop') for (let k2 = 0; k2 < ow; k2 += 4) lpx(x + k2, y + oh - 5, 2, 3, k2 % 8 ? '#ffffff' : '#ff3d81');
        return;
      }
      // tejado inclinado de tejas (azules en el Reino, nevado en el Glaciar, oscuro con pinchos en el Infierno)
      const roof = s === 'cabin' ? '#f4f8ff' : s === 'hielo-keep' ? '#a8d8ff' : T.roof, roofD = s === 'cabin' ? '#c4d4ea' : s === 'hielo-keep' ? '#6aa8e0' : T.roofD;
      roofStripes(x, y - L, ow, oh, roof, roofD);
      lpx(x, y - L, ow, 1, T.trim); lpx(x, y - L, 1, oh, T.trim); lpx(x + ow - 1, y - L, 1, oh, roofD);
      lpx(x, y - L + (oh >> 1), ow, 1, OUT); lpx(x, y - L + (oh >> 1) - 1, ow, 1, 'rgba(255,255,255,0.25)');   // cumbrera
      if (s === 'house' || s === 'cabin') { lpx(x + ow - 9, y - L + 2, 4, 6, OUT); lpx(x + ow - 8, y - L + 3, 2, 4, '#8a3a2a'); }   // chimenea
      if (id === 'glaciar') for (let i = 0; i < ow; i += 4) lpx(x + i, y - L + oh - 1, 2, 2, '#ffffff');
      if (s === 'demonio-keep') {
        for (let i = 3; i < ow - 3; i += 7) { lpx(x + i, y - L - 3, 2, 4, OUT); lpx(x + i, y - L - 4, 1, 1, '#ff6a1c'); }
        for (const side of [-1, 1]) for (let k2 = 0; k2 < 12; k2++) lpx(x + (side < 0 ? -2 - k2 / 2 : ow + 1 + k2 / 2), y - L - k2, 2, 2, k2 > 9 ? '#e8dcc0' : '#4a3a3a');   // cuernos
        lpx(x + (ow >> 1) - 3, y + oh - 8, 6, 8, '#ff6a1c');   // puerta incandescente
      }
      if (s === 'reino-keep' || s === 'hielo-keep') { lpx(x + (ow >> 1) - 4, y + oh - 8, 8, 8, OUT); lpx(x + (ow >> 1) - 3, y + oh - 7, 6, 7, '#6a4a2a'); }
    } else if (k === 'w') {
      if (s === 'fence') {
        const horiz = ow > oh;
        for (let i = 0; i < (horiz ? ow : oh); i += 4) horiz ? (lpx(x + i, y - 4, 1, 6, OUT), lpx(x + i, y - 3, 1, 4, '#8a5a30')) : (lpx(x, y + i - 2, 2, 3, '#8a5a30'));
        horiz ? (lpx(x, y - 2, ow, 1, '#6a4224'), lpx(x, y, ow, 1, '#6a4224')) : lpx(x + 1, y, 1, oh, '#6a4224');
        return;
      }
      const wf = s === 'hielo' ? '#a8c8e8' : s === 'demonio' ? '#2a1e20' : T.wallF, ws = s === 'hielo' ? '#6a9ad0' : s === 'demonio' ? '#140c0e' : T.wallS;
      lpx(x - 1, y - 5, ow + 2, oh + 6, OUT);
      lpx(x, y - 4, ow, oh + 4, wf);
      for (let ry = 0; ry < oh + 4; ry += 3) { lpx(x, y - 4 + ry, ow, 1, ws); for (let rx = ((ry / 3) % 2 ? 3 : 0); rx < ow; rx += 6) lpx(x + rx, y - 4 + ry, 1, 3, ws); }
      // almenas
      if (ow > oh) for (let i = 0; i < ow; i += 4) lpx(x + i, y - 6, 2, 2, i % 8 ? wf : OUT);
      else for (let i = 0; i < oh; i += 4) lpx(x - 1, y - 4 + i, 1, 2, wf);
      if (s === 'demonio') for (let i = 2; i < ow; i += 6) lpx(x + i, y - 8, 1, 3, '#ff6a1c');
      if (s === 'hielo') lpx(x, y - 4, ow, 1, '#ffffff');
    } else if (k === 'p') {
      const cx = x + (ow >> 1), cy = y + (oh >> 1), rad = ow >> 1;
      if (s === 'reino' || s === 'windmill') {
        disc(cx, cy, rad + 1, OUT); disc(cx, cy, rad, T.wallF); disc(cx, cy, rad - 2, T.wallS);
        if (s === 'reino') {   // tejado cónico azul y bandera
          for (let r2 = rad; r2 > 0; r2--) disc(cx, cy - (rad - r2) * 1.1 - 2, r2, r2 % 3 ? T.roof : T.roofD);
          lpx(cx, cy - rad * 1.1 - 10, 1, 8, OUT); lpx(cx + 1, cy - rad * 1.1 - 10, 5, 3, '#3a5ab0');
        } else { disc(cx, cy - 2, rad - 3, '#a8323a'); }
      } else if (s === 'hielo' || s === 'crystal') {
        crystal(cx, y + oh, Math.max(3, rad), Math.round(oh * (s === 'hielo' ? 2.2 : 1.4)));
        if (s === 'hielo') { crystal(cx - rad + 2, y + oh, Math.max(2, rad >> 1), Math.round(oh * 1.4)); crystal(cx + rad - 2, y + oh, Math.max(2, rad >> 1), Math.round(oh * 1.5)); }
      } else if (s === 'demonio' || s === 'demontower') {
        disc(cx, cy, rad + 1, OUT); disc(cx, cy, rad, '#2a1e20'); disc(cx, cy - 2, rad - 2, '#3a1414');
        for (let k2 = 0; k2 < rad; k2++) lpx(cx - (rad - k2) / 2, cy - rad - k2, rad - k2, 1, k2 % 2 ? '#2a0c0c' : '#3a1414');   // aguja
        lpx(cx - 2, cy - 2, 4, 6, '#ff6a1c'); lpx(cx - 1, cy - 1, 2, 3, '#ffd24a');   // ventana encendida
        if (s === 'demontower') { lpx(cx + rad - 2, cy - rad - 6, 1, 12, OUT); lpx(cx + rad - 1, cy - rad - 6, 6, 8, '#8a1a1a'); lpx(cx + rad, cy - rad - 4, 3, 3, '#ff4655'); }
      } else if (s === 'spike') {
        for (let j = 0; j < oh + 8; j++) { const hw = Math.max(0, Math.round((ow / 2) * (1 - j / (oh + 8)))); lpx(cx - hw - 1, y + oh - j, hw * 2 + 3, 1, OUT); lpx(cx - hw, y + oh - j, hw, 1, T.rockL); lpx(cx, y + oh - j, hw + 1, 1, T.rockD); }
        lpx(cx, y - 7, 1, 2, '#ff6a1c');
      } else if (s === 'ruin') {
        lpx(x - 1, y - 7, ow + 2, oh + 8, OUT); lpx(x, y - 6, ow, oh + 6, T.stone); lpx(x, y - 6, ow, 2, '#e0d8c8'); lpx(x + ow - 3, y - 6, 3, oh + 6, T.stoneD);
        lpx(x + 2, y - 7, 3, 2, T.stone); lpx(x + 1, y + 2, 2, 3, T.leaf);   // musgo
      } else if (s === 'skullgate') {
        lpx(x - 1, y - 12, ow + 2, oh + 13, OUT); lpx(x, y - 11, ow, oh + 11, '#2a1e20'); lpx(x + 2, y - 11, ow - 4, 3, '#3a2a2a');
        ell(cx, y - 4, 5, 4, '#e8dcc0'); lpx(cx - 3, y - 5, 2, 2, OUT); lpx(cx + 1, y - 5, 2, 2, OUT);
      } else {
        lpx(x - 1, y - 4, ow + 2, oh + 5, OUT);
        lpx(x, y - 3, ow, oh + 3, T.stone); lpx(x, y - 3, ow, 2, 'rgba(255,255,255,0.35)'); lpx(x + ow - 2, y - 3, 2, oh + 3, 'rgba(0,0,0,0.25)');
        lpx(cx - 1, y - 3 + (oh >> 1), 2, 2, T.trim);
      }
    } else if (k === 'a') {
      tree(x + (ow >> 1), y + oh - 2, ow >> 1);
    } else if (k === 'o') {
      // roca gris (como en la referencia)
      const cx = x + (ow >> 1), cy = y + (oh >> 1);
      ell(cx + 1, cy + 3, (ow >> 1) + 1, 2, 'rgba(0,0,0,0.3)');
      ell(cx, cy, (ow >> 1) + 1, (oh >> 1), OUT); ell(cx, cy, ow >> 1, (oh >> 1) - 1, '#8a8a96'); ell(cx - 1, cy - 1, (ow >> 1) - 2, (oh >> 1) - 3, '#a8a8b4');
      lpx(cx - 2, cy - 2, 3, 1, '#d0d0dc'); lpx(cx + 1, cy, 3, 1, '#5a5a66');
    } else if (k === 'r' && s === 'volcano') {
      // volcán: cono de roca con lava en la cima y regueros
      const cx = x + (ow >> 1), cy = y + (oh >> 1), rx2 = ow >> 1, ry2 = oh >> 1;
      for (let r2 = 0; r2 < 12; r2++) ell(cx, cy - r2 * 1.5, rx2 - r2 * (rx2 / 14), ry2 - r2 * (ry2 / 14), r2 % 2 ? T.rock : T.rockL);
      ell(cx, cy - 18, 9, 6, OUT); ell(cx, cy - 18, 8, 5, '#ff6a1c'); ell(cx, cy - 18, 5, 3, '#ffd24a');
      for (const dx of [-6, 2, 7]) for (let k2 = 0; k2 < 22; k2++) lpx(cx + dx + Math.round(Math.sin(k2 * 0.5) * 2), cy - 14 + k2, 2, 1, k2 % 4 ? '#ff6a1c' : '#ffd24a');
    } else if (k === 'c') {
      lpx(x - 1, y - 3, ow + 2, oh + 4, OUT);
      lpx(x, y - 2, ow, oh, T.crate);
      lpx(x, y - 2, ow, 1, T.crateD); lpx(x, y - 2 + oh - 1, ow, 1, T.crateD); lpx(x, y - 2, 1, oh, T.crateD); lpx(x + ow - 1, y - 2, 1, oh, T.crateD);
      for (let i = 1; i < Math.min(ow, oh) - 1; i++) { lpx(x + i, y - 2 + i, 1, 1, T.crateD); lpx(x + ow - 1 - i, y - 2 + i, 1, 1, T.crateD); }
      lpx(x, y - 2 + oh, ow, 2, T.crateD);
      if (id === 'glaciar') lpx(x, y - 2, ow, 2, '#ffffff');
    } else if (k === 't') {
      const bx = x + (ow >> 1), by = y + (oh >> 1);
      disc(bx, by - 1, (ow >> 1) + 1, OUT); disc(bx, by - 1, ow >> 1, '#7a5230'); lpx(bx - (ow >> 1), by - 3, ow, 1, '#4a3018'); lpx(bx - (ow >> 1), by + 1, ow, 1, '#4a3018'); lpx(bx - 2, by - (oh >> 1), 2, 2, 'rgba(255,255,255,0.35)');
    }
  }

  /** Árbol: copa redonda (Reino, Ciudad), pino nevado (Glaciar) o árbol seco (Infierno). (cx, by) = base. */
  function tree(cx: number, by: number, rad: number) {
    ell(cx + 1, by + 1, rad, 2, 'rgba(0,0,0,0.3)');
    if (id === 'glaciar') {
      lpx(cx - 1, by - 3, 2, 4, T.trunk);
      for (let k2 = 0; k2 < 4; k2++) { const w = rad + 1 - k2 * 2, yy = by - 4 - k2 * 4; lpx(cx - w - 1, yy - 4, w * 2 + 3, 6, OUT); lpx(cx - w, yy - 3, w * 2 + 1, 4, T.leaf); lpx(cx - w, yy - 3, w * 2 + 1, 1, T.leafL); lpx(cx, yy - 3, w + 1, 3, T.leafD); }
      lpx(cx - 1, by - 22, 3, 3, T.leafL);
    } else if (id === 'infierno') {
      // árbol seco y retorcido
      lpx(cx - 1, by - rad * 2, 3, rad * 2, OUT); lpx(cx, by - rad * 2 + 1, 1, rad * 2 - 1, T.bladeL);
      for (const [dx, dy, len] of [[-1, -1.6, 4], [1, -1.3, 5], [-1, -0.9, 3], [1, -2, 3]] as number[][]) {
        const sy = by + dy * rad;
        for (let k2 = 0; k2 < len; k2++) { lpx(cx + dx * (k2 + 1) - (dx < 0 ? 0 : 0), sy - k2, 1, 1, OUT); }
      }
      lpx(cx - 3, by - rad * 2 - 2, 1, 3, OUT); lpx(cx + 3, by - rad * 2 - 1, 1, 3, OUT);
    } else {
      lpx(cx - 1, by - 4, 3, 5, T.trunk);
      const top = by - rad - 3;
      disc(cx, top, rad + 1, OUT); disc(cx, top, rad, T.leafD); disc(cx - 1, top - 1, rad - 2, T.leaf); disc(cx - 2, top - 3, Math.max(1, rad - 6), T.leafL);
      if (id === 'reino' && rad > 5 && (cx + by) % 3 === 0) { lpx(cx + 2, top + 1, 1, 1, '#ff4655'); lpx(cx - 3, top + 2, 1, 1, '#ff4655'); }   // manzanas
    }
  }
}
