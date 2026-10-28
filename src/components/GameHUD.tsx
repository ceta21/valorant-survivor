import { GameEngine } from '../game/GameEngine';
import { WEAPONS } from '../data/weapons';
import { gunRuns, gunSize } from '../game/weaponSprites';
import { t } from '../i18n';
import { KeyMap, keyLabel } from '../game/controls';

function GunIcon({ id }: { id: string }) {
  const s = gunSize(id);
  return (
    <svg className="gunicon" viewBox={`0 0 ${s.w} ${s.h}`} shapeRendering="crispEdges" aria-hidden="true">
      {gunRuns(id, WEAPONS[id].color).map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1.02} fill={r.c} />)}
    </svg>
  );
}

export type Hud = ReturnType<GameEngine['hud']>;
/** Texto del aviso grande: los del motor llevan clave y nombres sin traducir. */
const bannerText = (b: NonNullable<Hud['banner']>) =>
  b.key ? t(b.key, Object.fromEntries(Object.entries(b.p ?? {}).map(([k, v]) => [k, t(v).toUpperCase()]))) : t(b.text);
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

interface Props { hud: Hud; engine: GameEngine; onPause: () => void; onCast?: (slot: 'special' | 'secondary' | 'ultimate') => void; keys: KeyMap }

export function GameHUD({ hud, engine, onPause, onCast, keys }: Props) {
  const ag = engine.agent;
  const cast = (slot: 'special' | 'secondary' | 'ultimate') => (onCast ? onCast(slot) : engine.cast(slot));
  const slot = (key: string, label: string, name: string, cd: number, max: number, ready: boolean, cast: () => void, ult = false) => {
    const frac = ult ? hud.ult / 100 : max > 0 ? 1 - cd / max : 1;
    return (
      <button className={`ab ${ready ? 'ready' : ''} ${ult ? 'ult' : ''}`} style={{ ['--f' as any]: `${Math.round(frac * 100)}%`, ['--ac' as any]: ag.color }} onClick={cast} aria-label={`${name} (${label})`}>
        <span className="ab-fill" />
        <b>{t(name)}</b>
        <kbd>{key}</kbd>
        {!ult && cd > 0 && <em>{cd.toFixed(1)}</em>}
        {ult && !ready && <em>{Math.floor(hud.ult)}%</em>}
      </button>
    );
  };
  return (
    <div className="hud">
      <div className="xpbar" aria-label={t('Experiencia')}><i style={{ width: `${(hud.xp / hud.need) * 100}%` }} /></div>
      <div className="hud-top">
        <div className="hud-left">
          <div className="lvl">{t('NV')} {hud.level}</div>
          <div className="hpwrap">
            <div className="hp"><i style={{ width: `${Math.max(0, (hud.hp / hud.maxHp) * 100)}%` }} /><span>{Math.ceil(hud.hp)} / {Math.round(hud.maxHp)}</span></div>
            {hud.mates.map((m, i) => (
              <div key={i} className={`mate ${m.dead ? 'down' : ''}`} style={{ ['--mc' as any]: m.color }}>
                <span>{m.name} · {m.gone ? t('desconectado') : m.dead ? t('caído') : t(m.agent)}</span>
                <div><i style={{ width: `${m.dead ? 0 : Math.max(0, (m.hp / m.maxHp) * 100)}%` }} /></div>
              </div>
            ))}
            {hud.shield > 0 && <div className="sh"><i style={{ width: `${Math.min(100, (hud.shield / Math.max(1, hud.maxShield + 20)) * 100)}%` }} /><span>{Math.ceil(hud.shield)}</span></div>}
          </div>
        </div>
        <div className="hud-mid">
          <div className="timer">{fmt(hud.time)}</div>
          <small>
            {hud.endless ? t('Modo infinito · siguiente jefe en {n} s', { n: Math.ceil(hud.nextBoss) }) : t('Jefe final en {t}', { t: fmt(hud.finalAt - hud.time) })}
            {' · '}<span style={{ color: hud.difficulty.color }}>{t(hud.difficulty.name)}</span>
          </small>
        </div>
        <div className="hud-right">
          <div className="kills">☠ {hud.kills}</div>
          <small>{t('{n} enemigos', { n: hud.alive })}</small>
          <button className="btn btn-sm" onClick={onPause} aria-label={t('Pausa')}><b>II</b></button>
        </div>
      </div>
      {hud.boss && (
        <div className="bossbar"><span>{t(hud.boss.name)}</span><div><i style={{ width: `${Math.max(0, (hud.boss.hp / hud.boss.max) * 100)}%` }} /></div></div>
      )}
      {hud.banner && <div className="banner" style={{ color: hud.banner.color }} key={hud.banner.text}>{bannerText(hud.banner)}</div>}
      <div className="weapons">
        {hud.weapons.map(w => (
          <div key={w.id} className={`wslot ${w.lvl >= 5 ? 'evo' : ''}`} style={{ ['--wc' as any]: WEAPONS[w.id].color }}>
            <GunIcon id={w.id} /><b>{t(w.lvl >= 5 ? WEAPONS[w.id].evolved.name : WEAPONS[w.id].name)}</b><span>{t('Nv')} {w.lvl}</span>
          </div>
        ))}
      </div>
      <div className="abilities-bar">
        {slot(keyLabel(keys.special), keyLabel(keys.special), ag.special.name, hud.special.cd, hud.special.max, hud.special.cd <= 0, () => cast('special'))}
        {ag.secondary && hud.secondary && slot(keyLabel(keys.secondary), keyLabel(keys.secondary), ag.secondary.name, hud.secondary.cd, hud.secondary.max, hud.secondary.cd <= 0, () => cast('secondary'))}
        {slot(keyLabel(keys.ultimate), keyLabel(keys.ultimate), ag.ultimate.name, 0, 0, hud.ult >= 100, () => cast('ultimate'), true)}
      </div>
    </div>
  );
}
