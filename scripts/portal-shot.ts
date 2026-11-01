// Capturas de los portales entre zonas en el juego (shots/portales_<zona>.png). Uso: npx tsx scripts/portal-shot.ts
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { setEnemyArt, setPortalArt } from '../src/game/enemyArt';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer } from '../src/game/Renderer';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAPS } from '../src/data/maps';

mkdirSync('shots', { recursive: true });
for (const f of readdirSync('public/portals')) setPortalArt(f.replace('.png', ''), await loadImage('public/portals/' + f) as any);
for (const f of readdirSync('public/enemies')) setEnemyArt(f.replace('.png', ''), await loadImage('public/enemies/' + f) as any);
const W = 1100, H = 640, S = 2;
const low = createCanvas(W / S, H / S), canvas = createCanvas(W, H);
const out = canvas.getContext('2d') as any; out.imageSmoothingEnabled = false;
const rd = new Renderer(low.getContext('2d') as any, (w, h) => createCanvas(w, h) as any);
const view = rd.resizePixels(W / S, H / S);

for (const [z, m] of MAPS.entries()) {
  const e: any = new GameEngine(AGENT_BY_ID.zephyr, m, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  e.setView(view.w, view.h); e.updateSpawner = () => {};
  e.update(1 / 60);
  const pt = e.world.portals.find((p: any) => p.zone === z);
  e.player.x = pt.x + 150; e.player.y = pt.y + 90; e.portalCd = 99;
  e.enemies.length = 0; e.crates.length = 0;
  for (let i = 0; i < 40; i++) e.update(1 / 60);
  e.player.x = pt.x + 150; e.player.y = pt.y + 90;
  rd.render(e);
  out.drawImage(low, 0, 0, W, H);
  writeFileSync(`shots/portales_${m.id}.png`, canvas.toBuffer('image/png'));
  console.log(m.id, '→', MAPS[pt.to].id);
}
