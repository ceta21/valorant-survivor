// Robots enemigos en pixel-art ORIGINALES (bots de entrenamiento, drones de ruedas, bots-cápsula…),
// dibujados por código con contorno automático. Cada uno tiene 2 fotogramas de animación y
// variantes "golpe" (blanco) y "aturdido" (gris).
import { Grid } from './sprites';

type Make = (w: number, h: number) => any;
type Variant = 'n' | 'hit' | 'stun';
const OUT = '#10151c';

interface Pal { L: string; M: string; D: string; X: string; glow: string; acc: string }
const STEEL: Pal = { L: '#d6dce3', M: '#9aa5b3', D: '#5d6875', X: '#2c333d', glow: '#2fe6ff', acc: '#2fe6ff' };

/** Paletas por enemigo (acc = color propio del tipo). */
const PALS: Record<string, Pal> = {
  grunt: STEEL,
  runner: { ...STEEL, L: '#c9d1d9', acc: '#ffb347' },
  tank: { L: '#b9a7a4', M: '#8a6d6a', D: '#523c3b', X: '#2a1e1e', glow: '#ff4655', acc: '#ff4655' },
  shooter: { L: '#efe9df', M: '#c9c2b6', D: '#5d5a55', X: '#33302c', glow: '#bfeaff', acc: '#ff7a3d' },
  exploder: { L: '#6e6e7a', M: '#4a4a55', D: '#2e2e36', X: '#1a1a1f', glow: '#ffd24a', acc: '#ff5a36' },
  elite: { L: '#c99cf0', M: '#8a4fc4', D: '#4a2470', X: '#24103a', glow: '#ff4655', acc: '#d946ef' },
  boss: { L: '#b8c0cc', M: '#6f7d92', D: '#3b4452', X: '#1e252e', glow: '#ff4655', acc: '#ff4655' },
};

/** Tamaño de la rejilla de cada robot (incluye 1 píxel de margen para el contorno). */
const SIZE: Record<string, [number, number]> = {
  grunt: [14, 22], runner: [18, 13], tank: [20, 28], shooter: [16, 22], exploder: [13, 11], elite: [16, 26], boss: [26, 31],
};
const BOSSES = ['boss1', 'boss2', 'boss3', 'final'];
/** Tipo de dibujo: cada jefe es su propio tipo (comparten cuerpo y cambian los detalles). */
export const enemyKind = (id: string) => (id in SIZE || BOSSES.includes(id) ? id : 'grunt');
const baseOf = (kind: string) => (BOSSES.includes(kind) ? 'boss' : kind);

