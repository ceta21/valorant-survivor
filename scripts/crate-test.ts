// Prueba de las cajas rompibles: aparecen cerca, se rompen con los poderes y las explosiones, y cada premio
// (curación, imán, bomba, monedas) hace lo suyo. Uso: npm run test:crates
import { GameEngine, Gem } from '../src/game/GameEngine';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAP_BY_ID } from '../src/data/maps';
let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };
const noop = { onLevelUp() {}, onEnd() {}, sfx() {} }, meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };
const mk = () => { const e = new GameEngine(AGENT_BY_ID.zephyr, MAP_BY_ID.reino, meta, noop); e.player.invuln = 1e9; return e; };

// 1. aparecen solas, cerca del jugador y sin pasar del máximo
{
  const e = mk();
  for (let i = 0; i < 60 * 60; i++) { e.enemies.length = 0; e.update(1 / 60); }
  const near = e.crates.every(c => Math.hypot(c.x - e.player.x, c.y - e.player.y) < 1800);
  ok(e.crates.length >= 3 && e.crates.length <= 6, `en 1 minuto aparecen cajas (${e.crates.length}, máximo 6)`);
  ok(near && e.crates.every(c => !e.world.hit(c.x, c.y, 20)), 'cerca del jugador y nunca dentro de un obstáculo');
}

// 2. los poderes y las explosiones las rompen, y sueltan premio + experiencia
{
  const e = mk();
  // lejos del jugador, para que no recoja el premio antes de comprobarlo
  e.crates.push({ id: 999, x: e.player.x + 600, y: e.player.y, hp: 30, max: 30, flash: 0, dead: false });
  for (let i = 0; i < 20; i++) e.spawnProj(e.player.x + 560, e.player.y, 0, 400, 10, 6, 400, 0, false, '#fff');
  const gems0 = e.gems.length;
  for (let i = 0; i < 30 && e.crates.some(c => c.id === 999); i++) { e.enemies.length = 0; e.update(1 / 60); }
  ok(!e.crates.some(c => c.id === 999), 'los proyectiles rompen la caja');
  ok(e.gems.length >= gems0 + 2 && e.gems.some(g => g.kind > 0), 'al romperse suelta un premio y experiencia');
  e.crates.push({ id: 1000, x: e.player.x - 300, y: e.player.y, hp: 30, max: 30, flash: 0, dead: false });
  e.explodeAt(e.player.x - 300, e.player.y, 60, 50, '#fff');
  e.update(1 / 60);
  ok(!e.crates.some(c => c.id === 1000), 'las explosiones también las rompen');
}

// 3. cada premio hace su efecto al recogerlo
const pick = (e: GameEngine, kind: Gem['kind'], v: number) => { e.gems.push({ x: e.player.x, y: e.player.y, v, kind, mag: false, dead: false, t: 0 }); e.update(1 / 60); };
{
  const e = mk();
  e.player.hp = e.stats.maxHp * 0.5; pick(e, 1, 0.25);
  ok(e.player.hp > e.stats.maxHp * 0.7, 'curación: recupera vida');
  e.gems.push({ x: e.player.x + 900, y: e.player.y, v: 1, kind: 0, mag: false, dead: false, t: 0 });
  pick(e, 2, 0);
  ok(e.gems.filter(g => g.kind === 0).every(g => g.mag), 'imán: atrae todas las gemas de experiencia');
  const before = e.resultFor(0).credits; pick(e, 4, 20);
  ok(e.resultFor(0).credits === before + 20, 'monedas: suman créditos al resultado');
  e.spawnEnemy('grunt', e.player.x + 200, e.player.y);
  const n = e.enemies.filter(m => !m.dead).length; pick(e, 3, 0);
  ok(n > 0 && e.enemies.filter(m => !m.dead).length === 0, 'bomba: barre a los enemigos cercanos');
}
// 4. el premio sale despedido, cae al suelo y se queda ahí hasta que lo pisas (aunque esté cerca)
{
  const e = mk();
  e.crates.push({ id: 77, x: e.player.x + 110, y: e.player.y, hp: 1, max: 1, flash: 0, dead: false });
  e.damageCrate(e.crates[e.crates.length - 1], 5);
  const prize = e.gems.find(g => g.box)!;
  let maxZ = 0;
  for (let i = 0; i < 60 * 3; i++) { e.enemies.length = 0; e.inputMove = { x: 0, y: 0 }; e.update(1 / 60); maxZ = Math.max(maxZ, prize.z ?? 0); }
  ok(maxZ > 30 && prize.z === 0, `salta al salir (hasta ${Math.round(maxZ)} de altura) y acaba en el suelo`);
  ok(!prize.dead && !prize.mag, 'no vuela hacia ti: se queda en el suelo aunque estés cerca');
  for (let i = 0; i < 60 * 2 && !prize.dead; i++) {
    const dx = prize.x - e.player.x, dy = prize.y - e.player.y, d = Math.hypot(dx, dy) || 1;
    e.enemies.length = 0; e.inputMove = { x: dx / d, y: dy / d }; e.update(1 / 60);
  }
  ok(prize.dead, 'al pasarle por encima se recoge');
}
// 5. el poder dispara a la caja si está más cerca que el enemigo más cercano
{
  const e = mk();
  e.enemies.length = 0; e.crates.length = 0;
  const { x, y } = e.player;
  e.crates.push({ id: 88, x: x + 120, y, hp: 1e6, max: 1e6, flash: 0, dead: false });
  e.spawnEnemy('grunt', x - 300, y);
  e.projs.length = 0; e.update(1 / 60); for (let i = 0; i < 40 && !e.projs.length; i++) e.update(1 / 60);
  ok(e.projs.length > 0 && e.projs[0].vx > 0, 'caja más cerca que el enemigo: dispara a la caja');
  e.crates[0].x = x + 380; e.enemies.forEach(m => { m.x = x - 100; m.y = y; });
  e.projs.length = 0; for (let i = 0; i < 40 && !e.projs.length; i++) e.update(1 / 60);
  ok(e.projs.length > 0 && e.projs[0].vx < 0, 'enemigo más cerca que la caja: dispara al enemigo');
}
console.log(fails ? `\n${fails} FALLOS` : '\nTodo correcto'); process.exit(fails ? 1 : 0);
