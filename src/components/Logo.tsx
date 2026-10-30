// Emblema pixelado de ENDLESS RIFT: estrella dorada de 4 puntas con un anillo y el cristal morado de la grieta en
// el centro, rasterizado en una rejilla de 19×19 (con luz arriba a la izquierda y contorno oscuro).
const N = 19, C = 9;
const GOLD = ['#7a4a14', '#c4902a', '#f0c850', '#fff2b0'], RIFT = ['#2a0f4a', '#6a2ab0', '#9b5cff', '#e2c4ff'], OUT = '#120818';
const CELLS: { x: number; y: number; c: string }[] = [];
{
  const fill: (string | null)[] = Array(N * N).fill(null);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = x - C, dy = y - C, ax = Math.abs(dx), ay = Math.abs(dy), d = Math.hypot(dx, dy);
    const light = dx + dy < 0 ? 1 : dx + dy > 0 ? -1 : 0;   // luz arriba a la izquierda
    if (ax + ay <= 4) {
      // cristal de la grieta, con una grieta clara en diagonal
      const crack = dx === -dy || (dx === -dy + 1 && ay < 2);
      fill[y * N + x] = crack ? RIFT[3] : RIFT[light > 0 ? 2 : light < 0 ? 1 : 2];
      if (ax + ay === 4) fill[y * N + x] = RIFT[0];
    } else if (Math.min(ax, ay) <= (C - Math.max(ax, ay)) / 3.2) {
      fill[y * N + x] = GOLD[(ax < ay ? dx : dy) < 0 ? 3 : 1 + (Math.min(ax, ay) === 0 ? 1 : 0)];   // puntas de la estrella
    } else if (d > 5.4 && d < 6.6) {
      fill[y * N + x] = GOLD[light > 0 ? 2 : 1];   // anillo
    } else if (d <= 5.4) {
      fill[y * N + x] = (x * 7 + y * 3) % 11 === 0 ? RIFT[2] : '#1c0b33';   // interior de la grieta con chispas
    }
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const c = fill[y * N + x];
    if (c) { CELLS.push({ x, y, c }); continue; }
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([u, v]) => fill[(y + v) * N + x + u] && x + u >= 0 && x + u < N && y + v >= 0 && y + v < N);
    if (near) CELLS.push({ x, y, c: OUT });
  }
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={`logo ${small ? 'small' : ''}`} aria-label="ENDLESS RIFT">
      <svg viewBox={`0 0 ${N} ${N}`} className="logo-mark" shapeRendering="crispEdges" aria-hidden="true">
        {CELLS.map((p, i) => <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={p.c} />)}
      </svg>
      <div className="logo-text">
        <span className="logo-top">ENDLESS</span>
        <span className="logo-bot">R<i>I</i>FT</span>
      </div>
    </div>
  );
}
