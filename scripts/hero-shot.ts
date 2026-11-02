// Capturas de los héroes en partida (shots/heroes-andando.png): varias poses del ciclo de andar de frente, de perfil
// y de espaldas, ampliadas para revisar la animación y la nitidez. Uso: npx tsx scripts/hero-shot.ts
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { setAgentSheet } from '../src/game/sprites';
import { AGENT_IMAGES } from '../src/data/agentImages';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer, PX } from '../src/game/Renderer';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAP_BY_ID } from '../src/data/maps';

mkdirSync('shots', { recursive: true });
for (const id of Object.keys(AGENT_IMAGES)) setAgentSheet(id, await loadImage(`public/agents/${id}.webp`));
const VW = 160, VH = 120, Z = 4;   // trozo del lienzo alrededor del héroe y ampliación
const heroes = ['ember', 'kael', 'draco', 'tink'];
const moves: [string, number, number][] = [['quieto', 0, 0], ['frente', 0, 1], ['perfil', 1, 0], ['espalda', 0, -1]];
const steps = [0, 0.13, 0.26, 0.39];
const out = createCanvas(moves.length * steps.length * (64 * Z + 4) + 20, heroes.length * (64 * Z + 4) + 20), og = out.getContext('2d') as any;
og.fillStyle = '#1a1424'; og.fillRect(0, 0, out.width, out.height); og.imageSmoothingEnabled = false;
heroes.forEach((id, hi) => {
  let col = 0;
  for (const [, mx, my] of moves) for (const ts of steps) {
    const low = createCanvas(VW, VH), rd = new Renderer(low.getContext('2d') as any, (w, h) => createCanvas(w, h) as any);
    const v = rd.resizePixels(VW, VH);
    const e: any = new GameEngine(AGENT_BY_ID[id], MAP_BY_ID.reino, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
    e.setView(v.w, v.h); e.updateSpawner = () => {}; e.weapons.length = 0;
    for (let i = 0; i < 30; i++) e.update(1 / 60);
    e.enemies.length = 0; e.crates.length = 0; e.banner.t = 0;
    e.player.x += 360; e.player.y += 200;   // lejos de la fuente de la plaza
    // un enemigo normal al lado, para comparar tamaños
    e.spawnEnemy('soldado', e.player.x + 34, e.player.y + 4); e.enemies.forEach((m: any) => { m.speed = 0; m.atkT = 99; });
    e.inputMove.x = mx; e.inputMove.y = my; e.time = 10 + ts; e.lastShotT = -9;
    rd.render(e);
    // recorte centrado en el héroe
    const cw = 64, ch = 64;
    og.drawImage(low, VW / 2 - cw / 2, VH / 2 - ch / 2 - 8, cw, ch, 10 + col * (cw * Z + 4), 10 + hi * (ch * Z + 4), cw * Z, ch * Z);
    col++;
  }
});
writeFileSync('shots/heroes-andando.png', out.toBuffer('image/png'));
console.log('ok', PX);
