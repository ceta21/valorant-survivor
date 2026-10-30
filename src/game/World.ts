import { MapDef, Rect, Vec } from './types';
import { MAPS } from '../data/maps';

/**
 * Mundo grande y cerrado: 4 islas (Reino, Glaciar, Infierno, Ciudad) en cuadrícula de 2×2 sobre un abismo, unidas
 * por portales. El terreno es orgánico: cada chunk de CS×CS se divide en celdas de CELL unidades cuyo tipo (suelo,
 * camino, agua, lava, hielo, roca, abismo…) sale de ruido determinista, de los caminos que unen los sitios importantes
 * y de los monumentos de cada zona. Misma semilla = mismo mundo; solo se guardan en memoria los chunks cercanos.
 */
export const CS = 640;
export const STREET = 120;   // (compatibilidad) ancho de calle de la Ciudad
export const BS = CS - STREET * 2;
/** Chunks por lado de cada zona, chunks de abismo entre zonas y paso entre el origen de una zona y la siguiente. */
export const ZN = 8, GAP = 1, ZS = ZN + GAP;
/** Chunks del mundo por lado (dos zonas y el abismo de en medio). */
export const WORLD_CHUNKS = ZS + ZN;
/** Lado de una zona en unidades. */
export const ZW = ZN * CS;
/** Celdas de terreno. */
export const CELL = 32, CN = CS / CELL;

/** Tipos de celda. */
export const Cell = { Ground: 0, Path: 1, Water: 2, Lava: 3, Ice: 4, Void: 5, Rock: 6, Sea: 7, Road: 8, Sand: 9, Bridge: 10, Grass: 11 } as const;
/** Celdas que no se pueden pisar. */
export const BLOCKING = new Set<number>([Cell.Void, Cell.Rock, Cell.Sea]);

export type ChunkKind = 'land' | 'void';
export interface Deco { type: 'fountain' | 'windmill' | 'campfire' | 'banner' | 'statue' | 'helipad' | 'brazier' | 'skull' | 'lamp' | 'stall' | 'crystal' | 'billboard'; x: number; y: number; rx: number; ry: number; c?: string }
export interface ChunkData {
  cx: number; cy: number; seed: number; kind: ChunkKind;
  /** Zona a la que pertenece (índice en MAPS) o -1 si es abismo. */
  zone: number;
  /** Tipo de cada celda (CN×CN). */
  cells: Uint8Array;
  obstacles: Rect[];
  deco: Deco[];
  /** (compatibilidad) marca en el suelo. */
  mark?: { x: number; y: number; r: number; label: string };
}
/** Portal: pisarlo te lleva a su pareja en otra zona. */
export interface Portal { x: number; y: number; zone: number; to: number }

