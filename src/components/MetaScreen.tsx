import { SaveData } from '../utils/storage';
import { META, metaCost } from '../data/meta';
import { audio } from '../utils/audio';
import { t, nf } from '../i18n';

export function MetaScreen({ save, back, buy }: { save: SaveData; back: () => void; buy: (id: keyof SaveData['meta']) => void }) {
  return (
    <div className="screen meta">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>{t('Volver')}</b></button>
        <h2>{t('Mejoras permanentes')}</h2>
        <span className="credits">◈ {nf(save.credits)}</span>
      </header>
      <p className="lead">{t('Se aplican a todos los agentes en cada partida. Son pequeñas a propósito: cada punto cuenta, pero la habilidad sigue importando.')}</p>
      <ul className="meta-list">
        {META.map(m => {
          const lv = save.meta[m.id];
          const maxed = lv >= m.max;
          const cost = metaCost(lv);
          return (
            <li key={m.id} className="meta-row">
              <span className="meta-icon">{m.icon}</span>
              <div className="meta-info">
                <b>{t(m.name)}</b>
                <span>{t(m.desc)}</span>
                <div className="pips" aria-label={t('Nivel {a} de {b}', { a: lv, b: m.max })}>{Array.from({ length: m.max }, (_, i) => <i key={i} className={i < lv ? 'on' : ''} />)}</div>
              </div>
              <div className="meta-val">+{Math.round(lv * m.per * 100)}%<small>{t('actual')}</small></div>
              <button className="btn btn-red btn-sm" disabled={maxed || save.credits < cost} onClick={() => { audio.play('pick'); buy(m.id); }}>
                <b>{maxed ? t('Máximo') : `◈ ${nf(cost)}`}</b>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
