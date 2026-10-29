import type { Lang } from '../i18n';
import { browserLang } from '../i18n';
import { KeyMap, normalizeKeys } from '../game/controls';
import { DailyProgress, LoginStreak, emptyDaily, emptyLogin } from '../data/daily';
export interface Settings {
  musicVol: number; sfxVol: number; musicOn: boolean; sfxOn: boolean; shake: boolean; autoPause: boolean;
}
export interface MetaLevels { dmg: number; hp: number; speed: number; xp: number }
export interface SaveStats {
  games: number; wins: number; kills: number; bossKills: number; damage: number;
  time: number; bestTime: number; bestLevel: number; bestKills: number; credits: number;
}
export interface MapRecord { bestTime: number; bestLevel: number; wins: number }
export interface SaveData {
  version: 1;
  credits: number;
  unlocked: string[];
  meta: MetaLevels;
  stats: SaveStats;
  records: Record<string, MapRecord>;
  claimed: string[];
  achievements: string[];
  settings: Settings;
  lastAgent: string;
  lastMap: string;
  lastDifficulty: string;
  playerName: string;
  /** Mercado nocturno: armas y agentes exclusivos comprados. */
  exclusives: string[];
  /** Habilidades elegidas para cada agente exclusivo. */
  kits: Record<string, { special: string; secondary: string; ultimate: string }>;
  /** Arma con la que se empieza la partida. */
  loadout: string;
  /** Cartas del mercado ya descubiertas en la rotación actual. */
  market: { period: number; revealed: number[] };
  /** Última versión de las novedades que ha visto el jugador. */
  newsSeen: string;
  /** Misiones diarias: lo hecho hoy y lo ya cobrado. */
  daily: DailyProgress;
  /** Racha de días seguidos entrando al juego. */
  login: LoginStreak;
}

const KEY = 'valorant-survivors-save-v1';

export const defaultSave = (): SaveData => ({
  version: 1,
  credits: 0,
  unlocked: ['jett', 'phoenix', 'sage'],
  meta: { dmg: 0, hp: 0, speed: 0, xp: 0 },
  stats: { games: 0, wins: 0, kills: 0, bossKills: 0, damage: 0, time: 0, bestTime: 0, bestLevel: 0, bestKills: 0, credits: 0 },
  records: {},
  claimed: [],
  achievements: [],
  settings: { musicVol: 0.4, sfxVol: 0.7, musicOn: true, sfxOn: true, shake: true, autoPause: true },
  lastAgent: 'jett',
  lastMap: 'ascent',
  lastDifficulty: 'normal',
  playerName: '',
  exclusives: [],
  kits: {},
  loadout: 'classic',
  market: { period: 0, revealed: [] },
  newsSeen: '',
  daily: emptyDaily(''),
  login: emptyLogin(),
});

/** Completa un guardado (local o de la nube) con los valores por defecto que falten. */
export function normalizeSave(p: any): SaveData {
  const d = defaultSave();
  if (!p || typeof p !== 'object') return d;
  return {
    ...d, ...p,
    meta: { ...d.meta, ...(p.meta || {}) },
    stats: { ...d.stats, ...(p.stats || {}) },
    settings: { ...d.settings, ...(p.settings || {}) },
    records: p.records || {},
    unlocked: Array.isArray(p.unlocked) && p.unlocked.length ? p.unlocked : d.unlocked,
    claimed: p.claimed || [],
    achievements: p.achievements || [],
    exclusives: Array.isArray(p.exclusives) ? p.exclusives : [],
    kits: p.kits && typeof p.kits === 'object' ? p.kits : {},
    market: p.market && typeof p.market.period === 'number' ? p.market : d.market,
    daily: p.daily && typeof p.daily.day === 'string' ? { ...d.daily, ...p.daily } : d.daily,
    login: p.login && typeof p.login.streak === 'number' ? { ...d.login, ...p.login } : d.login,
  };
}

/**
 * Guardado antiguo de este navegador (de antes de las cuentas). Ya no se escribe:
 * solo se usa como punto de partida para no perder ese progreso al crear una cuenta.
 */
export function loadLegacySave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalizeSave(JSON.parse(raw)) : defaultSave();
  } catch {
    return defaultSave();
  }
}

export function clearLegacySave(): void {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}

/* ------------------------------------------------------------------ preferencias del dispositivo */
// Idioma y controles se guardan en este navegador (también en modo invitado y antes de entrar).

export interface Prefs { lang: Lang; keys: KeyMap }
const PREFS = 'valorant-survivors-prefs-v1';

export function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS) || '{}');
    return { lang: p.lang === 'en' || p.lang === 'es' ? p.lang : browserLang(), keys: normalizeKeys(p.keys) };
  } catch {
    return { lang: browserLang(), keys: normalizeKeys() };
  }
}
export function savePrefs(p: Prefs): void {
  try { localStorage.setItem(PREFS, JSON.stringify(p)); } catch { /* sin almacenamiento */ }
}
