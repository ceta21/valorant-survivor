// Capturas del ambiente de cada zona (shots/ambiente-zonas.png): luciérnagas y hojas, nieve, ceniza y ascuas, lluvia,
// con el tinte de luz de cada una. Uso: npx tsx scripts/weather-shot.ts
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { setAgentSheet } from '../src/game/sprites';
import { setEnemyArt, setPortalArt } from '../src/game/enemyArt';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer } from '../src/game/Renderer';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAPS } from '../src/data/maps';

mkdirSync('shots', { recursive: true });
for (const f of readdirSync('public/agents')) setAgentSheet(f.replace(/\.\w+$/, ''), await loadImage('public/agents/' + f));
for (const f of readdirSync('public/portals')) setPortalArt(f.replace('.png', ''), await loadImage('public/portals/' + f) as any);
for (const f of readdirSync('public/enemies')) setEnemyArt(f.replace('.png', ''), await loadImage('public/enemies/' + f) as any);
const VW = 440, VH = 256, S = 2;
const out = createCanvas(VW * S * 2 + 10, VH * S * 2 + 10), og = out.getContext('2d') as any;
og.imageSmoothingEnabled = false; og.fillStyle = '#000'; og.fillRect(0, 0, out.width, out.height);
MAPS.forEach((m, i) => {
  const low = createCanvas(VW, VH), rd = new Renderer(low.getContext('2d') as any, (w, h) => createCanvas(w, h) as any);
  const v = rd.resizePixels(VW, VH);
  const e: any = new GameEngine(AGENT_BY_ID.zephyr, m, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  e.setView(v.w, v.h); e.updateSpawner = () => {};
  for (let k = 0; k < 120; k++) e.update(1 / 60);
  e.banner.t = 0; e.player.x += 300; e.player.y += 180;
  for (let k = 0; k < 4; k++) e.update(1 / 60);
  e.time = 37.4;
  rd.render(e);
  og.drawImage(low, (i % 2) * (VW * S + 10), Math.floor(i / 2) * (VH * S + 10), VW * S, VH * S);
  console.log(m.id);
});
writeFileSync('shots/ambiente-zonas.png', out.toBuffer('image/png'));
