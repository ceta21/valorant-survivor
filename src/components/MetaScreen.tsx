import { SaveData } from '../utils/storage';
import { META, metaCost } from '../data/meta';
import { audio } from '../utils/audio';

export function MetaScreen({ save, back, buy }: { save: SaveData; back: () => void; buy: (id: keyof SaveData['meta']) => void }) {
  return (
    <div className="screen meta">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>Volver</b></button>
        <h2>Mejoras permanentes</h2>
        <span className="credits">◈ {save.credits.toLocaleString('es-ES')}</span>
      </header>
      <p className="lead">Se aplican a todos los agentes en cada partida. Son pequeñas a propósito: cada punto cuenta, pero la habilidad sigue importando.</p>
      <ul className="meta-list">
        {META.map(m => {
          const lv = save.meta[m.id];
          const maxed = lv >= m.max;
          const cost = metaCost(lv);
          return (
            <li key={m.id} className="meta-row">
              <span className="meta-icon">{m.icon}</span>
              <div className="meta-info">
                <b>{m.name}</b>
                <span>{m.desc}</span>
                <div className="pips" aria-label={`Nivel ${lv} de ${m.max}`}>{Array.from({ length: m.max }, (_, i) => <i key={i} className={i < lv ? 'on' : ''} />)}</div>
              </div>
              <div className="meta-val">+{Math.round(lv * m.per * 100)}%<small>actual</small></div>
              <button className="btn btn-red btn-sm" disabled={maxed || save.credits < cost} onClick={() => { audio.play('pick'); buy(m.id); }}>
                <b>{maxed ? 'Máximo' : `◈ ${cost}`}</b>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
