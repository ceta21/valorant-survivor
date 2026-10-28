// Hoja con todos los robots enemigos (2 fotogramas, golpe y aturdido) para revisarlos.
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies';
import { enemyCore, enemyKind, enemySprite } from '../src/game/enemySprites';

mkdirSync('shots', { recursive: true });
const make = (w: number, h: number) => createCanvas(w, h) as any;
const S = 5, cell = 30 * S, ids = Object.keys(ENEMIES), cols = 4;
const c = createCanvas(cols * cell, ids.length * (cell + 20)), g = c.getContext('2d') as any;
g.imageSmoothingEnabled = false; g.fillStyle = '#4a4f5c'; g.fillRect(0, 0, c.width, c.height);
ids.forEach((id, row) => {
  const k = enemyKind(id), core = enemyCore(k, ENEMIES[id].color);
  ([[0, 'n'], [1, 'n'], [0, 'hit'], [0, 'stun']] as const).forEach(([f, v], col) => {
    const img = enemySprite(k, f, v, core, make);
    g.drawImage(img, col * cell + (cell - img.width * S) / 2, row * (cell + 20) + 20 + (cell - img.height * S) / 2, img.width * S, img.height * S);
  });
  g.fillStyle = '#fff'; g.font = '16px monospace'; g.fillText(`${ENEMIES[id].name} (${id})`, 6, row * (cell + 20) + 16);
});
writeFileSync('shots/enemies.png', c.toBuffer('image/png'));
console.log('ok');
