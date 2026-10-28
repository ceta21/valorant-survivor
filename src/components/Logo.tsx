// Emblema pixelado: los dos trazos del logo rasterizados en una rejilla de 16x14.
const SHAPES: [string, number[][]][] = [
  ['#ff4655', [[2, 4], [22, 4], [40, 40], [30, 40]]],
  ['#ece8e1', [[62, 4], [42, 4], [26, 36], [36, 52]]],
];
const inside = (x: number, y: number, poly: number[][]) => {
  let r = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) r = !r;
  }
  return r;
};
const CELLS: { x: number; y: number; c: string }[] = [];
for (let y = 0; y < 14; y++) for (let x = 0; x < 16; x++) {
  const hit = SHAPES.find(([, p]) => inside(x * 4 + 2, y * 4 + 2, p));
  if (hit) CELLS.push({ x, y, c: hit[0] });
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={`logo ${small ? 'small' : ''}`} aria-label="VALORANT SURVIVORS">
      <svg viewBox="0 0 16 14" className="logo-mark" shapeRendering="crispEdges" aria-hidden="true">
        {CELLS.map((p, i) => <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={p.c} />)}
      </svg>
      <div className="logo-text">
        <span className="logo-top">VALORANT</span>
        <span className="logo-bot">SURVIVORS</span>
      </div>
    </div>
  );
}
