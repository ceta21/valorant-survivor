// Prueba de los eventos del domingo: solo hay evento los domingos, cada domingo uno distinto, y cada uno cambia la
// partida como dice.
// Uso: npm run test:events
import { EVENTS, EVENT_BY_ID, NO_EVENT, currentEvent, isSunday, msToEventChange, sundayEvent } from '../src/data/events';
import { GameEngine } from '../src/game/GameEngine';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAP_BY_ID } from '../src/data/maps';

let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };
const noop = { onLevelUp() {}, onEnd() {}, sfx() {} }, meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };
const mk = (id?: string): any => { const e: any = new GameEngine(AGENT_BY_ID.ember, MAP_BY_ID.reino, meta, noop as any); e.event = id ? EVENT_BY_ID[id] : NO_EVENT; return e; };

// calendario (hora local)
const H = 3600000, sun = new Date(2026, 10, 1, 12).getTime(), sat = new Date(2026, 10, 7, 20).getTime(), mon = new Date(2026, 10, 2, 0, 0, 1).getTime();
ok(isSunday(sun) && currentEvent(sun).id !== 'none', `el domingo hay evento (${currentEvent(sun).name})`);
ok(currentEvent(mon).id === 'none' && currentEvent(sat).id === 'none', 'de lunes a sábado no hay evento');
ok(sundayEvent(sat).id !== sundayEvent(sun).id && sundayEvent(sat).id === currentEvent(sun + 7 * 24 * H).id, `entre semana se anuncia el del próximo domingo (${sundayEvent(sat).name})`);
ok(msToEventChange(sun) === 12 * H && msToEventChange(sat) === 4 * H, 'cuenta bien cuánto le queda el domingo y cuánto falta entre semana');
const seen = new Set(Array.from({ length: EVENTS.length }, (_, i) => currentEvent(sun + i * 7 * 24 * H).id));
ok(seen.size === EVENTS.length, `en ${EVENTS.length} domingos salen todos (${[...seen].join(', ')})`);

// efectos
{ const a = mk(), b = mk('oro'); for (const e of [a, b]) { e.kills = 200; e.time = 300; e.level = 15; }
  ok(Math.abs(b.resultFor(0).credits / a.resultFor(0).credits - 1.5) < 0.02, `Fiebre del oro: ×1,5 créditos (${a.resultFor(0).credits} → ${b.resultFor(0).credits})`); }
{ const a = mk(), b = mk('saber');
  // se mide recogiendo una gema junto al jugador
  for (const e of [a, b]) { e.gems.length = 0; e.dropGem(e.me.body.x, e.me.body.y, 3, 0); for (let i = 0; i < 30; i++) e.step(1 / 60); }
  ok(b.xp > a.xp * 1.4, `Semana del saber: más experiencia por gema (${a.xp.toFixed(1)} → ${b.xp.toFixed(1)})`); }
{ const a = mk(), b = mk('jefes');
  const ba = a.spawnEnemy('zona', a.me.body.x + 400, a.me.body.y), bb = b.spawnEnemy('zona', b.me.body.x + 400, b.me.body.y);
  ok(Math.abs(bb.maxHp / ba.maxHp - 1.5) < 0.01, 'Caza de jefes: los jefes tienen +50 % de vida');
  b.killEnemy(bb, false); a.killEnemy(ba, false);
  ok(b.loot.length === 2 && a.loot.length === 1, `y sueltan 2 objetos en vez de 1 (${b.loot.length})`); }
{ const run = (id?: string) => { const e = mk(id); e.updateSpawner = () => {}; e.crates.length = 0; e.crateT = 0; for (let i = 0; i < 60 * 40; i++) e.updateCrates(1 / 60); return e.crates.filter((c: any) => !c.dead).length; };
  const a = run(), b = run('cajas');
  ok(b > a, `Lluvia de cajas: más cajas en 40 s (${a} → ${b})`); }
{ const run = (id?: string) => { const e = mk(id); e.me.stats.maxHp = e.me.body.hp = 1e9; e.weapons.length = 0; for (let i = 0; i < 60 * 30; i++) e.step(1 / 60); return e.enemies.filter((m: any) => !m.dead).length; };
  let a = 0, b = 0; for (let k = 0; k < 3; k++) { a += run(); b += run('horda'); }
  ok(b > a * 1.15, `Gran horda: más enemigos (${a / 3 | 0} → ${b / 3 | 0} a los 30 s)`); }
{ const e = mk('oro'); for (let i = 0; i < 60 * 2.2; i++) e.step(1 / 60);
  ok(e.banner.key === '{i} EVENTO: {n}' && e.banner.p?.n === 'Fiebre del oro', 'al empezar, tras «¡SOBREVIVE!», avisa del evento'); }

if (fails) { console.error(`\n${fails} fallo(s)`); process.exit(1); }
console.log('\nTodo correcto');
