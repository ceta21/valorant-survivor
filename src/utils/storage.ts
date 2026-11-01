import type { Lang } from '../i18n';
import { browserLang } from '../i18n';
import { KeyMap, normalizeKeys } from '../game/controls';
import { DailyProgress, LoginStreak, emptyDaily, emptyLogin } from '../data/daily';
import { ShopSave, emptyShop, LEGACY_PRICES } from '../data/shop';
import { GearSave, emptyGear } from '../data/gear';
import { LEGACY_AGENT_COSTS } from '../data/agents';
import { mapOrDefault } from '../data/maps';
export interface Settings {
  musicVol: number; sfxVol: number; musicOn: boolean; sfxOn: boolean; shake: boolean; autoPause: boolean;
  /** Ya se vieron los consejos de la primera partida. */
  tutorialDone: boolean;
  /** Enviar estadísticas anónimas de uso (utils/analytics.ts). */
  analytics: boolean;
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
  /** Equipo entre partidas: objetos ganados y los que se llevan puestos. */
  gear: GearSave;
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
  settings: { musicVol: 0.4, sfxVol: 0.7, musicOn: true, sfxOn: true, shake: true, autoPause: true, tutorialDone: false, analytics: true },
  lastAgent: 'zephyr',
  lastMap: 'reino',
  lastDifficulty: 'normal',
  playerName: '',
  market: { period: 0, revealed: [] },
  newsSeen: '',
  daily: emptyDaily(''),
  login: emptyLogin(),
  shop: emptyShop(),
  gear: emptyGear(),
});

/** Completa un guardado (local o de la nube) con los valores por defecto que falten. */
export function normalizeSave(p: any): SaveData {
  const d = defaultSave();
  if (!p || typeof p !== 'object') return d;
  // héroes de versiones anteriores que ya no existen: se quitan y se devuelve lo que costaron
  const legacy = Array.isArray(p.unlocked) ? p.unlocked.filter((id: string) => id in LEGACY_AGENT_COSTS) : [];
  if (legacy.length) {
    p = { ...p, unlocked: [...d.unlocked, ...p.unlocked.filter((id: string) => !(id in LEGACY_AGENT_COSTS) && !d.unlocked.includes(id))],
      credits: (p.credits ?? 0) + legacy.reduce((t: number, id: string) => t + LEGACY_AGENT_COSTS[id], 0) };
  }
  // lo que ya no existe (armas exclusivas, estilos de arma y los héroes exclusivos) se quita y se devuelve lo que costó
  const ex: string[] = Array.isArray(p.exclusives) ? p.exclusives : [], own: string[] = Array.isArray(p.shop?.owned) ? p.shop.owned : [];
  const gone = [...ex, ...own].filter(id => id in LEGACY_PRICES);
  if (gone.length || ex.length) {
    p = { ...p, credits: (p.credits ?? 0) + gone.reduce((t, id) => t + LEGACY_PRICES[id], 0), shop: p.shop && { ...p.shop, owned: own.filter(id => !(id in LEGACY_PRICES)) } };
  }
  p = { ...p }; delete p.exclusives; delete p.kits; delete p.loadout; if (p.shop) delete p.shop.weapon;
  return {
    ...d, ...p,
    lastMap: mapOrDefault(p.lastMap ?? d.lastMap),   // los mapas antiguos (Ascent, Bind, Haven) pasan a la zona por defecto
    meta: { ...d.meta, ...(p.meta || {}) },
    stats: { ...d.stats, ...(p.stats || {}) },
    settings: { ...d.settings, ...(p.settings || {}), tutorialDone: p.settings?.tutorialDone ?? ((p.stats?.games ?? 0) > 0) },
    records: p.records || {},
    unlocked: Array.isArray(p.unlocked) && p.unlocked.length ? p.unlocked : d.unlocked,
    claimed: p.claimed || [],
    achievements: p.achievements || [],
    market: p.market && typeof p.market.period === 'number' ? p.market : d.market,
    daily: p.daily && typeof p.daily.day === 'string' ? { ...d.daily, ...p.daily } : d.daily,
    login: p.login && typeof p.login.streak === 'number' ? { ...d.login, ...p.login } : d.login,
    shop: p.shop && Array.isArray(p.shop.owned) ? { ...d.shop, ...p.shop } : d.shop,
    gear: p.gear && Array.isArray(p.gear.items) ? { items: p.gear.items, equipped: Array.isArray(p.gear.equipped) ? p.gear.equipped : [] } : d.gear,
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
