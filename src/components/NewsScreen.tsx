import { NEWS } from '../data/news';
import { audio } from '../utils/audio';

const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

/** Novedades: historial de actualizaciones del juego, la más reciente arriba. */
export function NewsScreen({ back }: { back: () => void }) {
  return (
    <div className="screen news">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>Volver</b></button>
        <h2>Novedades</h2>
        <span />
      </header>
      <div className="news-list">
        {NEWS.map((n, i) => (
          <article key={n.id} className={`news-card ${i === 0 ? 'latest' : ''}`} style={{ ['--nc' as any]: n.color }}>
            <header>
              <span className="news-tag">{n.tag}</span>
              <span className="news-ver">v{n.id}</span>
              <time dateTime={n.date}>{fmtDate(n.date)}</time>
            </header>
            <h3>{n.title}</h3>
            <ul>{n.items.map((t, j) => <li key={j}>{t}</li>)}</ul>
          </article>
        ))}
      </div>
    </div>
  );
}
