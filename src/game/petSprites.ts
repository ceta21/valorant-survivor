// Mascotas pixel-art ORIGINALES: un mismo cuerpo redondito con los colores de cada una y el detalle de su
// elemento (llama, aletas y burbuja, antenas eléctricas, brote y orejas, cresta de hielo).
import { Grid } from './sprites';
import { PET_BY_ID, PetDef } from '../data/shop';

export const PW = 16, PH = 15;
// b = cuerpo oscuro, B = cuerpo, y = tripa, c = mejillas, w/k = ojos, m = boca, X/Z = detalle del elemento
const BODY = [
  '................',
  '................',
  '................',
  '.....bbbbbb.....',
  '...bbBBBBBBbb...',
  '..bBBBBBBBBBBb..',
  '..bBBwkBBwkBBb..',
  '.bBBBkkBBkkBBBb.',
  '.bBccBBmmBBccBb.',
  '.bBBBByyyyBBBBb.',
  '..bBByyyyyyBBb..',
  '..bBByyyyyyBBb..',
  '...bbBBBBBBbb...',
  '....BB....BB....',
  '................',
];
type Dot = [number, number, string];
const CREST: Record<PetDef['element'], Dot[]> = {
  fuego: [[7, 0, 'Z'], [6, 1, 'Z'], [7, 1, 'X'], [8, 1, 'Z'], [6, 2, 'Z'], [7, 2, 'X'], [8, 2, 'X'], [9, 2, 'Z'],
    [14, 9, 'Z'], [15, 8, 'Z'], [15, 9, 'X'], [14, 10, 'X']],
  agua: [[2, 3, 'X'], [1, 4, 'X'], [2, 4, 'X'], [1, 5, 'X'], [13, 3, 'X'], [13, 4, 'X'], [14, 4, 'X'], [14, 5, 'X'],
    [13, 0, 'Z'], [12, 1, 'Z'], [14, 1, 'Z'], [13, 2, 'Z']],
  rayo: [[5, 2, 'b'], [4, 1, 'b'], [4, 0, 'X'], [10, 2, 'b'], [11, 1, 'b'], [11, 0, 'X'],
    [14, 9, 'X'], [15, 8, 'X'], [15, 9, 'Z'], [14, 10, 'X']],
  planta: [[4, 0, 'B'], [4, 1, 'B'], [4, 2, 'B'], [11, 0, 'B'], [11, 1, 'B'], [11, 2, 'B'],
    [7, 2, 'X'], [7, 1, 'X'], [6, 0, 'Z'], [8, 0, 'Z'], [6, 1, 'Z'], [8, 1, 'Z']],
  hielo: [[6, 2, 'X'], [7, 1, 'X'], [7, 2, 'Z'], [8, 0, 'X'], [8, 1, 'Z'], [9, 2, 'X'], [3, 3, 'b'], [2, 2, 'b'], [12, 3, 'b'], [13, 2, 'b']],
};

/** frame 0 = de pie; 1 = saltito (el cuerpo sube y recoge las patas). */
export function buildPet(id: string, frame = 0): Grid {
  const p = PET_BY_ID[id] ?? PET_BY_ID.pet_brasin, c = p.colors;
  const pal: Record<string, string> = { b: c.dark, B: c.body, y: c.belly, c: c.cheek, w: '#ffffff', k: '#10151c', m: '#5a1a1a', X: c.fx, Z: c.fx2 };
  const g: Grid = Array.from({ length: PH }, () => Array<string | null>(PW).fill(null));
  const up = frame === 1 ? 1 : 0;
  BODY.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.' || (up && y === 13)) return;
    const yy = y - up;
    if (yy >= 0) g[yy][x] = pal[ch];
  }));
  for (const [x, y, ch] of CREST[p.element]) if (y - up >= 0) g[y - up][x] = pal[ch];
  // contorno
  const out: Grid = g.map(r => r.slice());
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    if (g[y][x]) continue;
    if (g[y - 1]?.[x] || g[y + 1]?.[x] || g[y]?.[x - 1] || g[y]?.[x + 1]) out[y][x] = '#10151c';
  }
  return out;
}

const cache = new Map<string, any>();
export function petCanvas(id: string, frame: number, make: (w: number, h: number) => any, scale = 3) {
  const key = `${id}|${frame}|${scale}`;
  let cv = cache.get(key);
  if (cv) return cv;
  const grid = buildPet(id, frame);
  cv = make(PW * scale, PH * scale);
  const g = cv.getContext('2d');
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const col = grid[y][x];
    if (col) { g.fillStyle = col; g.fillRect(x * scale, y * scale, scale, scale); }
  }
  cache.set(key, cv);
  return cv;
}

/** Runs del dibujo (para pintarlo como SVG en la tienda). */
export function petRuns(id: string) {
  const g = buildPet(id), runs: { x: number; y: number; w: number; c: string }[] = [];
  for (let y = 0; y < PH; y++) {
    let x = 0;
    while (x < PW) {
      const c = g[y][x];
      if (!c) { x++; continue; }
      let w = 1;
      while (x + w < PW && g[y][x + w] === c) w++;
      runs.push({ x, y, w, c });
      x += w;
    }
  }
  return runs;
}
