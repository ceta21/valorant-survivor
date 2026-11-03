import { SaveData, SaveStats } from '../utils/storage';
import type { RunResult } from '../game/types';

export interface Goal {
  id: string; name: string; desc: string; reward: number;
  progress: (s: SaveStats) => [number, number];
}
export const MISSIONS: Goal[] = [
  { id: 'm_kills_300', name: 'Calentamiento', desc: 'Elimina 300 enemigos en total', reward: 80, progress: s => [s.kills, 300] },
  { id: 'm_kills_2000', name: 'Cazarrecompensas', desc: 'Elimina 2.000 enemigos en total', reward: 250, progress: s => [s.kills, 2000] },
  { id: 'm_time_300', name: 'Superviviente', desc: 'Sobrevive 5 minutos en una partida', reward: 120, progress: s => [s.bestTime, 300] },
  { id: 'm_level_15', name: 'Veterano', desc: 'Alcanza el nivel 15 en una partida', reward: 150, progress: s => [s.bestLevel, 15] },
  { id: 'm_boss_5', name: 'Rompejefes', desc: 'Derrota 5 jefes en total', reward: 200, progress: s => [s.bossKills, 5] },
  { id: 'm_win_1', name: 'Ronda ganada', desc: 'Gana una partida', reward: 400, progress: s => [s.wins, 1] },
  { id: 'm_games_10', name: 'Habitual', desc: 'Juega 10 partidas', reward: 150, progress: s => [s.games, 10] },
];
/**
 * Logros: se consiguen una vez y dan créditos al momento. `check` mira el guardado (estadísticas, récords por zona,
 * equipo, héroes, racha…) y, al acabar una partida, también esa partida (`r`): así hay logros de «gana en Pesadilla».
 * Devuelve [progreso, objetivo].
 */
