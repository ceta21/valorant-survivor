// Ranking del domingo: clasificación aparte solo con las marcas publicadas ese domingo (hora UTC, igual para todos).
// El lunes, los 3 primeros con cuenta cobran créditos y una medalla al entrar en el juego (save.sundayMedals).
const DAY = 86400000;

/** Premios del 1.º, 2.º y 3.º. */
export const SUNDAY_PRIZES = [5000, 3000, 1500];
export const MEDALS = ['🥇', '🥈', '🥉'];

export interface SundayWindow { key: string; start: Date; end: Date; live: boolean }
const win = (startMs: number, now: number): SundayWindow => {
  const start = new Date(startMs), end = new Date(startMs + DAY);
  return { key: start.toISOString().slice(0, 10), start, end, live: now >= startMs && now < startMs + DAY };
};
/** Domingo que se enseña en el ranking: hoy si es domingo (UTC); si no, el último que pasó. */
export function shownSunday(now = Date.now()): SundayWindow {
  const d = new Date(now), today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return win(today - d.getUTCDay() * DAY, now);
}
/** Último domingo ya terminado (el que se puede cobrar). */
export function lastFinishedSunday(now = Date.now()): SundayWindow {
  const s = shownSunday(now);
  return s.live ? win(s.start.getTime() - 7 * DAY, now) : s;
}

export interface SundayMedal { key: string; place: number }
