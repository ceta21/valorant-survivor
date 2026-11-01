// Prueba de los tipos de habilidad nuevos: órbita, rebote, espiral, bumerán y rastro. Cada una debe dañar a los
// enemigos y comportarse como dice su descripción. Uso: npm run test:kinds
import { GameEngine } from '../src/game/GameEngine';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAP_BY_ID } from '../src/data/maps';
let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };
const noop = { onLevelUp() {}, onEnd() {}, sfx() {} }, meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };

/** Partida con un héroe, sin poder básico ni enemigos que aparezcan solos, y un anillo de enemigos alrededor. */
function setup(agent: string) {
  const e = new GameEngine(AGENT_BY_ID[agent], MAP_BY_ID.reino, meta, noop);
  e.player.invuln = 1e9; e.weapons.length = 0; e.enemies.length = 0; e.crates.length = 0;
  const { x, y } = e.player;
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, d = 80 + (i % 3) * 60; e.spawnEnemy('escudo_n', x + Math.cos(a) * d, y + Math.sin(a) * d); }
  for (const m of e.enemies) { m.speed = 0; m.maxHp = m.hp = 1e5; }
  return e;
}
const run = (e: GameEngine, s: number, f?: () => void) => { for (let i = 0; i < s * 60; i++) { f?.(); e.update(1 / 60); } };
const hurt = (e: GameEngine) => e.enemies.filter(m => m.hp < m.maxHp).length;

// órbita (Aqua): las burbujas giran alrededor y golpean a los enemigos cercanos
{
  const e = setup('aqua'); e.cast('special');
  ok(e.buffs.orbitT > 0 && e.buffs.orbitN === 6, 'órbita: 6 burbujas activas');
  const a0 = e.buffs.orbitAng; run(e, 2);
  ok(e.buffs.orbitAng > a0 && hurt(e) >= 3, `órbita: giran y golpean (${hurt(e)} enemigos tocados)`);
  run(e, 6); ok(e.buffs.orbitT <= 0, 'órbita: se acaba a los 6 s');
}
// rebote (Zephyr): cada orbe toca a varios enemigos distintos
{
  const e = setup('zephyr'); e.cast('secondary');
  ok(e.projs.filter(p => p.look === 'star' && (p.bounce ?? 0) > 0).length === 3, 'rebote: salen 3 estrellas arcanas con saltos');
  run(e, 2); ok(hurt(e) >= 5, `rebote: saltan de enemigo en enemigo (${hurt(e)} enemigos tocados)`);
}
// espiral (Nox): lanza bolas en todas direcciones durante un rato
{
  const e = setup('nox'); e.cast('special'); run(e, 1);
  const angs = new Set(e.projs.filter(p => p.look === 'wisp' && p.pal === 'gravity').map(p => Math.round(Math.atan2(p.vy, p.vx) * 2)));
  ok(angs.size >= 8, `espiral: bolas en muchas direcciones (${angs.size})`);
  run(e, 2); ok(hurt(e) >= 4, `espiral: dañan a los enemigos (${hurt(e)})`);
}
// bumerán (Grim): va, vuelve al héroe y desaparece
{
  const e = setup('grim'); e.cast('special');
  const disc = e.projs.find(p => p.look === 'disc')!;
  let far = 0, back = false;
  run(e, 3, () => { if (disc.dead) return; const d = Math.hypot(disc.x - e.player.x, disc.y - e.player.y); far = Math.max(far, d); if (disc.ret === 2) back = true; });
  ok(far > 250 && back && disc.dead, `bumerán: llega a ${Math.round(far)} y vuelve a ti`);
  ok(hurt(e) >= 1, 'bumerán: golpea a los enemigos que atraviesa');
}
// rastro (Sylvan): al andar deja charcos que dañan y ralentizan
{
  const e = setup('sylvan'); e.cast('special');
  run(e, 2, () => { e.inputMove = { x: 1, y: 0 }; });
  ok(e.puddles.length >= 5, `rastro: deja charcos al andar (${e.puddles.length})`);
  const m = e.enemies[0]; m.x = e.puddles[0].x; m.y = e.puddles[0].y; const hp = m.hp;
  run(e, 0.5, () => { e.inputMove = { x: 0, y: 0 }; });
  ok(m.hp < hp && m.slowT > 0, 'rastro: el charco daña y ralentiza a quien lo pisa');
}
console.log(fails ? `\n${fails} FALLOS` : '\nTodo correcto'); process.exit(fails ? 1 : 0);
