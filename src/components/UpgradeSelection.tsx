import { useEffect } from 'react';
import { UpgradeChoice, RARITY_COLORS, RARITY_NAMES } from '../game/types';
import { UPGRADE_BY_ID } from '../data/upgrades';
import { POWERS } from '../data/powers';
import { t, upgradeText } from '../i18n';
import { keyLabel } from '../game/controls';

/** Nombre y descripción de una mejora en el idioma activo (se rehacen a partir de su id y valor). */
function describe(c: UpgradeChoice): { name: string; desc: string } {
  if (c.kind === 'stat') {
    const u = UPGRADE_BY_ID[c.id];
    return u ? { name: t(u.name), desc: upgradeText(u.id, c.value, u.text) } : { name: t(c.name), desc: t(c.desc) };
  }
  const w = POWERS[c.powerId ?? ''];
  if (!w) return { name: t(c.name), desc: t(c.desc) };
  if (c.kind === 'power-new') return { name: t(w.name), desc: t('Nuevo poder: {d}', { d: t(w.desc) }) };
  return c.value >= 5
    ? { name: t(w.evolved.name), desc: t('EVOLUCIÓN: {d}', { d: t(w.evolved.desc) }) }
    : { name: `${t(w.name)} ${t('Nv.')}${c.value}`, desc: t('{w}: +22% daño y -6% de recarga', { w: t(w.name) }) };
}

interface Props { choices: UpgradeChoice[]; rerolls: number; pick: (i: number) => void; reroll: () => void; level: number; rerollKey?: string }

export function UpgradeSelection({ choices, rerolls, pick, reroll, level, rerollKey = 'KeyR' }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const i = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
      if (i >= 0 && i < choices.length) pick(i);
      else if (e.code === rerollKey) reroll();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [choices, pick, reroll, rerollKey]);
  return (
    <div className="overlay levelup" role="dialog" aria-label={t('Elige una mejora')}>
      <h2>{t('Nivel')} {level}</h2>
      <p>{t('Elige una mejora')} <small>{t('(teclas 1, 2, 3)')}</small></p>
      <div className="cards">
        {choices.map((c, i) => { const d = describe(c); return (
          <button key={c.id + i + c.rarity} className="ucard" style={{ ['--rc' as any]: RARITY_COLORS[c.rarity], animationDelay: `${i * 70}ms` }} onClick={() => pick(i)}>
            <span className="ucard-rar">{t(RARITY_NAMES[c.rarity])}</span>
            <span className="ucard-icon">{c.icon}</span>
            <b>{d.name}</b>
            <span className="ucard-desc">{d.desc}</span>
            <kbd>{i + 1}</kbd>
          </button>
        ); })}
      </div>
      <button className="btn btn-sm" disabled={rerolls <= 0} onClick={reroll}><b>{t('Relanzar')} ({rerolls}) · {keyLabel(rerollKey)}</b></button>
    </div>
  );
}
