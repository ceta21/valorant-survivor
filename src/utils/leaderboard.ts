// Ranking global en Supabase (API REST, sin SDK). Si no hay credenciales configuradas,
// se usa un ranking local guardado en este navegador con la misma interfaz.
export interface ScoreEntry {
  name: string; agent: string; difficulty: string; map: string;
  time: number; kills: number; level: number; boss_kills: number; created_at?: string;
}
export interface Filters { agent: string; difficulty: string }

const env = import.meta.env ?? {}; // vacío fuera de Vite (scripts de prueba en Node)
const URL = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const KEY = env.VITE_SUPABASE_ANON_KEY;
export const isGlobal = Boolean(URL && KEY);

const LOCAL = 'valorant-survivors-scores-v1';
const headers = () => ({ apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' });

export const cleanName = (s: string) => s.replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 16);

function readLocal(): ScoreEntry[] {
  try { const v = JSON.parse(localStorage.getItem(LOCAL) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}

/** Mejor marca de cada jugador (por nombre) que cumpla los filtros, de más a menos tiempo. */
function bestPerPlayer(rows: ScoreEntry[], limit: number) {
  const seen = new Set<string>(), out: ScoreEntry[] = [];
  for (const r of [...rows].sort((a, b) => b.time - a.time)) {
    const k = r.name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k); out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}

export async function fetchScores(f: Filters, limit = 50): Promise<ScoreEntry[]> {
  if (!isGlobal) {
    const rows = readLocal().filter(r => (f.agent === 'all' || r.agent === f.agent) && (f.difficulty === 'all' || r.difficulty === f.difficulty));
    return bestPerPlayer(rows, limit);
  }
  const q = new URLSearchParams({ select: 'name,agent,difficulty,map,time,kills,level,boss_kills,created_at', order: 'time.desc', limit: '500' });
  if (f.agent !== 'all') q.set('agent', `eq.${f.agent}`);
  if (f.difficulty !== 'all') q.set('difficulty', `eq.${f.difficulty}`);
  const res = await fetch(`${URL}/rest/v1/scores?${q}`, { headers: headers() });
  if (!res.ok) throw new Error(`Ranking no disponible (${res.status})`);
  return bestPerPlayer(await res.json(), limit);
}

export async function submitScore(s: ScoreEntry): Promise<void> {
  const row = { ...s, name: cleanName(s.name), time: Math.round(s.time * 10) / 10 };
  if (!row.name) throw new Error('Escribe un nombre');
  if (!isGlobal) {
    const all = readLocal();
    all.push({ ...row, created_at: new Date().toISOString() });
    try { localStorage.setItem(LOCAL, JSON.stringify(all.sort((a, b) => b.time - a.time).slice(0, 300))); } catch { /* sin almacenamiento */ }
    return;
  }
  const res = await fetch(`${URL}/rest/v1/scores`, { method: 'POST', headers: { ...headers(), Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!res.ok) throw new Error(`No se pudo enviar (${res.status})`);
}
