// Hoja de un agente ampliada con rejilla, para situar los rectángulos "erase" de art/frames.json.
// Uso: npx tsx scripts/agent-grid.ts <id> <fila: 0 frente, 1 espalda, 2 lado> <salida.png>
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
import { AGENT_IMAGES } from '../src/data/agentImages';
const [id, rowS, out] = process.argv.slice(2), row = +rowS, A = AGENT_IMAGES[id], S = 7;
const n = [A.front, A.back, A.side][row];
const sh = await loadImage(`public/agents/${id}.png`);
const c = createCanvas(n * (A.w * S + 30), A.h * S + 20); const g = c.getContext('2d') as any;
g.fillStyle = '#8a90a0'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false;
for (let i = 0; i < n; i++) {
  const ox = i * (A.w * S + 30) + 20;
  g.drawImage(sh, i * A.w, row * A.h, A.w, A.h, ox, 10, A.w * S, A.h * S);
  g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1;
  for (let x = 0; x <= A.w; x += 5) { g.beginPath(); g.moveTo(ox + x * S, 10); g.lineTo(ox + x * S, 10 + A.h * S); g.stroke(); }
  for (let y = 0; y <= A.h; y += 5) { g.beginPath(); g.moveTo(ox, 10 + y * S); g.lineTo(ox + A.w * S, 10 + y * S); g.stroke(); }
  g.fillStyle = '#ff0'; g.font = '11px monospace';
  for (let x = 0; x <= A.w; x += 10) g.fillText(String(x), ox + x * S + 1, 9);
  for (let y = 0; y <= A.h; y += 10) g.fillText(String(y), ox - 18, 10 + y * S + 10);
}
writeFileSync(out, c.toBuffer('image/png'));
