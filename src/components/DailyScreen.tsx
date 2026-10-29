import { useEffect, useState } from 'react';
import { SaveData } from '../utils/storage';
import { DAILY_REWARDS, LOGIN_REWARD, STREAK_REWARDS, dailyMissions, dayKey, msToMidnight, todayProgress } from '../data/daily';
import { audio } from '../utils/audio';
import { t, nf } from '../i18n';

interface Props {
  save: SaveData;
  back: () => void;
  claimMission: (id: string) => void;
  claimLogin: () => void;
  claimStreak: (day: number) => void;
}

const fmtLeft = (ms: number) => { const m = Math.ceil(ms / 60000); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
/** "7 días", "1 mes", "2 meses"… "1 año". */
const milestoneName = (d: number) => d >= 365 ? t('1 año') : d >= 30 ? (d / 30 === 1 ? t('1 mes') : t('{n} meses', { n: Math.round(d / 30) })) : t('{n} días', { n: d });
const TIERS = ['Fácil', 'Media', 'Difícil'];

/** Diario: misiones del día y camino de la racha de conexión. */
export function DailyScreen({ save, back, claimMission, claimLogin, claimStreak }: Props) {
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 30000); return () => clearInterval(id); }, []);
  const day = dayKey(), d = todayProgress(save.daily, day);
  const missions = dailyMissions(day, [...save.unlocked, ...save.exclusives]);
  const l = save.login, streak = l.last === day ? l.streak : 0;
  const prev = [...STREAK_REWARDS].reverse().find(m => m.day <= streak)?.day ?? 0;
  const next = STREAK_REWARDS.find(m => m.day > streak);
  // tramo del camino: desde el último hito alcanzado hasta el siguiente (tras el año, los últimos 7 días)
  const from = next ? Math.max(1, prev) : Math.max(1, streak - 6), to = next ? next.day : streak;
  const path = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const todayDone = l.dayClaimed === day;

  return (
    <div className="screen daily">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>{t('Volver')}</b></button>
        <h2>{t('Diario')}</h2>
        <span className="credits">◈ {nf(save.credits)}</span>
      </header>
      <div className="daily-body">
        <section>
          <h3>{t('Misiones diarias')}</h3>
          <p className="daily-note">{t('Nuevas misiones en {time}', { time: fmtLeft(msToMidnight()) })}</p>
          <ul className="goals">
            {missions.map((m, i) => {
              const cur = Math.min(m.value(d), m.goal), done = cur >= m.goal, claimed = d.claimed.includes(m.id);
              return (
                <li key={m.id} className={claimed ? 'claimed' : ''}>
                  <div>
                    <b>{t(TIERS[i])}</b><span>{m.text}</span>
                    <div className="bar"><i style={{ width: `${(cur / m.goal) * 100}%` }} /></div>
                    <small>{nf(cur)} / {nf(m.goal)}</small>
                  </div>
                  <button className="btn btn-sm btn-red" disabled={!done || claimed} onClick={() => { audio.play('pick'); claimMission(m.id); }}>
                    <b>{claimed ? t('Cobrada') : `◈ ${DAILY_REWARDS[i]}`}</b>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="streak">
          <h3>{t('Racha de conexión')}</h3>
          <div className="streak-head">
            <div><strong>{streak}</strong><span>{streak === 1 ? t('día seguido') : t('días seguidos')}</span></div>
            <small>{t('Mejor racha: {n}', { n: Math.max(l.best, streak) })}</small>
            <button className="btn btn-red" disabled={todayDone || streak === 0} onClick={() => { audio.play('pick'); claimLogin(); }}>
              <b>{todayDone ? t('Premio de hoy cobrado') : t('Cobrar premio de hoy · ◈ {n}', { n: LOGIN_REWARD })}</b>
            </button>
          </div>
          <p className="daily-note">{next
            ? (next.day - streak === 1 ? t('Camino hasta {name}: ¡falta 1 día!', { name: milestoneName(next.day) }) : t('Camino hasta {name}: faltan {n} días', { name: milestoneName(next.day), n: next.day - streak }))
            : t('¡Has completado el camino de un año!')}</p>
          <ol className="streak-path" aria-label={t('Camino de la racha')}>
            {path.map(n => {
              const goal = STREAK_REWARDS.find(m => m.day === n);
              return (
                <li key={n} className={`${n <= streak ? 'on' : ''} ${n === streak ? 'today' : ''} ${goal ? 'goal' : ''}`} title={t('Día {n}', { n })}>
                  {goal ? <>★<em>◈ {nf(goal.credits)}</em></> : n}
                </li>
              );
            })}
          </ol>
          <h4>{t('Premios de racha')}</h4>
          <ul className="streak-goals">
            {STREAK_REWARDS.map(m => {
              const claimed = l.claimed.includes(m.day), ready = streak >= m.day && !claimed;
              return (
                <li key={m.day} className={`${claimed ? 'claimed' : ''} ${ready ? 'ready' : ''}`}>
                  <b>{milestoneName(m.day)}</b>
                  <span>◈ {nf(m.credits)}</span>
                  {ready ? (
                    <button className="btn btn-sm btn-red" onClick={() => { audio.play('pick'); claimStreak(m.day); }}><b>{t('Cobrar')}</b></button>
                  ) : (
                    <small>{claimed ? t('Cobrado') : m.day - streak === 1 ? t('Falta 1 día') : t('Faltan {n} días', { n: m.day - streak })}</small>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="daily-note">{t('Si un día no entras, la racha vuelve a empezar.')}</p>
        </section>
      </div>
    </div>
  );
}
