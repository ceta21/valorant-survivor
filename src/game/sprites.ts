// Sprites pixel-art "chibi" ORIGINALES, dibujados por código (sin imágenes externas).
export const SW = 22;
export const SH = 26;
export type Grid = (string | null)[][];
type Hair = 'short' | 'pony' | 'long' | 'hood' | 'cap' | 'buns' | 'crest';
interface Look {
  skin: string; hair: string; style: Hair; main: string; sleeve: string; accent: string;
  pants: string; boots: string; extra?: string; eyes?: string; dark?: boolean; acc?: string[];
}
const OUT = '#10151c';

const LOOKS: Record<string, Look> = {
  jett: { skin: '#f3cfb3', hair: '#e8f1f8', style: 'pony', main: '#4f86c6', sleeve: '#e6eef7', accent: '#ffffff', pants: '#2c3e5c', boots: '#e6eef7', acc: ['scarf'] },
  phoenix: { skin: '#a9714a', hair: '#2b1b14', style: 'crest', extra: '#ff7a3d', main: '#ff7a3d', sleeve: '#2a2a33', accent: '#ffd0a8', pants: '#2a2a33', boots: '#17171c' },
  sage: { skin: '#e8c4a0', hair: '#2a2f3a', style: 'long', main: '#2fb8a0', sleeve: '#cfeee7', accent: '#ffffff', pants: '#1f6f66', boots: '#1a3f3b', acc: ['halo'] },
  reyna: { skin: '#c98d6a', hair: '#3a1747', style: 'long', main: '#7a2a9a', sleeve: '#2a1236', accent: '#d946ef', pants: '#1d0f26', boots: '#120a18', eyes: '#ff5cff' },
  raze: { skin: '#b8825a', hair: '#3b2418', style: 'buns', main: '#ffb02e', sleeve: '#4a3a1c', accent: '#ffffff', pants: '#3a3a44', boots: '#222228', acc: ['goggles'] },
  sova: { skin: '#f0cfb0', hair: '#6b4a2a', style: 'cap', extra: '#3a5fbf', main: '#5c7aa8', sleeve: '#40536e', accent: '#c9d8ff', pants: '#2e3a4c', boots: '#1b2230', acc: ['beard'] },
  neon: { skin: '#c88a62', hair: '#2fe6ff', style: 'pony', main: '#2a3f66', sleeve: '#2fe6ff', accent: '#fff04a', pants: '#1c2a46', boots: '#2fe6ff', acc: ['bolt'] },
  omen: { skin: '#1b1f2e', hair: '#2b2f6a', style: 'hood', main: '#2b2f6a', sleeve: '#1a1d44', accent: '#6b7cff', pants: '#141733', boots: '#0c0e22', dark: true, eyes: '#ffffff' },
  killjoy: { skin: '#f3d3b6', hair: '#f0d26a', style: 'short', main: '#ffe14a', sleeve: '#2f3440', accent: '#ffffff', pants: '#2f3440', boots: '#1a1d24', acc: ['headphones', 'glasses'] },
  brimstone: { skin: '#d9a98a', hair: '#cfcfcf', style: 'cap', extra: '#8a6a3a', main: '#8a6a3a', sleeve: '#5a4a30', accent: '#d9a066', pants: '#4a4a3a', boots: '#2a2a22', acc: ['beard'] },
};

