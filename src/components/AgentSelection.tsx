import { useState } from 'react';
import { AGENTS } from '../data/agents';
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
}

export function AgentSelection({ save, back, start, unlock }: Props) {
  const [sel, setSel] = useState(save.lastAgent);
  const [mapId, setMapId] = useState(save.lastMap);
  const [diffId, setDiffId] = useState(save.lastDifficulty);
  const agent = AGENTS.find(a => a.id === sel) ?? AGENTS[0];
  const isOpen = save.unlocked.includes(agent.id);
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
          {AGENTS.map(a => {
            const open = save.unlocked.includes(a.id);
            return (
              <button key={a.id} role="option" aria-selected={a.id === sel} className={`agent-card ${a.id === sel ? 'on' : ''} ${open ? '' : 'locked'}`}
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
