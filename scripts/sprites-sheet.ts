import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spriteCanvas } from '../src/game/sprites';
import { AGENTS } from '../src/data/agents';
mkdirSync('shots', { recursive: true });
const S = 6, W = 22 * S + 20, H = 26 * S + 30;
const c = createCanvas(W * 5, H * 2); const g = c.getContext('2d') as any;
g.fillStyle = '#1b2a38'; g.fillRect(0, 0, c.width, c.height);
AGENTS.forEach((a, i) => {
  const s = spriteCanvas(a.id, (w, h) => createCanvas(w, h) as any, S);
  g.drawImage(s, (i % 5) * W + 10, Math.floor(i / 5) * H + 10);
  g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText(a.name, (i % 5) * W + 10, Math.floor(i / 5) * H + 26 * S + 24);
});
writeFileSync('shots/sprites.png', c.toBuffer('image/png'));
