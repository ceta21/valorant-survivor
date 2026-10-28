import { useState } from 'react';
import { ABILITIES, ABILITY_OWNER, AGENTS, EXCLUSIVE_AGENTS, Kit, ULTIMATES, withKit } from '../data/agents';
import { WEAPONS } from '../data/weapons';
import { MAPS } from '../data/maps';
import { DIFFICULTIES } from '../data/difficulty';
import { SaveData } from '../utils/storage';
import { AgentPortrait } from './AgentPortrait';
import { audio } from '../utils/audio';

interface Props {
  save: SaveData;
  back: () => void;
  start: (agentId: string, mapId: string, difficulty: string) => void;
  unlock: (agentId: string) => void;
  setKit: (agentId: string, kit: Kit) => void;
  setLoadout: (weaponId: string) => void;
}

export function AgentSelection({ save, back, start, unlock, setKit, setLoadout }: Props) {
  const [sel, setSel] = useState(save.lastAgent);
  const [mapId, setMapId] = useState(save.lastMap);
  const [diffId, setDiffId] = useState(save.lastDifficulty);
  // los agentes exclusivos solo aparecen si se han comprado en el mercado nocturno
  const roster = [...AGENTS, ...EXCLUSIVE_AGENTS.filter(a => save.exclusives.includes(a.id))];
  const base = roster.find(a => a.id === sel) ?? AGENTS[0];
  const kit = save.kits[base.id];
  const agent = withKit(base, kit);
  const isOpen = save.unlocked.includes(agent.id) || save.exclusives.includes(agent.id);
  const guns = ['classic', ...save.exclusives.filter(id => WEAPONS[id])];
  const loadout = guns.includes(save.loadout) ? save.loadout : 'classic';
  const changeKit = (slot: keyof Kit, id: string) => {
    audio.play('click');
    setKit(agent.id, { special: agent.special.id, secondary: agent.secondary?.id ?? '', ultimate: agent.ultimate.id, [slot]: id });
  };
  const canBuy = !isOpen && save.credits >= agent.cost;
  const rec = save.records[mapId];
  return (
    <div className="screen select">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>Volver</b></button>
        <h2>Elige tu agente</h2>
        <span className="credits">◈ {save.credits.toLocaleString('es-ES')}</span>
      </header>
      <div className="select-body">
        <div className="agent-grid" role="listbox" aria-label="Agentes">
          {roster.map(a => {
            const open = save.unlocked.includes(a.id) || save.exclusives.includes(a.id);
            return (
              <button key={a.id} role="option" aria-selected={a.id === sel} className={`agent-card ${a.id === sel ? 'on' : ''} ${open ? '' : 'locked'} ${a.exclusive ? 'exclusive' : ''}`}
                style={{ ['--ac' as any]: a.color }} onClick={() => { audio.play('click'); setSel(a.id); }} onMouseEnter={() => audio.play('hover')}>
                <AgentPortrait agent={a} locked={!open} />
                <span className="agent-card-name">{a.name}</span>
                {!open && <span className="agent-card-cost">◈ {a.cost}</span>}
              </button>
            );
          })}
        </div>
        <aside className="agent-panel" style={{ ['--ac' as any]: agent.color }}>
          <div className="panel-head">
            <small>{agent.role}</small>
            <h3>{agent.name}</h3>
          </div>
          <p className="panel-desc">{agent.desc}</p>
          <ul className="stat-bars">
            <StatBar label="Vida" v={agent.hp} max={140} />
            <StatBar label="Velocidad" v={agent.speed} max={215} />
            <StatBar label="Daño" v={agent.damage} max={12} />
          </ul>
          <div className="trait"><b>{agent.trait.label}</b><span>{agent.trait.desc}</span></div>
          {agent.exclusive && (
            <div className="kit-editor">
              <b>Elige sus habilidades</b>
              {([['special', 'Espacio', ABILITIES], ['secondary', 'E', ABILITIES], ['ultimate', 'Q', ULTIMATES]] as const).map(([slot, key, list]) => (
                <label key={slot}>
                  <kbd>{key}</kbd>
                  <select value={agent[slot]?.id ?? ''} onChange={e => changeKit(slot, e.target.value)}>
                    {list.map(ab => <option key={ab.id} value={ab.id}>{ab.name} ({ABILITY_OWNER[ab.id]})</option>)}
                  </select>
                </label>
              ))}
            </div>
          )}
          <ul className="abilities">
            <li><kbd>Espacio</kbd><div><b>{agent.special.name}</b><span>{agent.special.desc}</span></div></li>
            {agent.secondary && <li><kbd>E</kbd><div><b>{agent.secondary.name}</b><span>{agent.secondary.desc}</span></div></li>}
            <li><kbd>Q</kbd><div><b>{agent.ultimate.name}</b><span>{agent.ultimate.desc}</span></div></li>
          </ul>
          <div className="map-pick" role="radiogroup" aria-label="Mapa">
            {MAPS.map(m => (
              <button key={m.id} role="radio" aria-checked={m.id === mapId} className={`map-chip ${m.id === mapId ? 'on' : ''}`} onClick={() => { audio.play('click'); setMapId(m.id); }}>
                <i style={{ background: m.colors.wallTop, boxShadow: `0 0 0 2px ${m.colors.accent}` }} />
                <b>{m.name}</b>
              </button>
            ))}
          </div>
          <p className="map-desc">{MAPS.find(m => m.id === mapId)?.desc}{rec ? ` · Mejor: ${Math.floor(rec.bestTime / 60)}:${String(Math.floor(rec.bestTime % 60)).padStart(2, '0')}, nivel ${rec.bestLevel}` : ''}</p>
          {guns.length > 1 && (
            <label className="loadout">
              <span>Arma inicial</span>
              <select value={loadout} onChange={e => { audio.play('click'); setLoadout(e.target.value); }}>
                {guns.map(id => <option key={id} value={id}>{WEAPONS[id].name}{WEAPONS[id].exclusive ? ' ★' : ''}</option>)}
              </select>
            </label>
          )}
          <div className="map-pick diff-pick" role="radiogroup" aria-label="Dificultad">
            {DIFFICULTIES.map(d => (
              <button key={d.id} role="radio" aria-checked={d.id === diffId} className={`map-chip ${d.id === diffId ? 'on' : ''}`} style={{ ['--dc' as any]: d.color }}
                onClick={() => { audio.play('click'); setDiffId(d.id); }}>
                <i style={{ background: d.color }} />
                <b>{d.name}</b>
              </button>
            ))}
          </div>
          <p className="map-desc">{DIFFICULTIES.find(d => d.id === diffId)?.desc} Créditos ×{DIFFICULTIES.find(d => d.id === diffId)?.credits}.</p>
          {isOpen ? (
            <button className="btn btn-red btn-xl" onClick={() => { audio.play('click'); start(agent.id, mapId, diffId); }}><b>Confirmar y jugar</b></button>
          ) : (
            <button className="btn btn-red btn-xl" disabled={!canBuy} onClick={() => { audio.play('pick'); unlock(agent.id); }}>
              <b>{canBuy ? `Desbloquear por ◈ ${agent.cost}` : `Te faltan ◈ ${agent.cost - save.credits}`}</b>
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

function StatBar({ label, v, max }: { label: string; v: number; max: number }) {
  return (
    <li><span>{label}</span><div className="bar"><i style={{ width: `${Math.min(100, (v / max) * 100)}%` }} /></div><em>{v}</em></li>
  );
}
