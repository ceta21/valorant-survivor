// Armas pixel-art ORIGINALES (silueta reconocible por tipo: pistola, rifle, francotirador, escopeta...).
import { Grid } from './sprites';
import { WEAPONS } from '../data/weapons';
import { WEAPON_SKIN_BY_ID } from '../data/shop';

type Part = [number, number, number, number, 'M' | 'D' | 'A' | 'W' | 'L'];
const PARTS: Record<string, { w: number; h: number; p: Part[] }> = {
  classic: { w: 14, h: 9, p: [[3, 1, 9, 2, 'M'], [3, 1, 9, 1, 'L'], [3, 3, 6, 1, 'D'], [12, 1, 1, 2, 'D'], [3, 4, 3, 4, 'W'], [6, 4, 2, 1, 'D'], [8, 2, 2, 1, 'A']] },
  vandal: { w: 30, h: 10, p: [[0, 3, 5, 3, 'W'], [5, 2, 10, 3, 'D'], [5, 2, 10, 1, 'L'], [15, 3, 8, 2, 'W'], [23, 3, 7, 1, 'M'], [28, 2, 1, 1, 'D'], [10, 5, 3, 4, 'M'], [12, 8, 2, 1, 'M'], [6, 5, 2, 3, 'W'], [7, 3, 6, 1, 'A'], [8, 1, 2, 1, 'D']] },
  phantom: { w: 28, h: 10, p: [[0, 3, 4, 3, 'D'], [4, 2, 9, 3, 'D'], [4, 2, 9, 1, 'L'], [5, 3, 6, 1, 'A'], [13, 2, 11, 3, 'M'], [13, 3, 11, 1, 'D'], [9, 5, 3, 4, 'M'], [5, 5, 2, 3, 'D'], [7, 1, 3, 1, 'D']] },
  spectre: { w: 20, h: 11, p: [[0, 3, 2, 2, 'D'], [2, 2, 10, 3, 'D'], [2, 2, 10, 1, 'L'], [3, 3, 6, 1, 'A'], [12, 3, 5, 1, 'M'], [17, 3, 1, 1, 'D'], [7, 5, 2, 5, 'M'], [3, 5, 2, 3, 'D'], [4, 1, 2, 1, 'D']] },
  operator: { w: 34, h: 10, p: [[0, 3, 6, 3, 'W'], [6, 3, 10, 3, 'D'], [6, 3, 10, 1, 'L'], [8, 4, 6, 1, 'A'], [16, 3, 17, 2, 'M'], [33, 3, 1, 2, 'D'], [10, 0, 10, 2, 'D'], [19, 0, 1, 2, 'A'], [11, 2, 2, 1, 'D'], [12, 6, 2, 2, 'M'], [7, 6, 2, 3, 'W']] },
  sheriff: { w: 17, h: 10, p: [[5, 1, 10, 2, 'M'], [5, 1, 10, 1, 'L'], [3, 1, 3, 3, 'D'], [4, 2, 1, 1, 'A'], [3, 3, 5, 1, 'D'], [2, 3, 3, 5, 'W'], [6, 4, 2, 1, 'D'], [15, 0, 1, 1, 'D']] },
  judge: { w: 30, h: 10, p: [[0, 3, 5, 3, 'W'], [5, 2, 6, 3, 'D'], [5, 2, 6, 1, 'L'], [6, 3, 4, 1, 'A'], [11, 2, 15, 2, 'M'], [26, 2, 1, 2, 'D'], [11, 4, 15, 1, 'D'], [14, 4, 6, 2, 'W'], [6, 5, 2, 3, 'W']] },
  odin: { w: 28, h: 12, p: [[0, 3, 4, 3, 'D'], [4, 2, 10, 4, 'D'], [4, 2, 10, 1, 'L'], [5, 3, 7, 1, 'A'], [14, 3, 10, 2, 'M'], [14, 2, 6, 1, 'D'], [8, 6, 6, 4, 'M'], [9, 7, 4, 1, 'A'], [6, 0, 6, 2, 'D'], [4, 6, 2, 3, 'D'], [22, 5, 1, 4, 'D']] },
};
const COL = { M: '#8793a3', D: '#3b4452', W: '#7a5230', L: '#c7d0dc' } as const;

/** Silueta del arma: las exclusivas usan la de su arma base. */
const partsOf = (id: string) => PARTS[id] ?? PARTS[WEAPONS[id]?.sprite ?? ''] ?? PARTS.classic;
export function gunSize(id: string) { const d = partsOf(id); return { w: d.w, h: d.h }; }

/** `skin`: estilo de arma de la tienda (cambia los colores; la silueta es la del arma). */
export function buildGun(id: string, accent: string, skin = ''): Grid {
  const st = WEAPON_SKIN_BY_ID[skin]?.colors;
  const d = partsOf(id), col = { ...COL, ...(WEAPONS[id]?.skin ?? {}), ...(st ?? {}) };
  if (st) accent = st.A;
  const g: Grid = Array.from({ length: d.h }, () => Array<string | null>(d.w).fill(null));
  for (const [x, y, w, h, k] of d.p) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (g[y + j] && x + i < d.w) g[y + j][x + i] = k === 'A' ? accent : col[k];
  const out: Grid = g.map(r => r.slice());
  for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) {
    if (g[y][x]) continue;
    if (g[y - 1]?.[x] || g[y + 1]?.[x] || g[y]?.[x - 1] || g[y]?.[x + 1]) out[y][x] = '#10151c';
  }
  return out;
}

export function gunRuns(id: string, accent: string, skin = '') {
  const g = buildGun(id, accent, skin), runs: { x: number; y: number; w: number; c: string }[] = [];
  for (let y = 0; y < g.length; y++) {
    let x = 0;
    while (x < g[y].length) {
      const c = g[y][x];
      if (!c) { x++; continue; }
      let w = 1;
      while (x + w < g[y].length && g[y][x + w] === c) w++;
      runs.push({ x, y, w, c });
      x += w;
    }
  }
  return runs;
}

const cache = new Map<string, any>();
export function gunCanvas(id: string, accent: string, make: (w: number, h: number) => any, scale = 3, skin = '') {
  const key = `${id}@${scale}|${skin}`;
  let c = cache.get(key);
  if (c) return c;
  const grid = buildGun(id, accent, skin);
  c = make(grid[0].length * scale, grid.length * scale);
  const g = c.getContext('2d');
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y].length; x++) {
    const col = grid[y][x];
    if (col) { g.fillStyle = col; g.fillRect(x * scale, y * scale, scale, scale); }
  }
  cache.set(key, c);
  return c;
}
