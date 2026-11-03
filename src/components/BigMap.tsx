import { useEffect, useRef } from 'react';
import type { GameEngine } from '../game/GameEngine';
import { drawWorldArea, MAP_SCALE } from '../game/WorldMap';
import { MAPS } from '../data/maps';
import { CS } from '../game/World';
import { t } from '../i18n';

const makeCanvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/** Lado que abarca el mapa grande (unidades) y su tamaño en píxeles. */
const VIEW = 17 * CS, MAP_PX = VIEW / MAP_SCALE;

/**
 * Mapa a pantalla grande: el trozo de mundo alrededor de ti (las zonas no tienen bordes), con el nombre de la zona,
 * los portales (los lejanos, pegados al borde en su dirección), tú, tu pareja y los jefes.
 */
export function BigMap({ engine, close, keyName }: { engine: GameEngine; close: () => void; keyName: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current, g = cv?.getContext('2d');
    if (!cv || !g) return;
    const S = 2;   // se dibuja al doble para que los rótulos se lean
    cv.width = MAP_PX * S; cv.height = MAP_PX * S;
    g.imageSmoothingEnabled = false;
    let raf = 0;
    let ox = 0, oy = 0;   // esquina del trozo que se ve (sigue al jugador)
    const W = (v: number) => (v / MAP_SCALE) * S, X = (x: number) => W(x - ox), Y = (y: number) => W(y - oy);
    const dot = (x: number, y: number, s: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(X(x) - s / 2), Math.round(Y(y) - s / 2), s, s); };
    /** Punto dentro del mapa; si queda fuera, pegado al borde en su dirección. */
    const clampPt = (x: number, y: number, m: number) => {
      const cx = ox + VIEW / 2, cy = oy + VIEW / 2, dx = x - cx, dy = y - cy, lim = VIEW / 2 - m * MAP_SCALE / S;
      const f = Math.max(Math.abs(dx), Math.abs(dy)) > lim ? lim / Math.max(Math.abs(dx), Math.abs(dy)) : 1;
      return { x: cx + dx * f, y: cy + dy * f, out: f < 1 };
    };
    const label = (text: string, x: number, y: number, c: string, size: number) => {
      g.font = `${size}px "Press Start 2P", monospace`; g.textAlign = 'center';
      g.fillStyle = '#000'; for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2]]) g.fillText(text, x + ox, y + oy);
      g.fillStyle = c; g.fillText(text, x, y);
    };
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const me = engine.me.body;
      ox = me.x - VIEW / 2; oy = me.y - VIEW / 2;
      drawWorldArea(g, engine.world, ox, oy, VIEW, VIEW, S / MAP_SCALE, makeCanvas);
      // nombre de la zona en la que estás
      const z = engine.world.zoneOfPoint(me.x, me.y);
      if (z >= 0) label(t(MAPS[z].name).toUpperCase(), (MAP_PX * S) / 2, 40, MAPS[z].colors.accent, 22);
      const blink = Math.floor(performance.now() / 250) % 2 === 0;
      let nOut = 0;
      for (const pt of engine.world.portals) {
        if (pt.zone !== z) continue;   // solo los de tu zona (las demás están a más de un millón de unidades)
        const q = clampPt(pt.x, pt.y, 40);
        // los lejanos se pegan al borde; si caen juntos, sus rótulos se apilan para que se lean
        const ly = Y(q.y) - 16 - (q.out ? 14 * nOut++ : 0);
        const open = engine.portalOpen(pt), c = open ? MAPS[pt.to].colors.accent : '#8a8fa0';
        dot(q.x, q.y, 18, '#000'); dot(q.x, q.y, 14, c); dot(q.x, q.y, 6, open ? '#ffffff' : '#3a3850');
        label((q.out ? '⇢ ' : '→ ') + t(MAPS[pt.to].name) + (open ? '' : ' 🔒'), Math.max(70, X(q.x)), ly, c, 10);
      }
      for (const e of engine.enemies) if (!e.dead && e.isBoss) { const q = clampPt(e.x, e.y, 12); dot(q.x, q.y, 16, '#000'); dot(q.x, q.y, 12, '#ff4655'); }
      for (const pl of engine.players) {
        if (pl.gone) continue;
        const me = pl === engine.me, s = me ? 18 : 14;
        if (me && !blink) continue;
        const q = clampPt(pl.body.x, pl.body.y, 12);
        dot(q.x, q.y, s + 4, '#000'); dot(q.x, q.y, s, me ? '#ffffff' : pl.dead ? '#6a7080' : pl.agent.color);
        if (!me) label(pl.name, X(q.x), Y(q.y) - 16, pl.agent.color, 10);
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
          <li><i style={{ background: '#8a8fa0' }} />{t('Portal cerrado: derrota a un jefe para abrirlo')}</li>
          {engine.players.length > 1 && <li><i style={{ background: engine.players.find(p => p !== engine.me)?.agent.color }} />{t('Tu pareja')}</li>}
        </ul>
        <button className="btn btn-red" onClick={close}><b>{t('Cerrar')}</b></button>
      </div>
    </div>
  );
}
