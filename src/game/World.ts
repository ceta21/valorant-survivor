import { MapDef, Rect, Vec } from './types';

/**
 * Mundo infinito. Se genera por "chunks" de CS×CS unidades de forma determinista (misma semilla = mismo mundo),
 * y solo se guardan en memoria los que están cerca del jugador.
 *
 * Cada chunk tiene un bloque central de BS×BS rodeado de calles de STREET unidades a cada lado,
 * de modo que las calles de chunks vecinos se unen en avenidas de 2×STREET y las esquinas forman cruces libres.
 */
export const CS = 640;
export const STREET = 120;
export const BS = CS - STREET * 2; // 400
const SC = 4; // los teletransportadores se reparten por "superceldas" de SC×SC chunks

export type ChunkKind = 'big' | 'two' | 'market' | 'open' | 'site' | 'plaza' | 'yard' | 'garden';
export interface Deco { type: 'fountain' | 'pond' | 'rugs'; x: number; y: number; rx: number; ry: number }
export interface ChunkData {
  cx: number; cy: number; seed: number; kind: ChunkKind;
  obstacles: Rect[];
  zone?: { x: number; y: number; r: number; label: string };
  deco: Deco[];
}

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

// Pesos de cada tipo de chunk por mapa (el orden importa: es el de ChunkKind menos 'plaza' al final).
const WEIGHTS: Record<string, [ChunkKind, number][]> = {
  ascent: [['big', 0.30], ['two', 0.32], ['market', 0.12], ['open', 0.08], ['site', 0.10], ['plaza', 0.05]],
  bind: [['big', 0.18], ['two', 0.18], ['market', 0.14], ['open', 0.06], ['site', 0.10], ['plaza', 0.04], ['yard', 0.30]],
  haven: [['big', 0.26], ['two', 0.22], ['market', 0.08], ['open', 0.05], ['site', 0.10], ['plaza', 0.04], ['garden', 0.25]],
};

const key = (cx: number, cy: number) => (cx + 32768) * 65536 + (cy + 32768);

export class World {
  readonly map: MapDef;
  readonly seed: number;
  /** Punto de aparición del jugador (centro del chunk 0,0). */
  readonly spawn: Vec = { x: CS / 2, y: CS / 2 };
  private cache = new Map<number, ChunkData>();
  private portalCache = new Map<number, [Vec, Vec] | null>();

