// Simulación headless: un bot juega partidas completas para comprobar que el motor no falla y calibrar dificultad.
import { GameEngine } from '../src/game/GameEngine';
import { AGENTS } from '../src/data/agents';
import { MAPS } from '../src/data/maps';

function runBot(agentId: string, mapId: string, skill: number, seed = 0) {
  const agent = AGENTS.find(a => a.id === agentId)!;
  const map = MAPS.find(m => m.id === mapId)!;
  let result: any = null;
  const eng = new GameEngine(agent, map, { dmg: 0, hp: 0, speed: 0, xp: 0 }, {
    onLevelUp: () => {},
    onEnd: r => { result = r; },
    sfx: () => {},
  });
  let t = 0, frames = 0, ang = 0;
  let maxAlive = 0, ups = 0;
  while (!result && t < 700) {
    // bot: huir del centro de masa de los enemigos cercanos, con algo de órbita
    const p = eng.player;
    let ax = 0, ay = 0, n = 0;
    for (const e of eng.enemies) {
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
      if (d < 260 * skill + 60) { const w = 1 / (d + 20); ax += dx * w; ay += dy * w; n++; }
    }
    ang += 0.02;
    // si está a salvo, recoge la gema más cercana
    if (n < 40) {
      let bg: any = null, bd = 450 * 450;
      for (const g of eng.gems) { const d = (g.x - p.x) ** 2 + (g.y - p.y) ** 2; if (d < bd) { bd = d; bg = g; } }
      if (bg) { ax = (bg.x - p.x) / Math.sqrt(bd) * 1.2 + ax * 2.2; ay = (bg.y - p.y) / Math.sqrt(bd) * 1.2 + ay * 2.2; n = 99; }
    }
    if (n === 0) { ax = Math.cos(ang); ay = Math.sin(ang); }
    // atraer hacia el centro del mapa si se acerca a bordes
    const l = Math.hypot(ax, ay) || 1;
    eng.inputMove.x = ax / l; eng.inputMove.y = ay / l;
    if (frames % 10 === 0) { eng.cast('special'); eng.cast('secondary'); eng.cast('ultimate'); }
    if (eng.state === 'levelup') { eng.chooseUpgrade(Math.floor(Math.random() * eng.choices.length)); ups++; }
    if (process.env.GOD) p.hp = eng.stats.maxHp;
    eng.update(1 / 60);
    frames++; t += 1 / 60;
    maxAlive = Math.max(maxAlive, eng.enemies.length);
    if (frames % 600 === 0 && eng.state === 'playing' && process.env.VERBOSE) {
      console.log(`  t=${Math.round(t)} lvl=${eng.level} hp=${Math.round(p.hp)}/${Math.round(eng.stats.maxHp)} kills=${eng.kills} alive=${eng.enemies.length} w=${eng.weapons.map(w => w.id + w.lvl).join(',')}`);
    }
  }
  return { agentId, mapId, win: result?.win ?? false, time: Math.round(eng.time), level: eng.level, kills: eng.kills, maxAlive, ups, bosses: eng.bossKills, dmg: Math.round(eng.damageDealt), credits: result?.credits };
}

const t0 = Date.now();
const which = process.argv[2];
const list = which ? AGENTS.filter(a => a.id === which) : AGENTS;
for (const a of list) {
  const r = runBot(a.id, MAPS[Math.floor(Math.random() * 3)].id, 1);
  console.log(JSON.stringify(r));
}
console.log('ms', Date.now() - t0);
