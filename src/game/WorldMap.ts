// Vista del mundo entero en pequeño (para el minimapa y el mapa grande). Se dibuja una vez por mundo a partir de
// las celdas del terreno (suelo, caminos, agua, lava, hielo, roca, abismo…) y los objetos, con los colores de la zona.
import { CS, CELL, CN, Cell, World, WORLD_CHUNKS } from './World';
import { THEMES } from './MapArt';
import { MAPS } from '../data/maps';

/** Unidades de mundo por píxel de la vista. */
export const MAP_SCALE = 16;
export const MAP_PX = (WORLD_CHUNKS * CS) / MAP_SCALE;

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

const cache = new WeakMap<World, any>();
export function worldOverview(world: World, make: (w: number, h: number) => any) {
  let cv = cache.get(world);
  if (cv) return cv;
  cv = make(MAP_PX, MAP_PX);
  const g = cv.getContext('2d'), K = 1 / MAP_SCALE, cp = CELL * K;
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(Math.floor(x * K), Math.floor(y * K), Math.max(1, Math.ceil(w * K)), Math.max(1, Math.ceil(h * K)));
  };
  g.fillStyle = '#0a0c18'; g.fillRect(0, 0, MAP_PX, MAP_PX);
  for (let cy = 0; cy < WORLD_CHUNKS; cy++) for (let cx = 0; cx < WORLD_CHUNKS; cx++) {
    const ch = world.chunk(cx, cy);
    if (ch.zone < 0) continue;
    const T = THEMES[MAPS[ch.zone].id], ox = cx * CS * K, oy = cy * CS * K;
    for (let j = 0; j < CN; j++) for (let i = 0; i < CN; i++) {
      const t = ch.cells[j * CN + i];
      g.fillStyle = cellColor(t, T); g.fillRect(ox + i * cp, oy + j * cp, cp, cp);
      // canto de la isla: celda de tierra con abismo debajo
      if (t !== Cell.Void && j < CN - 1 && ch.cells[(j + 1) * CN + i] === Cell.Void) { g.fillStyle = T.cliffD; g.fillRect(ox + i * cp, oy + (j + 1) * cp, cp, cp); }
    }
    for (const d of ch.deco) if (d.type === 'fountain' || d.type === 'helipad') { g.fillStyle = d.type === 'fountain' ? '#4fd0e0' : '#4a4f5c'; g.beginPath(); g.arc(d.x * K, d.y * K, d.rx * K, 0, 7); g.fill(); }
    for (const o of ch.obstacles) {
      if (o.k === 'v' || o.k === 'r' || o.k === 'h') continue;   // ya pintadas por celdas
      const c = o.k === 'b' ? T.roof : o.k === 'w' ? T.wallF : o.k === 'a' ? T.leafD : o.k === 'p' ? T.stone : o.k === 'o' ? T.stoneD : T.crate;
      rect(o.x, o.y, o.w, o.h, c);
    }
  }
  cache.set(world, cv);
  return cv;
}
