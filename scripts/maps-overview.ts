// Mosaico de chunks alrededor del monumento principal de cada zona (1 px de imagen = 1 px del arte; el juego lo amplía x4).
// Uso: npx tsx scripts/maps-overview.ts  → shots/overview_<zona>.png
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { renderChunk, CPX } from '../src/game/MapArt';
import { World, CS, WORLD_CHUNKS } from '../src/game/World';
import { MAPS } from '../src/data/maps';
mkdirSync('shots', { recursive: true });
const make = (w: number, h: number) => createCanvas(w, h) as any;
const COLS = 5, ROWS = 4, w = new World(MAPS[0], 12345);
const LANDMARK: Record<string, string> = { reino: 'reino-keep', glaciar: 'hielo-keep', infierno: 'demonio-keep', ciudad: 'dome' };
for (const m of MAPS) {
  let at = [0, 0];
  for (let j = 0; j < WORLD_CHUNKS; j++) for (let i = 0; i < WORLD_CHUNKS; i++) for (const o of w.chunk(i, j).obstacles) if (o.s === LANDMARK[m.id]) at = [Math.floor((o.x + o.w / 2) / CS), Math.floor((o.y + o.h / 2) / CS)];
  const c = createCanvas(CPX * COLS, CPX * ROWS), g = c.getContext('2d') as any;
  g.imageSmoothingEnabled = false;
  const t0 = Date.now(), x0 = at[0] - 2, y0 = at[1] - 2;
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) g.drawImage(renderChunk(w, w.chunk(x0 + i, y0 + j), make), i * CPX, j * CPX);
  const big = createCanvas(CPX * COLS * 1.5, CPX * ROWS * 1.5), bg = big.getContext('2d') as any;
  bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, big.width, big.height);
  writeFileSync(`shots/overview_${m.id}.png`, big.toBuffer('image/png'));
  console.log(m.id, 'chunks', COLS * ROWS, 'ms', Date.now() - t0);
}
