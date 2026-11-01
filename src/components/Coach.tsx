// Primera partida guiada: consejos cortos que aparecen de uno en uno y se van al hacer lo que piden.
import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { KeyMap, keyLabel } from '../game/controls';
import { POWERS } from '../data/powers';
import { t } from '../i18n';
import { track } from '../utils/analytics';

interface Step { id: string; text: () => string; /** Se cumple (y pasa al siguiente) cuando devuelve true. */ done: (e: GameEngine, since: number) => boolean; show?: (e: GameEngine) => boolean }

interface Props { engine: GameEngine; keys: KeyMap; touch: boolean; finish: () => void }

export function Coach({ engine, keys, touch, finish }: Props) {
  const start = useRef({ x: engine.player.x, y: engine.player.y });
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const since = useRef(engine.time);
  const go = (n: number) => { stepRef.current = n; setStep(n); };
  const steps: Step[] = [
    { id: 'move', text: () => touch ? t('Arrastra el dedo por la pantalla para moverte.') : t('Muévete con {k} o las flechas.', { k: [keys.up, keys.left, keys.down, keys.right].map(keyLabel).join(' ') }),
      done: e => Math.hypot(e.player.x - start.current.x, e.player.y - start.current.y) > 140 },
    { id: 'power', text: () => t('Tu poder ({p}) dispara solo al enemigo más cercano: tú esquiva.', { p: t(POWERS[engine.weapons[0]?.id ?? '']?.name ?? '') }),
      done: (_e, s) => s > 5 },
    { id: 'gems', text: () => t('Recoge los cristales que sueltan los enemigos para subir de nivel.'),
      done: e => e.level > 1 || e.xp > 0 },
    { id: 'abilities', text: () => touch ? t('Toca los botones de abajo para usar tus habilidades; la definitiva, cuando llegue al 100 %.')
      : t('Usa tus habilidades con {a} y {b}; la definitiva con {c} cuando llegue al 100 %.', { a: keyLabel(keys.special), b: keyLabel(keys.secondary), c: keyLabel(keys.ultimate) }),
      done: (e, s) => e.cds.special > 0 || e.cds.secondary > 0 || s > 12 },
    { id: 'crates', text: () => t('Rompe las cajas: sueltan curación, monedas, imanes o bombas.'),
      show: e => e.crates.some(c => !c.dead && Math.hypot(c.x - e.player.x, c.y - e.player.y) < 600),
      done: (_e, s) => s > 7 },
  ];
  // un solo temporizador para toda la guía (el HUD redibuja este componente 10 veces por segundo)
  const live = useRef({ steps, finish });
  live.current = { steps, finish };
  useEffect(() => {
    const id = window.setInterval(() => {
      if (engine.state !== 'playing') return;
      const { steps: list, finish: end } = live.current, n = stepRef.current, st = list[n];
      if (!st) return;
      if (st.show && !st.show(engine)) { since.current = engine.time; return; }   // espera a que tenga sentido
      if (st.done(engine, engine.time - since.current)) {
        since.current = engine.time;
        if (n + 1 >= list.length) { track('tutorial', { step: 'fin', skipped: false }); end(); }
        go(n + 1);
      }
    }, 150);
    return () => window.clearInterval(id);
  }, [engine]);
  const st = steps[step];
  if (!st || (st.show && !st.show(engine))) return null;
  return (
    <div className="coach" key={st.id} role="status">
      <b>{t('Consejo')} {step + 1}/{steps.length}</b>
      <span>{st.text()}</span>
      <button className="coach-skip" onClick={() => { track('tutorial', { step: st.id, skipped: true }); go(steps.length); finish(); }}>{t('Saltar')}</button>
    </div>
  );
}