  constructor(map: MapDef, seed = Math.floor(Math.random() * 2147483647)) {
    this.map = map;
    this.seed = seed;
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

  /** Pares de teletransportadores (solo Bind) en las superceldas alrededor de un punto. */
  portalsNear(x: number, y: number, range = 1): [Vec, Vec][] {
    if (this.map.id !== 'bind') return [];
    const S = SC * CS, sx = Math.floor(x / S), sy = Math.floor(y / S), out: [Vec, Vec][] = [];
    for (let j = -range; j <= range; j++) for (let i = -range; i <= range; i++) {
      const p = this.portalPair(sx + i, sy + j);
      if (p) out.push(p);
    }
    return out;
  }
  private portalPair(sx: number, sy: number): [Vec, Vec] | null {
    const k = key(sx, sy);
    if (this.portalCache.has(k)) return this.portalCache.get(k) as [Vec, Vec] | null;
    let res: [Vec, Vec] | null = null;
    if (hash2(sx, sy, this.seed + 11) < 0.8) {
      const r = mulberry(Math.floor(hash2(sx, sy, this.seed + 29) * 4294967295));
      const ax = sx * SC + Math.floor(r() * SC), ay = sy * SC + Math.floor(r() * SC);
      let bx = ax, by = ay, guard = 0;
      while (Math.abs(bx - ax) + Math.abs(by - ay) < 3 && guard++ < 30) { bx = sx * SC + Math.floor(r() * SC); by = sy * SC + Math.floor(r() * SC); }
      if (Math.abs(bx - ax) + Math.abs(by - ay) >= 3) res = [{ x: ax * CS, y: ay * CS }, { x: bx * CS, y: by * CS }];
    }
    this.portalCache.set(k, res);
    return res;
  }

  /* ------------------------------------------------------------------ generación */
  private gen(cx: number, cy: number): ChunkData {
    const id = this.map.id;
    const seed = Math.floor(hash2(cx, cy, this.seed) * 4294967295);
    const r = mulberry(seed);
    const rr = (a: number, b: number) => a + r() * (b - a);
    const ox = cx * CS, oy = cy * CS, bx = ox + STREET, by = oy + STREET;
    const origin = cx === 0 && cy === 0;
    const obs: Rect[] = [];
    const deco: Deco[] = [];

    let kind: ChunkKind = 'big';
    if (origin) kind = 'plaza';
    else {
      const table = WEIGHTS[id] ?? WEIGHTS.ascent;
      const total = table.reduce((s, t) => s + t[1], 0);
      let roll = r() * total;
      for (const [k, w] of table) { roll -= w; if (roll <= 0) { kind = k; break; } }
    }
    const data: ChunkData = { cx, cy, seed, kind, obstacles: obs, deco };

    const add = (x: number, y: number, w: number, h: number, k: Rect['k']) => { obs.push({ x, y, w, h, k }); };
    const overlaps = (x: number, y: number, w: number, h: number, pad: number) =>
      obs.some(o => x < o.x + o.w + pad && x + w > o.x - pad && y < o.y + o.h + pad && y + h > o.y - pad);
    const nearCorner = (x: number, y: number, s: number) => {
      for (const [px, py] of [[ox, oy], [ox + CS, oy], [ox, oy + CS], [ox + CS, oy + CS]]) if (Math.hypot(x + s / 2 - px, y + s / 2 - py) < 120) return true;
      return false;
    };
    const nearSpawn = (x: number, y: number, s: number) => origin && Math.hypot(x + s / 2 - (ox + CS / 2), y + s / 2 - (oy + CS / 2)) < 170;
    /** Coloca un objeto pequeño en un hueco libre dentro de la región indicada. */
    const prop = (k: 'c' | 't' | 'p', x0: number, y0: number, x1: number, y1: number, tries = 14) => {
      const s = k === 'c' ? 48 : k === 'p' ? 40 : 32;
      if (x1 - x0 < s + 4 || y1 - y0 < s + 4) return false;
      for (let i = 0; i < tries; i++) {
        const x = rr(x0, x1 - s), y = rr(y0, y1 - s);
        if (overlaps(x, y, s, s, 28) || nearCorner(x, y, s) || nearSpawn(x, y, s)) continue;
        add(x, y, s, s, k);
        return true;
      }
      return false;
    };
    const anyProp = () => (r() < 0.55 ? 'c' : r() < 0.7 ? 't' : 'p') as 'c' | 't' | 'p';
    const whole = (n: number) => { for (let i = 0; i < n; i++) prop(anyProp(), ox + 16, oy + 16, ox + CS - 16, oy + CS - 16); };
    /** Pared recta con un hueco opcional (gap = [inicio, ancho] relativo a la pared). */
    const wall = (x: number, y: number, len: number, horiz: boolean, gap?: [number, number]) => {
      const t = 28;
      const seg = (a: number, l: number) => { if (l > 8) horiz ? add(x + a, y, l, t, 'w') : add(x, y + a, t, l, 'w'); };
      if (!gap) seg(0, len); else { seg(0, gap[0]); seg(gap[0] + gap[1], len - gap[0] - gap[1]); }
    };

    switch (kind) {
      case 'big': {
        const w = rr(230, 380), h = rr(190, 340);
        add(bx + rr(10, BS - w - 10), by + rr(10, BS - h - 10), w, h, 'b');
        whole(2 + Math.floor(r() * 3));
        break;
      }
      case 'two': {
        if (r() < 0.5) {
          const w1 = rr(140, 200), w2 = 340 - w1;
          add(bx + 10, by + rr(10, 60), w1, rr(170, 320), 'b');
          add(bx + 10 + w1 + 40, by + rr(10, 60), w2, rr(170, 320), 'b');
        } else {
          const h1 = rr(140, 200), h2 = 340 - h1;
          add(bx + rr(10, 60), by + 10, rr(170, 320), h1, 'b');
          add(bx + rr(10, 60), by + 10 + h1 + 40, rr(170, 320), h2, 'b');
        }
        whole(1 + Math.floor(r() * 3));
        break;
      }
      case 'market': {
        const n = 1 + Math.floor(r() * 2);
        for (let i = 0; i < n; i++) for (let t = 0; t < 10; t++) {
          const w = rr(100, 135), h = rr(80, 110), x = rr(bx + 10, bx + BS - w - 10), y = rr(by + 10, by + BS - h - 10);
          if (!overlaps(x, y, w, h, 40)) { add(x, y, w, h, 'b'); break; }
        }
        const ccx = rr(bx + 100, bx + BS - 100), ccy = rr(by + 100, by + BS - 100), n2 = 6 + Math.floor(r() * 4);
        for (let i = 0; i < n2; i++) prop(anyProp(), ccx - 130, ccy - 130, ccx + 130, ccy + 130);
        whole(2);
        break;
      }
      case 'open': {
        for (let i = 0; i < 3 + Math.floor(r() * 4); i++) prop('p', ox + 16, oy + 16, ox + CS - 16, oy + CS - 16);
        whole(4 + Math.floor(r() * 3));
        break;
      }
      case 'site': {
        const labels = id === 'haven' ? ['A', 'B', 'C'] : ['A', 'B'];
        data.zone = { x: ox + CS / 2, y: oy + CS / 2, r: 150, label: labels[Math.floor(r() * labels.length)] };
        const n = 6 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rr(0, 0.4), d = rr(85, 135), x = data.zone.x + Math.cos(a) * d - 24, y = data.zone.y + Math.sin(a) * d - 24;
          if (!overlaps(x, y, 48, 48, 18)) add(x, y, 48, 48, r() < 0.8 ? 'c' : 't');
        }
        wall(bx + 20, by + 50, 110, true); wall(bx + BS - 130, by + BS - 80, 110, true);
        whole(2);
        break;
      }
      case 'plaza': {
        const px = ox + CS / 2, py = oy + CS / 2;
        deco.push({ type: id === 'ascent' ? 'fountain' : id === 'haven' ? 'pond' : 'rugs', x: px, y: py, rx: id === 'bind' ? 150 : 90, ry: id === 'bind' ? 100 : id === 'haven' ? 62 : 90 });
        for (const [dx, dy] of [[-150, -150], [110, -150], [-150, 110], [110, 110]]) add(px + dx, py + dy, 40, 40, 'p');
        for (let i = 0; i < 3; i++) prop(r() < 0.5 ? 't' : 'c', ox + 16, oy + 16, ox + CS - 16, oy + CS - 16);
        break;
      }
      case 'yard': {
        const W = rr(280, 340), H = rr(240, 310), X = bx + rr(10, BS - W - 10), Y = by + rr(10, BS - H - 10);
        const gapSide = Math.floor(r() * 4), gapLen = 100;
        const side = (n: number, x: number, y: number, len: number, horiz: boolean) => wall(x, y, len, horiz, gapSide === n ? [rr(30, len - gapLen - 30), gapLen] : undefined);
        side(0, X, Y, W, true); side(1, X, Y + H - 28, W, true); side(2, X, Y, H, false); side(3, X + W - 28, Y, H, false);
        for (let i = 0; i < 2 + Math.floor(r() * 3); i++) prop(anyProp(), X + 40, Y + 40, X + W - 40, Y + H - 40);
        whole(2);
        break;
      }
      case 'garden': {
        const px = rr(bx + 130, bx + BS - 130), py = rr(by + 100, by + BS - 100);
        deco.push({ type: 'pond', x: px, y: py, rx: 100, ry: 64 });
        for (const [dx, dy] of [[-125, -80], [95, -80], [-125, 52], [95, 52]]) if (r() < 0.75) add(px + dx, py + dy, 40, 40, 'p');
        for (let t = 0; t < 10; t++) {
          const w = rr(130, 170), h = rr(110, 140), x = rr(bx + 10, bx + BS - w - 10), y = rr(by + 10, by + BS - h - 10);
          if (!overlaps(x, y, w, h, 120) && Math.hypot(x + w / 2 - px, y + h / 2 - py) > 190) { add(x, y, w, h, 'b'); break; }
        }
        whole(2);
        break;
      }
    }
    return data;
  }
}
