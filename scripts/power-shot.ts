// Antes y después de los proyectiles de elemento (shots/poderes-antes-despues.png): arriba el dibujo antiguo, en medio
// el nuevo y abajo los impactos en varios momentos. Uso: npx tsx scripts/power-shot.ts
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { setAgentSheet } from '../src/game/sprites';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer } from '../src/game/Renderer';
import { FANCY_LOOKS } from '../src/game/fancyProj';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAP_BY_ID } from '../src/data/maps';
import { POWERS } from '../src/data/powers';

mkdirSync('shots', { recursive: true });
for (const f of readdirSync('public/agents')) setAgentSheet(f.replace(/\.\w+$/, ''), await loadImage('public/agents/' + f));
const VW = 330, VH = 100, Z = 3, looks = ['flame', 'bolt', 'water', 'ice', 'leaf', 'rock', 'star', 'dagger', 'arrow', 'wisp'];
const power = (look: string) => Object.values(POWERS).find(p => p.look === look)!;
const out = createCanvas(VW * Z, VH * Z * 3 + 20), og = out.getContext('2d') as any;
og.imageSmoothingEnabled = false; og.fillStyle = '#000'; og.fillRect(0, 0, out.width, out.height);

function frame(row: number, fancy: boolean, impacts: boolean) {
  const saved = [...FANCY_LOOKS];
  if (!fancy) FANCY_LOOKS.clear();
  const low = createCanvas(VW, VH), rd = new Renderer(low.getContext('2d') as any, (w, h) => createCanvas(w, h) as any);
  const v = rd.resizePixels(VW, VH);
  const e: any = new GameEngine(AGENT_BY_ID.ember, MAP_BY_ID.reino, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  e.setView(v.w, v.h); e.updateSpawner = () => {}; e.weapons.length = 0;
  for (let i = 0; i < 20; i++) e.update(1 / 60);
  e.enemies.length = 0; e.crates.length = 0; e.banner.t = 0; e.projs.length = 0;
  const p = e.player; p.x += 2000; p.y += 1200;   // lejos del héroe y de la plaza
  e.update(1 / 60); e.time = 7.3;
  looks.forEach((look, i) => {
    const w = power(look), x = p.x - 290 + (i % 5) * 140, y = p.y - 70 + Math.floor(i / 5) * 140;
    if (impacts) [0.05, 0.3, 0.6].forEach((k, j) => e.impacts.push({ x: x + j * 34, y, look, t: e.time - k * 0.35, ang: 0, seed: 17 + j }));
    else e.spawnProj(x, y, 0, 300, 10, w.size, 999, 0, false, w.color, { look });
  });
  rd.render(e);
  og.drawImage(low, 0, row * (VH * Z + 10), VW * Z, VH * Z);
  FANCY_LOOKS.clear(); for (const l of saved) FANCY_LOOKS.add(l);
}
frame(0, false, false);
frame(1, true, false);
frame(2, true, true);
writeFileSync('shots/poderes-antes-despues.png', out.toBuffer('image/png'));
console.log('ok');
