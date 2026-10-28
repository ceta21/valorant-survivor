import { SaveStats } from '../utils/storage';

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
export const ACHIEVEMENTS: Goal[] = [
  { id: 'a_first', name: 'Primera sangre', desc: 'Elimina a tu primer enemigo', reward: 0, progress: s => [s.kills, 1] },
  { id: 'a_kills_1000', name: 'Mil bajas', desc: 'Acumula 1.000 eliminaciones', reward: 0, progress: s => [s.kills, 1000] },
  { id: 'a_kills_10000', name: 'Máquina de guerra', desc: 'Acumula 10.000 eliminaciones', reward: 0, progress: s => [s.kills, 10000] },
  { id: 'a_time_600', name: 'Diez minutos', desc: 'Sobrevive 10 minutos', reward: 0, progress: s => [s.bestTime, 600] },
  { id: 'a_level_25', name: 'Nivel 25', desc: 'Alcanza el nivel 25 en una partida', reward: 0, progress: s => [s.bestLevel, 25] },
  { id: 'a_win_3', name: 'Imparable', desc: 'Gana 3 partidas', reward: 0, progress: s => [s.wins, 3] },
  { id: 'a_boss_1', name: 'Jefe caído', desc: 'Derrota a un jefe', reward: 0, progress: s => [s.bossKills, 1] },
  { id: 'a_run_500', name: 'Masacre', desc: 'Elimina 500 enemigos en una partida', reward: 0, progress: s => [s.bestKills, 500] },
];
