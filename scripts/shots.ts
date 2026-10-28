// Genera capturas PNG del renderizado sin navegador (usa @napi-rs/canvas).
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer } from '../src/game/Renderer';
import { AGENTS } from '../src/data/agents';
import { MAPS } from '../src/data/maps';

mkdirSync('shots', { recursive: true });
// como en el navegador: se dibuja a baja resolución y se amplía sin suavizado
const W = 1100, H = 640, S = 2;
const low = createCanvas(W / S, H / S);
const canvas = createCanvas(W, H);
const out = canvas.getContext('2d') as any;
out.imageSmoothingEnabled = false;
const ctx = low.getContext('2d') as any;
const rd = new Renderer(ctx, (w, h) => createCanvas(w, h) as any);
const view = rd.resizePixels(W / S, H / S);

function shot(agentId: string, mapId: string, seconds: number, name: string, extra?: (e: GameEngine) => void) {
  const agent = AGENTS.find(a => a.id === agentId)!, map = MAPS.find(m => m.id === mapId)!;
  const e = new GameEngine(agent, map, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp: () => {}, onEnd: () => {}, sfx: () => {} });
  e.setView(view.w, view.h);
  let ang = 0;
  for (let i = 0; i < seconds * 60; i++) {
    const p = e.player;
    ang += 0.015;
    e.inputMove.x = Math.cos(ang); e.inputMove.y = Math.sin(ang * 1.3);
    if (e.state === 'levelup') e.chooseUpgrade(Math.floor(Math.random() * e.choices.length));
    p.hp = e.stats.maxHp;
    if (i % 20 === 0) { e.cast('special'); e.cast('secondary'); e.cast('ultimate'); }
    e.update(1 / 60);
  }
  extra?.(e);
  rd.render(e);
  out.drawImage(low, 0, 0, W, H);
  writeFileSync(`shots/${name}.png`, canvas.toBuffer('image/png'));
  console.log(name, 'ok', 'enemies', e.enemies.length, 'lvl', e.level);
}
shot('jett', 'ascent', 75, 'ascent');
shot('raze', 'bind', 170, 'bind_boss');
shot('phoenix', 'haven', 140, 'haven');
