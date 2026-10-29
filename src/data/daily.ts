// Misiones diarias y racha de conexión. Todo va en el guardado del jugador (en la nube si tiene cuenta).
// El día es el del reloj del dispositivo y cambia a medianoche.
import type { RunResult } from '../game/types';
import { AGENT_BY_ID, isAvailable } from './agents';
import { MAP_BY_ID, MAPS } from './maps';
import { t, nf } from '../i18n';

/** Lo que el jugador ha hecho hoy (se reinicia al cambiar de día). */
export interface DailyProgress {
  day: string;
  games: number; wins: number; kills: number; bossKills: number; damage: number;
  bestTime: number; bestLevel: number; bestKills: number;
  /** Partidas por agente, por mapa y en Difícil/Pesadilla. */
  agents: Record<string, number>; maps: Record<string, number>; hard: number;
  /** Misiones de hoy ya cobradas (por id de plantilla). */
  claimed: string[];
}
/** Racha de días seguidos entrando al juego. */
export interface LoginStreak {
  last: string; streak: number; best: number;
  /** Día del último premio diario cobrado. */
  dayClaimed: string;
  /** Hitos (7, 14, 30…) ya cobrados en la racha actual. */
  claimed: number[];
}

/* ------------------------------------------------------------------ días */
const pad = (n: number) => String(n).padStart(2, '0');
/** Día local en formato AAAA-MM-DD. */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function prevDay(key: string) {
  const [y, m, d] = key.split('-').map(Number), x = new Date(y, m - 1, d - 1);
  return dayKey(x);
}
/** Milisegundos que faltan para medianoche (cuando cambian las misiones). */
export function msToMidnight(now = new Date()) {
  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return n.getTime() - now.getTime();
}

export const emptyDaily = (day = dayKey()): DailyProgress => ({
  day, games: 0, wins: 0, kills: 0, bossKills: 0, damage: 0, bestTime: 0, bestLevel: 0, bestKills: 0, agents: {}, maps: {}, hard: 0, claimed: [],
});
export const emptyLogin = (): LoginStreak => ({ last: '', streak: 0, best: 0, dayClaimed: '', claimed: [] });

/** Progreso de hoy (vacío si lo guardado es de otro día). */
export const todayProgress = (d: DailyProgress | undefined, day = dayKey()) => (d && d.day === day ? d : emptyDaily(day));

/** Suma una partida al progreso de hoy. */
export function addRun(d: DailyProgress | undefined, r: RunResult, day = dayKey()): DailyProgress {
  const p = todayProgress(d, day);
  return {
    ...p,
    games: p.games + 1, wins: p.wins + (r.win ? 1 : 0), kills: p.kills + r.kills, bossKills: p.bossKills + r.bossKills,
    damage: p.damage + Math.round(r.damage),
    bestTime: Math.max(p.bestTime, Math.floor(r.time)), bestLevel: Math.max(p.bestLevel, r.level), bestKills: Math.max(p.bestKills, r.kills),
    agents: { ...p.agents, [r.agentId]: (p.agents[r.agentId] ?? 0) + 1 },
    maps: { ...p.maps, [r.mapId]: (p.maps[r.mapId] ?? 0) + 1 },
    hard: p.hard + (r.difficulty === 'dificil' || r.difficulty === 'pesadilla' ? 1 : 0),
  };
}

/* ------------------------------------------------------------------ misiones diarias */
export interface DailyMission {
  id: string;           // plantilla (única en el día)
  text: string;         // ya traducido
  goal: number;
  reward: number;
  value: (d: DailyProgress) => number;
}
/** Recompensa según la dificultad de la misión (fácil, media, difícil). */
export const DAILY_REWARDS = [60, 120, 200];
const mmss = (s: number) => `${Math.floor(s / 60)}:${pad(s % 60)}`;

