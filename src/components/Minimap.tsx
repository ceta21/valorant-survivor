import { useEffect, useRef } from 'react';
import type { GameEngine } from '../game/GameEngine';
import { worldOverview, MAP_SCALE } from '../game/WorldMap';
import { MAPS } from '../data/maps';
import { t } from '../i18n';

/** Lado del minimapa en píxeles (se amplía con CSS, sin suavizado) y distancia del mundo que abarca desde el centro. */
const N = 96, RANGE = 1100, K = N / 2 / RANGE;
const makeCanvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/**
 * Minimapa: el trozo del mapa del mundo alrededor del jugador, con su posición en el centro, la pareja
 * (en cooperativo), los jefes y los portales. Lo que queda fuera de su alcance se pega al borde, en su dirección.
 * Debajo, el nombre de la zona en la que estás.
 */
export function Minimap({ engine, onOpen }: { engine: GameEngine; onOpen?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null), zoneRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const g = ref.current?.getContext('2d');
    if (!g) return;
    const map = worldOverview(engine.world, makeCanvas), src = (RANGE * 2) / MAP_SCALE;
    g.imageSmoothingEnabled = false;
    let raf = 0, lastZone = -2;
    const dot = (x: number, y: number, s: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); };
    /** Posición en el minimapa; fuera de alcance, pegada al borde. */
    const place = (dx: number, dy: number) => {
      let x = dx * K, y = dy * K;
      const out = Math.abs(x) > N / 2 - 3 || Math.abs(y) > N / 2 - 3;
      if (out) { const f = (N / 2 - 3) / Math.max(Math.abs(x), Math.abs(y)); x *= f; y *= f; }
      return { x: N / 2 + x, y: N / 2 + y, out };
    };
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const me = engine.me.body, blink = Math.floor(engine.time * 4) % 2 === 0;
      g.fillStyle = '#0a0c18'; g.fillRect(0, 0, N, N);
      g.drawImage(map, (me.x - RANGE) / MAP_SCALE, (me.y - RANGE) / MAP_SCALE, src, src, 0, 0, N, N);
      for (const pt of engine.world.portals) {
        const q = place(pt.x - me.x, pt.y - me.y);
        if (!q.out) { dot(q.x, q.y, 5, '#000'); dot(q.x, q.y, 3, MAPS[pt.to].colors.accent); }
      }
      for (const e of engine.enemies) {
        if (e.dead || !e.isBoss) continue;
        const p = place(e.x - me.x, e.y - me.y);
        if (p.out && !blink) continue;
        dot(p.x, p.y, p.out ? 4 : 6, '#000'); dot(p.x, p.y, p.out ? 2 : 4, '#ff4655');
      }
      for (const pl of engine.players) {
        if (pl === engine.me || pl.gone) continue;
        const p = place(pl.body.x - me.x, pl.body.y - me.y);
        dot(p.x, p.y, 5, '#000'); dot(p.x, p.y, 3, pl.dead ? '#6a7080' : pl.agent.color);
      }
      dot(N / 2, N / 2, 6, '#000'); dot(N / 2, N / 2, 4, '#ffffff');
      const z = engine.world.zoneOfPoint(me.x, me.y);
      if (z !== lastZone && zoneRef.current) { lastZone = z; zoneRef.current.textContent = z >= 0 ? t(MAPS[z].name) : ''; zoneRef.current.style.color = z >= 0 ? MAPS[z].colors.accent : ''; }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [engine]);
  return (
    <div className="minimap-wrap">
      <canvas ref={ref} className="minimap" width={N} height={N} role="img" aria-label={t('Minimapa')} onClick={onOpen} />
      <span ref={zoneRef} className="minimap-zone" />
    </div>
  );
}
