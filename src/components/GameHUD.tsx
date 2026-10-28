import { GameEngine } from '../game/GameEngine';
import { WEAPONS } from '../data/weapons';
import { gunRuns, gunSize } from '../game/weaponSprites';

function GunIcon({ id }: { id: string }) {
  const s = gunSize(id);
  return (
    <svg className="gunicon" viewBox={`0 0 ${s.w} ${s.h}`} shapeRendering="crispEdges" aria-hidden="true">
      {gunRuns(id, WEAPONS[id].color).map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1.02} fill={r.c} />)}
    </svg>
  );
}

export type Hud = ReturnType<GameEngine['hud']>;
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

interface Props { hud: Hud; engine: GameEngine; onPause: () => void }

export function GameHUD({ hud, engine, onPause }: Props) {
  const ag = engine.agent;
  const slot = (key: string, label: string, name: string, cd: number, max: number, ready: boolean, cast: () => void, ult = false) => {
    const frac = ult ? hud.ult / 100 : max > 0 ? 1 - cd / max : 1;
    return (
      <button className={`ab ${ready ? 'ready' : ''} ${ult ? 'ult' : ''}`} style={{ ['--f' as any]: `${Math.round(frac * 100)}%`, ['--ac' as any]: ag.color }} onClick={cast} aria-label={`${name} (${label})`}>
        <span className="ab-fill" />
        <b>{name}</b>
        <kbd>{key}</kbd>
        {!ult && cd > 0 && <em>{cd.toFixed(1)}</em>}
        {ult && !ready && <em>{Math.floor(hud.ult)}%</em>}
      </button>
    );
  };
  return (
    <div className="hud">
      <div className="xpbar" aria-label="Experiencia"><i style={{ width: `${(hud.xp / hud.need) * 100}%` }} /></div>
      <div className="hud-top">
        <div className="hud-left">
          <div className="lvl">NV {hud.level}</div>
          <div className="hpwrap">
            <div className="hp"><i style={{ width: `${Math.max(0, (hud.hp / hud.maxHp) * 100)}%` }} /><span>{Math.ceil(hud.hp)} / {Math.round(hud.maxHp)}</span></div>
            {hud.shield > 0 && <div className="sh"><i style={{ width: `${Math.min(100, (hud.shield / Math.max(1, hud.maxShield + 20)) * 100)}%` }} /><span>{Math.ceil(hud.shield)}</span></div>}
          </div>
        </div>
        <div className="hud-mid">
          <div className="timer">{fmt(hud.time)}</div>
          <small>Objetivo: derrotar al jefe final ({fmt(540)})</small>
        </div>
        <div className="hud-right">
          <div className="kills">☠ {hud.kills}</div>
          <small>{hud.alive} enemigos</small>
          <button className="btn btn-sm" onClick={onPause} aria-label="Pausa"><b>II</b></button>
        </div>
      </div>
      {hud.boss && (
        <div className="bossbar"><span>{hud.boss.name}</span><div><i style={{ width: `${Math.max(0, (hud.boss.hp / hud.boss.max) * 100)}%` }} /></div></div>
      )}
      {hud.banner && <div className="banner" style={{ color: hud.banner.color }} key={hud.banner.text}>{hud.banner.text}</div>}
      <div className="weapons">
        {hud.weapons.map(w => (
          <div key={w.id} className={`wslot ${w.lvl >= 5 ? 'evo' : ''}`} style={{ ['--wc' as any]: WEAPONS[w.id].color }}>
            <GunIcon id={w.id} /><b>{w.lvl >= 5 ? WEAPONS[w.id].evolved.name : WEAPONS[w.id].name}</b><span>Nv {w.lvl}</span>
          </div>
        ))}
      </div>
      <div className="abilities-bar">
        {slot('Espacio', 'Espacio', ag.special.name, hud.special.cd, hud.special.max, hud.special.cd <= 0, () => engine.cast('special'))}
        {ag.secondary && hud.secondary && slot('E', 'E', ag.secondary.name, hud.secondary.cd, hud.secondary.max, hud.secondary.cd <= 0, () => engine.cast('secondary'))}
        {slot('Q', 'Q', ag.ultimate.name, 0, 0, hud.ult >= 100, () => engine.cast('ultimate'), true)}
      </div>
    </div>
  );
}
