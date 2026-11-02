// Desafío semanal: cada semana (de lunes a domingo, hora del jugador) hay un desafío con reglas especiales. Se juega
// cuando quieras desde el Diario; si aguantas el tiempo pedido te llevas su premio una vez por semana.
import type { WeeklyEvent } from './events';

export interface Challenge extends WeeklyEvent {
  /** Segundos que hay que aguantar para superarlo. */
  goal: number;
  /** Créditos al superarlo (una vez por semana). */
  reward: number;
}

export const CHALLENGES: Challenge[] = [
  { id: 'reto_veloz', name: 'Bots acelerados', icon: '⚡', color: '#2fe6ff', desc: 'Los bots van un 50 % más rápido.', enemySpeed: 1.5, challenge: true, goal: 300, reward: 400 },
  { id: 'reto_cristal', name: 'Cañón de cristal', icon: '🔮', color: '#d946ef', desc: 'Haces el doble de daño, pero solo tienes el 40 % de la vida.', dmgMul: 2, maxHpMul: 0.4, challenge: true, goal: 300, reward: 450 },
  { id: 'reto_sincura', name: 'Sin curación', icon: '🩸', color: '#ff4655', desc: 'No te puedes curar de ninguna forma.', noHeal: true, challenge: true, goal: 300, reward: 450 },
  { id: 'reto_marea', name: 'Marea sin fin', icon: '🌊', color: '#4fd0ff', desc: 'El doble de enemigos, y +30 % de experiencia.', spawn: 2, xp: 1.3, challenge: true, goal: 360, reward: 400 },
  { id: 'reto_blindados', name: 'Bots blindados', icon: '🛡', color: '#9aa4b4', desc: 'Los bots tienen el doble de vida, y dan +50 % de experiencia.', enemyHp: 2, xp: 1.5, challenge: true, goal: 300, reward: 400 },
];
export const CHALLENGE_BY_ID = Object.fromEntries(CHALLENGES.map(c => [c.id, c])) as Record<string, Challenge>;

const DAY = 86400000;
/** Número de día según la hora local del jugador (0 = 1-1-1970, que fue jueves). */
const dayNum = (now: number) => Math.floor((now - new Date(now).getTimezoneOffset() * 60000) / DAY);
/** Número de semana (empiezan en lunes). */
export const challengeWeek = (now = Date.now()) => Math.floor((dayNum(now) + 3) / 7);
/** Desafío de esta semana. */
export const weeklyChallenge = (now = Date.now()): Challenge => CHALLENGES[challengeWeek(now) % CHALLENGES.length];
/** Milisegundos hasta el próximo desafío (lunes a medianoche, hora local). */
export const msToNextChallenge = (now = Date.now()) => {
  const d = new Date(now), left = (8 - (d.getDay() || 7)) % 7 || 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + left).getTime() - now;
};
