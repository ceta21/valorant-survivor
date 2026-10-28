import { useEffect } from 'react';
import { UpgradeChoice, RARITY_COLORS, RARITY_NAMES } from '../game/types';

interface Props { choices: UpgradeChoice[]; rerolls: number; pick: (i: number) => void; reroll: () => void; level: number }

export function UpgradeSelection({ choices, rerolls, pick, reroll, level }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const i = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
      if (i >= 0 && i < choices.length) pick(i);
      else if (e.code === 'KeyR') reroll();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [choices, pick, reroll]);
  return (
    <div className="overlay levelup" role="dialog" aria-label="Elige una mejora">
      <h2>Nivel {level}</h2>
      <p>Elige una mejora <small>(teclas 1, 2, 3)</small></p>
      <div className="cards">
        {choices.map((c, i) => (
          <button key={c.id + i + c.rarity} className="ucard" style={{ ['--rc' as any]: RARITY_COLORS[c.rarity], animationDelay: `${i * 70}ms` }} onClick={() => pick(i)}>
            <span className="ucard-rar">{RARITY_NAMES[c.rarity]}</span>
            <span className="ucard-icon">{c.icon}</span>
            <b>{c.name}</b>
            <span className="ucard-desc">{c.desc}</span>
            <kbd>{i + 1}</kbd>
          </button>
        ))}
      </div>
      <button className="btn btn-sm" disabled={rerolls <= 0} onClick={reroll}><b>Relanzar ({rerolls}) · R</b></button>
    </div>
  );
}
