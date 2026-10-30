import type { Lang } from '../i18n';
import { browserLang } from '../i18n';
import { KeyMap, normalizeKeys } from '../game/controls';
import { DailyProgress, LoginStreak, emptyDaily, emptyLogin } from '../data/daily';
import { ShopSave, emptyShop, LEGACY_WEAPON_PRICES } from '../data/shop';
import { LEGACY_AGENT_COSTS } from '../data/agents';
import { mapOrDefault } from '../data/maps';
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
  /** Mercado nocturno: agentes exclusivos comprados. */
  exclusives: string[];
  /** Habilidades elegidas para cada agente exclusivo. */
  kits: Record<string, { special: string; secondary: string; ultimate: string }>;
  /** Cartas del mercado ya descubiertas en la rotación actual. */
  market: { period: number; revealed: number[] };
  /** Última versión de las novedades que ha visto el jugador. */
  newsSeen: string;
  /** Misiones diarias: lo hecho hoy y lo ya cobrado. */
  daily: DailyProgress;
  /** Racha de días seguidos entrando al juego. */
  login: LoginStreak;
  /** Tienda: estilos y mascotas comprados y equipados. */
  shop: ShopSave;
}

const KEY = 'valorant-survivors-save-v1';

export const defaultSave = (): SaveData => ({
  version: 1,
  credits: 0,
  unlocked: ['zephyr', 'lyra', 'kael'],
  meta: { dmg: 0, hp: 0, speed: 0, xp: 0 },
  stats: { games: 0, wins: 0, kills: 0, bossKills: 0, damage: 0, time: 0, bestTime: 0, bestLevel: 0, bestKills: 0, credits: 0 },
  records: {},
  claimed: [],
  achievements: [],
  settings: { musicVol: 0.4, sfxVol: 0.7, musicOn: true, sfxOn: true, shake: true, autoPause: true },
  lastAgent: 'zephyr',
  lastMap: 'reino',
  lastDifficulty: 'normal',
  playerName: '',
  exclusives: [],
  kits: {},
  market: { period: 0, revealed: [] },
  newsSeen: '',
  daily: emptyDaily(''),
  login: emptyLogin(),
  shop: emptyShop(),
});

/** Completa un guardado (local o de la nube) con los valores por defecto que falten. */
export function normalizeSave(p: any): SaveData {
  const d = defaultSave();
  if (!p || typeof p !== 'object') return d;
  // agentes de versiones anteriores que ya no existen: se quitan y se devuelve lo que costaron
  const legacy = Array.isArray(p.unlocked) ? p.unlocked.filter((id: string) => id in LEGACY_AGENT_COSTS) : [];
  if (legacy.length) {
    p = { ...p, unlocked: [...d.unlocked, ...p.unlocked.filter((id: string) => !(id in LEGACY_AGENT_COSTS) && !d.unlocked.includes(id))],
      credits: (p.credits ?? 0) + legacy.reduce((t: number, id: string) => t + LEGACY_AGENT_COSTS[id], 0) };
  }
  // ya no hay armas: las exclusivas y los estilos de arma comprados se quitan y se devuelve lo que costaron
  const ex: string[] = Array.isArray(p.exclusives) ? p.exclusives : [], own: string[] = Array.isArray(p.shop?.owned) ? p.shop.owned : [];
  const guns = [...ex, ...own].filter(id => id in LEGACY_WEAPON_PRICES);
  if (guns.length) {
    p = { ...p, credits: (p.credits ?? 0) + guns.reduce((t, id) => t + LEGACY_WEAPON_PRICES[id], 0), exclusives: ex.filter(id => !(id in LEGACY_WEAPON_PRICES)),
      shop: { ...p.shop, owned: own.filter(id => !(id in LEGACY_WEAPON_PRICES)) } };
  }
  delete p.loadout; if (p.shop) delete p.shop.weapon;
  return {
    ...d, ...p,
    lastMap: mapOrDefault(p.lastMap ?? d.lastMap),   // los mapas antiguos (Ascent, Bind, Haven) pasan a la zona por defecto
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
    shop: p.shop && Array.isArray(p.shop.owned) ? { ...d.shop, ...p.shop } : d.shop,
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
