// Captura de cada agente usando sus habilidades (para revisar los efectos visuales).
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer } from '../src/game/Renderer';
import { AGENTS } from '../src/data/agents';
import { MAPS } from '../src/data/maps';

mkdirSync('shots', { recursive: true });
const W = 440, H = 300, S = 2;
const low = createCanvas(W / S, H / S), out = createCanvas(W * 3, H * 3 * 3);
const o = out.getContext('2d') as any;
o.imageSmoothingEnabled = false;
const rd = new Renderer(low.getContext('2d') as any, (w, h) => createCanvas(w, h) as any);
const view = rd.resizePixels(W / S, H / S);
const slots = ['special', 'secondary', 'ultimate'] as const;
const sheet = createCanvas(W * slots.length, H * AGENTS.length), sg = sheet.getContext('2d') as any;
sg.imageSmoothingEnabled = false;
AGENTS.forEach((agent, row) => slots.forEach((slot, col) => {
  const e = new GameEngine(agent, MAPS[row % MAPS.length], { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  e.setView(view.w, view.h);
  for (let i = 0; i < 60 * 40; i++) { if (e.state === 'levelup') e.chooseUpgrade(0); e.player.hp = e.stats.maxHp; e.inputMove.x = i % 600 < 300 ? 1 : -1; e.update(1 / 60); }
  e.inputMove.x = 1; e.inputMove.y = 0.3;
  e.ult = 100; e.cds.special = 0; e.cds.secondary = 0;
  const ok = e.cast(slot);
  const wait = slot === 'ultimate' && /strike/.test(agent.ultimate.kind) ? 0.45 : 0.18;
  for (let i = 0; i < wait * 60; i++) { e.player.hp = e.stats.maxHp; e.update(1 / 60); }
  rd.render(e);
  sg.drawImage(low, col * W, row * H, W, H);
  sg.fillStyle = '#000'; sg.fillRect(col * W, row * H, 230, 18);
  sg.fillStyle = '#fff'; sg.font = '12px monospace';
  const ab = slot === 'special' ? agent.special : slot === 'secondary' ? agent.secondary : agent.ultimate;
  sg.fillText(`${agent.name}: ${ab ? ab.name : '-'}${ok ? '' : ' (n/a)'}`, col * W + 4, row * H + 13);
}));
writeFileSync('shots/abilities.png', sheet.toBuffer('image/png'));
console.log('ok');
