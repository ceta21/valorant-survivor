// Prueba de las mascotas: te siguen, los robots las derriban, vuelven al minuto y atacan con su poder.
// Uso: npm run test:pets   (guarda una captura en shots/pets.png)
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer } from '../src/game/Renderer';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAPS } from '../src/data/maps';
import { PETS, PET_RESPAWN } from '../src/data/shop';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`${c ? 'OK ' : 'MAL'} ${m}`); if (!c) fails++; };
const noop = { onLevelUp() {}, onEnd() {}, sfx() {} };
const meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };
const step = (e: GameEngine, s: number) => { for (let i = 0; i < 60 * s; i++) { if (e.state === 'levelup') e.chooseUpgrade(0); e.player.hp = e.stats.maxHp; e.update(1 / 60); } };

// sin mascota
ok(new GameEngine(AGENT_BY_ID.jett, MAPS[0], meta, noop).me.pet === null, 'sin mascota equipada no hay mascota');

// con mascota pero sin poder: solo acompaña
const a = new GameEngine(AGENT_BY_ID.jett, MAPS[0], meta, noop, undefined, 'classic', undefined, { pet: 'pet_brasin', petLv: 0 });
a.setView(1100, 640);
a.inputMove.x = 1; step(a, 3); a.inputMove.x = 0; step(a, 1);
const pa = a.me.pet!;
ok(Math.hypot(pa.x - a.player.x, pa.y - a.player.y) < 80, 'te sigue al moverte');
ok(!a.projs.some(p => p.look === 'flame'), 'sin poder no ataca');

// derribada: vuelve a los 60 s
a.damageTurret(pa, 1e9);
ok(pa.dead, 'los golpes la derriban');
step(a, PET_RESPAWN - 2);
ok(pa.dead, `sigue fuera a los ${PET_RESPAWN - 2} s`);
step(a, 2.5);
ok(!pa.dead && pa.hp > 0, `vuelve a los ${PET_RESPAWN} s`);

// cada mascota con poder ataca a los robots
for (const def of PETS) {
  const e = new GameEngine(AGENT_BY_ID.jett, MAPS[0], meta, noop, undefined, 'classic', undefined, { pet: def.id, petLv: 3 });
  e.setView(1100, 640);
  const p = e.player;
  for (let i = 0; i < 12; i++) e.spawnEnemy('tank', p.x + 160 + (i % 4) * 30, p.y - 60 + Math.floor(i / 4) * 40);
  // su ataque se reconoce por el aspecto: llama, rayo u hojas, o la explosión de agua o hielo
  let seen = false;
  for (let i = 0; i < 60 * 4; i++) {
    e.player.hp = e.stats.maxHp; e.update(1 / 60);
    seen ||= e.projs.some(b => !b.dead && (b.look === 'flame' || b.look === 'bolt' || b.look === 'leaf')) || e.vfx.some(v => v.pal === 'water' || v.pal === 'ice');
  }
  ok(seen, `${def.name} (${def.element}) ataca con su poder`);
  if (def.id === 'pet_brasin') {
    mkdirSync('shots', { recursive: true });
    const low = createCanvas(550, 320), out = createCanvas(1100, 640), o = out.getContext('2d') as any; o.imageSmoothingEnabled = false;
    const rd = new Renderer(low.getContext('2d') as any, (w, h) => createCanvas(w, h) as any); rd.resizePixels(550, 320); rd.render(e);
    o.drawImage(low, 0, 0, 1100, 640); writeFileSync('shots/pets.png', out.toBuffer('image/png'));
  }
}

console.log(fails ? `\n${fails} fallos` : '\nTodo bien');
process.exitCode = fails ? 1 : 0;
