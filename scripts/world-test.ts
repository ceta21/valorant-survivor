// Prueba del mundo: 4 zonas sin bordes (muy separadas) con su corazón que se repite, portales entre zonas,
// determinismo y que todo el suelo de cada zona esté conectado (no quedan rincones encerrados entre obstáculos).
// Uso: npm run test:world
import { GameEngine } from '../src/game/GameEngine';
import { World, CS, ZN, ZW, TILE, ZSPACE, zoneAt, zoneOrigin, Cell } from '../src/game/World';
import { AGENTS } from '../src/data/agents';
import { MAPS, MAP_BY_ID } from '../src/data/maps';
let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };
/** Chunk de la esquina del corazón original de una zona. */
const oc = (z: number) => zoneOrigin(z).map(v => v / CS) as [number, number];
const noop = { onLevelUp() {}, onEnd() {}, sfx() {} }, meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };

// 1. determinismo: misma semilla => mismo mundo; semillas distintas => distinto
const a = new World(MAP_BY_ID.reino, 7), b = new World(MAP_BY_ID.reino, 7), c = new World(MAP_BY_ID.reino, 8);
const sig = (w: World) => JSON.stringify([w.chunk(3, 2).obstacles, w.chunk(12, 11).obstacles]);
ok(sig(a) === sig(b), 'mismo seed => mismo mundo');
ok(sig(a) !== sig(c), 'seed distinta => mundo distinto');
ok(sig(a) === sig(new World(MAP_BY_ID.ciudad, 7)), 'la zona de inicio no cambia el mundo (en pareja los dos ven lo mismo)');

// 2. zonas y abismo
ok(MAPS.every((m, i) => { const [x, y] = oc(i); return zoneAt(x, y) === i; }), 'cada zona está en su sitio de la cuadrícula 2×2');
{
  // sin bordes: la zona sigue (con suelo pisable) muy lejos de su corazón, en las 4 direcciones
  const far = 900;   // chunks: 576.000 unidades
  const [x, y] = oc(0), dirs = [[far, 0], [-far, 0], [0, far], [0, -far]];
  ok(dirs.every(([dx, dy]) => zoneAt(x + dx, y + dy) === 0 && a.chunk(x + dx, y + dy).kind === 'land'), 'las zonas no tienen bordes (siguen a 576.000 unidades del centro)');
  ok(ZW < TILE && ZSPACE / 2 >= 600_000 && ZSPACE * 1.5 < 2_097_152, 'más de 600.000 unidades hasta el límite de cada zona, y coordenadas dentro del rango que el canvas dibuja sin temblar');
  ok(zoneAt(x - ZSPACE / CS, y) === -1 && a.hit((x - ZSPACE / CS) * CS + CS / 2, y * CS, 4), 'solo más allá de las 4 zonas hay abismo, y no se puede pisar');
}

// 3. terreno: cada zona tiene sus elementos (hierba y agua en el Reino, hielo en el Glaciar, lava en el Infierno…)
{
  const w = new World(MAP_BY_ID.reino, 99);
  const count = (z: number) => { const [zx, zy] = MAPS[z].zone, n: Record<number, number> = {};
    const [x0, y0] = oc(z); void zx; void zy;
    for (let j = 0; j < ZN; j++) for (let i = 0; i < ZN; i++) for (const t of w.chunk(x0 + i, y0 + j).cells) n[t] = (n[t] ?? 0) + 1;
    return n; };
  const need: [string, number[]][] = [['reino', [Cell.Grass, Cell.Water, Cell.Path]], ['glaciar', [Cell.Ice, Cell.Rock]], ['infierno', [Cell.Lava, Cell.Rock, Cell.Bridge]], ['ciudad', [Cell.Road, Cell.Sea, Cell.Grass]]];
  for (const [id, cells] of need) { const n = count(MAPS.findIndex(m => m.id === id)); ok(cells.every(c => (n[c] ?? 0) > 50), `${id}: tiene su terreno propio (${cells.map(c => n[c] ?? 0).join(', ')} celdas)`); }
  const keeps = new Set<string>(), copies = new Set<string>(), T = TILE / CS;
  MAPS.forEach((_, z) => { const [x0, y0] = oc(z);
    for (let j = 0; j < ZN; j++) for (let i = 0; i < ZN; i++) {
      for (const o of w.chunk(x0 + i, y0 + j).obstacles) if (o.s?.endsWith('keep')) keeps.add(o.s);
      for (const o of w.chunk(x0 + i + T, y0 + j - T).obstacles) if (o.s?.endsWith('keep')) copies.add(o.s);
    } });
  ok(keeps.size === 3, `hay castillos en Reino, Glaciar e Infierno (${[...keeps].join(', ')})`);
  ok(copies.size === 3, 'el corazón de cada zona (con su castillo) se repite más allá');
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
  const e2 = new GameEngine(AGENTS[0], MAP_BY_ID.infierno, meta, noop), [ix, iy] = zoneOrigin(MAPS.indexOf(MAP_BY_ID.infierno));
  let lava: number[] | null = null;
  for (let y = iy; y < iy + ZW && !lava; y += 16) for (let x = ix; x < ix + ZW; x += 16) if (e2.world.terrainAt(x, y) === Cell.Lava) { lava = [x, y]; break; }
  e2.inputMove = { x: 0, y: 0 }; e2.player.invuln = 0; e2.player.iframes = 0; e2.player.x = lava![0]; e2.player.y = lava![1];
  const hp0 = e2.player.hp; for (let i = 0; i < 60; i++) { e2.player.x = lava![0]; e2.player.y = lava![1]; e2.update(1 / 60); }
  ok(e2.player.hp < hp0, `la lava quema (${Math.round(hp0)} → ${Math.round(e2.player.hp)} de vida en 1 s)`);
}

// 4. todo el suelo de cada zona conectado (rejilla de 40 unidades, cuerpo de radio 12; agua, lava y hielo se pisan)
{
  const w = new World(MAP_BY_ID.reino, 4242), STEP = 40;
  for (let z = 0; z < MAPS.length; z++) {
    const [x0, y0] = zoneOrigin(z), N = (ZN * CS) / STEP;
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
  // al empezar están cerrados: pisarlos no lleva a ningún sitio; cada jefe derrotado abre la zona siguiente
  { const p0 = e.world.portals.find(p => MAPS[p.zone].id === 'reino' && MAPS[p.to].id === 'glaciar')!;
    e.portalCd = 0; e.player.x = p0.x + 10; e.player.y = p0.y; e.update(1 / 60);
    ok(Math.hypot(e.player.x - p0.x, e.player.y - p0.y) < 60, 'al empezar los portales están cerrados');
    const b = e.spawnEnemy('coloso', e.player.x + 300, e.player.y); e.killEnemy(b, false);
    ok(e.portalsOpen === 1 && e.portalOpen(p0) && !e.world.portals.some(p => MAPS[p.to].id === 'infierno' && e.portalOpen(p)), 'derrotar a un jefe abre el Glaciar (y el Infierno sigue cerrado)'); }
  e.portalsOpen = 3; e.slowT = 0;   // sin la cámara lenta del jefe derrotado
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
  for (let i = 0; i < 400; i++) w.chunk(i % 20, (i / 20) | 0); w.prune(16 * CS, 16 * CS, 2);
  ok(JSON.stringify(w.chunk(2, 2).obstacles) === before, 'tras podar y regenerar, el chunk es idéntico');
}
console.log(fails ? `\n${fails} FALLOS` : '\nTodo correcto'); process.exit(fails ? 1 : 0);
