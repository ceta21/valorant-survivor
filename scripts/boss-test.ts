// Prueba de los ataques propios de cada jefe: escudo del Coloso, telarañas de la Reina, tormenta del Elemental,
// aliento del Dragón y salto del Sabio. Uso: npm run test:bosses
import { GameEngine, WEB_SLOW } from '../src/game/GameEngine';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAP_BY_ID } from '../src/data/maps';
import { ENEMIES } from '../src/data/enemies';
import { BossPattern } from '../src/game/types';

let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };
const noop = { onLevelUp() {}, onEnd() {}, sfx() {} }, meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };

/** Partida con un jefe a `dist` del jugador que empieza el ataque `kind`; el jugador no se mueve ni dispara. */
function setup(boss: string, kind: BossPattern, dist = 200) {
  const e: any = new GameEngine(AGENT_BY_ID.ember, MAP_BY_ID.reino, meta, noop as any);
  e.weapons.length = 0; e.updateWeapons = () => {}; e.updateSpawner = () => {};
  e.me.stats.maxHp = e.me.body.hp = 1e6;
  const p = e.me.body;
  const b = e.spawnEnemy(boss, p.x + dist, p.y);
  b.atkT = 0;
  e.bossLogic = ((orig: any) => function (this: any, en: any, ...r: any[]) {
    if (en === b && !en.atk && !b.forced) { b.forced = true; en.atk = { kind, t: 0, dur: durOf(kind), x: p.x, y: p.y, ang: Math.atan2(p.y - en.y, p.x - en.x), fired: 0 }; }
    return orig.call(this, en, ...r);
  })(e.bossLogic);
  return { e, b, p };
}
const durOf = (k: BossPattern) => ({ shield: 0.6, web: 1.0, storm: 2.4, flame: 2.4, blink: 1.1 } as any)[k] ?? 1;
const run = (e: any, s: number, each?: () => void) => { for (let i = 0; i < s * 60; i++) { each?.(); e.step(1 / 60); } };

for (const [id, k] of [['coloso', 'shield'], ['reina', 'web'], ['elemental', 'storm'], ['dragon', 'flame'], ['sabio', 'blink'], ['dragon_final', 'flame'], ['dragon_final', 'storm']] as const)
  ok((ENEMIES[id].patterns ?? []).includes(k), `${ENEMIES[id].name}${id === 'dragon_final' ? ' (final)' : ''} usa «${k}»`);

{ // escudo
  const { e, b } = setup('coloso', 'shield');
  run(e, 0.8);
  ok(b.shieldT > 3, `el Coloso se pone el escudo (${b.shieldT.toFixed(1)} s)`);
  const hp = b.hp; e.damageEnemy(b, 100, false); ok(Math.abs(hp - b.hp - 25) < 1e-6, 'con escudo recibe un 25 % del daño');
  b.atkT = 999; run(e, 6); const hp2 = b.hp; e.damageEnemy(b, 100, false); ok(Math.abs(hp2 - b.hp - 100) < 1e-6, 'el escudo se acaba');
}
{ // telarañas
  const { e, p } = setup('reina', 'web', 300);
  run(e, 1.1);
  const webs = e.hazards.filter((h: any) => h.kind === 'web');
  ok(webs.length >= 3, `la Reina lanza ${webs.length} telarañas`);
  ok(e.inWeb(p.x, p.y), 'una cae justo donde estás');
  // andar dentro de la telaraña es más lento
  const sx = p.x; e.me.inputMove.x = -1; e.me.inputMove.y = 0;
  const speedIn = (() => { const x0 = p.x; e.updatePlayer(0.1); return Math.abs(p.x - x0); })();
  p.x = sx + 2000; const speedOut = (() => { const x0 = p.x; e.updatePlayer(0.1); return Math.abs(p.x - x0); })();
  ok(speedOut > 0 && Math.abs(speedIn / speedOut - WEB_SLOW) < 0.05, `dentro de la telaraña se anda al ${Math.round((speedIn / Math.max(1e-9, speedOut)) * 100)} %`);
  e.enemies.forEach((m: any) => { m.atkT = 999; m.atk = null; }); run(e, 7); ok(e.hazards.filter((h: any) => h.kind === 'web').length === 0, 'las telarañas desaparecen');
}
{ // tormenta
  const { e, p } = setup('elemental', 'storm', 300);
  const hp0 = p.hp; let maxBolts = 0;
  run(e, 3.6, () => { maxBolts = Math.max(maxBolts, e.hazards.filter((h: any) => h.kind === 'bolt').length); });
  ok(maxBolts >= 2, `caen rayos avisados (hasta ${maxBolts} a la vez)`);
  ok(p.hp < hp0, `quedarse quieto bajo la tormenta duele (−${Math.round(hp0 - p.hp)})`);
  ok(e.hazards.length === 0, 'los rayos se acaban');
}
{ // aliento
  const { e, p } = setup('dragon', 'flame', 180);
  const hp0 = p.hp; run(e, 0.6); ok(p.hp === hp0, 'durante el aviso del aliento no hay daño');
  run(e, 1.9); ok(p.hp < hp0, `el aliento quema delante del Dragón (−${Math.round(hp0 - p.hp)})`);
  const b2 = setup('dragon', 'flame', 180); b2.p.y += 400; b2.p.x -= 300;
  const h1 = b2.p.hp; run(b2.e, 0.75); ok(b2.p.hp === h1, 'fuera del cono no quema');
}
{ // salto del Sabio
  const { e, b, p } = setup('sabio', 'blink', 900);
  const d0 = Math.hypot(b.x - p.x, b.y - p.y); run(e, 0.7);
  const d1 = Math.hypot(b.x - p.x, b.y - p.y);
  ok(d0 > 800 && d1 < 260, `el Sabio salta a tu lado (de ${Math.round(d0)} a ${Math.round(d1)} px)`);
  ok(e.eprojs.length >= 12, `y suelta un anillo de ${e.eprojs.length} disparos`);
}
if (fails) { console.error(`\n${fails} fallo(s)`); process.exit(1); }
console.log('\nTodo correcto');
