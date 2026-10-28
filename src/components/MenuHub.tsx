import { useEffect, useState } from 'react';
import { SaveData } from '../utils/storage';
import { NEWS } from '../data/news';
import { MISSIONS } from '../data/goals';
import { AGENT_BY_ID } from '../data/agents';
import { DIFFICULTY_BY_ID } from '../data/difficulty';
import { marketPeriod, msToNextRotation, MARKET_SLOTS } from '../data/market';
import { ScoreEntry, fetchScores } from '../utils/leaderboard';
import { audio } from '../utils/audio';

type Target = 'news' | 'market' | 'ranking' | 'stats';
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const fmtLeft = (ms: number) => { const m = Math.floor(ms / 60000); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };

/** Columna central del menú: lo último del juego de un vistazo (novedades, mercado, ranking, misiones). */
export function MenuHub({ save, go }: { save: SaveData; go: (s: Target) => void }) {
  const [top, setTop] = useState<ScoreEntry[] | null>(null);
  const [left, setLeft] = useState(msToNextRotation());
  useEffect(() => {
    let live = true;
    fetchScores({ agent: 'all', difficulty: 'all' }, 3).then(r => { if (live) setTop(r); }).catch(() => { if (live) setTop([]); });
    const t = setInterval(() => setLeft(msToNextRotation()), 30000);
    return () => { live = false; clearInterval(t); };
  }, []);

  const open = (s: Target) => () => { audio.play('click'); go(s); };
  const news = NEWS[0];
  const revealed = save.market.period === marketPeriod() ? save.market.revealed.length : 0;
  const missions = MISSIONS.filter(m => !save.claimed.includes(m.id))
    .map(m => { const [c, t] = m.progress(save.stats); return { m, c: Math.min(c, t), t, done: c >= t }; })
    .sort((a, b) => Number(b.done) - Number(a.done) || b.c / b.t - a.c / a.t)
    .slice(0, 2);

  return (
    <section className="menu-mid" aria-label="Resumen">
      {news && (
        <button className="hub-card hub-news" style={{ ['--hc' as any]: news.color }} onClick={open('news')}>
          <span className="hub-kicker">Novedades · v{news.id}</span>
          <b>{news.title}</b>
          <ul>{news.items.slice(0, 2).map((t, i) => <li key={i}>{t}</li>)}</ul>
          <span className="hub-more">Ver todas ›</span>
        </button>
      )}
      <button className="hub-card hub-market" style={{ ['--hc' as any]: '#b05cff' }} onClick={open('market')}>
        <span className="hub-kicker">Mercado nocturno</span>
        <div className="hub-cards" aria-hidden="true">
          {Array.from({ length: MARKET_SLOTS }, (_, i) => <i key={i} className={i < revealed ? 'on' : ''}>{i < revealed ? '★' : '?'}</i>)}
        </div>
        <span>{revealed < MARKET_SLOTS ? `${MARKET_SLOTS - revealed} cartas por descubrir` : 'Ya has visto todas las cartas de hoy'} · nuevas en {fmtLeft(left)}</span>
      </button>
      <button className="hub-card hub-rank" style={{ ['--hc' as any]: '#ffd24a' }} onClick={open('ranking')}>
        <span className="hub-kicker">Top del ranking</span>
        {top === null ? <span className="hub-muted">Cargando…</span> : top.length === 0 ? <span className="hub-muted">Aún no hay marcas. ¡Sé el primero!</span> : (
          <ol>
            {top.map((r, i) => (
              <li key={i}>
                <em>{i + 1}</em>
                <b>{r.name}</b>
                <span style={{ color: AGENT_BY_ID[r.agent]?.color }}>{AGENT_BY_ID[r.agent]?.name ?? r.agent}</span>
                <span style={{ color: DIFFICULTY_BY_ID[r.difficulty]?.color }}>{DIFFICULTY_BY_ID[r.difficulty]?.name}</span>
                <strong>{fmt(r.time)}</strong>
              </li>
            ))}
          </ol>
        )}
      </button>
      {missions.length > 0 && (
        <button className="hub-card hub-missions" style={{ ['--hc' as any]: '#5dff9a' }} onClick={open('stats')}>
          <span className="hub-kicker">Misiones</span>
          {missions.map(({ m, c, t, done }) => (
            <div key={m.id} className="hub-mission">
              <span><b>{m.name}</b> {done ? <em>¡Reclama ◈ {m.reward}!</em> : <em>◈ {m.reward}</em>}</span>
              <div className="bar"><i style={{ width: `${(c / t) * 100}%` }} /></div>
              <small>{m.desc} · {c.toLocaleString('es-ES')}/{t.toLocaleString('es-ES')}</small>
            </div>
          ))}
        </button>
      )}
    </section>
  );
}
