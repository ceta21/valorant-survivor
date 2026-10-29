import { useEffect, useRef } from 'react';
import type { GameEngine } from '../game/GameEngine';
import { CS, STREET } from '../game/World';
import { t } from '../i18n';

/** Lado del minimapa en píxeles (se amplía con CSS, sin suavizado) y distancia del mundo que abarca desde el centro. */
const N = 96, RANGE = 1100, K = N / 2 / RANGE;

/** Oscurece un color #rrggbb (k entre 0 y 1). */
const dark = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16), f = (c: number) => Math.round(c * (1 - k));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

/**
 * Minimapa: el entorno en miniatura (calles, manzanas, edificios, muros, cajas, agua, sitios y
 * teletransportadores) con tu posición en el centro, tu pareja (en cooperativo) y los jefes.
 * Lo que queda fuera de su alcance se pega al borde, en su dirección.
 */
export function Minimap({ engine }: { engine: GameEngine }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current?.getContext('2d');
    if (!g) return;
    const world = engine.world, col = world.map.colors;
    const pal = {
      street: dark(col.ground, 0.45), block: dark(col.ground2, 0.2),
      b: col.wallTop, w: col.wall, c: '#8a5a2a', p: '#bfb6a6', t: '#6a4a2a', water: '#4fb8d0', accent: col.accent,
    };
    let raf = 0;
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
      const ox = N / 2 - me.x * K, oy = N / 2 - me.y * K;               // del mundo al minimapa: x * K + ox
      const rect = (x: number, y: number, w: number, h: number, c: string) => {
        const x0 = Math.floor(x * K + ox), y0 = Math.floor(y * K + oy);
        g.fillStyle = c; g.fillRect(x0, y0, Math.max(1, Math.ceil((x + w) * K + ox) - x0), Math.max(1, Math.ceil((y + h) * K + oy) - y0));
      };
      // calles de fondo y, encima, cada manzana con lo que tiene
      g.fillStyle = pal.street; g.fillRect(0, 0, N, N);
      const c0x = Math.floor((me.x - RANGE) / CS), c1x = Math.floor((me.x + RANGE) / CS);
      const c0y = Math.floor((me.y - RANGE) / CS), c1y = Math.floor((me.y + RANGE) / CS);
      for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) {
        const ch = world.chunk(cx, cy), bx = cx * CS, by = cy * CS;
        rect(bx + STREET, by + STREET, CS - STREET * 2, CS - STREET * 2, pal.block);
        for (const d of ch.deco) if (d.type !== 'rugs') rect(d.x - d.rx, d.y - d.ry, d.rx * 2, d.ry * 2, pal.water);
        if (ch.zone) {   // sitio (A, B, C): marco del color del mapa
          const z = ch.zone;
          g.strokeStyle = pal.accent; g.lineWidth = 1;
          g.strokeRect(Math.round((z.x - z.r) * K + ox) + 0.5, Math.round((z.y - z.r) * K + oy) + 0.5, Math.round(z.r * 2 * K), Math.round(z.r * 2 * K));
        }
        for (const o of ch.obstacles) rect(o.x, o.y, o.w, o.h, pal[o.k ?? 'w']);
      }
      // teletransportadores
      for (const [a, b] of world.portalsNear(me.x, me.y, Math.ceil(RANGE / CS))) for (const p of [a, b]) {
        const q = place(p.x - me.x, p.y - me.y);
        if (!q.out) dot(q.x, q.y, 3, pal.accent);
      }
      // jefes
      for (const e of engine.enemies) {
        if (e.dead || !e.isBoss) continue;
        const p = place(e.x - me.x, e.y - me.y);
        if (p.out && !blink) continue;
        dot(p.x, p.y, p.out ? 4 : 6, '#000'); dot(p.x, p.y, p.out ? 2 : 4, '#ff4655');
      }
      // pareja
      for (const pl of engine.players) {
        if (pl === engine.me || pl.gone) continue;
        const p = place(pl.body.x - me.x, pl.body.y - me.y);
        dot(p.x, p.y, 5, '#000'); dot(p.x, p.y, 3, pl.dead ? '#6a7080' : pl.agent.color);
      }
      // tú
      dot(N / 2, N / 2, 6, '#000'); dot(N / 2, N / 2, 4, '#ffffff');
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [engine]);
  return <canvas ref={ref} className="minimap" width={N} height={N} role="img" aria-label={t('Minimapa')} />;
}