type Template = { id: string; goals: number[]; make: (goal: number, pick: <T>(a: T[]) => T, agents: string[]) => Pick<DailyMission, 'text' | 'value'> };
const TEMPLATES: Template[] = [
  { id: 'kills', goals: [300, 700, 1200], make: n => ({ text: t('Elimina {n} enemigos hoy', { n }), value: d => d.kills }) },
  { id: 'runkills', goals: [150, 300, 500], make: n => ({ text: t('Elimina {n} enemigos en una sola partida', { n }), value: d => d.bestKills }) },
  { id: 'survive', goals: [180, 300, 480], make: n => ({ text: t('Sobrevive {time} en una partida', { time: mmss(n) }), value: d => d.bestTime }) },
  { id: 'level', goals: [8, 12, 18], make: n => ({ text: t('Alcanza el nivel {n} en una partida', { n }), value: d => d.bestLevel }) },
  { id: 'games', goals: [2, 3, 5], make: n => ({ text: t('Juega {n} partidas', { n }), value: d => d.games }) },
  { id: 'boss', goals: [1, 2, 4], make: n => ({ text: n === 1 ? t('Derrota a un jefe') : t('Derrota {n} jefes', { n }), value: d => d.bossKills }) },
  { id: 'damage', goals: [25000, 60000, 120000], make: n => ({ text: t('Haz {n} de daño', { n: nf(n) }), value: d => d.damage }) },
  { id: 'agent', goals: [1, 2, 3], make: (n, pick, agents) => {
    const a = pick(agents), agent = t(AGENT_BY_ID[a]?.name ?? a);
    return { text: n === 1 ? t('Juega una partida con {agent}', { agent }) : t('Juega {n} partidas con {agent}', { n, agent }), value: d => d.agents[a] ?? 0 };
  } },
  { id: 'map', goals: [1, 2, 3], make: (n, pick) => {
    const m = pick(MAPS).id, map = MAP_BY_ID[m].name;
    return { text: n === 1 ? t('Juega una partida en {map}', { map }) : t('Juega {n} partidas en {map}', { n, map }), value: d => d.maps[m] ?? 0 };
  } },
  { id: 'hard', goals: [1, 1, 2], make: n => ({ text: n === 1 ? t('Juega una partida en Difícil o Pesadilla') : t('Juega {n} partidas en Difícil o Pesadilla', { n }), value: d => d.hard }) },
];

/** Generador pseudoaleatorio con semilla (las misiones de un día son siempre las mismas). */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

/** Las 3 misiones del día: una fácil, una media y una difícil. `agents` = agentes que el jugador puede usar. */
export function dailyMissions(day: string, agents: string[]): DailyMission[] {
  const r = rng('daily-' + day), pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const usable = agents.filter(isAvailable);
  const pool = TEMPLATES.filter(tp => tp.id !== 'agent' || usable.length > 0);
  const chosen: Template[] = [];
  while (chosen.length < 3) { const tp = pick(pool); if (!chosen.includes(tp)) chosen.push(tp); }
  return chosen.map((tp, tier) => {
    const goal = tp.goals[tier];
    const m = tp.make(goal, pick, usable.length ? usable : ['jett']);
    return { id: tp.id, goal, reward: DAILY_REWARDS[tier], text: m.text, value: m.value };
  });
}

/* ------------------------------------------------------------------ racha de conexión */
/** Premio por entrar cada día (los días sin hito). */
export const LOGIN_REWARD = 50;
/** Hitos de la racha: días seguidos y créditos. */
export const STREAK_REWARDS: { day: number; credits: number }[] = [
  { day: 7, credits: 300 }, { day: 14, credits: 600 }, { day: 30, credits: 1500 }, { day: 60, credits: 2500 },
  { day: 90, credits: 3500 }, { day: 120, credits: 4500 }, { day: 150, credits: 5500 }, { day: 180, credits: 7000 },
  { day: 210, credits: 8000 }, { day: 240, credits: 9000 }, { day: 270, credits: 10000 }, { day: 300, credits: 12000 },
  { day: 330, credits: 14000 }, { day: 365, credits: 25000 },
];

/** Apunta que el jugador ha entrado hoy: suma un día a la racha o la reinicia si se saltó alguno. */
export function touchLogin(l: LoginStreak | undefined, day = dayKey()): LoginStreak {
  const s = l ?? emptyLogin();
  if (s.last === day) return s;
  const keep = s.last === prevDay(day);
  const streak = keep ? s.streak + 1 : 1;
  return { ...s, last: day, streak, best: Math.max(s.best, streak), claimed: keep ? s.claimed : [] };
}
/** Hay algo que cobrar hoy (premio diario, hito o misión completada). */
export function hasDailyReward(daily: DailyProgress | undefined, login: LoginStreak | undefined, agents: string[], day = dayKey()) {
  const l = login ?? emptyLogin(), d = todayProgress(daily, day);
  if (l.last === day && l.dayClaimed !== day) return true;
  if (STREAK_REWARDS.some(m => l.streak >= m.day && !l.claimed.includes(m.day))) return true;
  return dailyMissions(day, agents).some(m => m.value(d) >= m.goal && !d.claimed.includes(m.id));
}
