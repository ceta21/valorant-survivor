import { useEffect, useState } from 'react';
import { ALL_AGENTS as AGENTS, AGENT_BY_ID } from '../data/agents';
import { DIFFICULTIES, DIFFICULTY_BY_ID } from '../data/difficulty';
import { MAP_BY_ID } from '../data/maps';
import { Filters, ScoreEntry, fetchScores, isGlobal } from '../utils/leaderboard';
import { audio } from '../utils/audio';

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

/** Ranking: el jugador que más ha durado, filtrable por agente y dificultad. */
export function RankingScreen({ back }: { back: () => void }) {
  const [f, setF] = useState<Filters>({ agent: 'all', difficulty: 'all' });
  const [rows, setRows] = useState<ScoreEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setRows(null); setError('');
    fetchScores(f).then(r => { if (live) setRows(r); }).catch(e => { if (live) setError(String(e.message ?? e)); });
    return () => { live = false; };
  }, [f]);

  const pick = (p: Partial<Filters>) => { audio.play('click'); setF(o => ({ ...o, ...p })); };

  return (
    <div className="screen ranking">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>Volver</b></button>
        <h2>Ranking {isGlobal ? 'global' : 'local'}</h2>
        <span />
      </header>
      {!isGlobal && <p className="lead">El ranking global aún no está conectado: se muestran las partidas de este navegador.</p>}
      <div className="rank-filters">
        <label>
          <span>Agente</span>
          <select value={f.agent} onChange={e => pick({ agent: e.target.value })}>
            <option value="all">Todos</option>
            {AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <div className="map-pick" role="radiogroup" aria-label="Dificultad">
          {[{ id: 'all', name: 'Todas', color: '#ece8e1' }, ...DIFFICULTIES].map(d => (
            <button key={d.id} role="radio" aria-checked={f.difficulty === d.id} className={`map-chip ${f.difficulty === d.id ? 'on' : ''}`} onClick={() => pick({ difficulty: d.id })}>
              <i style={{ background: d.color }} /><b>{d.name}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="rank-table-wrap">
        {error ? <p className="rank-msg">{error}</p> : !rows ? <p className="rank-msg">Cargando…</p> : rows.length === 0 ? <p className="rank-msg">Todavía no hay partidas con estos filtros.</p> : (
          <table className="records rank-table">
            <thead><tr><th>#</th><th>Jugador</th><th>Tiempo</th><th>Agente</th><th>Dificultad</th><th className="opt">Mapa</th><th className="opt">Bajas</th><th className="opt">Nivel</th><th className="opt">Jefes</th></tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const d = DIFFICULTY_BY_ID[r.difficulty];
                return (
                  <tr key={`${r.name}-${i}`} className={i < 3 ? `top${i + 1}` : ''}>
                    <td className="pos">{i + 1}</td>
                    <td><b>{r.name}</b>{r.player_id ? <em className="pid"> #{r.player_id}</em> : <em className="pid guest"> invitado</em>}</td>
                    <td className="time">{fmt(r.time)}</td>
                    <td style={{ color: AGENT_BY_ID[r.agent]?.color }}>{AGENT_BY_ID[r.agent]?.name ?? r.agent}</td>
                    <td style={{ color: d?.color }}>{d?.name ?? r.difficulty}</td>
                    <td className="opt">{MAP_BY_ID[r.map]?.name ?? r.map}</td>
                    <td className="opt">{r.kills.toLocaleString('es-ES')}</td>
                    <td className="opt">{r.level}</td>
                    <td className="opt">{r.boss_kills}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
