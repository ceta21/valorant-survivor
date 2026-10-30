// Prueba del mundo: 4 zonas en 2×2 separadas por abismos, portales entre zonas, determinismo y que todo
// el suelo de cada zona esté conectado (no quedan rincones encerrados entre obstáculos).
// Uso: npm run test:world
import { GameEngine } from '../src/game/GameEngine';
import { World, CS, ZN, ZS, WORLD_CHUNKS, zoneAt, Cell } from '../src/game/World';
import { AGENTS } from '../src/data/agents';
import { MAPS, MAP_BY_ID } from '../src/data/maps';
let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };
const noop = { onLevelUp() {}, onEnd() {}, sfx() {} }, meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };

// 1. determinismo: misma semilla => mismo mundo; semillas distintas => distinto
const a = new World(MAP_BY_ID.reino, 7), b = new World(MAP_BY_ID.reino, 7), c = new World(MAP_BY_ID.reino, 8);
const sig = (w: World) => JSON.stringify([w.chunk(3, 2).obstacles, w.chunk(12, 11).obstacles]);
ok(sig(a) === sig(b), 'mismo seed => mismo mundo');
ok(sig(a) !== sig(c), 'seed distinta => mundo distinto');
ok(sig(a) === sig(new World(MAP_BY_ID.ciudad, 7)), 'la zona de inicio no cambia el mundo (en pareja los dos ven lo mismo)');

// 2. zonas y abismo
ok(MAPS.every((m, i) => zoneAt(m.zone[0] * ZS, m.zone[1] * ZS) === i), 'cada zona está en su sitio de la cuadrícula 2×2');
ok(zoneAt(ZN, 0) === -1 && zoneAt(0, ZN) === -1 && zoneAt(-1, 3) === -1 && zoneAt(WORLD_CHUNKS, 3) === -1, 'entre zonas y alrededor del mundo hay abismo');
ok(a.hit(ZN * CS + CS / 2, CS * 3, 4), 'el abismo no se puede pisar');

// 3. terreno: cada zona tiene sus elementos (hierba y agua en el Reino, hielo en el Glaciar, lava en el Infierno…)
{
  const w = new World(MAP_BY_ID.reino, 99);
  const count = (z: number) => { const [zx, zy] = MAPS[z].zone, n: Record<number, number> = {};
    for (let j = 0; j < ZN; j++) for (let i = 0; i < ZN; i++) for (const t of w.chunk(zx * ZS + i, zy * ZS + j).cells) n[t] = (n[t] ?? 0) + 1;
    return n; };
  const need: [string, number[]][] = [['reino', [Cell.Grass, Cell.Water, Cell.Path]], ['glaciar', [Cell.Ice, Cell.Rock]], ['infierno', [Cell.Lava, Cell.Rock, Cell.Bridge]], ['ciudad', [Cell.Road, Cell.Sea, Cell.Grass]]];
  for (const [id, cells] of need) { const n = count(MAPS.findIndex(m => m.id === id)); ok(cells.every(c => (n[c] ?? 0) > 50), `${id}: tiene su terreno propio (${cells.map(c => n[c] ?? 0).join(', ')} celdas)`); }
  const keeps = new Set<string>();
  for (let j = 0; j < WORLD_CHUNKS; j++) for (let i = 0; i < WORLD_CHUNKS; i++) for (const o of w.chunk(i, j).obstacles) if (o.s?.endsWith('keep')) keeps.add(o.s);
  ok(keeps.size === 3, `hay castillos en Reino, Glaciar e Infierno (${[...keeps].join(', ')})`);
}
{
  const e = new GameEngine(AGENTS[0], MAP_BY_ID.reino, meta, noop);
  const find = (t: number) => { for (let y = 0; y < ZN * CS; y += 16) for (let x = 0; x < ZN * CS; x += 16) if (e.world.terrainAt(x, y) === t && e.world.terrainAt(x + 40, y) === t && e.world.terrainAt(x - 40, y) === t && !e.world.hit(x, y, 14)) return [x, y]; return null; };
  const wat = find(Cell.Water)!;
  e.inputMove = { x: 1, y: 0 }; e.player.x = wat[0] - 20; e.player.y = wat[1]; e.update(1 / 60);
  const vWater = (e.player.x - (wat[0] - 20)) * 60;
  const grs = find(Cell.Grass)!; e.player.x = grs[0] - 20; e.player.y = grs[1]; e.update(1 / 60);
  const vGrass = (e.player.x - (grs[0] - 20)) * 60;
  ok(vWater < vGrass * 0.7 && vWater > 0, `el agua frena (${Math.round(vWater)} frente a ${Math.round(vGrass)} en hierba)`);
  const [zx, zy] = MAP_BY_ID.infierno.zone, e2 = new GameEngine(AGENTS[0], MAP_BY_ID.infierno, meta, noop);
  let lava: number[] | null = null;
  for (let y = zy * ZS * CS; y < (zy * ZS + ZN) * CS && !lava; y += 16) for (let x = zx * ZS * CS; x < (zx * ZS + ZN) * CS; x += 16) if (e2.world.terrainAt(x, y) === Cell.Lava) { lava = [x, y]; break; }
  e2.inputMove = { x: 0, y: 0 }; e2.player.invuln = 0; e2.player.iframes = 0; e2.player.x = lava![0]; e2.player.y = lava![1];
  const hp0 = e2.player.hp; for (let i = 0; i < 60; i++) { e2.player.x = lava![0]; e2.player.y = lava![1]; e2.update(1 / 60); }
  ok(e2.player.hp < hp0, `la lava quema (${Math.round(hp0)} → ${Math.round(e2.player.hp)} de vida en 1 s)`);
}

