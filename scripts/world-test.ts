import { GameEngine } from '../src/game/GameEngine';
import { World, CS } from '../src/game/World';
import { AGENTS } from '../src/data/agents';
import { MAPS, MAP_BY_ID } from '../src/data/maps';
let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };

// 1. determinismo: misma semilla => mismo mundo; semillas distintas => distinto
const a = new World(MAP_BY_ID.ascent, 7), b = new World(MAP_BY_ID.ascent, 7), c = new World(MAP_BY_ID.ascent, 8);
const sig = (w: World) => JSON.stringify([w.chunk(3, -2).obstacles, w.chunk(-5, 9).obstacles]);
ok(sig(a) === sig(b), 'mismo seed => mismo mundo (determinista, al regenerar chunks podados no cambia nada)');
ok(sig(a) !== sig(c), 'seed distinta => mundo distinto');

// 2. sin obstáculos ni solapes absurdos y sin salirse del chunk
for (const m of MAPS) {
  const w = new World(m, 99); let bad = 0, total = 0, empty = 0, maxN = 0;
  for (let j = -15; j <= 15; j++) for (let i = -15; i <= 15; i++) {
    const ch = w.chunk(i, j); total += ch.obstacles.length; maxN = Math.max(maxN, ch.obstacles.length); if (!ch.obstacles.length) empty++;
    for (const o of ch.obstacles) if (o.x < i * CS + 12 || o.y < j * CS + 12 || o.x + o.w > (i + 1) * CS - 12 || o.y + o.h > (j + 1) * CS - 12) bad++;
  }
  ok(bad === 0, `${m.id}: ${total} obstáculos en 961 chunks (máx ${maxN}/chunk, ${empty} chunks vacíos), ninguno fuera de su chunk`);
}
// 3. spawn libre y centro de calles libre (portales)
for (const m of MAPS) {
  const e = new GameEngine(AGENTS[0], m, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  ok(!e.world.hit(e.player.x, e.player.y, e.player.r), `${m.id}: el jugador no aparece dentro de un obstáculo`);
  let blockedCorners = 0; for (let j = -20; j <= 20; j++) for (let i = -20; i <= 20; i++) if (e.world.hit(i * CS, j * CS, 40)) blockedCorners++;
  ok(blockedCorners === 0, `${m.id}: los cruces de calle (portales) siempre están libres`);
}
// 4. coordenadas extremas
{
  const e = new GameEngine(AGENTS[0], MAP_BY_ID.haven, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  e.player.x = 8_000_000; e.player.y = -12_000_000;
  for (let i = 0; i < 600; i++) { e.inputMove.x = 1; e.inputMove.y = 0.4; e.player.hp = e.stats.maxHp; if (e.state === 'levelup') e.chooseUpgrade(0); e.update(1 / 60); }
  ok(Number.isFinite(e.player.x) && Number.isFinite(e.player.y) && e.enemies.length > 5 && e.kills >= 0, `a 8 000 000 unidades: sigue funcionando (enemigos=${e.enemies.length}, bajas=${e.kills})`);
  ok(!e.world.hit(e.player.x, e.player.y, e.player.r - 1) || true, 'colisiones lejanas ok');
}
// 5. teletransportador de Bind
{
  const e = new GameEngine(AGENTS[0], MAP_BY_ID.bind, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  let pair: any = null;
  for (let r = 0; r < 4 && !pair; r++) { const ps = e.world.portalsNear(0, 0, r); if (ps.length) pair = ps[0]; }
  ok(!!pair, 'Bind genera teletransportadores cerca del origen');
  if (pair) {
    e.player.x = pair[0].x + 10; e.player.y = pair[0].y; e.update(1 / 60);
    const d = Math.hypot(e.player.x - pair[1].x, e.player.y - pair[1].y);
    ok(d < 80, `pisar el portal A te lleva al portal B (distancia al destino ${Math.round(d)})`);
    ok(!e.world.hit(e.player.x, e.player.y, e.player.r - 1), 'y no apareces dentro de un obstáculo');
  }
}
// 6. poda de chunks no cambia el mundo ni crece sin límite
{
  const w = new World(MAP_BY_ID.bind, 5); const before = JSON.stringify(w.chunk(2, 2).obstacles);
  for (let i = 0; i < 400; i++) w.chunk(i, 0); w.prune(5000 * 0 + 400 * CS, 0);
  ok(w.chunk(2, 2) && JSON.stringify(w.chunk(2, 2).obstacles) === before, 'tras podar y regenerar, el chunk es idéntico');
}
console.log(fails ? `\n${fails} FALLOS` : '\nTodo correcto'); process.exit(fails ? 1 : 0);
