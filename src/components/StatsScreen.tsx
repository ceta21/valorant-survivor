import { SaveData } from '../utils/storage';
import { MISSIONS, ACHIEVEMENTS } from '../data/goals';
import { MAPS } from '../data/maps';
import { audio } from '../utils/audio';
import { t, nf } from '../i18n';

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function StatsScreen({ save, back, claim }: { save: SaveData; back: () => void; claim: (id: string, reward: number) => void }) {
  const s = save.stats;
  const cells: [string, string][] = [
    [t('Partidas'), String(s.games)], [t('Victorias'), String(s.wins)], [t('Eliminaciones'), nf(s.kills)],
    [t('Jefes derrotados'), String(s.bossKills)], [t('Daño total'), nf(s.damage)], [t('Tiempo jugado'), fmt(s.time)],
    [t('Mejor tiempo'), fmt(s.bestTime)], [t('Mejor nivel'), String(s.bestLevel)], [t('Más bajas en una partida'), String(s.bestKills)],
  ];
  return (
    <div className="screen stats">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>{t('Volver')}</b></button>
        <h2>{t('Estadísticas')}</h2>
        <span className="credits">◈ {nf(save.credits)}</span>
      </header>
      <div className="stats-body">
        <section>
          <h3>{t('Resumen')}</h3>
          <dl className="stat-grid">{cells.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <h3>{t('Récords por mapa')}</h3>
          <table className="records"><thead><tr><th>{t('Mapa')}</th><th>{t('Mejor tiempo')}</th><th>{t('Nivel')}</th><th>{t('Victorias')}</th></tr></thead>
            <tbody>{MAPS.map(m => { const r = save.records[m.id]; return <tr key={m.id}><td>{m.name}</td><td>{r ? fmt(r.bestTime) : '—'}</td><td>{r ? r.bestLevel : '—'}</td><td>{r ? r.wins : 0}</td></tr>; })}</tbody></table>
        </section>
        <section>
          <h3>{t('Misiones')}</h3>
          <ul className="goals">
            {MISSIONS.map(g => {
              const [cur, tot] = g.progress(s);
              const done = cur >= tot, claimed = save.claimed.includes(g.id);
              return (
                <li key={g.id} className={claimed ? 'claimed' : ''}>
                  <div><b>{t(g.name)}</b><span>{t(g.desc)}</span><div className="bar"><i style={{ width: `${Math.min(100, (cur / tot) * 100)}%` }} /></div><small>{nf(Math.min(cur, tot))} / {nf(tot)}</small></div>
                  <button className="btn btn-sm btn-red" disabled={!done || claimed} onClick={() => { audio.play('pick'); claim(g.id, g.reward); }}><b>{claimed ? t('Cobrada') : `◈ ${g.reward}`}</b></button>
                </li>
              );
            })}
          </ul>
          <h3>{t('Logros')}</h3>
          <ul className="achv">
            {ACHIEVEMENTS.map(a => {
              const got = save.achievements.includes(a.id);
              return <li key={a.id} className={got ? 'got' : ''}><i>{got ? '★' : '☆'}</i><div><b>{t(a.name)}</b><span>{t(a.desc)}</span></div></li>;
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
