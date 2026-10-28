// Prueba del motor con 2 jugadores (sin red): caídas, vuelta en la oleada, subidas de nivel y captura.
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer } from '../src/game/Renderer';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAPS } from '../src/data/maps';

const meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };
const levelups = [0, 0];
const e = new GameEngine(AGENT_BY_ID.jett, MAPS[0], meta, { onLevelUp: (_c, i) => { levelups[i]++; }, onEnd: () => {}, sfx: () => {} }, undefined, 'classic', {
  setups: [{ agent: AGENT_BY_ID.jett, meta, startWeapon: 'classic', name: 'Ana' }, { agent: AGENT_BY_ID.phoenix, meta, startWeapon: 'classic', name: 'Bruno' }],
  local: 0,
});
e.setView(1100, 640);
const log: string[] = [];
let downs = 0, revives = 0, wasDead = false;
for (let i = 0; i < 60 * 200 && e.state !== 'lost'; i++) {
  if (e.state === 'levelup') for (const pl of e.players) if (pl.choices.length) e.chooseUpgrade(0, pl.idx);
  e.players[0].inputMove.x = Math.cos(i / 120); e.players[0].inputMove.y = Math.sin(i / 160);
  e.players[1].inputMove.x = Math.cos(i / 90 + 2); e.players[1].inputMove.y = Math.sin(i / 70);
  e.players[0].body.hp = e.players[0].stats.maxHp;                 // el jugador 0 no cae: así vemos al 1 caer y volver
  if (i === 60 * 20) e.withPlayer(e.players[1], () => e.hurtPlayer(9999));
  if (i % 120 === 0 && !e.players[1].dead) e.cast('special', 1);
  e.update(1 / 60);
  const d = e.players[1].dead;
  if (d && !wasDead) { downs++; log.push(`t=${e.time.toFixed(0)} Bruno cae`); }
  if (!d && wasDead) { revives++; log.push(`t=${e.time.toFixed(0)} Bruno vuelve con ${e.players[1].body.hp.toFixed(0)} de vida`); }
  wasDead = d;
}
console.log(log.slice(0, 6).join('\n'));
console.log('estado', e.state, 'nivel', e.level, 'subidas por jugador', levelups, 'caídas', downs, 'vueltas', revives, 'bajas', e.kills);
console.log('armas', e.players.map(p => p.weapons.map(w => w.id + w.lvl).join(',')).join(' | '), 'ult', e.players.map(p => Math.round(p.ult)));
mkdirSync('shots', { recursive: true });
const low = createCanvas(550, 320), out = createCanvas(1100, 640), o = out.getContext('2d') as any;
o.imageSmoothingEnabled = false;
const rd = new Renderer(low.getContext('2d') as any, (w, h) => createCanvas(w, h) as any);
rd.resizePixels(550, 320); rd.render(e);
o.drawImage(low, 0, 0, 1100, 640);
writeFileSync('shots/coop.png', out.toBuffer('image/png'));

// abandonar con una mejora pendiente no debe bloquear la partida
const e2 = new GameEngine(AGENT_BY_ID.jett, MAPS[0], meta, { onLevelUp: () => {}, onEnd: () => {}, sfx: () => {} }, undefined, 'classic', {
  setups: [{ agent: AGENT_BY_ID.jett, meta, startWeapon: 'classic', name: 'A' }, { agent: AGENT_BY_ID.sage, meta, startWeapon: 'classic', name: 'B' }], local: 0,
});
e2.addXp(500);
e2.chooseUpgrade(0, 0); while (e2.me.pending > 0) e2.chooseUpgrade(0, 0);
const stuck = e2.state;
e2.leave(1);
console.log('abandono con mejora pendiente:', stuck, '→', e2.state);
