import { useState } from 'react';
import { SaveData } from '../utils/storage';
import { AGENT_SKINS, PETS } from '../data/shop';
import { ALL_AGENTS, isAvailable, playableAgent } from '../data/agents';
import { AgentArt, ELEMENT, PetArt } from './ShopArt';
import { audio } from '../utils/audio';
import { t, nf } from '../i18n';

interface Props {
  save: SaveData;
  back: () => void;
  buy: (id: string, price: number) => void;
}
type Tab = 'agents' | 'pets';

/** Tienda: solo se compra. Los estilos de agente se ponen en Agentes; las mascotas, en Mascotas. */
export function ShopScreen({ save, back, buy }: Props) {
  const [tab, setTab] = useState<Tab>('agents');
  const [sure, setSure] = useState('');   // compra pendiente de confirmar
  const owned = save.shop.owned;
  // agente sobre el que se ven los estilos (cualquiera que se pueda jugar; empieza en el último elegido)
  const lookable = ALL_AGENTS.filter(a => isAvailable(a.id) && (!a.exclusive || save.exclusives.includes(a.id)));
  const [agentId, setAgentId] = useState(playableAgent(save.lastAgent));
  const click = (fn: () => void) => () => { audio.play('click'); fn(); };

  /** Botón de comprar (con confirmación); si ya es tuyo, dice dónde ponértelo. */
  const buyButton = (id: string, price: number, where: string) => {
    if (owned.includes(id)) return <button className="btn btn-sm" disabled><b>{t('Comprado')} · {where}</b></button>;
    const can = save.credits >= price;
    if (sure === id) {
      return <button className="btn btn-sm btn-red" onClick={() => { audio.play('pick'); buy(id, price); setSure(''); }}><b>{t('Confirmar · ◈ {n}', { n: nf(price) })}</b></button>;
    }
    return <button className="btn btn-sm btn-red" disabled={!can} onClick={click(() => setSure(id))}><b>{can ? t('Comprar · ◈ {n}', { n: nf(price) }) : t('Te faltan ◈ {n}', { n: nf(price - save.credits) })}</b></button>;
  };

  return (
    <div className="screen shop">
      <header className="top">
        <button className="btn btn-sm" onClick={click(back)}><b>{t('Volver')}</b></button>
        <h2>{t('Tienda')}</h2>
        <span className="credits">◈ {nf(save.credits)}</span>
      </header>
      <nav className="shop-tabs" role="tablist">
        {([['agents', t('Estilos de agentes')], ['pets', t('Mascotas')]] as [Tab, string][]).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`btn btn-sm ${tab === k ? 'btn-red' : ''}`} onClick={click(() => { setTab(k); setSure(''); })}><b>{label}</b></button>
        ))}
      </nav>

      {tab === 'agents' && (
        <>
          <p className="lead">{t('Ropa y armadura nuevas para tus agentes. Solo estético: no da poderes ni mejoras. Póntelos en la ficha de cada agente, en Agentes.')}</p>
          <label className="shop-agent-pick">
            <span>{t('Ver los estilos en')}</span>
            <select value={agentId} onChange={e => { audio.play('click'); setAgentId(e.target.value); }}>
              {lookable.map(a => <option key={a.id} value={a.id}>{t(a.name)}</option>)}
            </select>
          </label>
          <div className="shop-grid">
            {AGENT_SKINS.map(k => (
              <article key={k.id} className={`shop-card ${owned.includes(k.id) ? 'owned' : ''}`} style={{ ['--sc' as any]: k.ramp[3] }}>
                <AgentArt id={agentId} skin={k.id} />
                <b>{t(k.name)}</b>
                <small>{t(k.desc)}</small>
                {buyButton(k.id, k.price, t('en Agentes'))}
              </article>
            ))}
          </div>
        </>
      )}

      {tab === 'pets' && (
        <>
          <p className="lead">{t('Te acompañan en la partida; si la derriban, vuelve en 1 minuto. Elige tu mascota y desbloquea su poder en Mascotas.')}</p>
          <div className="shop-grid pets">
            {PETS.map(p => {
              const el = ELEMENT[p.element];
              return (
                <article key={p.id} className={`shop-card pet ${owned.includes(p.id) ? 'owned' : ''}`} style={{ ['--sc' as any]: el.color }}>
                  <PetArt id={p.id} />
                  <span className="shop-el">{t(el.name)}</span>
                  <b>{t(p.name)}</b>
                  <small>{t(p.desc)}</small>
                  <small className="shop-power-hint">{t('Poder')}: <b>{t(p.power.name)}</b> · {t(p.power.desc)}</small>
                  {buyButton(p.id, p.price, t('en Mascotas'))}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
