import { useEffect, useRef } from 'react';
import type { GameEngine } from '../game/GameEngine';
import { worldOverview, MAP_PX, MAP_SCALE } from '../game/WorldMap';
import { MAPS } from '../data/maps';
import { CS, ZN, ZS } from '../game/World';
import { t } from '../i18n';

const makeCanvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/** Mapa del mundo a pantalla grande: las 4 zonas con su nombre, los portales, tú, tu pareja y los jefes. */
export function BigMap({ engine, close, keyName }: { engine: GameEngine; close: () => void; keyName: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current, g = cv?.getContext('2d');
    if (!cv || !g) return;
    const map = worldOverview(engine.world, makeCanvas), S = 2;   // se dibuja al doble para que los rótulos se lean
    cv.width = MAP_PX * S; cv.height = MAP_PX * S;
    g.imageSmoothingEnabled = false;
    let raf = 0;
    const W = (v: number) => (v / MAP_SCALE) * S;
    const dot = (x: number, y: number, s: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(W(x) - s / 2), Math.round(W(y) - s / 2), s, s); };
    const label = (text: string, x: number, y: number, c: string, size: number) => {
      g.font = `${size}px "Press Start 2P", monospace`; g.textAlign = 'center';
      g.fillStyle = '#000'; for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2]]) g.fillText(text, x + ox, y + oy);
      g.fillStyle = c; g.fillText(text, x, y);
    };
    const draw = () => {
      raf = requestAnimationFrame(draw);
      g.drawImage(map, 0, 0, MAP_PX * S, MAP_PX * S);
      // nombre de cada zona
      for (const m of MAPS) label(t(m.name).toUpperCase(), W((m.zone[0] * ZS + ZN / 2) * CS), W((m.zone[1] * ZS + 0.8) * CS), m.colors.accent, 22);
      const blink = Math.floor(performance.now() / 250) % 2 === 0;
      for (const pt of engine.world.portals) {
        dot(pt.x, pt.y, 18, '#000'); dot(pt.x, pt.y, 14, MAPS[pt.to].colors.accent); dot(pt.x, pt.y, 6, '#ffffff');
        label('→ ' + t(MAPS[pt.to].name), W(pt.x), W(pt.y) - 16, MAPS[pt.to].colors.accent, 10);
      }
      for (const e of engine.enemies) if (!e.dead && e.isBoss) { dot(e.x, e.y, 16, '#000'); dot(e.x, e.y, 12, '#ff4655'); }
      for (const pl of engine.players) {
        if (pl.gone) continue;
        const me = pl === engine.me, s = me ? 18 : 14;
        if (me && !blink) continue;
        dot(pl.body.x, pl.body.y, s + 4, '#000'); dot(pl.body.x, pl.body.y, s, me ? '#ffffff' : pl.dead ? '#6a7080' : pl.agent.color);
        if (!me) label(pl.name, W(pl.body.x), W(pl.body.y) - 16, pl.agent.color, 10);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [engine]);
  return (
    <div className="overlay bigmap" onClick={close}>
      <div className="bigmap-box" onClick={e => e.stopPropagation()}>
        <header><h2>{t('Mapa')}</h2><span>{t('Pulsa {k} o Esc para cerrar', { k: keyName })}</span></header>
        <canvas ref={ref} className="bigmap-canvas" role="img" aria-label={t('Mapa del mundo')} />
        <ul className="bigmap-legend">
          <li><i style={{ background: '#fff' }} />{t('Tú')}</li>
          <li><i style={{ background: '#ff4655' }} />{t('Jefe')}</li>
          <li><i style={{ background: '#4fd0ff' }} />{t('Portal (del color de la zona a la que lleva)')}</li>
          {engine.players.length > 1 && <li><i style={{ background: engine.players.find(p => p !== engine.me)?.agent.color }} />{t('Tu pareja')}</li>}
        </ul>
        <button className="btn btn-red" onClick={close}><b>{t('Cerrar')}</b></button>
      </div>
    </div>
  );
}
