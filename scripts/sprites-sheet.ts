// Hoja de sprites de los agentes: frente, espalda, lado derecho e izquierdo y andar de lado/frente.
// Uso: npx tsx scripts/sprites-sheet.ts [ids separados por comas]  → shots/sprites.png
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spriteCanvas, spriteSize, setAgentSheet, IDLE, WALK, CAST, Dir, Pose } from '../src/game/sprites';
import { AGENT_IMAGES } from '../src/data/agentImages';
import { loadImage } from '@napi-rs/canvas';
import { ALL_AGENTS } from '../src/data/agents';

mkdirSync('shots', { recursive: true });
for (const id of Object.keys(AGENT_IMAGES)) setAgentSheet(id, await loadImage(`public/agents/${id}.png`));
const pick = process.argv[2]?.split(',');
const agents = pick ? ALL_AGENTS.filter(a => pick.includes(a.id)) : ALL_AGENTS;
const S = 4, cw = 22 * S + 8, ch = 30 * S + 22;
const views: [string, Dir, Pose, boolean][] = [
  ['frente', 'front', IDLE, false], ['espalda', 'back', IDLE, false], ['derecha', 'side', IDLE, false], ['izquierda', 'side', IDLE, true],
  ['andar 1', 'side', WALK[1], false], ['andar 2', 'side', WALK[3], false], ['frente 1', 'front', WALK[1], false], ['espalda 1', 'back', WALK[3], false], ['habilidad', 'front', CAST, false],
];
const cols = 2;   // agentes por fila
const c = createCanvas(cols * views.length * cw + 20, Math.ceil(agents.length / cols) * ch + 10);
const g = c.getContext('2d') as any;
g.fillStyle = '#4a4f5c'; g.fillRect(0, 0, c.width, c.height);
g.imageSmoothingEnabled = false;
agents.forEach((a, i) => {
  const ox = (i % cols) * (views.length * cw + 20), oy = Math.floor(i / cols) * ch + 4;
  g.fillStyle = '#fff'; g.font = '12px monospace'; g.fillText(a.name, ox + 4, oy + 12);
  views.forEach(([, dir, pose, flip], j) => {
    // mismo tamaño en pantalla que en el juego (unidades de mundo × 2)
    const z = spriteSize(a.id), f = j === 4 ? 1 : j === 5 ? 3 : j >= 6 && j < 8 ? 1 : 0;
    const s = spriteCanvas(a.id, (w, h) => createCanvas(w, h) as any, S, pose, dir, f), sw = z.w * z.px * 2, sh = z.h * z.px * 2;
    g.save();
    if (flip) { g.translate(ox + j * cw + 4 + sw, oy + 16); g.scale(-1, 1); g.drawImage(s, 0, 0, sw, sh); }
    else g.drawImage(s, ox + j * cw + 4, oy + 16, sw, sh);
    g.restore();
  });
});
writeFileSync('shots/sprites.png', c.toBuffer('image/png'));
console.log('shots/sprites.png', agents.length, 'agentes');
