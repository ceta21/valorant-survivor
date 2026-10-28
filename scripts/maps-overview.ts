// Mosaico de chunks de cada mapa (1 px de imagen = 1 px del arte; el juego lo amplía x4).
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { renderChunk, CPX } from '../src/game/MapArt';
import { World } from '../src/game/World';
import { MAPS } from '../src/data/maps';
mkdirSync('shots', { recursive: true });
const make = (w: number, h: number) => createCanvas(w, h) as any;
const COLS = 5, ROWS = 4;
for (const m of MAPS) {
  const w = new World(m, 12345);
  const c = createCanvas(CPX * COLS, CPX * ROWS), g = c.getContext('2d') as any;
  g.imageSmoothingEnabled = false;
  const t0 = Date.now();
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) g.drawImage(renderChunk(w, w.chunk(i - 1, j - 1), make), i * CPX, j * CPX);
  const big = createCanvas(CPX * COLS * 1.5, CPX * ROWS * 1.5), bg = big.getContext('2d') as any;
  bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, big.width, big.height);
  writeFileSync(`shots/overview_${m.id}.png`, big.toBuffer('image/png'));
  console.log(m.id, 'chunks', COLS * ROWS, 'ms', Date.now() - t0, 'obstáculos', Array.from({ length: COLS * ROWS }, (_, k) => w.chunk((k % COLS) - 1, Math.floor(k / COLS) - 1).obstacles.length).reduce((a, b) => a + b, 0));
}
