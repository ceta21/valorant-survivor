// Prueba de las torretas de Killjoy: cuántas salen y si los robots las destruyen.
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer } from '../src/game/Renderer';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAPS } from '../src/data/maps';

const noop = { onLevelUp() {}, onEnd() {}, sfx() {} };
const e = new GameEngine(AGENT_BY_ID.tink, MAPS[0], { dmg: 0, hp: 0, speed: 0, xp: 0 }, noop);
e.setView(1100, 640);
for (let i = 0; i < 60 * 150; i++) { if (e.state === 'levelup') e.chooseUpgrade(0); e.player.hp = e.stats.maxHp; e.update(1 / 60); }

e.cds.special = 0; e.cast('special');
const afterSpecial = e.allTurrets().length;
e.ult = 100; e.cast('ultimate');
const afterUlt = e.allTurrets().length;
const hp = e.allTurrets().map(t => Math.round(t.maxHp));

// rodear al jugador de robots para ver si destruyen las torretas antes de que caduquen
const p = e.player;
for (let i = 0; i < 40; i++) e.spawnEnemy(i % 3 ? 'grunt' : 'tank', p.x + Math.cos(i) * 140, p.y + Math.sin(i) * 140);
let destroyed = 0, last = afterUlt, shot = false;
for (let i = 0; i < 60 * 10; i++) {
  if (e.state === 'levelup') e.chooseUpgrade(0);
  p.hp = e.stats.maxHp;
  e.update(1 / 60);
  const now = e.allTurrets().length;
  if (now < last) destroyed += last - now;
  last = now;
  if (!shot && e.allTurrets().some(t => t.hp < t.maxHp)) {
    shot = true;
    mkdirSync('shots', { recursive: true });
    const low = createCanvas(550, 320), out = createCanvas(1100, 640), o = out.getContext('2d') as any; o.imageSmoothingEnabled = false;
    const rd = new Renderer(low.getContext('2d') as any, (w, h) => createCanvas(w, h) as any); rd.resizePixels(550, 320); rd.render(e);
    o.drawImage(low, 0, 0, 1100, 640); writeFileSync('shots/turrets.png', out.toBuffer('image/png'));
  }
}
console.log(`Torreta: ${afterSpecial} · tras Bloqueo: ${afterUlt} · vida: ${hp.join(', ')} · destruidas por robots en 10 s: ${destroyed}`);
