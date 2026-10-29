// Dibujos de la tienda (armas con estilo, mascotas y agentes con estilo), compartidos por la Tienda,
// la ficha de Agentes y la sección de Mascotas.
import { useEffect, useRef } from 'react';
import { PetDef } from '../data/shop';
import { gunRuns, gunSize } from '../game/weaponSprites';
import { petRuns, PW, PH } from '../game/petSprites';
import { spriteCanvas, agentSheetReady, IDLE } from '../game/sprites';
import { WEAPONS } from '../data/weapons';

export const ELEMENT: Record<PetDef['element'], { name: string; color: string }> = {
  fuego: { name: 'Fuego', color: '#ff7a2e' }, agua: { name: 'Agua', color: '#4fd0ff' }, rayo: { name: 'Rayo', color: '#ffe14a' },
  planta: { name: 'Planta', color: '#5dff9a' }, hielo: { name: 'Hielo', color: '#bfe8ff' },
};

export function GunArt({ weapon, skin, className = 'shop-art gun' }: { weapon: string; skin: string; className?: string }) {
  const s = gunSize(weapon);
  return (
    <svg className={className} viewBox={`-2 -2 ${s.w + 4} ${s.h + 4}`} shapeRendering="crispEdges" aria-hidden="true">
      {gunRuns(weapon, WEAPONS[weapon]?.color ?? '#ff4655', skin).map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1.02} fill={r.c} />)}
    </svg>
  );
}

export function PetArt({ id, className = 'shop-art pet' }: { id: string; className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${PW} ${PH}`} shapeRendering="crispEdges" aria-hidden="true">
      {petRuns(id).map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1.02} fill={r.c} />)}
    </svg>
  );
}

/** Agente dibujado con un estilo (se pinta en un canvas porque el estilo recolorea píxeles). */
export function AgentArt({ id, skin, className = 'shop-art agent' }: { id: string; skin: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    agentSheetReady(id).then(() => {
      const cv = ref.current;
      if (!live || !cv) return;
      const spr = spriteCanvas(id, (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }, 4, IDLE, 'front', 0, skin);
      cv.width = spr.width; cv.height = spr.height;
      const g = cv.getContext('2d')!;
      g.clearRect(0, 0, cv.width, cv.height); g.drawImage(spr, 0, 0);
    });
    return () => { live = false; };
  }, [id, skin]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
