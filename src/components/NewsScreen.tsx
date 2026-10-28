import { NEWS } from '../data/news';
import { audio } from '../utils/audio';
import { t, getLang } from '../i18n';

const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(getLang() === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

/** Novedades: historial de actualizaciones del juego, la más reciente arriba. */
export function NewsScreen({ back }: { back: () => void }) {
  return (
    <div className="screen news">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>{t('Volver')}</b></button>
        <h2>{t('Novedades')}</h2>
        <span />
      </header>
      <div className="news-list">
        {NEWS.map((n, i) => (
          <article key={n.id} className={`news-card ${i === 0 ? 'latest' : ''}`} style={{ ['--nc' as any]: n.color }}>
            <header>
              <span className="news-tag">{t(n.tag)}</span>
              <span className="news-ver">v{n.id}</span>
              <time dateTime={n.date}>{fmtDate(n.date)}</time>
            </header>
            <h3>{t(n.title)}</h3>
            <ul>{n.items.map((s, j) => <li key={j}>{t(s)}</li>)}</ul>
          </article>
        ))}
      </div>
    </div>
  );
}
