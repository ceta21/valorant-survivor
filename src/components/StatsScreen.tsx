import { SaveData } from '../utils/storage';
import { MISSIONS, ACHIEVEMENTS } from '../data/goals';
import { MAPS } from '../data/maps';
import { audio } from '../utils/audio';

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function StatsScreen({ save, back, claim }: { save: SaveData; back: () => void; claim: (id: string, reward: number) => void }) {
  const s = save.stats;
  const cells: [string, string][] = [
    ['Partidas', String(s.games)], ['Victorias', String(s.wins)], ['Eliminaciones', s.kills.toLocaleString('es-ES')],
    ['Jefes derrotados', String(s.bossKills)], ['Daño total', s.damage.toLocaleString('es-ES')], ['Tiempo jugado', fmt(s.time)],
    ['Mejor tiempo', fmt(s.bestTime)], ['Mejor nivel', String(s.bestLevel)], ['Más bajas en una partida', String(s.bestKills)],
  ];
  return (
    <div className="screen stats">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>Volver</b></button>
        <h2>Estadísticas</h2>
        <span className="credits">◈ {save.credits.toLocaleString('es-ES')}</span>
      </header>
      <div className="stats-body">
        <section>
          <h3>Resumen</h3>
          <dl className="stat-grid">{cells.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <h3>Récords por mapa</h3>
          <table className="records"><thead><tr><th>Mapa</th><th>Mejor tiempo</th><th>Nivel</th><th>Victorias</th></tr></thead>
            <tbody>{MAPS.map(m => { const r = save.records[m.id]; return <tr key={m.id}><td>{m.name}</td><td>{r ? fmt(r.bestTime) : '—'}</td><td>{r ? r.bestLevel : '—'}</td><td>{r ? r.wins : 0}</td></tr>; })}</tbody></table>
        </section>
        <section>
          <h3>Misiones</h3>
          <ul className="goals">
            {MISSIONS.map(g => {
              const [cur, tot] = g.progress(s);
              const done = cur >= tot, claimed = save.claimed.includes(g.id);
              return (
                <li key={g.id} className={claimed ? 'claimed' : ''}>
                  <div><b>{g.name}</b><span>{g.desc}</span><div className="bar"><i style={{ width: `${Math.min(100, (cur / tot) * 100)}%` }} /></div><small>{Math.min(cur, tot).toLocaleString('es-ES')} / {tot.toLocaleString('es-ES')}</small></div>
                  <button className="btn btn-sm btn-red" disabled={!done || claimed} onClick={() => { audio.play('pick'); claim(g.id, g.reward); }}><b>{claimed ? 'Cobrada' : `◈ ${g.reward}`}</b></button>
                </li>
              );
            })}
          </ul>
          <h3>Logros</h3>
          <ul className="achv">
            {ACHIEVEMENTS.map(a => {
              const got = save.achievements.includes(a.id);
              return <li key={a.id} className={got ? 'got' : ''}><i>{got ? '★' : '☆'}</i><div><b>{a.name}</b><span>{a.desc}</span></div></li>;
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