function draw(kind: string, frame: number, P: Pal, core: string): Grid {
  const [W, H] = SIZE[baseOf(kind)];
  const g: Grid = Array.from({ length: H }, () => Array<string | null>(W).fill(null));
  const px = (x: number, y: number, c: string | null) => { x += 1; y += 1; if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
  const rect = (x: number, y: number, w: number, h: number, c: string | null) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
  const f = frame % 2; // 0 / 1: pierna o rueda alternada

  switch (baseOf(kind)) {
    case 'grunt': { // bot de entrenamiento: cabeza-cápsula con visor, cuerpo segmentado
      rect(4, 0, 4, 1, P.L); rect(3, 1, 6, 4, P.L); rect(3, 4, 6, 1, P.M);
      rect(4, 2, 4, 1, P.X); px(6, 2, P.glow);
      rect(5, 5, 2, 1, P.D);
      rect(2, 6, 8, 5, P.M); rect(3, 6, 6, 3, P.L); rect(5, 7, 2, 1, core);
      rect(0, 6, 2, 5, P.M); rect(10, 6, 2, 5, P.M); px(0, 8, P.D); px(11, 8, P.D);
      rect(0, 11 + f, 2, 1, P.D); rect(10, 12 - f, 2, 1, P.D);
      rect(4, 11, 4, 1, P.D); rect(3, 12, 6, 2, P.M);
      rect(3, 14, 2, 5 - f, P.L); px(3, 16, P.D); rect(2, 19 - f, 3, 1, P.X);
      rect(7, 14, 2, 4 + f, P.L); px(8, 16, P.D); rect(7, 18 + f, 3, 1, P.X);
      break;
    }
    case 'runner': { // dron de 4 patas con ruedas y un gran ojo
      rect(5, 0, 6, 1, P.L); rect(4, 1, 8, 5, P.L); rect(2, 2, 2, 3, P.M); rect(12, 2, 2, 3, P.M);
      rect(6, 1, 4, 4, P.X); rect(7, 2, 2, 2, P.glow); px(7, 2, '#ffffff');
      px(4, 3, P.acc); px(11, 3, P.acc);
      rect(5, 6, 6, 2, P.D);
      rect(1, 6, 4, 2, P.M); rect(11, 6, 4, 2, P.M); rect(1, 8, 2, 1, P.M); rect(13, 8, 2, 1, P.M);
      rect(0, 9, 3, 3, P.X); px(1 - f, 10, P.M); rect(13, 9, 3, 3, P.X); px(14 + f, 10, P.M);
      rect(5, 9, 2, 2, P.X); rect(9, 9, 2, 2, P.X); px(5 + f, 9, P.D); px(10 - f, 9, P.D);
      break;
    }
    case 'tank': { // bot blindado pesado con núcleo rojo
      rect(6, 0, 6, 5, P.M); rect(7, 1, 4, 1, P.L); rect(7, 3, 4, 1, P.glow);
      rect(1, 5, 16, 3, P.D); rect(2, 5, 4, 1, P.M); rect(12, 5, 4, 1, P.M);
      rect(3, 8, 12, 8, P.M); rect(5, 9, 8, 5, P.L); rect(8, 10, 2, 2, core); px(8, 10, '#ffffff');
      rect(0, 8, 3, 8, P.D); rect(15, 8, 3, 8, P.D); rect(0, 16 + f, 3, 2, P.M); rect(15, 17 - f, 3, 2, P.M);
      rect(5, 16, 8, 2, P.D);
      rect(5, 18, 3, 6 - f, P.M); rect(10, 18, 3, 5 + f, P.M); rect(4, 24 - f, 4, 2, P.X); rect(10, 23 + f, 4, 2, P.X);
      break;
    }
    case 'shooter': { // bot-cápsula con pantalla y cañón
      rect(3, 1, 8, 12, P.L); px(3, 1, null); px(10, 1, null); px(3, 12, null); px(10, 12, null);
      rect(9, 2, 2, 10, P.acc); px(9, 0, P.D); px(9, -1 + 1, P.D);
      rect(4, 2, 4, 9, P.glow); rect(5, 4, 2, 1, '#7ab8ff'); rect(5, 6, 2, 1, '#7ab8ff'); rect(5, 8, 1, 1, '#7ab8ff');
      rect(11, 6, 3, 1, P.D); px(13, 5, P.D);
      rect(1, 11, 3, 3, P.M); px(2, 12, P.X); rect(10, 11, 3, 3, P.M); px(11, 12, P.X);
      rect(3, 14, 1, 3 - f, P.D); rect(10, 14, 1, 2 + f, P.D);
      rect(2, 17 - f, 3, 1, P.X); rect(9, 16 + f, 3, 1, P.X);
      break;
    }
    case 'exploder': { // dron-bomba con luz de aviso
      rect(3, 0, 5, 1, P.M); rect(2, 1, 7, 5, P.M); rect(2, 3, 7, 1, P.acc); rect(3, 1, 5, 1, P.L);
      px(5, 0, core); rect(4, 2, 3, 1, P.X); px(5, 2, P.glow);
      rect(0, 5, 3, 3, P.X); px(1, 6 - f, P.D); rect(8, 5, 3, 3, P.X); px(9, 5 + f, P.D);
      rect(3, 6, 5, 2, P.D);
      break;
    }
    case 'elite': { // bot de élite morado, más alto y con hombreras
      rect(4, 0, 6, 5, P.L); rect(4, 4, 6, 1, P.M); rect(5, 2, 4, 1, P.X); rect(6, 2, 2, 1, P.glow);
      rect(6, 5, 2, 1, P.D);
      rect(1, 6, 12, 2, P.D); rect(3, 8, 8, 6, P.M); rect(4, 8, 6, 4, P.L); rect(6, 9, 2, 2, core);
      rect(0, 6, 2, 7, P.M); rect(12, 6, 2, 7, P.M); rect(0, 13 + f, 2, 2, P.D); rect(12, 14 - f, 2, 2, P.D);
      rect(4, 14, 6, 2, P.D);
      rect(4, 16, 2, 6 - f, P.L); px(4, 18, P.D); rect(3, 22 - f, 3, 2, P.X);
      rect(8, 16, 2, 5 + f, P.L); px(9, 18, P.D); rect(8, 21 + f, 3, 2, P.X);
      break;
    }
    default: { // jefe: gran mecha con visor y núcleo del color del jefe (bajado 3 filas para sus adornos)
      const T = 3;
      const r0 = rect;
      const rect2 = (x: number, y: number, w: number, h: number, c: string | null) => r0(x, y + T, w, h, c);
      if (kind === 'boss1') { rect(11, 0, 2, 3, P.D); px(11, 0, core); px(12, 0, core); }                       // antena
      if (kind === 'boss2') { rect(0, 4, 5, 2, P.D); rect(19, 4, 5, 2, P.D); px(0, 4, core); px(23, 4, core); } // cañones al hombro
      if (kind === 'boss3') { for (const x of [3, 6, 17, 20]) { rect(x, 6 - (x % 2), 1, 3, P.L); } }            // pinchos
      if (kind === 'final') { rect(8, 1, 8, 2, '#ffd24a'); px(8, 0, '#ffd24a'); px(11, 0, '#ffd24a'); px(12, 0, '#ffd24a'); px(15, 0, '#ffd24a'); px(11, 1, core); px(12, 1, core); } // corona
      ((rect) => {
      rect(8, 0, 8, 6, P.M); rect(9, 1, 6, 1, P.L); rect(9, 3, 6, 2, P.X); rect(10, 3, 4, 1, core);
      rect(2, 6, 20, 4, P.D); rect(3, 6, 5, 2, P.M); rect(16, 6, 5, 2, P.M); px(5, 7, core); px(18, 7, core);
      rect(5, 10, 14, 8, P.M); rect(7, 10, 10, 6, P.L); rect(10, 11, 4, 4, P.X); rect(11, 12, 2, 2, core);
      rect(0, 9, 4, 9, P.D); rect(20, 9, 4, 9, P.D); rect(0, 18, 4, 2, P.X); rect(20, 18, 4, 2, P.X); rect(1, 20, 2, 1, core); rect(21, 20, 2, 1, core);
      rect(7, 18, 10, 2, P.D);
      rect(7, 20, 4, 5 - f, P.M); rect(13, 20, 4, 4 + f, P.M); rect(6, 25 - f, 6, 1, P.X); rect(12, 24 + f, 6, 1, P.X);
      })(rect2);
      break;
    }
  }
  // contorno automático
  const out: Grid = g.map(r => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x]) continue;
    if (g[y - 1]?.[x] || g[y + 1]?.[x] || g[y]?.[x - 1] || g[y]?.[x + 1]) out[y][x] = OUT;
  }
  return out;
}