export interface Achievement { id: string; name: string; desc: string; reward: number; check: (s: SaveData, r?: RunResult) => [number, number] }
const won = (s: SaveData, map: string) => Math.min(1, s.records[map]?.wins ?? 0);
const runWin = (r: RunResult | undefined, diff: string[]) => (r && r.win && diff.includes(r.difficulty) ? 1 : 0);
export const ACHIEVEMENTS: Achievement[] = [
  // bajas, jefes y partidas
  { id: 'a_first', name: 'Primera sangre', desc: 'Elimina a tu primer enemigo', reward: 50, check: s => [s.stats.kills, 1] },
  { id: 'a_kills_1000', name: 'Mil bajas', desc: 'Acumula 1.000 eliminaciones', reward: 300, check: s => [s.stats.kills, 1000] },
  { id: 'a_kills_10000', name: 'Máquina de guerra', desc: 'Acumula 10.000 eliminaciones', reward: 1500, check: s => [s.stats.kills, 10000] },
  { id: 'a_kills_50000', name: 'Leyenda de la grieta', desc: 'Acumula 50.000 eliminaciones', reward: 5000, check: s => [s.stats.kills, 50000] },
  { id: 'a_run_500', name: 'Masacre', desc: 'Elimina 500 enemigos en una partida', reward: 500, check: s => [s.stats.bestKills, 500] },
  { id: 'a_run_1500', name: 'Exterminio', desc: 'Elimina 1.500 enemigos en una partida', reward: 1500, check: s => [s.stats.bestKills, 1500] },
  { id: 'a_boss_1', name: 'Jefe caído', desc: 'Derrota a un jefe', reward: 150, check: s => [s.stats.bossKills, 1] },
  { id: 'a_boss_50', name: 'Cazador de jefes', desc: 'Derrota 50 jefes en total', reward: 2000, check: s => [s.stats.bossKills, 50] },
  { id: 'a_games_50', name: 'Incansable', desc: 'Juega 50 partidas', reward: 800, check: s => [s.stats.games, 50] },
  // aguantar y subir de nivel
  { id: 'a_time_600', name: 'Diez minutos', desc: 'Sobrevive 10 minutos', reward: 800, check: s => [s.stats.bestTime, 600] },
  { id: 'a_time_900', name: 'Sin final', desc: 'Sobrevive 15 minutos', reward: 2000, check: s => [s.stats.bestTime, 900] },
  { id: 'a_level_25', name: 'Nivel 25', desc: 'Alcanza el nivel 25 en una partida', reward: 600, check: s => [s.stats.bestLevel, 25] },
  { id: 'a_level_40', name: 'Nivel 40', desc: 'Alcanza el nivel 40 en una partida', reward: 2000, check: s => [s.stats.bestLevel, 40] },
  // ganar (derrotar al jefe final)
  { id: 'a_win_3', name: 'Imparable', desc: 'Gana 3 partidas', reward: 1500, check: s => [s.stats.wins, 3] },
  { id: 'a_win_reino', name: 'Señor del Reino', desc: 'Gana una partida', reward: 800, check: s => [won(s, 'reino'), 1] },
  { id: 'a_win_glaciar', name: 'Corazón de hielo', desc: 'Gana una partida en la que hayas llegado al Glaciar', reward: 800, check: s => [won(s, 'glaciar'), 1] },
  { id: 'a_win_infierno', name: 'A prueba de fuego', desc: 'Gana una partida en la que hayas llegado al Infierno', reward: 800, check: s => [won(s, 'infierno'), 1] },
  { id: 'a_win_ciudad', name: 'Rey de la ciudad', desc: 'Gana una partida en la que hayas llegado a la Ciudad', reward: 800, check: s => [won(s, 'ciudad'), 1] },
  { id: 'a_win_all', name: 'Conquistador', desc: 'Gana partidas en las que hayas llegado a las 4 zonas', reward: 3000, check: s => [won(s, 'reino') + won(s, 'glaciar') + won(s, 'infierno') + won(s, 'ciudad'), 4] },
  { id: 'a_win_hard', name: 'Sin piedad', desc: 'Gana una partida en Difícil o Pesadilla', reward: 1500, check: (_s, r) => [runWin(r, ['dificil', 'pesadilla']), 1] },
  { id: 'a_win_nightmare', name: 'Pesadilla superada', desc: 'Gana una partida en Pesadilla', reward: 4000, check: (_s, r) => [runWin(r, ['pesadilla']), 1] },
  // colección y progreso fuera de la partida
  { id: 'a_heroes_5', name: 'Compañía', desc: 'Ten 5 héroes', reward: 500, check: s => [s.unlocked.length, 5] },
  { id: 'a_heroes_all', name: 'Leyendas reunidas', desc: 'Ten los 20 héroes', reward: 5000, check: s => [s.unlocked.length, 20] },
  { id: 'a_meta_max', name: 'Entrenamiento completo', desc: 'Lleva una mejora permanente al máximo', reward: 1000, check: s => [Math.max(s.meta.dmg, s.meta.hp, s.meta.speed, s.meta.xp), 10] },
  { id: 'a_gear_legend', name: 'Tesoro legendario', desc: 'Consigue un objeto de equipo legendario', reward: 1500, check: s => [s.gear.items.some(i => i.rarity === 3) ? 1 : 0, 1] },
  { id: 'a_gear_max', name: 'Forjado al máximo', desc: 'Sube un objeto de equipo al nivel 5', reward: 1000, check: s => [Math.max(0, ...s.gear.items.map(i => i.lvl)), 5] },
  { id: 'a_pet', name: 'Mejor amigo', desc: 'Consigue una mascota', reward: 500, check: s => [s.shop.owned.some(o => o.startsWith('pet_')) ? 1 : 0, 1] },
  { id: 'a_streak_7', name: 'Una semana seguida', desc: 'Entra 7 días seguidos', reward: 1000, check: s => [s.login.best, 7] },
  { id: 'a_streak_30', name: 'Fiel a la grieta', desc: 'Entra 30 días seguidos', reward: 4000, check: s => [s.login.best, 30] },
];

/** Logros nuevos con este guardado (y la partida, si acaba de terminar): devuelve el guardado con ellos y sus créditos. */
export function unlockAchievements(s: SaveData, r?: RunResult): { save: SaveData; got: Achievement[] } {
  const got = ACHIEVEMENTS.filter(a => !s.achievements.includes(a.id) && (([c, t]) => c >= t)(a.check(s, r)));
  if (!got.length) return { save: s, got };
  return { save: { ...s, achievements: [...s.achievements, ...got.map(a => a.id)], credits: s.credits + got.reduce((n, a) => n + a.reward, 0) }, got };
}
