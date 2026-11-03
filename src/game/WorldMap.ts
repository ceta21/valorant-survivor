// Vista del mundo en pequeño (para el minimapa y el mapa grande), a partir de las celdas del terreno (suelo, caminos,
// agua, lava, hielo, roca, abismo…) y los objetos, con los colores de la zona. El mundo no tiene bordes, así que se
// pinta solo el trozo que se ve, chunk a chunk.
import { CS, CELL, CN, Cell, World } from './World';
import { THEMES } from './MapArt';
import { MAPS } from '../data/maps';

/** Unidades de mundo por píxel de la vista. */
export const MAP_SCALE = 16;

/** Color de cada tipo de celda en la vista (según el tema de la zona). */
export function cellColor(t: number, T: (typeof THEMES)[string]) {
  switch (t) {
    case Cell.Path: return T.road;
    case Cell.Bridge: return T.wallS;
    case Cell.Water: return '#3b78b8';
    case Cell.Lava: return '#ff6a1c';
    case Cell.Ice: return '#a8e0ff';
    case Cell.Void: return '#0a0c18';
    case Cell.Rock: return T.rock;
    case Cell.Sea: return '#1f5a8a';
    case Cell.Road: return T.road;
    case Cell.Sand: return '#e0c890';
    case Cell.Grass: return T.g2;
    default: return T.g1;
  }
}

/** Miniatura de un chunk (CS / MAP_SCALE píxeles de lado); se guardan las últimas por mundo. */
const thumbs = new WeakMap<World, Map<number, any>>();
const TPX = CS / MAP_SCALE;
function chunkThumb(world: World, cx: number, cy: number, make: (w: number, h: number) => any) {
  let m = thumbs.get(world);
  if (!m) { m = new Map(); thumbs.set(world, m); }
  const k = (cx + 32768) * 65536 + (cy + 32768);
  let cv = m.get(k);
  if (cv) return cv;
  cv = make(TPX, TPX);
  const g = cv.getContext('2d'), K = 1 / MAP_SCALE, cp = CELL * K, ox = cx * CS, oy = cy * CS;
  const ch = world.chunk(cx, cy);
  if (ch.zone < 0) { g.fillStyle = '#0a0c18'; g.fillRect(0, 0, TPX, TPX); }
  else {
    const T = THEMES[MAPS[ch.zone].id];
    for (let j = 0; j < CN; j++) for (let i = 0; i < CN; i++) {
      const t = ch.cells[j * CN + i];
      g.fillStyle = cellColor(t, T); g.fillRect(i * cp, j * cp, cp, cp);
    }
    for (const d of ch.deco) if (d.type === 'fountain' || d.type === 'helipad') { g.fillStyle = d.type === 'fountain' ? '#4fd0e0' : '#4a4f5c'; g.beginPath(); g.arc((d.x - ox) * K, (d.y - oy) * K, d.rx * K, 0, 7); g.fill(); }
    for (const o of ch.obstacles) {
      if (o.k === 'v' || o.k === 'r' || o.k === 'h') continue;   // ya pintadas por celdas
      g.fillStyle = o.k === 'b' ? T.roof : o.k === 'w' ? T.wallF : o.k === 'a' ? T.leafD : o.k === 'p' ? T.stone : o.k === 'o' ? T.stoneD : T.crate;
      g.fillRect(Math.floor((o.x - ox) * K), Math.floor((o.y - oy) * K), Math.max(1, Math.ceil(o.w * K)), Math.max(1, Math.ceil(o.h * K)));
    }
  }
  if (m.size > 900) m.delete(m.keys().next().value!);   // las más antiguas fuera
  m.set(k, cv);
  return cv;
}

/**
 * Dibuja en g el trozo del mundo que empieza en (x0, y0) y mide w × h unidades, a k píxeles por unidad.
 * El mundo no tiene bordes: se pinta por chunks (miniaturas guardadas), solo los que se ven.
 */
export function drawWorldArea(g: any, world: World, x0: number, y0: number, w: number, h: number, k: number, make: (w: number, h: number) => any) {
  const c0 = Math.floor(x0 / CS), c1 = Math.floor((x0 + w) / CS), r0 = Math.floor(y0 / CS), r1 = Math.floor((y0 + h) / CS), s = CS * k;
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
    const px = Math.floor((cx * CS - x0) * k), py = Math.floor((cy * CS - y0) * k);
    g.drawImage(chunkThumb(world, cx, cy, make), px, py, Math.ceil(s) + 1, Math.ceil(s) + 1);
  }
}
