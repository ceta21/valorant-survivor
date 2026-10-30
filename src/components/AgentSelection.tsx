import { useState } from 'react';
import { ABILITIES, ABILITY_OWNER, AGENTS, EXCLUSIVE_AGENTS, Kit, ULTIMATES, withKit, isAvailable, playableAgent } from '../data/agents';
import { heroPower } from '../data/powers';
import { t, nf } from '../i18n';
import { KeyMap, keyLabel } from '../game/controls';
import { MAPS } from '../data/maps';
import { DIFFICULTIES } from '../data/difficulty';
import { SaveData } from '../utils/storage';
import { AgentPortrait } from './AgentPortrait';
import { AgentArt } from './ShopArt';
import { AGENT_SKINS, ShopSave } from '../data/shop';
import { audio } from '../utils/audio';

interface Props {
  save: SaveData;
  back: () => void;
  start: (agentId: string, mapId: string, difficulty: string) => void;
  unlock: (agentId: string) => void;
  setKit: (agentId: string, kit: Kit) => void;
  /** Poner los estilos comprados en la tienda. */
  equip: (fn: (s: ShopSave) => ShopSave) => void;
  keys: KeyMap;
}

export function AgentSelection({ save, back, start, unlock, setKit, equip, keys }: Props) {
  const K = { special: keyLabel(keys.special), secondary: keyLabel(keys.secondary), ultimate: keyLabel(keys.ultimate) };
  const [sel, setSel] = useState(playableAgent(save.lastAgent));
  const [mapId, setMapId] = useState(save.lastMap);
  const [diffId, setDiffId] = useState(save.lastDifficulty);
  // los agentes exclusivos solo aparecen si se han comprado en el mercado nocturno
  const roster = [...AGENTS, ...EXCLUSIVE_AGENTS.filter(a => save.exclusives.includes(a.id))];
  const base = roster.find(a => a.id === sel) ?? AGENTS[0];
  const kit = save.kits[base.id];
  const agent = withKit(base, kit);
  const isOpen = save.unlocked.includes(agent.id) || save.exclusives.includes(agent.id);
  const changeKit = (slot: keyof Kit, id: string) => {
    audio.play('click');
    setKit(agent.id, { special: agent.special.id, secondary: agent.secondary?.id ?? '', ultimate: agent.ultimate.id, [slot]: id });
  };
  const soon = !isAvailable(agent.id);
  const canBuy = !isOpen && !soon && save.credits >= agent.cost;
  const rec = save.records[mapId];
  return (
    <div className="screen select">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>{t('Volver')}</b></button>
        <h2>{t('Elige tu agente')}</h2>
        <span className="credits">◈ {nf(save.credits)}</span>
      </header>
      <div className="select-body">
        <div className="agent-grid" role="listbox" aria-label={t('Agentes')}>
          {roster.map(a => {
            const open = save.unlocked.includes(a.id) || save.exclusives.includes(a.id), later = !isAvailable(a.id);
            return (
              <button key={a.id} role="option" aria-selected={a.id === sel} className={`agent-card ${a.id === sel ? 'on' : ''} ${open && !later ? '' : 'locked'} ${later ? 'soon' : ''} ${a.exclusive ? 'exclusive' : ''}`}
                style={{ ['--ac' as any]: a.color }} onClick={() => { audio.play('click'); setSel(a.id); }} onMouseEnter={() => audio.play('hover')}>
                <AgentPortrait agent={a} locked={!open || later} />
                <span className="agent-card-name">{t(a.name)}</span>
                {later
                  ? <span className="agent-card-soon">{t('Próximamente')}</span>
                  : !open && <span className="agent-card-cost">◈ {a.cost}</span>}
              </button>
            );
          })}
        </div>
        <aside className="agent-panel" style={{ ['--ac' as any]: agent.color }}>
          <div className="panel-head">
            <small>{t(agent.role)}</small>
            <h3>{t(agent.name)}</h3>
          </div>
          <p className="panel-desc">{t(agent.desc)}</p>
          <ul className="stat-bars">
            <StatBar label={t('Vida')} v={agent.hp} max={140} />
            <StatBar label={t('Velocidad')} v={agent.speed} max={215} />
            <StatBar label={t('Daño')} v={agent.damage} max={12} />
          </ul>
          <div className="trait"><b>{t(agent.trait.label)}</b><span>{t(agent.trait.desc)}</span></div>
          {(() => { const pw = heroPower(agent.id); return (
            <div className="trait power" style={{ ['--pc' as any]: pw.color }}><b>{pw.icon} {t('Poder')}: {t(pw.name)}</b><span>{t(pw.desc)} {t('Lo lanza solo, sin parar.')}</span></div>
          ); })()}
          {isOpen && !soon && (() => {
            // estilos del agente comprados en la tienda (solo estéticos)
            const skins = AGENT_SKINS.filter(k => save.shop.owned.includes(k.id)), cur = save.shop.agent[agent.id] ?? '';
            return (
              <div className="styles">
                <b>{t('Estilo del agente')}</b>
                {skins.length === 0 ? <small>{t('Compra estilos en la Tienda para cambiar la ropa y la armadura de tus agentes.')}</small> : (
                  <div className="style-row">
                    <AgentArt id={agent.id} skin={cur} className="style-preview" />
                    <div className="style-chips" role="radiogroup" aria-label={t('Estilo del agente')}>
                      {[{ id: '', name: 'Original' }, ...skins].map(k => (
                        <button key={k.id} role="radio" aria-checked={cur === k.id} className={`map-chip ${cur === k.id ? 'on' : ''}`}
                          onClick={() => { audio.play('click'); equip(s => ({ ...s, agent: { ...s.agent, [agent.id]: k.id } })); }}><b>{t(k.name)}</b></button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          {agent.exclusive && (
            <div className="kit-editor">
              <b>{t('Elige sus habilidades')}</b>
              {([['special', K.special, ABILITIES], ['secondary', K.secondary, ABILITIES], ['ultimate', K.ultimate, ULTIMATES]] as const).map(([slot, key, list]) => (
                <label key={slot}>
                  <kbd>{key}</kbd>
                  <select value={agent[slot]?.id ?? ''} onChange={e => changeKit(slot, e.target.value)}>
                    {list.map(ab => <option key={ab.id} value={ab.id}>{t(ab.name)} ({ABILITY_OWNER[ab.id]})</option>)}
                  </select>
                </label>
              ))}
            </div>
          )}
          <ul className="abilities">
            <li><kbd>{K.special}</kbd><div><b>{t(agent.special.name)}</b><span>{t(agent.special.desc)}</span></div></li>
            {agent.secondary && <li><kbd>{K.secondary}</kbd><div><b>{t(agent.secondary.name)}</b><span>{t(agent.secondary.desc)}</span></div></li>}
            <li><kbd>{K.ultimate}</kbd><div><b>{t(agent.ultimate.name)}</b><span>{t(agent.ultimate.desc)}</span></div></li>
          </ul>
          <div className="map-pick" role="radiogroup" aria-label={t('Mapa')}>
            {MAPS.map(m => (
              <button key={m.id} role="radio" aria-checked={m.id === mapId} className={`map-chip ${m.id === mapId ? 'on' : ''}`} onClick={() => { audio.play('click'); setMapId(m.id); }}>
                <i style={{ background: m.colors.wallTop, boxShadow: `0 0 0 2px ${m.colors.accent}` }} />
                <b>{t(m.name)}</b>
              </button>
            ))}
          </div>
          <p className="map-desc">{t(MAPS.find(m => m.id === mapId)?.desc ?? '')}{rec ? t(' · Mejor: {time}, nivel {level}', { time: `${Math.floor(rec.bestTime / 60)}:${String(Math.floor(rec.bestTime % 60)).padStart(2, '0')}`, level: rec.bestLevel }) : ''}</p>
          <div className="map-pick diff-pick" role="radiogroup" aria-label={t('Dificultad')}>
            {DIFFICULTIES.map(d => (
              <button key={d.id} role="radio" aria-checked={d.id === diffId} className={`map-chip ${d.id === diffId ? 'on' : ''}`} style={{ ['--dc' as any]: d.color }}
                onClick={() => { audio.play('click'); setDiffId(d.id); }}>
                <i style={{ background: d.color }} />
                <b>{t(d.name)}</b>
              </button>
            ))}
          </div>
          <p className="map-desc">{t(DIFFICULTIES.find(d => d.id === diffId)?.desc ?? '')} {t('Créditos')} ×{DIFFICULTIES.find(d => d.id === diffId)?.credits}.</p>
          {soon ? (
            <button className="btn btn-red btn-xl" disabled><b>{t('No disponible en estos momentos · Próximamente')}</b></button>
          ) : isOpen ? (
            <button className="btn btn-red btn-xl" onClick={() => { audio.play('click'); start(agent.id, mapId, diffId); }}><b>{t('Confirmar y jugar')}</b></button>
          ) : (
            <button className="btn btn-red btn-xl" disabled={!canBuy} onClick={() => { audio.play('pick'); unlock(agent.id); }}>
              <b>{canBuy ? t('Desbloquear por ◈ {n}', { n: nf(agent.cost) }) : t('Te faltan ◈ {n}', { n: nf(agent.cost - save.credits) })}</b>
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