export function hash2(a: number, b: number, s: number): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Ruido suave (value noise) en 0..1. */
export function noise(x: number, y: number, s: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** Ruido fractal (3 octavas) en 0..1. */
export function fbm(x: number, y: number, s: number) {
  return (noise(x, y, s) * 0.57 + noise(x * 2.03, y * 2.03, s + 17) * 0.29 + noise(x * 4.1, y * 4.1, s + 41) * 0.14);
}

/** Zona de un chunk (índice en MAPS) o -1 si es abismo entero. */
export function zoneAt(cx: number, cy: number): number {
  if (cx < 0 || cy < 0) return -1;
  const zx = Math.floor(cx / ZS), zy = Math.floor(cy / ZS);
  if (zx > 1 || zy > 1 || cx % ZS >= ZN || cy % ZS >= ZN) return -1;
  return MAPS.findIndex(m => m.zone[0] === zx && m.zone[1] === zy);
}
const zoneOrigin = (z: number): [number, number] => [MAPS[z].zone[0] * ZS * CS, MAPS[z].zone[1] * ZS * CS];
/** Centro de la zona en coordenadas locales (donde se aparece). */
export const SPAWN_LOCAL = 2880;

/** Pieza de un monumento: obstáculo con estilo, o decoración. Coordenadas locales de la zona. */
type Piece = Rect | (Deco & { deco: true });
interface Layout { pieces: Piece[]; reserve: { x: number; y: number; r: number }[]; paths: [number, number][][] }

/* ------------------------------------------------------------------ monumentos de cada zona */
const R = (x: number, y: number, w: number, h: number, k: Rect['k'], s?: string): Rect => ({ x, y, w, h, k, s });
const D = (type: Deco['type'], x: number, y: number, rx = 30, ry = rx, c?: string): Piece => ({ deco: true, type, x, y, rx, ry, c });
/** Castillo: muralla con almenas y puerta abajo, torres en las esquinas y torre del homenaje en el centro. */
function castle(cx: number, cy: number, W: number, H: number, style: string, out: Piece[]) {
  const x0 = cx - W / 2, y0 = cy - H / 2, t = 40, gate = 150;
  out.push(R(x0, y0, W, t, 'w', style), R(x0, y0, t, H, 'w', style), R(x0 + W - t, y0, t, H, 'w', style));
  out.push(R(x0, y0 + H - t, (W - gate) / 2, t, 'w', style), R(x0 + (W + gate) / 2, y0 + H - t, (W - gate) / 2, t, 'w', style));
  for (const [tx, ty] of [[x0 - 30, y0 - 30], [x0 + W - 80, y0 - 30], [x0 - 30, y0 + H - 80], [x0 + W - 80, y0 + H - 80]]) out.push(R(tx, ty, 110, 110, 'p', style));
  for (const gx of [cx - gate / 2 - 70, cx + gate / 2 - 10]) out.push(R(gx, y0 + H - 70, 80, 90, 'p', style));   // torres de la puerta
  out.push(R(cx - 170, cy - 150, 340, 220, 'b', style + '-keep'));
  for (const kx of [cx - 210, cx + 130]) out.push(R(kx, cy - 190, 80, 80, 'p', style));
}
function layoutFor(id: string): Layout {
  const pieces: Piece[] = [], reserve: Layout['reserve'] = [], paths: Layout['paths'] = [];
  const S = SPAWN_LOCAL;
  // plaza central con estatua o fuente
  reserve.push({ x: S, y: S, r: 300 });
  if (id === 'reino') {
    pieces.push(D('fountain', S, S, 110));
    for (const [dx, dy] of [[-200, -200], [200, -200], [-200, 200], [200, 200]]) pieces.push(D('lamp', S + dx, S + dy));
    castle(1250, 1150, 900, 720, 'reino', pieces); reserve.push({ x: 1250, y: 1150, r: 620 });
    for (const [x, y, w, h] of [[3700, 900, 170, 140], [4050, 1050, 150, 130], [3800, 1350, 190, 140], [4250, 1450, 140, 120], [3550, 1650, 150, 130]]) pieces.push(R(x, y, w, h, 'b', 'house'));
    pieces.push(D('stall', 3980, 1250, 30, 22, '#c4262e'), D('stall', 3700, 1180, 30, 22, '#3a5ab0'));
    reserve.push({ x: 3950, y: 1300, r: 520 });
    pieces.push(R(1260, 3860, 80, 80, 'p', 'windmill'), D('windmill', 1300, 3900, 90)); reserve.push({ x: 1300, y: 3900, r: 260 });
    // granja con vallas
    pieces.push(R(1700, 4050, 500, 16, 'w', 'fence'), R(1700, 4050, 16, 330, 'w', 'fence'), R(2184, 4050, 16, 330, 'w', 'fence'), R(1700, 4364, 200, 16, 'w', 'fence'), R(2000, 4364, 200, 16, 'w', 'fence'));
    reserve.push({ x: 1950, y: 4210, r: 320 });
    // ruinas
    for (const [x, y] of [[3800, 3700], [3920, 3700], [3800, 3880], [4060, 3820]]) pieces.push(R(x, y, 48, 48, 'p', 'ruin'));
    reserve.push({ x: 3920, y: 3790, r: 220 });
    for (const [x, y] of [[1800, 1700], [2500, 2400], [3300, 2300], [2100, 3300], [3400, 3500]]) pieces.push(D('banner', x, y, 10, 16, '#3a5ab0'));
    paths.push([[S, S], [1250, 1600]], [[S, S], [3950, 1500]], [[S, S], [1300, 3900]], [[S, S], [1950, 4200]], [[S, S], [3920, 3790]]);
  } else if (id === 'glaciar') {
    pieces.push(D('statue', S, S, 70, 70, '#9ad8ff'));
    for (const [dx, dy] of [[-200, -200], [200, -200], [-200, 200], [200, 200]]) pieces.push(D('crystal', S + dx, S + dy, 22));
    castle(3900, 1100, 1000, 760, 'hielo', pieces); reserve.push({ x: 3900, y: 1100, r: 680 });
    for (const [x, y, w, h] of [[1150, 1150, 170, 130], [1450, 1350, 150, 120]]) pieces.push(R(x, y, w, h, 'b', 'cabin'));
    pieces.push(D('campfire', 1380, 1220, 22)); reserve.push({ x: 1350, y: 1300, r: 330 });
    for (const [x, y] of [[2300, 3900], [3800, 3500], [1000, 3000]]) { for (let i = 0; i < 5; i++) pieces.push(R(x + Math.cos(i * 1.3) * 90 - 22, y + Math.sin(i * 1.3) * 70 - 22, 44, 44, 'p', 'crystal')); reserve.push({ x, y, r: 160 }); }
    paths.push([[S, S], [3900, 1600]], [[S, S], [1350, 1400]], [[S, S], [2300, 3900]], [[S, S], [3800, 3500]]);
  } else if (id === 'infierno') {
    pieces.push(D('brazier', S, S, 60, 60));
    for (const [dx, dy] of [[-200, -200], [200, -200], [-200, 200], [200, 200]]) pieces.push(D('brazier', S + dx, S + dy, 18));
    castle(2900, 4050, 900, 640, 'demonio', pieces); reserve.push({ x: 2900, y: 4050, r: 600 });
    pieces.push(R(800, 1050, 480, 420, 'r', 'volcano')); reserve.push({ x: 1040, y: 1260, r: 380 });
    for (const [x, y] of [[1500, 2600], [3900, 3700], [1150, 4200], [4300, 1100]]) { pieces.push(R(x, y, 90, 90, 'p', 'demontower')); reserve.push({ x: x + 45, y: y + 45, r: 150 }); }
    pieces.push(R(820, 3600, 70, 70, 'p', 'skullgate'), R(1010, 3600, 70, 70, 'p', 'skullgate'), D('skull', 950, 3640, 40)); reserve.push({ x: 950, y: 3640, r: 200 });
    paths.push([[S, S], [2900, 3700]], [[S, S], [1040, 1700]], [[S, S], [950, 3700]], [[S, S], [1545, 2645]], [[S, S], [3945, 3745]]);
  } else {
    pieces.push(D('statue', S, S, 70, 70, '#bfc4cc'));
    pieces.push(R(3500, 1050, 520, 420, 'b', 'dome')); reserve.push({ x: 3760, y: 1260, r: 420 });
    pieces.push(R(4150, 2050, 220, 220, 'b', 'skyscraper'), R(1150, 3650, 200, 200, 'b', 'skyscraper')); reserve.push({ x: 4260, y: 2160, r: 220 }, { x: 1250, y: 3750, r: 220 });
    for (const [x, y] of [[2200, 1150], [3500, 3300]]) { pieces.push(D('helipad', x, y, 120)); reserve.push({ x, y, r: 170 }); }
    for (const [x, y] of [[2000, 2400], [3400, 2500], [2500, 3500]]) pieces.push(D('billboard', x, y, 40, 14, '#ff3d81'));
  }
  return { pieces, reserve, paths };
}

const key = (cx: number, cy: number) => (cx + 32768) * 65536 + (cy + 32768);

export class World {
  /** Zona de inicio. */
  readonly map: MapDef;
  readonly seed: number;
  /** Punto de aparición del jugador (centro de la zona de inicio). */
  readonly spawn: Vec;
  /** Los portales en pareja (uno por cada par de zonas); cada zona tiene 3. */
  readonly portals: Portal[] = [];
  private cache = new Map<number, ChunkData>();
  /** Monumentos, zonas reservadas y caminos de cada zona (coordenadas de mundo). */
  private layouts: { pieces: Piece[]; reserve: { x: number; y: number; r: number }[]; segs: number[][] }[] = [];

  constructor(map: MapDef, seed = Math.floor(Math.random() * 2147483647)) {
    this.map = map;
    this.seed = seed;
    const start = Math.max(0, MAPS.findIndex(m => m.id === map.id));
    const [sx, sy] = zoneOrigin(start);
    this.spawn = { x: sx + SPAWN_LOCAL, y: sy + SPAWN_LOCAL };
    // un portal por cada pareja de zonas, a 1.280 del centro en la dirección de la otra zona
    for (let a = 0; a < MAPS.length; a++) for (let b = a + 1; b < MAPS.length; b++) {
      const at = (z: number, o: number) => {
        const dx = Math.sign(MAPS[o].zone[0] - MAPS[z].zone[0]), dy = Math.sign(MAPS[o].zone[1] - MAPS[z].zone[1]);
        const [ox, oy] = zoneOrigin(z);
        return { x: ox + SPAWN_LOCAL + dx * 1280, y: oy + SPAWN_LOCAL + dy * 1280 };
      };
      this.portals.push({ ...at(a, b), zone: a, to: b }, { ...at(b, a), zone: b, to: a });
    }
    MAPS.forEach((m, z) => {
      const [ox, oy] = zoneOrigin(z), L = layoutFor(m.id);
      const pieces = L.pieces.map(p => ({ ...p, x: p.x + ox, y: p.y + oy }));
      const reserve = L.reserve.map(r => ({ ...r, x: r.x + ox, y: r.y + oy }));
      const routes = L.paths.map(p => p.map(([x, y]) => [x + ox, y + oy] as [number, number]));
      for (const p of this.portals.filter(q => q.zone === z)) { reserve.push({ x: p.x, y: p.y, r: 230 }); routes.push([[ox + SPAWN_LOCAL, oy + SPAWN_LOCAL], [p.x, p.y]]); }
      // cada ruta se vuelve un camino con curvas (puntos intermedios desplazados con ruido)
      const segs: number[][] = [];
      routes.forEach((rt, ri) => {
        const [[x0, y0], [x1, y1]] = rt, n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 220));
        const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
        let px = x0, py = y0;
        for (let i = 1; i <= n; i++) {
          const t = i / n, w = i === n ? 0 : (noise(i * 0.7, ri * 3.1, this.seed + z * 13) - 0.5) * 380 * Math.sin(Math.PI * t);
          const qx = x0 + (x1 - x0) * t + (nx / nl) * w, qy = y0 + (y1 - y0) * t + (ny / nl) * w;
          segs.push([px, py, qx, qy]); px = qx; py = qy;
        }
      });
      this.layouts.push({ pieces, reserve, segs });
    });
  }
  /** Zona de un punto del mundo (-1 = abismo). */
  zoneOfPoint(x: number, y: number) { return zoneAt(Math.floor(x / CS), Math.floor(y / CS)); }
  /** Pareja de un portal. */
  portalPair(p: Portal) { return this.portals.find(q => q.zone === p.to && q.to === p.zone)!; }
  /** Tipo de celda en un punto (para el agua que frena y la lava que quema). */
  terrainAt(x: number, y: number): number {
    const cx = Math.floor(x / CS), cy = Math.floor(y / CS);
    const ch = this.chunk(cx, cy);
    const i = Math.min(CN - 1, Math.max(0, Math.floor((x - cx * CS) / CELL))), j = Math.min(CN - 1, Math.max(0, Math.floor((y - cy * CS) / CELL)));
    return ch.cells[j * CN + i];
  }

  chunk(cx: number, cy: number): ChunkData {
    const k = key(cx, cy);
    let c = this.cache.get(k);
    if (!c) { c = this.gen(cx, cy); this.cache.set(k, c); }
    return c;
  }

  /** Libera chunks lejanos (los vuelve a generar idénticos si hace falta). */
  prune(px: number, py: number, keep = 6) {
    if (this.cache.size < 120) return;
    const pcx = Math.floor(px / CS), pcy = Math.floor(py / CS);
    for (const [k, c] of this.cache) if (Math.abs(c.cx - pcx) > keep || Math.abs(c.cy - pcy) > keep) this.cache.delete(k);
  }

  /** ¿Un círculo (x,y,r) toca algún obstáculo? */
  hit(x: number, y: number, r: number): boolean {
    const x0 = Math.floor((x - r) / CS), x1 = Math.floor((x + r) / CS), y0 = Math.floor((y - r) / CS), y1 = Math.floor((y + r) / CS);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const obs = this.chunk(cx, cy).obstacles;
      for (let i = 0; i < obs.length; i++) {
        const o = obs[i];
        if (x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r) return true;
      }
    }
    return false;
  }

  /** Expulsa un círculo fuera de los obstáculos (deslizamiento natural contra las paredes). */
  resolve(o: { x: number; y: number }, r: number) {
    const x0 = Math.floor((o.x - r) / CS), x1 = Math.floor((o.x + r) / CS), y0 = Math.floor((o.y - r) / CS), y1 = Math.floor((o.y + r) / CS);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const obs = this.chunk(cx, cy).obstacles;
      for (let i = 0; i < obs.length; i++) {
        const b = obs[i];
        if (o.x + r < b.x || o.x - r > b.x + b.w || o.y + r < b.y || o.y - r > b.y + b.h) continue;
        const nx = o.x < b.x ? b.x : o.x > b.x + b.w ? b.x + b.w : o.x;
        const ny = o.y < b.y ? b.y : o.y > b.y + b.h ? b.y + b.h : o.y;
        const dx = o.x - nx, dy = o.y - ny, d2 = dx * dx + dy * dy;
        if (d2 >= r * r) continue;
        if (d2 > 0.0001) {
          const d = Math.sqrt(d2), k = (r - d) / d;
          o.x += dx * k; o.y += dy * k;
        } else {
          const l = o.x - b.x, rr = b.x + b.w - o.x, t = o.y - b.y, bb = b.y + b.h - o.y, m = Math.min(l, rr, t, bb);
          if (m === l) o.x = b.x - r; else if (m === rr) o.x = b.x + b.w + r; else if (m === t) o.y = b.y - r; else o.y = b.y + b.h + r;
        }
      }
    }
  }

  /** Parejas de portales (todas: son pocas). */
  portalsNear(_x: number, _y: number, _range = 1): [Vec, Vec][] {
    return this.portals.filter(p => p.zone < p.to).map(p => [p, this.portalPair(p)] as [Vec, Vec]);
  }

  /* ------------------------------------------------------------------ generación */
  /** Tipo de celda en coordenadas de mundo (sin monumentos ni objetos). */
  private cellType(z: number, x: number, y: number): number {
    const id = MAPS[z].id, [ox, oy] = zoneOrigin(z), lx = x - ox, ly = y - oy, s = this.seed + z * 1009;
    // borde de la isla irregular
    const edge = Math.min(lx, ly, ZW - lx, ZW - ly), m = 130 + 360 * fbm(x / 700, y / 700, s + 5);
    if (edge < m) return Cell.Void;
    const L = this.layouts[z];
    // caminos que unen la plaza, los portales y los monumentos
    let dPath = 1e9;
    for (const [ax, ay, bx, by] of L.segs) {
      const vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1)));
      const d = Math.hypot(x - ax - vx * t, y - ay - vy * t); if (d < dPath) dPath = d;
    }
    let reserved = false, dRes = 1e9;
    for (const r of L.reserve) { const d = Math.hypot(x - r.x, y - r.y) - r.r; if (d < 0) reserved = true; if (d < dRes) dRes = d; }
    const pathW = id === 'ciudad' ? 0 : 46 + 14 * noise(x / 160, y / 160, s + 9);
    // las rocas se van encogiendo cerca de caminos y monumentos (así no quedan trozos sueltos recortados)
    const rk = 0.3 * Math.max(0, 1 - Math.min(dPath - pathW, dRes) / 240);
    const big = fbm(x / 1100, y / 1100, s + 1), mid = fbm(x / 420, y / 420, s + 2), river = Math.abs(fbm(x / 1500, y / 1500, s + 3) - 0.5);
    let t: number = Cell.Ground;
    if (id === 'ciudad') {
      // avenidas (cada 1.280) y calles (cada 640), algo desplazadas para que no sea una cuadrícula perfecta
      const ax = ((lx + 300 * (noise(ly / 2000, 0, s) - 0.5)) % 1280 + 1280) % 1280, ay = ((ly + 300 * (noise(lx / 2000, 7, s) - 0.5)) % 1280 + 1280) % 1280;
      const bxx = ((lx - 640) % 1280 + 1280) % 1280, byy = ((ly - 640) % 1280 + 1280) % 1280;
      const avenue = ax < 140 || ay < 140, street = (bxx < 80 && noise(ly / 600, 1, s) > 0.35) || (byy < 80 && noise(lx / 600, 2, s) > 0.35);
      if (ly > ZW - 900 + 120 * noise(lx / 500, 3, s)) t = ly > ZW - 760 + 100 * noise(lx / 400, 4, s) ? Cell.Sea : Cell.Sand;   // playa y mar
      else if (avenue || street) t = Cell.Road;
      else if (big < 0.32) t = Cell.Grass;   // parques
      if (t === Cell.Grass && mid < 0.3) t = Cell.Water;
      return t;
    }
    if (id === 'reino') {
      if (river < 0.022 || big < 0.2) t = Cell.Water;
      else if (mid > 0.74 + rk) t = Cell.Rock;
      else if (mid < 0.46 && big > 0.32) t = Cell.Grass;   // praderas de hierba alta
    } else if (id === 'glaciar') {
      if (big < 0.27) t = mid < 0.3 ? Cell.Water : Cell.Ice;
      else if (mid > 0.72 + rk || (edge < m + 260 && ly < 700 && rk < 0.05)) t = Cell.Rock;   // montañas (más al norte)
    } else if (id === 'infierno') {
      if (river < 0.03 || big < 0.2) t = Cell.Lava;
      else if (mid > 0.73 + rk) t = Cell.Rock;
    }
    if (dPath < pathW) return t === Cell.Water || t === Cell.Lava ? Cell.Bridge : Cell.Path;
    if (reserved && (t === Cell.Rock || t === Cell.Water || t === Cell.Lava || t === Cell.Ice)) t = Cell.Ground;
    return t;
  }

  private gen(cx: number, cy: number): ChunkData {
    const zone = zoneAt(cx, cy);
    const seed = Math.floor(hash2(cx, cy, this.seed) * 4294967295);
    const ox = cx * CS, oy = cy * CS;
    const cells = new Uint8Array(CN * CN);
    const obs: Rect[] = [], deco: Deco[] = [];
    if (zone < 0) { cells.fill(Cell.Void); return { cx, cy, seed, kind: 'void', zone, cells, obstacles: [{ x: ox, y: oy, w: CS, h: CS, k: 'v' }], deco }; }
    const id = MAPS[zone].id, L = this.layouts[zone];
    for (let j = 0; j < CN; j++) for (let i = 0; i < CN; i++) cells[j * CN + i] = this.cellType(zone, ox + (i + 0.5) * CELL, oy + (j + 0.5) * CELL);
    // monumentos que tocan el chunk (enteros: así se dibujan sin cortes entre chunks)
    for (const p of L.pieces) {
      const w = 'deco' in p ? p.rx * 2 + 60 : p.w, h = 'deco' in p ? p.ry * 2 + 60 : p.h, x0 = 'deco' in p ? p.x - p.rx - 30 : p.x, y0 = 'deco' in p ? p.y - p.ry - 30 : p.y;
      // con margen: los tejados, torres y copas sobresalen por arriba y se dibujan también en el chunk de encima
      const M = 110;
      if (x0 + w + M < ox || x0 - M > ox + CS || y0 + h + M < oy || y0 - M > oy + CS) continue;
      if ('deco' in p) { const { deco: _d, ...dd } = p; deco.push(dd as Deco); }
      else obs.push(p);
    }
    // celdas que bloquean: se juntan en tiras horizontales (abismo, roca, mar)
    const kindOf: Record<number, Rect['k']> = { [Cell.Void]: 'v', [Cell.Rock]: 'r', [Cell.Sea]: 'h' };
    for (let j = 0; j < CN; j++) {
      let i = 0;
      while (i < CN) {
        const c = cells[j * CN + i];
        if (!BLOCKING.has(c)) { i++; continue; }
        let n = 1; while (i + n < CN && cells[j * CN + i + n] === c) n++;
        obs.push({ x: ox + i * CELL, y: oy + j * CELL, w: n * CELL, h: CELL, k: kindOf[c] });
        i += n;
      }
    }
    // objetos sueltos: árboles, rocas, cristales, pinchos, cajas… según la zona y la densidad de bosque
    const r = mulberry(seed);
    const free = (x: number, y: number, s: number) => {
      for (const [dx, dy] of [[0, 0], [s, 0], [0, s], [s, s], [s / 2, s / 2]]) {
        const i = Math.floor((x + dx - ox) / CELL), j = Math.floor((y + dy - oy) / CELL);
        if (i < 0 || j < 0 || i >= CN || j >= CN) return false;
        const c = cells[j * CN + i];
        if (c !== Cell.Ground && c !== Cell.Grass && c !== Cell.Sand) return false;
      }
      for (const q of L.reserve) if (Math.hypot(x + s / 2 - q.x, y + s / 2 - q.y) < q.r) return false;
      return !obs.some(o => x < o.x + o.w + 26 && x + s > o.x - 26 && y < o.y + o.h + 26 && y + s > o.y - 26);
    };
    const forest = fbm((ox + CS / 2) / 900, (oy + CS / 2) / 900, this.seed + zone * 31 + 7);
    const nTrees = id === 'ciudad' ? 3 : Math.round(2 + forest * forest * 22);
    const place = (k: Rect['k'], s: number, tries: number, style?: string) => {
      for (let t = 0; t < tries; t++) {
        const x = ox + 10 + r() * (CS - s - 20), y = oy + 10 + r() * (CS - s - 20);
        if (free(x, y, s)) { obs.push({ x, y, w: s, h: s, k, s: style }); return; }
      }
    };
    if (id === 'ciudad') {
      // manzanas: edificios donde no hay calle, parque ni agua
      for (let t = 0; t < 10; t++) {
        const w = 130 + r() * 170, h = 120 + r() * 150, x = ox + r() * (CS - w), y = oy + r() * (CS - h);
        let ok = true;
        for (let yy = y; yy < y + h && ok; yy += CELL / 2) for (let xx = x; xx < x + w && ok; xx += CELL / 2) {
          const c = cells[Math.floor((yy - oy) / CELL) * CN + Math.floor((xx - ox) / CELL)];
          if (c !== Cell.Ground) ok = false;
        }
        if (ok && !L.reserve.some(q => Math.hypot(x + w / 2 - q.x, y + h / 2 - q.y) < q.r + Math.max(w, h) / 2) && !obs.some(o => x < o.x + o.w + 30 && x + w > o.x - 30 && y < o.y + o.h + 30 && y + h > o.y - 30))
          obs.push({ x, y, w, h, k: 'b', s: r() < 0.25 ? 'shop' : 'office' });
      }
    }
    for (let i = 0; i < nTrees; i++) place('a', 40 + Math.floor(r() * 12), 6);
    const nRocks = id === 'ciudad' ? 0 : 1 + Math.floor(r() * 3);
    for (let i = 0; i < nRocks; i++) place(id === 'glaciar' ? 'p' : id === 'infierno' ? 'p' : 'o', id === 'reino' ? 36 : 40, 6, id === 'glaciar' ? 'crystal' : id === 'infierno' ? 'spike' : undefined);
    if (id === 'ciudad') place(r() < 0.6 ? 'c' : 't', 40, 4);
    else if (r() < 0.25) place(r() < 0.5 ? 'c' : 't', 40, 6);
    return { cx, cy, seed, kind: 'land', zone, cells, obstacles: obs, deco };
  }
}