export function buildSprite(id: string): Grid {
  const L = LOOKS[id] ?? LOOKS.jett;
  const g: Grid = Array.from({ length: SH }, () => Array<string | null>(SW).fill(null));
  const px = (x: number, y: number, c: string | null) => { if (x >= 0 && x < SW && y >= 0 && y < SH) g[y][x] = c; };
  const rect = (x: number, y: number, w: number, h: number, c: string | null) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };

  // piernas y botas
  rect(8, 20, 2, 3, L.pants); rect(12, 20, 2, 3, L.pants);
  rect(7, 23, 3, 2, L.boots); rect(12, 23, 3, 2, L.boots);
  // brazos, manos, torso, cinturón
  rect(5, 14, 2, 5, L.sleeve); rect(15, 14, 2, 5, L.sleeve);
  rect(5, 19, 2, 2, L.dark ? L.sleeve : L.skin); rect(15, 19, 2, 2, L.dark ? L.sleeve : L.skin);
  rect(7, 13, 8, 7, L.main);
  rect(7, 18, 8, 1, L.accent);
  rect(9, 12, 4, 1, L.dark ? L.hair : L.skin);
  // capucha (detrás de la cara) o cabeza
  if (L.style === 'hood') {
    rect(5, 2, 12, 11, L.hair);
    rect(7, 5, 8, 7, L.skin);
  } else {
    rect(6, 3, 10, 9, L.skin);
  }
  // pelo
  switch (L.style) {
    case 'short': rect(6, 2, 10, 3, L.hair); rect(6, 5, 1, 2, L.hair); rect(15, 5, 1, 2, L.hair); break;
    case 'pony': rect(6, 2, 10, 3, L.hair); rect(6, 5, 1, 2, L.hair); rect(15, 5, 1, 2, L.hair); rect(16, 3, 2, 6, L.hair); rect(17, 9, 1, 3, L.hair); break;
    case 'long': rect(6, 2, 10, 3, L.hair); rect(5, 4, 2, 9, L.hair); rect(15, 4, 2, 9, L.hair); break;
    case 'buns': rect(6, 2, 10, 3, L.hair); rect(6, 5, 1, 2, L.hair); rect(15, 5, 1, 2, L.hair); rect(5, 1, 2, 2, L.hair); rect(15, 1, 2, 2, L.hair); break;
    case 'crest': rect(6, 2, 10, 3, L.hair); rect(6, 5, 1, 2, L.hair); rect(15, 5, 1, 2, L.hair); rect(8, 0, 6, 3, L.extra ?? L.hair); break;
    case 'cap': rect(6, 2, 10, 3, L.extra ?? L.hair); rect(5, 5, 12, 1, L.extra ?? L.hair); rect(6, 6, 1, 2, L.hair); rect(15, 6, 1, 2, L.hair); break;
    default: break;
  }
  // cara
  const eye = L.eyes ?? '#1a1f2b';
  rect(8, 7, 1, 2, eye); rect(13, 7, 1, 2, eye);
  if (!L.dark) { px(7, 9, '#ff9a9a'); px(14, 9, '#ff9a9a'); px(10, 10, '#7a3b3b'); px(11, 10, '#7a3b3b'); }
  // accesorios
  for (const a of L.acc ?? []) {
    if (a === 'goggles') { rect(6, 4, 10, 1, '#2a2a2a'); rect(7, 3, 3, 2, '#ffd37a'); rect(12, 3, 3, 2, '#ffd37a'); }
    if (a === 'headphones') { rect(5, 5, 1, 5, '#222a33'); rect(16, 5, 1, 5, '#222a33'); rect(6, 2, 10, 1, '#333d4a'); rect(4, 6, 1, 3, '#ffe14a'); rect(17, 6, 1, 3, '#ffe14a'); }
    if (a === 'glasses') { rect(7, 6, 3, 1, '#222'); rect(12, 6, 3, 1, '#222'); rect(10, 7, 2, 1, '#222'); }
    if (a === 'beard') { rect(6, 10, 10, 2, L.hair); px(10, 10, '#d9a98f'); px(11, 10, '#d9a98f'); }
    if (a === 'scarf') rect(7, 12, 8, 2, '#f2f6fa');
    if (a === 'bolt') for (const [x, y] of [[12, 14], [11, 15], [12, 15], [10, 16], [11, 16], [11, 17]]) px(x, y, L.accent);
    if (a === 'halo') rect(8, 0, 6, 1, '#ffe9a0');
  }
  // contorno automático
  const out: Grid = g.map(r => r.slice());
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    if (g[y][x]) continue;
    if (g[y - 1]?.[x] || g[y + 1]?.[x] || g[y]?.[x - 1] || g[y]?.[x + 1]) out[y][x] = OUT;
  }
  return out;
}

/** Runs horizontales del mismo color (para dibujar SVG con pocos nodos). */
export function spriteRuns(id: string): { x: number; y: number; w: number; c: string }[] {
  const g = buildSprite(id), runs: { x: number; y: number; w: number; c: string }[] = [];
  for (let y = 0; y < SH; y++) {
    let x = 0;
    while (x < SW) {
      const c = g[y][x];
      if (!c) { x++; continue; }
      let w = 1;
      while (x + w < SW && g[y][x + w] === c) w++;
      runs.push({ x, y, w, c });
      x += w;
    }
  }
  return runs;
}

const cache = new Map<string, any>();
/** Sprite ya pintado en un canvas (escala entera, sin suavizado). */
export function spriteCanvas(id: string, make: (w: number, h: number) => any, scale = 3) {
  const key = `${id}@${scale}`;
  let c = cache.get(key);
  if (c) return c;
  c = make(SW * scale, SH * scale);
  const g = c.getContext('2d');
  const grid = buildSprite(id);
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const col = grid[y][x];
    if (col) { g.fillStyle = col; g.fillRect(x * scale, y * scale, scale, scale); }
  }
  cache.set(key, c);
  return c;
}
