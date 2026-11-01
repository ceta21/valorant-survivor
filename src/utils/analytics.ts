// Estadísticas de uso anónimas (tabla `events`, ver supabase/estadisticas.sql): visitas, tutorial y partidas, para
// saber dónde se atascan o abandonan los jugadores. Sin datos personales: el identificador de la visita es al azar
// y solo vive en memoria mientras la página está abierta. Se pueden desactivar en Configuración.
import { supabase } from './supabase';

export type TrackKind = 'open' | 'tutorial' | 'run_start' | 'run_end';
type Row = { session: string; kind: TrackKind; data: Record<string, unknown> };

const SESSION = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 36);
let enabled = true;
let queue: Row[] = [];
let timer: number | null = null;
/** Cómo se envían (las pruebas lo cambian por uno falso). */
let sender: ((rows: Row[]) => Promise<unknown>) | null = supabase ? rows => Promise.resolve(supabase!.from('events').insert(rows)) : null;
export function setSender(fn: typeof sender) { sender = fn; }

/** Activa o desactiva el envío (opción de Configuración). Al desactivarlo se descarta lo pendiente. */
export function setAnalytics(on: boolean) { enabled = on; if (!on) queue = []; }

/** Apunta un evento; se envían juntos unos segundos después (o al ocultar la página). */
export function track(kind: TrackKind, data: Record<string, unknown> = {}) {
  if (!enabled || !sender) return;
  queue.push({ session: SESSION, kind, data });
  if (timer === null && typeof window !== 'undefined') timer = window.setTimeout(flush, 3000);
}

/** Envía lo pendiente ya. */
export function flush() {
  if (timer !== null && typeof window !== 'undefined') window.clearTimeout(timer);
  timer = null;
  if (!queue.length || !sender) return;
  const rows = queue; queue = [];
  // si falla (sin conexión, tabla aún sin crear…) no pasa nada: son solo estadísticas
  sender(rows).then(() => {}, () => {});
}

/** Tipo de dispositivo, a grandes rasgos. */
export function deviceKind() {
  if (typeof window === 'undefined') return 'pc';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  return !coarse ? 'pc' : Math.min(window.screen.width, window.screen.height) < 600 ? 'movil' : 'tablet';
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
