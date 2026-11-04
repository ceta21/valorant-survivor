import { useEffect, useState } from 'react';
import { SaveData } from '../utils/storage';
import { NEWS } from '../data/news';
import { DAILY_REWARDS, dailyMissions, dayKey, todayProgress } from '../data/daily';
import { AGENT_BY_ID } from '../data/agents';
import { DIFFICULTY_BY_ID } from '../data/difficulty';
import { marketPeriod, msToNextRotation, MARKET_SLOTS } from '../data/market';
import { isSunday, msToEventChange, sundayEvent } from '../data/events';
import { ScoreEntry, fetchScores } from '../utils/leaderboard';
import { audio } from '../utils/audio';
import { t, nf } from '../i18n';
import { Emo } from './MainMenu';

type Target = 'news' | 'market' | 'ranking' | 'stats' | 'daily';
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const fmtLeft = (ms: number) => { const m = Math.floor(ms / 60000); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };

/** Columna central del menú: lo último del juego de un vistazo (novedades, mercado, ranking, misiones). */
export function MenuHub({ save, go }: { save: SaveData; go: (s: Target) => void }) {
  const [top, setTop] = useState<ScoreEntry[] | null>(null);
  const [left, setLeft] = useState(msToNextRotation());
  useEffect(() => {
    let live = true;
    // se piden más y se quitan las marcas de héroes que ya no existen: el menú es lo primero que ve alguien nuevo
    fetchScores({ agent: 'all', difficulty: 'all' }, 30).then(r => { if (live) setTop(r.filter(x => AGENT_BY_ID[x.agent]).slice(0, 3)); }).catch(() => { if (live) setTop([]); });
    const t = setInterval(() => setLeft(msToNextRotation()), 30000);
    return () => { live = false; clearInterval(t); };
  }, []);

  const open = (s: Target) => () => { audio.play('click'); go(s); };
  const news = NEWS[0];
  const revealed = save.market.period === marketPeriod() ? save.market.revealed.length : 0;
  const day = dayKey(), today = todayProgress(save.daily, day);
  const missions = dailyMissions(day, save.unlocked)
    .map((m, i) => ({ m, reward: DAILY_REWARDS[i], c: Math.min(m.value(today), m.goal), claimed: today.claimed.includes(m.id) }))
    .filter(x => !x.claimed);
  const streak = save.login.last === day ? save.login.streak : 0;

  return (
    <section className="menu-mid" aria-label={t('Resumen')}>
      <EventStrip />
      {news && (
        <button className="hub-card hub-news" style={{ ['--hc' as any]: news.color }} onClick={open('news')}>
          <span className="hub-kicker"><Emo e="📰" />{t('Novedades')} · v{news.id}</span>
          <b>{t(news.title)}</b>
          <ul>{news.items.slice(0, 2).map((s, i) => <li key={i}>{t(s)}</li>)}</ul>
          <span className="hub-more">{t('Ver todas')} ›</span>
        </button>
      )}
      <button className="hub-card hub-market" style={{ ['--hc' as any]: '#b05cff' }} onClick={open('market')}>
        <span className="hub-kicker"><Emo e="🌙" />{t('Mercado de la Grieta')}</span>
        <div className="hub-cards" aria-hidden="true">
          {Array.from({ length: MARKET_SLOTS }, (_, i) => <i key={i} className={i < revealed ? 'on' : ''}>{i < revealed ? '★' : '?'}</i>)}
        </div>
        <span>{revealed < MARKET_SLOTS ? t('{n} cartas por descubrir', { n: MARKET_SLOTS - revealed }) : t('Ya has visto todas las cartas de hoy')} · {t('nuevas en')} {fmtLeft(left)}</span>
      </button>
      <button className="hub-card hub-rank" style={{ ['--hc' as any]: '#ffd24a' }} onClick={open('ranking')}>
        <span className="hub-kicker"><Emo e="🏆" />{t('Top del ranking')}</span>
        {top === null ? <span className="hub-muted">{t('Cargando…')}</span> : top.length === 0 ? <span className="hub-muted">{t('Aún no hay marcas. ¡Sé el primero!')}</span> : (
          <ol>
            {top.map((r, i) => (
              <li key={i}>
                <em>{i + 1}</em>
                <b>{r.name}</b>
                <span style={{ color: AGENT_BY_ID[r.agent]?.color }}>{AGENT_BY_ID[r.agent] ? t(AGENT_BY_ID[r.agent].name) : t('Héroe retirado')}</span>
                <span style={{ color: DIFFICULTY_BY_ID[r.difficulty]?.color }}>{t(DIFFICULTY_BY_ID[r.difficulty]?.name ?? '')}</span>
                <strong>{fmt(r.time)}</strong>
              </li>
            ))}
          </ol>
        )}
      </button>
      <button className="hub-card hub-missions" style={{ ['--hc' as any]: '#5dff9a' }} onClick={open('daily')}>
        <span className="hub-kicker"><Emo e="📅" />{t('Misiones diarias')} · {streak === 1 ? t('Racha: 1 día') : t('Racha: {n} días', { n: streak })}</span>
        {missions.length === 0 ? <span className="hub-muted">{t('¡Misiones de hoy completadas!')}</span> : missions.slice(0, 2).map(({ m, reward, c }) => (
          <div key={m.id} className="hub-mission">
            <span><b>{m.text}</b> {c >= m.goal ? <em>{t('¡Reclama ◈ {n}!', { n: reward })}</em> : <em>◈ {reward}</em>}</span>
            <div className="bar"><i style={{ width: `${(c / m.goal) * 100}%` }} /></div>
            <small>{nf(c)}/{nf(m.goal)}</small>
          </div>
        ))}
      </button>
    </section>
  );
}

/** Evento del domingo: el de hoy y cuánto le queda o, entre semana, el del próximo domingo y cuánto falta. */
export function EventStrip() {
  const ev = sundayEvent(), on = isSunday(), ms = msToEventChange(), d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000);
  const time = d > 0 ? t('{d} d {h} h', { d, h }) : t('{h} h', { h });
  return (
    <div className={`hub-event ${on ? 'on' : ''}`} style={{ ['--hc' as any]: ev.color }} title={t(ev.desc)}>
      <span className="hub-kicker"><Emo e={ev.icon} />{on ? t('Evento del domingo · termina en {t}', { t: time }) : t('Próximo domingo · empieza en {t}', { t: time })}</span>
      <b>{t(ev.name)}</b>
      <small>{t(ev.desc)}</small>
    </div>
  );
}
