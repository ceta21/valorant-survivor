// Prueba del equipo: rarezas del botín, ventaja aplicada al héroe, mejorar/desmontar y que los jefes sueltan objetos.
import { GEAR, GEAR_BY_ID, emptyGear, gearBonus, gearUpgradeCost, gearScrapValue, gearValue, rollLoot } from '../src/data/gear';
import { GameEngine } from '../src/game/GameEngine';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAP_BY_ID } from '../src/data/maps';

let fail = 0;
const ok = (c: boolean, m: string) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };

// rarezas
for (const [tier, fin] of [[0, false], [2, false], [0, true]] as [number, boolean][]) {
  const c = [0, 0, 0, 0];
  for (let i = 0; i < 20000; i++) c[rollLoot(tier, fin).rarity]++;
  console.log(`  zona ${tier}${fin ? ' (final)' : ''}: ${c.map(n => (n / 200).toFixed(1) + '%').join(' / ')}`);
  if (fin) ok(c[0] + c[1] === 0, 'el jefe final solo da épico o legendario');
}
ok(rollLoot(5, false).id in GEAR_BY_ID && GEAR.length === 12, '12 objetos y botín válido');

// ventaja
const g = emptyGear();
g.items.push({ uid: 'b', id: 'botas_grieta', rarity: 3, lvl: 5 }, { uid: 'p', id: 'placa_titanio', rarity: 1, lvl: 1 }, { uid: 'x', id: 'ojo_rubi', rarity: 0, lvl: 1 });
g.equipped.push('b', 'p', 'x');
const bonus = gearBonus(g);
ok(bonus.crit === undefined, 'solo cuentan 3 equipados');
ok(Math.abs((bonus.speed ?? 0) - 0.12 * 1.6) < 1e-9, 'nivel 5 = +60 % del valor');
const noop = { onLevelUp() {}, onEnd() {}, sfx() {} }, meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };
const mk = (gear: any): any => new GameEngine(AGENT_BY_ID.ember, MAP_BY_ID.reino, meta, noop as any, undefined, undefined, {}, gear);
const base = mk({}), withGear = mk(bonus);
ok(withGear.me.stats.maxHp === base.me.stats.maxHp + 14, 'vida máxima sumada');
ok(Math.abs(withGear.me.stats.speed / base.me.stats.speed - (1 + bonus.speed!)) < 1e-9, 'velocidad multiplicada');
ok(Math.abs(withGear.me.stats.dmg - base.me.stats.dmg - gearValue(g.items[0])) < 1e-9, 'daño sumado');

// costes
ok(gearUpgradeCost({ uid: '', id: 'colmillo', rarity: 2, lvl: 3 }) === 2250 && gearScrapValue({ uid: '', id: 'colmillo', rarity: 2, lvl: 3 }) === 1080, 'costes de mejorar y desmontar');

// los jefes sueltan botín
const eng = mk({});
eng.spawnEnemy('zona', eng.me.x + 60, eng.me.y);
const boss = eng.enemies.find((e: any) => e.isBoss);
ok(!!boss, 'aparece el jefe');
if (boss) eng.killEnemy(boss, false);
const res = eng.resultFor(0);
ok(eng.loot.length >= 1 && (res.loot?.length ?? 0) >= 1, `al matar al jefe hay botín (${eng.loot.map((l: any) => l.id + ':' + l.rarity).join(', ')})`);

if (fail) { console.error(`\n${fail} fallo(s)`); process.exit(1); }
console.log('\nEquipo OK');
