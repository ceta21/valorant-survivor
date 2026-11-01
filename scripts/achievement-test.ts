// Prueba de los logros: ids únicos, premios, que cada uno se consigue cuando toca (también los de una partida concreta),
// que se dan una sola vez y que suman sus créditos. Uso: npm run test:achievements
import { ACHIEVEMENTS, unlockAchievements } from '../src/data/goals';
import { defaultSave } from '../src/utils/storage';
import type { RunResult } from '../src/game/types';

let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };
const ids = ACHIEVEMENTS.map(a => a.id);
ok(ACHIEVEMENTS.length >= 25 && new Set(ids).size === ids.length, `${ACHIEVEMENTS.length} logros con id único`);
ok(ACHIEVEMENTS.every(a => a.reward > 0), 'todos dan créditos');

const fresh = defaultSave();
ok(unlockAchievements(fresh).got.length === 0, 'una cuenta nueva no tiene ninguno');

const run = (o: Partial<RunResult>): RunResult => ({ win: false, time: 100, kills: 10, level: 3, damage: 0, bossKills: 0, credits: 0, agentId: 'zephyr', mapId: 'reino', difficulty: 'normal', ...o });
{ const s = { ...fresh, stats: { ...fresh.stats, kills: 1, bossKills: 1 } };
  const { save, got } = unlockAchievements(s);
  ok(got.map(a => a.id).join() === 'a_first,a_boss_1' && save.credits === fresh.credits + 200, `primera baja y primer jefe: +◈ ${save.credits - fresh.credits}`);
  ok(unlockAchievements(save).got.length === 0, 'no se dan dos veces'); }
{ const s = { ...fresh, records: { reino: { bestTime: 600, bestLevel: 30, wins: 1 }, glaciar: { bestTime: 600, bestLevel: 30, wins: 1 }, infierno: { bestTime: 0, bestLevel: 0, wins: 0 }, ciudad: { bestTime: 600, bestLevel: 30, wins: 2 } } };
  const got = unlockAchievements(s).got.map(a => a.id);
  ok(got.includes('a_win_reino') && got.includes('a_win_ciudad') && !got.includes('a_win_infierno') && !got.includes('a_win_all'), 'ganar por zona (sin el Infierno, aún no «Conquistador»)'); }
{ ok(!unlockAchievements(fresh, run({ win: true, difficulty: 'normal' })).got.some(a => a.id === 'a_win_hard'), 'ganar en Normal no da «Sin piedad»');
  const got = unlockAchievements(fresh, run({ win: true, difficulty: 'pesadilla' })).got.map(a => a.id);
  ok(got.includes('a_win_hard') && got.includes('a_win_nightmare'), 'ganar en Pesadilla da «Sin piedad» y «Pesadilla superada»');
  ok(!unlockAchievements(fresh, run({ win: false, difficulty: 'pesadilla' })).got.some(a => a.id === 'a_win_nightmare'), 'perder en Pesadilla no cuenta'); }
{ const s = { ...fresh, unlocked: ['a', 'b', 'c', 'd', 'e'], meta: { ...fresh.meta, hp: 10 }, login: { ...fresh.login, best: 7 },
    gear: { items: [{ uid: 'x', id: 'colmillo', rarity: 3 as const, lvl: 5 }], equipped: [] }, shop: { ...fresh.shop, owned: ['pet_brasin'] } };
  const got = unlockAchievements(s).got.map(a => a.id).sort().join();
  ok(got === ['a_gear_legend', 'a_gear_max', 'a_heroes_5', 'a_meta_max', 'a_pet', 'a_streak_7'].sort().join(), `fuera de partida: héroes, mejoras, equipo, mascota y racha (${got})`); }
{ const old = { ...fresh, achievements: ['a_first'], stats: { ...fresh.stats, kills: 5 } };
  ok(unlockAchievements(old).got.length === 0, 'los logros que ya tenías no se vuelven a pagar'); }

if (fails) { console.error(`\n${fails} fallo(s)`); process.exit(1); }
console.log('\nTodo correcto');
