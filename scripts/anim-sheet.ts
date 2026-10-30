import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer } from '../src/game/Renderer';
import { AGENTS } from '../src/data/agents';
import { MAPS } from '../src/data/maps';

mkdirSync('shots', { recursive: true });
const W = 1100, H = 640;
const cv = createCanvas(W, H), ctx = cv.getContext('2d') as any;
const rd = new Renderer(ctx, (w, h) => createCanvas(w, h) as any);
const view = rd.resize(W, H);
const guns = ['classic', 'vandal', 'phantom', 'spectre', 'operator', 'sheriff', 'judge', 'odin'];
const states = ['idle', 'walk0', 'walk1', 'run', 'cast', 'dash'];
const CW = 150, CH = 150;
const sheet = createCanvas(CW * 8, CH * 2) as any, sg = sheet.getContext('2d');
sg.fillStyle = '#1b2a38'; sg.fillRect(0, 0, sheet.width, sheet.height);

function snap(agentId: string, gun: string, state: string, col: number, row: number) {
  const e = new GameEngine(AGENTS.find(a => a.id === agentId)!, MAPS[0], { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  e.setView(view.w, view.h);
  e.held = gun; e.player.face = 0.15;
  for (let i = 0; i < 5; i++) e.update(1 / 60);
  e.time = 10;
  if (state === 'walk0') { e.inputMove.x = 1; e.time = 10.0; }
  if (state === 'walk1') { e.inputMove.x = 1; e.time = 10.1; }
  if (state === 'run') { e.inputMove.x = 1; e.buffs.sprintT = 3; e.time = 10.05; }
  if (state === 'cast') { e.castT = e.time - 0.12; e.castUlt = false; }
  if (state === 'dash') { e.player.dashT = 0.1; e.player.dashVx = 900; e.player.dashVy = 0; }
  if (gun !== 'classic') e.lastShotT = e.time - 0.02;
  rd.render(e);
  const cx = Math.round(e.player.x - rd.camX) , cy = Math.round(e.player.y - rd.camY);
  sg.drawImage(cv, cx - CW / 2, cy - CH / 2 - 10, CW, CH, col * CW, row * CH, CW, CH);
}
guns.forEach((gn, i) => snap('grim', gn, 'idle', i, 0));
states.forEach((st, i) => snap('zephyr', 'vandal', st, i, 1));
snap('volt', 'judge', 'walk1', 6, 1); snap('tink', 'operator', 'cast', 7, 1);
writeFileSync('shots/anim.png', sheet.toBuffer('image/png'));
// mapas completos
for (const m of MAPS) {
  const e = new GameEngine(AGENTS[0], m, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  e.setView(view.w, view.h);
  rd.render(e);
  writeFileSync(`shots/map_${m.id}.png`, cv.toBuffer('image/png'));
}
console.log('ok');
