// Captura de efectos de combate (shots/combate.png): enemigos rompiéndose en piezas, números de daño (normales, de
// elemento y críticos) y la explosión de un jefe derrotado. Uso: npx tsx scripts/combat-shot.ts
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { setAgentSheet } from '../src/game/sprites';
import { setEnemyArt } from '../src/game/enemyArt';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer } from '../src/game/Renderer';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAP_BY_ID } from '../src/data/maps';

mkdirSync('shots', { recursive: true });
for (const f of readdirSync('public/agents')) setAgentSheet(f.replace(/\.\w+$/, ''), await loadImage('public/agents/' + f));
for (const f of readdirSync('public/enemies')) setEnemyArt(f.replace('.png', ''), await loadImage('public/enemies/' + f) as any);
const VW = 330, VH = 190, S = 3;
const out = createCanvas(VW * S, (VH * S + 8) * 2), og = out.getContext('2d') as any;
og.imageSmoothingEnabled = false;
for (const [row, boss] of [[0, false], [1, true]] as const) {
  const low = createCanvas(VW, VH), rd = new Renderer(low.getContext('2d') as any, (w, h) => createCanvas(w, h) as any);
  const v = rd.resizePixels(VW, VH);
  const e: any = new GameEngine(AGENT_BY_ID.volt, MAP_BY_ID.reino, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  e.setView(v.w, v.h); e.updateSpawner = () => {}; e.weapons.length = 0;
  for (let i = 0; i < 30; i++) e.update(1 / 60);
  e.enemies.length = 0; e.crates.length = 0; e.banner.t = 0; e.player.x += 400; e.player.y += 250;
  const p = e.player;
  if (boss) {
    const b = e.spawnEnemy('zona', p.x + 120, p.y - 20); e.killEnemy(b, false);
  } else {
    for (let i = 0; i < 5; i++) {
      const en = e.spawnEnemy('soldado', p.x - 200 + i * 90, p.y - 60 + (i % 2) * 70);
      e.damageEnemy(en, 23 + i * 7, i === 2, { color: i % 2 ? '#2fe6ff' : '#9ad8ff' });
      if (i !== 4) e.killEnemy(en, false);
    }
  }
  for (let i = 0; i < 9; i++) e.step(1 / 60);
  rd.render(e);
  og.drawImage(low, 0, row * (VH * S + 8), VW * S, VH * S);
}
writeFileSync('shots/combate.png', out.toBuffer('image/png'));
console.log('ok');
