// Prueba de mundo infinito: el jugador (invulnerable) recorre muchísima distancia mientras el motor y el renderizador trabajan.
import { createCanvas } from '@napi-rs/canvas';
import { GameEngine } from '../src/game/GameEngine';
import { Renderer } from '../src/game/Renderer';
import { AGENTS } from '../src/data/agents';
import { MAPS } from '../src/data/maps';

const W = 1100, H = 640;
for (const m of MAPS) {
  const cv = createCanvas(W, H), ctx = cv.getContext('2d') as any;
  const rd = new Renderer(ctx, (w, h) => createCanvas(w, h) as any);
  const v = rd.resize(W, H);
  const e = new GameEngine(AGENTS[0], m, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  e.setView(v.w, v.h);
  const slow: number[] = [];
  let maxStep = 0, maxRender = 0, tStep = 0, tRender = 0, frames = 0, stuckInside = 0, maxAlive = 0, maxGems = 0, bossFar = 0;
  let dir = 0;
  for (let i = 0; i < 60 * 240; i++) {                       // 4 minutos de juego
    const p = e.player;
    if (i % 240 === 0) dir += 0.9 + Math.sin(i) * 0.4;        // cambia de rumbo cada 4 s: recorre kilómetros
    e.inputMove.x = Math.cos(dir); e.inputMove.y = Math.sin(dir);
    p.hp = e.stats.maxHp;
    if (e.state === 'levelup') e.chooseUpgrade(0);
    if (i % 30 === 0) { e.cast('special'); e.cast('secondary'); e.cast('ultimate'); }
    let t = performance.now();
    e.update(1 / 60);
    const ds = performance.now() - t; tStep += ds; maxStep = Math.max(maxStep, ds);
    if (i % 2 === 0) { t = performance.now(); rd.render(e); const dr = performance.now() - t; tRender += dr; if (i > 120) maxRender = Math.max(maxRender, dr); if (dr > 33) slow.push(Math.round(dr)); frames++; }
    // comprobación EXACTA círculo-rectángulo (world.hit usa una caja ampliada, más conservadora en las esquinas)
    {
      let inside = false;
      for (let j = Math.floor((p.y - 20) / 640); j <= Math.floor((p.y + 20) / 640) && !inside; j++) for (let k = Math.floor((p.x - 20) / 640); k <= Math.floor((p.x + 20) / 640) && !inside; k++)
        for (const o of e.world.chunk(k, j).obstacles) {
          const nx = Math.max(o.x, Math.min(p.x, o.x + o.w)), ny = Math.max(o.y, Math.min(p.y, o.y + o.h));
          if (Math.hypot(p.x - nx, p.y - ny) < p.r - 0.6) { inside = true; break; }
        }
      if (inside) stuckInside++;
    }
    maxAlive = Math.max(maxAlive, e.enemies.length); maxGems = Math.max(maxGems, e.gems.length);
    for (const en of e.enemies) if (en.isBoss) bossFar = Math.max(bossFar, Math.hypot(en.x - p.x, en.y - p.y));
  }
  const p = e.player;
  console.log(JSON.stringify({
    map: m.id, fin: [Math.round(p.x), Math.round(p.y)], distOrigen: Math.round(Math.hypot(p.x, p.y)),
    stepMedio: +(tStep / (60 * 240)).toFixed(2), stepMax: +maxStep.toFixed(1), renderMedio: +(tRender / frames).toFixed(2), renderMax: +maxRender.toFixed(1),
    jugadorDentroDeObstaculo: stuckInside, maxEnemigos: maxAlive, maxGemas: maxGems, jefeMasLejos: Math.round(bossFar), nivel: e.level, bajas: e.kills, jefes: e.bossKills,
    fotogramasLentos33ms: slow.length, lentos: slow.slice(0, 8), chunksMundo: (e.world as any).cache.size, chunksDibujados: (rd as any).chunkCache.size,
  }));
}