const gray = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16), gg = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const l = Math.round((r * 0.3 + gg * 0.59 + b * 0.11) * 0.8 + 30);
  const h = Math.min(255, l).toString(16).padStart(2, '0');
  return `#${h}${h}${h}`;
};

const cache = new Map<string, any>();
/** Sprite del robot (1 píxel por celda). core = color del núcleo (el del jefe o el del tipo). */
export function enemySprite(kind: string, frame: number, variant: Variant, core: string, make: Make) {
  const key = `${kind}|${frame % 2}|${variant}|${core}`;
  let c = cache.get(key);
  if (c) return c;
  const grid = draw(kind, frame, PALS[baseOf(kind)] ?? STEEL, core);
  c = make(grid[0].length, grid.length);
  const g = c.getContext('2d');
  grid.forEach((row, y) => row.forEach((col, x) => {
    if (!col) return;
    g.fillStyle = variant === 'hit' ? (col === OUT ? '#ffd6da' : '#ffffff') : variant === 'stun' ? gray(col) : col;
    g.fillRect(x, y, 1, 1);
  }));
  cache.set(key, c);
  return c;
}

/** Color del núcleo/visor: el de cada jefe, o el propio del tipo de robot. */
export const enemyCore = (kind: string, defColor: string) => (baseOf(kind) === 'boss' ? defColor : (PALS[kind] ?? STEEL).acc);
export const isBossKind = (kind: string) => baseOf(kind) === 'boss';
