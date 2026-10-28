// Ranking global en Supabase. Si no hay proyecto configurado, se usa un ranking local
// guardado en este navegador con la misma interfaz.
import { supabase } from './supabase';

export interface ScoreEntry {
  name: string; agent: string; difficulty: string; map: string;
  time: number; kills: number; level: number; boss_kills: number;
  created_at?: string; player_id?: number | null; user_id?: string | null;
}
export interface Filters { agent: string; difficulty: string }

export const isGlobal = Boolean(supabase);
const LOCAL = 'valorant-survivors-scores-v1';

export const cleanName = (s: string) => s.replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 16);

function readLocal(): ScoreEntry[] {
  try { const v = JSON.parse(localStorage.getItem(LOCAL) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}

/** Mejor marca de cada jugador (por cuenta, o por nombre si es invitado), de más a menos tiempo. */
function bestPerPlayer(rows: ScoreEntry[], limit: number) {
  const seen = new Set<string>(), out: ScoreEntry[] = [];
  for (const r of [...rows].sort((a, b) => b.time - a.time)) {
    const k = r.user_id ?? `guest:${r.name.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k); out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}

export async function fetchScores(f: Filters, limit = 50): Promise<ScoreEntry[]> {
  if (!supabase) {
    const rows = readLocal().filter(r => (f.agent === 'all' || r.agent === f.agent) && (f.difficulty === 'all' || r.difficulty === f.difficulty));
    return bestPerPlayer(rows, limit);
  }
  let q = supabase.from('scores').select('name,agent,difficulty,map,time,kills,level,boss_kills,created_at,player_id,user_id').order('time', { ascending: false }).limit(500);
  if (f.agent !== 'all') q = q.eq('agent', f.agent);
  if (f.difficulty !== 'all') q = q.eq('difficulty', f.difficulty);
  const { data, error } = await q;
  if (error) throw new Error(`Ranking no disponible (${error.message})`);
  return bestPerPlayer(data as ScoreEntry[], limit);
}

/** Publica una marca. Con sesión iniciada, el servidor pone el nombre y el ID de la cuenta. */
export async function submitScore(s: ScoreEntry): Promise<void> {
  const row = { ...s, name: cleanName(s.name), time: Math.round(s.time * 10) / 10 };
  if (!row.name) throw new Error('Escribe un nombre');
  if (!supabase) {
    const all = readLocal();
    all.push({ ...row, created_at: new Date().toISOString() });
    try { localStorage.setItem(LOCAL, JSON.stringify(all.sort((a, b) => b.time - a.time).slice(0, 300))); } catch { /* sin almacenamiento */ }
    return;
  }
  const { error } = await supabase.from('scores').insert(row);
  if (error) throw new Error(/registrada/.test(error.message) ? 'Ese nombre pertenece a una cuenta registrada' : `No se pudo enviar (${error.message})`);
}
