// Comprueba las reglas del Diario: racha de conexión, misiones del día y su progreso.
// Uso: npm run test:daily
import { addRun, dailyMissions, emptyLogin, prevDay, todayProgress, touchLogin, hasDailyReward, STREAK_REWARDS } from '../src/data/daily';
import type { RunResult } from '../src/game/types';

let fails = 0;
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? 'OK ' : 'MAL'} ${msg}`); if (!cond) fails++; };

// días
ok(prevDay('2026-03-01') === '2026-02-28', 'día anterior a 1 de marzo');
ok(prevDay('2026-01-01') === '2025-12-31', 'día anterior a año nuevo');

// racha
let l = touchLogin(emptyLogin(), '2026-10-01');
ok(l.streak === 1 && l.last === '2026-10-01', 'primer día: racha 1');
ok(touchLogin(l, '2026-10-01') === l, 'mismo día: no cambia');
l = touchLogin(l, '2026-10-02');
ok(l.streak === 2, 'día siguiente: racha 2');
l = { ...l, streak: 7, best: 7, claimed: [7] };
const broken = touchLogin(l, '2026-10-05');
ok(broken.streak === 1 && broken.claimed.length === 0 && broken.best === 7, 'saltarse un día: vuelve a 1 y se pierden los hitos (mejor racha 7)');
ok(STREAK_REWARDS[STREAK_REWARDS.length - 1].day === 365, 'último hito: 365 días');

// misiones
const a = dailyMissions('2026-10-29', ['zephyr', 'lyra', 'kael']), b = dailyMissions('2026-10-29', ['zephyr', 'lyra', 'kael']);
ok(a.length === 3 && new Set(a.map(m => m.id)).size === 3, '3 misiones distintas');
ok(a.map(m => m.text).join() === b.map(m => m.text).join(), 'mismo día, mismas misiones');
const days = Array.from({ length: 30 }, (_, i) => dailyMissions(`2026-11-${String(i + 1).padStart(2, '0')}`, ['zephyr']).map(m => m.id).join());
ok(new Set(days).size > 10, 'cambian de un día a otro');
ok(!dailyMissions('2026-10-29', ['jett', 'viper']).some(m => /jett|viper/i.test(m.text)), 'no pide agentes que no se pueden jugar');

// progreso
const run: RunResult = { win: false, time: 320, kills: 420, level: 13, damage: 30000, bossKills: 1, credits: 100, agentId: 'zephyr', mapId: 'bind', difficulty: 'dificil' };
let d = addRun(undefined, run, '2026-10-29');
d = addRun(d, { ...run, kills: 100, time: 60 }, '2026-10-29');
ok(d.games === 2 && d.kills === 520 && d.bestKills === 420 && d.bestTime === 320 && d.agents.zephyr === 2 && d.maps.bind === 2 && d.hard === 2, 'suma las partidas del día');
ok(todayProgress(d, '2026-10-30').games === 0, 'al día siguiente empieza de cero');
ok(addRun(d, run, '2026-10-30').games === 1, 'una partida de otro día no suma a la de ayer');

// aviso de premio
ok(hasDailyReward(undefined, { ...emptyLogin(), last: '2026-10-29', streak: 1 }, ['zephyr'], '2026-10-29'), 'premio diario sin cobrar: hay aviso');
ok(!hasDailyReward(undefined, { ...emptyLogin(), last: '2026-10-29', streak: 1, dayClaimed: '2026-10-29' }, ['zephyr'], '2026-10-29'), 'todo cobrado y sin misiones hechas: sin aviso');

console.log(fails ? `\n${fails} fallos` : '\nTodo bien');
process.exitCode = fails ? 1 : 0;
