import { useEffect, useMemo, useState } from 'react';
import { SaveData } from '../utils/storage';
import { AGENT_BY_ID } from '../data/agents';
import { WEAPONS } from '../data/weapons';
import { Offer, marketOffers, marketPeriod, msToNextRotation } from '../data/market';
import { gunRuns, gunSize } from '../game/weaponSprites';
import { AgentPortrait } from './AgentPortrait';
import { audio } from '../utils/audio';

interface Props {
  save: SaveData;
  /** Semilla de la tienda: id de la cuenta, o una por sesión si es invitado. */
  seed: string;
  reveal: (slot: number) => void;
  buy: (offer: Offer) => void;
  back: () => void;
  goAgents: () => void;
}

const fmtCountdown = (ms: number) => {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const credits = (n: number) => n.toLocaleString('es-ES');

function GunArt({ id }: { id: string }) {
  const s = gunSize(id), w = WEAPONS[id];
  return (
    <svg className="market-gun" viewBox={`-2 -2 ${s.w + 4} ${s.h + 4}`} shapeRendering="crispEdges" aria-hidden="true">
      {gunRuns(id, w.color).map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1.02} fill={r.c} />)}
    </svg>
  );
}

/** Mercado nocturno: cartas boca abajo con armas y agentes exclusivos a precio de lujo. */
export function MarketScreen({ save, seed, reveal, buy, back, goAgents }: Props) {
  const period = marketPeriod();
  const offers = useMemo(() => marketOffers(seed, period), [seed, period]);
  const revealed = save.market.period === period ? save.market.revealed : [];
  const [left, setLeft] = useState(msToNextRotation());
  const [confirm, setConfirm] = useState<number | null>(null);
  const [flipping, setFlipping] = useState<number | null>(null);

  useEffect(() => { const t = setInterval(() => setLeft(msToNextRotation()), 1000); return () => clearInterval(t); }, []);

  const flip = (i: number) => {
    if (revealed.includes(i) || flipping !== null) return;
    audio.play('pick'); setFlipping(i);
    setTimeout(() => { reveal(i); setFlipping(null); }, 380);
  };

  return (
    <div className="screen market">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>Volver</b></button>
        <h2>Mercado nocturno</h2>
        <span className="credits">◈ {credits(save.credits)}</span>
      </header>
      <p className="lead">Descubre tus cartas. Cada día aparecen armas y agentes <b>exclusivos</b> que no se consiguen de otra forma. Nueva rotación en <b className="market-timer">{fmtCountdown(left)}</b>.</p>
      <div className="market-cards">
        {offers.map((o, i) => {
          const open = revealed.includes(i);
          const owned = save.exclusives.includes(o.id);
          const can = save.credits >= o.price;
          const agent = o.kind === 'agent' ? AGENT_BY_ID[o.id] : null;
          const weapon = o.kind === 'weapon' ? WEAPONS[o.id] : null;
          const color = agent?.color ?? weapon?.color ?? '#ff4655';
          if (!open) {
            return (
              <button key={i} className={`mcard back ${flipping === i ? 'flipping' : ''}`} onClick={() => flip(i)} aria-label={`Descubrir carta ${i + 1}`}>
                <span className="mcard-q">?</span>
                <span className="mcard-hint">Descubrir</span>
              </button>
            );
          }
          return (
            <article key={i} className={`mcard ${o.kind} ${owned ? 'owned' : ''}`} style={{ ['--mc' as any]: color }}>
              <span className="mcard-kind">{o.kind === 'agent' ? 'Agente exclusivo' : 'Arma exclusiva'}</span>
              <span className="mcard-off">-{o.discount}%</span>
              <div className="mcard-art">{agent ? <AgentPortrait agent={agent} /> : <GunArt id={o.id} />}</div>
              <h3>{agent?.name ?? weapon?.name}</h3>
              <p className="mcard-desc">{agent?.desc ?? weapon?.desc}</p>
              {weapon && (
                <ul className="mcard-stats">
                  <li><span>Daño</span><b>{weapon.damage}{weapon.count > 1 ? ` ×${weapon.count}` : ''}</b></li>
                  <li><span>Disparos/s</span><b>{(1 / weapon.cooldown).toFixed(1)}</b></li>
                  <li><span>Evolución</span><b>{weapon.evolved.name}</b></li>
                </ul>
              )}
              {agent && (
                <ul className="mcard-stats">
                  <li><span>Vida</span><b>{agent.hp}</b></li>
                  <li><span>Velocidad</span><b>{agent.speed}</b></li>
                  <li><span>{agent.trait.label}</span><b>{agent.trait.desc}</b></li>
                  <li><span>Habilidades</span><b>Las eliges tú</b></li>
                </ul>
              )}
              <div className="mcard-price"><s>◈ {credits(o.base)}</s><strong>◈ {credits(o.price)}</strong></div>
              {owned ? (
                o.kind === 'agent'
                  ? <button className="btn btn-sm" onClick={() => { audio.play('click'); goAgents(); }}><b>Personalizar</b></button>
                  : <p className="mcard-owned">En tu colección · equípala al elegir agente</p>
              ) : confirm === i ? (
                <div className="mcard-confirm">
                  <button className="btn btn-red btn-sm" onClick={() => { audio.play('pick'); buy(o); setConfirm(null); }}><b>Confirmar</b></button>
                  <button className="btn btn-sm" onClick={() => setConfirm(null)}><b>Cancelar</b></button>
                </div>
              ) : (
                <button className="btn btn-red btn-sm" disabled={!can} onClick={() => { audio.play('click'); setConfirm(i); }}>
                  <b>{can ? 'Comprar' : `Te faltan ◈ ${credits(o.price - save.credits)}`}</b>
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