// 4. todo el suelo de cada zona conectado (rejilla de 40 unidades, cuerpo de radio 12; agua, lava y hielo se pisan)
{
  const w = new World(MAP_BY_ID.reino, 4242), STEP = 40;
  for (let z = 0; z < MAPS.length; z++) {
    const [zx, zy] = MAPS[z].zone, x0 = zx * ZS * CS, y0 = zy * ZS * CS, N = (ZN * CS) / STEP;
    const free = (i: number, j: number) => !w.hit(x0 + i * STEP + STEP / 2, y0 + j * STEP + STEP / 2, 12);
    const seen = new Uint8Array(N * N); let total = 0, start = -1;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (free(i, j)) { total++; if (start < 0) start = j * N + i; }
    const st = [start]; seen[start] = 1; let reach = 1;
    while (st.length) { const k = st.pop()!, i = k % N, j = (k / N) | 0;
      for (const [u, v] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) if (u >= 0 && v >= 0 && u < N && v < N && !seen[v * N + u] && free(u, v)) { seen[v * N + u] = 1; reach++; st.push(v * N + u); } }
    ok(reach / total > 0.97, `${MAPS[z].id}: el ${Math.round((reach / total) * 1000) / 10}% del suelo libre es accesible desde cualquier punto`);
  }
}

// 5. aparición en cada zona y portales
for (const m of MAPS) {
  const e = new GameEngine(AGENTS[0], m, meta, noop);
  ok(e.world.zoneOfPoint(e.player.x, e.player.y) === MAPS.indexOf(m) && !e.world.hit(e.player.x, e.player.y, e.player.r), `${m.id}: apareces en tu zona y no dentro de un obstáculo`);
}
{
  const e = new GameEngine(AGENTS[0], MAP_BY_ID.reino, meta, noop);
  ok(e.world.portals.length === 12, '12 portales: 3 en cada zona, uno hacia cada otra zona');
  ok(MAPS.every((_, z) => new Set(e.world.portals.filter(p => p.zone === z).map(p => p.to)).size === 3), 'desde cada zona se llega a las otras 3');
  for (const from of e.world.portals) {
    const to = e.world.portalPair(from);
    e.portalCd = 0; e.player.x = from.x + 10; e.player.y = from.y; e.update(1 / 60);
    const z = e.world.zoneOfPoint(e.player.x, e.player.y);
    if (z !== from.to || Math.hypot(e.player.x - to.x, e.player.y - to.y) > 120 || e.world.hit(e.player.x, e.player.y, e.player.r - 1)) { ok(false, `portal ${MAPS[from.zone].id} → ${MAPS[from.to].id} no lleva bien`); }
  }
  ok(true, 'cada portal te lleva junto a su pareja en la otra zona, sin quedar dentro de un obstáculo');
}

// 6. poda de chunks no cambia el mundo
{
  const w = new World(MAP_BY_ID.glaciar, 5); const before = JSON.stringify(w.chunk(2, 2).obstacles);
  for (let i = 0; i < 400; i++) w.chunk(i % WORLD_CHUNKS, (i / WORLD_CHUNKS) | 0); w.prune(16 * CS, 16 * CS, 2);
  ok(JSON.stringify(w.chunk(2, 2).obstacles) === before, 'tras podar y regenerar, el chunk es idéntico');
}
console.log(fails ? `\n${fails} FALLOS` : '\nTodo correcto'); process.exit(fails ? 1 : 0);
