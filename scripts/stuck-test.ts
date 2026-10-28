// ¿Se atascan los enemigos tras edificios cuando el jugador está quieto? (jugador invulnerable, sin armas)
import { GameEngine } from '../src/game/GameEngine';
import { AGENTS } from '../src/data/agents';
import { MAPS } from '../src/data/maps';
for (const m of MAPS) {
  const e = new GameEngine(AGENTS[0], m, { dmg: 0, hp: 0, speed: 0, xp: 0 }, { onLevelUp() {}, onEnd() {}, sfx() {} });
  e.weapons = [];
  const lastPos = new Map<number, [number, number, number]>();
  let stuckEnemyFrames = 0, samples = 0, contactMax = 0;
  for (let i = 0; i < 60 * 40; i++) {
    e.player.hp = e.stats.maxHp; e.update(1 / 60);
    if (i % 60 === 0) {
      let near = 0;
      for (const en of e.enemies) {
        const d = Math.hypot(en.x - e.player.x, en.y - e.player.y);
        if (d < 60) near++;
        const prev = lastPos.get(en.id);
        if (prev && d > 90 && d < 700 && Math.hypot(en.x - prev[0], en.y - prev[1]) < 6 && !en.isBoss && en.stunT <= 0 && en.def.behavior !== 'shooter') stuckEnemyFrames++;
        lastPos.set(en.id, [en.x, en.y, i]);
        samples++;
      }
      contactMax = Math.max(contactMax, near);
    }
  }
  console.log(m.id, JSON.stringify({ enemigosVivos: e.enemies.length, muestras: samples, atascados: stuckEnemyFrames, pctAtascados: +(100 * stuckEnemyFrames / samples).toFixed(1), maxEnContacto: contactMax }));
}
