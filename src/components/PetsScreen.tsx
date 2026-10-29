import { SaveData } from '../utils/storage';
import { PETS, PET_POWER_PRICES, ShopSave } from '../data/shop';
import { ELEMENT, PetArt } from './ShopArt';
import { audio } from '../utils/audio';
import { t, nf } from '../i18n';

interface Props {
  save: SaveData;
  back: () => void;
  goShop: () => void;
  equip: (fn: (s: ShopSave) => ShopSave) => void;
  buyPower: (petId: string) => void;
}

/** Mascotas: elegir cuál te acompaña (o ninguna) y comprar o mejorar su poder. */
export function PetsScreen({ save, back, goShop, equip, buyPower }: Props) {
  const shop = save.shop, mine = PETS.filter(p => shop.owned.includes(p.id));
  const click = (fn: () => void) => () => { audio.play('click'); fn(); };
  return (
    <div className="screen pets">
      <header className="top">
        <button className="btn btn-sm" onClick={click(back)}><b>{t('Volver')}</b></button>
        <h2>{t('Mascotas')}</h2>
        <span className="credits">◈ {nf(save.credits)}</span>
      </header>
      {mine.length === 0 ? (
        <div className="pets-empty">
          <p className="lead">{t('Aún no tienes mascotas. Cómpralas en la Tienda y aquí podrás elegir cuál te acompaña y desbloquear su poder.')}</p>
          <button className="btn btn-red" onClick={click(goShop)}><b>{t('Ir a la Tienda')}</b></button>
        </div>
      ) : (
        <>
          <p className="lead">{t('Elige la mascota que te acompaña en la partida. Si la derriban, vuelve en 1 minuto. Sin poder solo te acompaña.')}</p>
          <div className="shop-grid">
            <article className={`shop-card ${shop.pet === '' ? 'on' : ''}`}>
              <div className="shop-art pet pets-none" aria-hidden="true">—</div>
              <b>{t('Sin mascota')}</b>
              <small>{t('Juegas solo con tu agente.')}</small>
              <button className="btn btn-sm" disabled={shop.pet === ''} onClick={click(() => equip(s => ({ ...s, pet: '' })))}><b>{shop.pet === '' ? t('Elegida') : t('Elegir')}</b></button>
            </article>
            {mine.map(p => {
              const on = shop.pet === p.id, lv = shop.power[p.id] ?? 0, el = ELEMENT[p.element], next = PET_POWER_PRICES[lv];
              return (
                <article key={p.id} className={`shop-card pet ${on ? 'on' : ''}`} style={{ ['--sc' as any]: el.color }}>
                  <PetArt id={p.id} />
                  <span className="shop-el">{t(el.name)}</span>
                  <b>{t(p.name)}</b>
                  <small>{t(p.desc)}</small>
                  <button className={`btn btn-sm ${on ? '' : 'btn-red'}`} disabled={on} onClick={click(() => equip(s => ({ ...s, pet: p.id })))}>
                    <b>{on ? t('Te acompaña') : t('Llevar a la partida')}</b>
                  </button>
                  <div className="shop-power">
                    <span><b>{t(p.power.name)}</b> · {t('Nivel {n}/3', { n: lv })}</span>
                    <small>{lv ? t(p.power.desc) : t('Bloqueado: tu mascota solo te acompaña.')}</small>
                    <div className="pips">{[0, 1, 2].map(i => <i key={i} className={i < lv ? 'on' : ''} />)}</div>
                    {lv < 3 ? (
                      <button className="btn btn-sm" disabled={save.credits < next} onClick={() => { audio.play('pick'); buyPower(p.id); }}>
                        <b>{save.credits < next ? t('Te faltan ◈ {n}', { n: nf(next - save.credits) })
                          : lv ? t('Mejorar poder · ◈ {n}', { n: nf(next) }) : t('Desbloquear poder · ◈ {n}', { n: nf(next) })}</b>
                      </button>
                    ) : <small>{t('Poder al máximo')}</small>}
                  </div>
                </article>
              );
            })}
          </div>
          {mine.length < PETS.length && <p className="lead">{t('Hay más mascotas en la Tienda.')} <button className="btn btn-sm" onClick={click(goShop)}><b>{t('Ir a la Tienda')}</b></button></p>}
        </>
      )}
    </div>
  );
}
