import { SaveData } from '../utils/storage';
import { GEAR_BY_ID, GEAR_MAX_LVL, GEAR_RARITY_COLORS, GEAR_RARITY_NAMES, GEAR_SLOTS, GearItem, GearSave, gearScrapValue, gearText, gearUpgradeCost } from '../data/gear';
import { audio } from '../utils/audio';
import { t, nf } from '../i18n';

interface Props {
  save: SaveData;
  back: () => void;
  /** Cambia el equipo (y los créditos, para mejorar o desmontar). */
  change: (fn: (g: GearSave, credits: number) => { gear: GearSave; credits: number } | null) => void;
}

/** Equipo: hasta 3 objetos puestos (ventajas pequeñas en cada partida), inventario, mejorar y desmontar. */
export function GearScreen({ save, back, change }: Props) {
  const g = save.gear, on = (it: GearItem) => g.equipped.includes(it.uid);
  const click = (fn: () => void) => () => { audio.play('click'); fn(); };
  const toggle = (it: GearItem) => change(gg => {
    if (on(it)) return { gear: { ...gg, equipped: gg.equipped.filter(u => u !== it.uid) }, credits: save.credits };
    // un hueco por tipo de objeto: si ya llevas uno igual, se cambia por este
    const same = gg.equipped.filter(u => gg.items.find(x => x.uid === u)?.id === it.id);
    const rest = gg.equipped.filter(u => !same.includes(u));
    if (rest.length >= GEAR_SLOTS) return null;
    return { gear: { ...gg, equipped: [...rest, it.uid] }, credits: save.credits };
  });
  const upgrade = (it: GearItem) => change((gg, cr) => {
    const cost = gearUpgradeCost(it);
    if (it.lvl >= GEAR_MAX_LVL || cr < cost) return null;
    return { gear: { ...gg, items: gg.items.map(x => (x.uid === it.uid ? { ...x, lvl: x.lvl + 1 } : x)) }, credits: cr - cost };
  });
  const scrap = (it: GearItem) => change((gg, cr) => ({
    gear: { items: gg.items.filter(x => x.uid !== it.uid), equipped: gg.equipped.filter(u => u !== it.uid) }, credits: cr + gearScrapValue(it),
  }));
  const sorted = [...g.items].sort((a, b) => b.rarity - a.rarity || b.lvl - a.lvl || a.id.localeCompare(b.id));
  const equipped = g.equipped.map(u => g.items.find(x => x.uid === u)).filter(Boolean) as GearItem[];
  const card = (it: GearItem, full: boolean) => {
    const d = GEAR_BY_ID[it.id], cost = gearUpgradeCost(it), max = it.lvl >= GEAR_MAX_LVL;
    return (
      <article key={it.uid} className={`shop-card gear-card ${on(it) ? 'on' : ''}`} style={{ ['--sc' as any]: GEAR_RARITY_COLORS[it.rarity] }}>
        <span className="gear-rar">{t(GEAR_RARITY_NAMES[it.rarity])} · {t('Nv')} {it.lvl}</span>
        <div className="gear-icon" aria-hidden="true">{d?.icon}</div>
        <b>{t(d?.name ?? it.id)}</b>
        <small>{gearText(it).replace(d?.label ?? '', t(d?.label ?? ''))}</small>
        {full && (
          <div className="gear-btns">
            <button className={`btn btn-sm ${on(it) ? '' : 'btn-red'}`} disabled={!on(it) && g.equipped.length >= GEAR_SLOTS && !g.equipped.some(u => g.items.find(x => x.uid === u)?.id === it.id)} onClick={click(() => toggle(it))}>
              <b>{on(it) ? t('Quitar') : t('Equipar')}</b>
            </button>
            <button className="btn btn-sm" disabled={max || save.credits < cost} onClick={click(() => upgrade(it))}><b>{max ? t('Nivel máximo') : t('Mejorar · ◈ {n}', { n: nf(cost) })}</b></button>
            <button className="btn btn-sm gear-scrap" onClick={click(() => scrap(it))}><b>{t('Desmontar · +◈ {n}', { n: nf(gearScrapValue(it)) })}</b></button>
          </div>
        )}
      </article>
    );
  };
  return (
    <div className="screen gear">
      <header className="top">
        <button className="btn btn-sm" onClick={click(back)}><b>{t('Volver')}</b></button>
        <h2>{t('Equipo')}</h2>
        <span className="credits">◈ {nf(save.credits)}</span>
      </header>
      <p className="lead">{t('Los jefes sueltan objetos: cuanto más dura la zona, mejores. Lleva hasta {n} puestos (uno de cada tipo); sus ventajas se aplican al empezar cada partida.', { n: GEAR_SLOTS })}</p>
      <div className="gear-slots">
        {Array.from({ length: GEAR_SLOTS }, (_, i) => equipped[i] ? card(equipped[i], false) : <article key={'v' + i} className="shop-card gear-card empty"><div className="gear-icon">＋</div><small>{t('Hueco libre')}</small></article>)}
      </div>
      <h3>{t('Inventario')} ({g.items.length})</h3>
      {g.items.length === 0 ? <p className="lead">{t('Aún no tienes objetos: derrota jefes para conseguirlos.')}</p> : <div className="shop-grid">{sorted.map(it => card(it, true))}</div>}
    </div>
  );
}
