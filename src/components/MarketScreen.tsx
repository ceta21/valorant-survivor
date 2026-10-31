import { useEffect, useMemo, useState } from 'react';
import { SaveData } from '../utils/storage';
import { playableAgent } from '../data/agents';
import { AGENT_SKIN_BY_ID, PET_BY_ID } from '../data/shop';
import { Offer, marketOffers, marketPeriod, msToNextRotation } from '../data/market';
import { AgentArt, ELEMENT, PetArt } from './ShopArt';
import { audio } from '../utils/audio';
import { t, nf } from '../i18n';

interface Props {
  save: SaveData;
  /** Semilla de la tienda: id de la cuenta, o una por sesión si es invitado. */
  seed: string;
  reveal: (slot: number) => void;
  buy: (offer: Offer) => void;
  back: () => void;
  goAgents: () => void;
  goPets: () => void;
}

const fmtCountdown = (ms: number) => {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const credits = (n: number) => nf(n);

/** Mercado de la Grieta: cartas boca abajo con estilos de héroe y mascotas de la Tienda a precio rebajado. */
export function MarketScreen({ save, seed, reveal, buy, back, goAgents, goPets }: Props) {
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
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>{t('Volver')}</b></button>
        <h2>{t('Mercado de la Grieta')}</h2>
        <span className="credits">◈ {credits(save.credits)}</span>
      </header>
      <p className="lead">{t('Descubre tus cartas. Cada día salen estilos de héroe y mascotas de la Tienda con un descuento distinto.')} {t('Nueva rotación en')} <b className="market-timer">{fmtCountdown(left)}</b>.</p>
      <div className="market-cards">
        {offers.map((o, i) => {
          const open = revealed.includes(i);
          const owned = save.shop.owned.includes(o.id);
          const can = save.credits >= o.price;
          const style = o.kind === 'style' ? AGENT_SKIN_BY_ID[o.id] : null, pet = o.kind === 'pet' ? PET_BY_ID[o.id] : null;
          const color = style ? style.ramp[3] : pet ? ELEMENT[pet.element].color : '#9b5cff';
          if (!open) {
            return (
              <button key={i} className={`mcard back ${flipping === i ? 'flipping' : ''}`} onClick={() => flip(i)} aria-label={t('Descubrir carta {n}', { n: i + 1 })}>
                <span className="mcard-q">?</span>
                <span className="mcard-hint">{t('Descubrir')}</span>
              </button>
            );
          }
          return (
            <article key={i} className={`mcard ${o.kind} ${owned ? 'owned' : ''}`} style={{ ['--mc' as any]: color }}>
              <span className="mcard-kind">{style ? t('Estilo de héroe') : t('Mascota')}</span>
              <span className="mcard-off">-{o.discount}%</span>
              <div className="mcard-art">
                {style ? <AgentArt id={playableAgent(save.lastAgent)} skin={style.id} className="market-art" /> : pet && <PetArt id={pet.id} className="market-art pet" />}
              </div>
              <h3>{t(style?.name ?? pet?.name ?? '')}</h3>
              <p className="mcard-desc">{t(style?.desc ?? pet?.desc ?? '')}</p>
              {pet && <ul className="mcard-stats"><li><span>{t('Elemento')}</span><b>{t(ELEMENT[pet.element].name)}</b></li><li><span>{t('Poder')}</span><b>{t(pet.power.name)}</b></li></ul>}
              <div className="mcard-price"><s>◈ {credits(o.base)}</s><strong>◈ {credits(o.price)}</strong></div>
              {owned ? (
                <button className="btn btn-sm" onClick={() => { audio.play('click'); (style ? goAgents : goPets)(); }}><b>{t('Comprado · póntelo')}</b></button>
              ) : confirm === i ? (
                <div className="mcard-confirm">
                  <button className="btn btn-red btn-sm" onClick={() => { audio.play('pick'); buy(o); setConfirm(null); }}><b>{t('Confirmar')}</b></button>
                  <button className="btn btn-sm" onClick={() => setConfirm(null)}><b>{t('Cancelar')}</b></button>
                </div>
              ) : (
                <button className="btn btn-red btn-sm" disabled={!can} onClick={() => { audio.play('click'); setConfirm(i); }}>
                  <b>{can ? t('Comprar') : t('Te faltan ◈ {n}', { n: credits(o.price - save.credits) })}</b>
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
