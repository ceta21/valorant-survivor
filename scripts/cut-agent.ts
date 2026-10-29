// Recorta los fotogramas de un agente de una hoja de sprites (imagen con fondo liso) y los guarda con sus
// colores exactos en public/agents/<id>.png (+ medidas en src/data/agentImages/<id>.json). El juego los dibuja tal cual.
// Uso: npx tsx scripts/cut-agent.ts <id>
// Lee art/<id>.png y los centros de sus fotogramas de art/frames.json: {"front":[[x,y],...],"back":[...],"side":[...]}.
// "side" debe mirar a la DERECHA (la izquierda es el espejo).
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const id = process.argv[2], src = `art/${id}.png`;
/** Rectángulo a borrar en la celda del fotograma [x0, y0, x1, y1, modo] (inclusive). Modo "c": se quita
 *  (el arma que sobresale); "f": se rellena con lo que la rodea (el arma por delante del cuerpo). */
type Erase = [number, number, number, number, 'c' | 'f' | 'F'];   // "F": como "f" pero solo con lo de debajo
const spec: Record<'front' | 'back' | 'side', [number, number][]> & { tol?: number; erase?: Partial<Record<'front' | 'back' | 'side', Erase[][]>> } = JSON.parse(readFileSync('art/frames.json', 'utf8'))[id] ?? {};
/** Tolerancia del color de fondo (más alta si la imagen tiene el fondo con textura). */
const TOL = spec.tol ?? 12;
const im = await loadImage(src);
const W = im.width, H = im.height;
const cv = createCanvas(W, H); const cg = cv.getContext('2d') as any; cg.drawImage(im, 0, 0);
const d: Uint8ClampedArray = cg.getImageData(0, 0, W, H).data;
const bg = (() => { const m = new Map<number, number>(); for (let i = 0; i < d.length; i += 4) { const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; m.set(k, (m.get(k) ?? 0) + 1); } const k = [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]; return [k >> 16, (k >> 8) & 255, k & 255]; })();   // color más frecuente
const at = (x: number, y: number) => (y * W + x) * 4;
const fg = (x: number, y: number) => { const i = at(x, y); return Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > 45; };

/** Fondo de verdad (un fondo liso solo varía ±6): así el pelo o la ropa muy oscuros no se borran. */
const bgExact = (x: number, y: number) => { const i = at(x, y); return Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) <= TOL; };
interface Frame { px: [number, number, number, number, number][]; cx: number; bottom: number; top: number }
/** Mancha conectada (la mayor cerca del punto) → fotograma. Los huecos oscuros del interior se conservan:
 *  solo es fondo lo que conecta con el borde del recuadro. */
function component(sx: number, sy: number) {
  const seen = new Set<number>([sy * W + sx]), st = [[sx, sy]], out: number[][] = [];
  while (st.length) {
    const [x, y] = st.pop()!; out.push([x, y]);
    for (const [u, v] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      const k = v * W + u;
      if (u >= 0 && v >= 0 && u < W && v < H && !seen.has(k) && fg(u, v)) { seen.add(k); st.push([u, v]); }
    }
  }
  return out;
}
/** Junta todas las manchas del fotograma (cuerpo, arma, pies sueltos…): las que caen en la celda
 *  de ±RX × ±RY alrededor del punto. Las motas de ruido muy pequeñas se ignoran. */
const RX = 24, RY = 31;
let lost = 0;
function blob(x0: number, y0: number): Frame {
  const best: number[][] = [], done = new Set<number>();
  for (let y = y0 - RY; y <= y0 + RY; y++) for (let x = x0 - RX; x <= x0 + RX; x++) {
    if (done.has(y * W + x) || !fg(x, y)) continue;
    const c = component(x, y);
    c.forEach(p => done.add(p[1] * W + p[0]));
    const mx = c.reduce((t, p) => t + p[0], 0) / c.length, my = c.reduce((t, p) => t + p[1], 0) / c.length;
    if (c.length >= 6 && Math.abs(mx - x0) <= RX && Math.abs(my - y0) <= RY) best.push(...c);
  }
  const bx0 = Math.min(...best.map(p => p[0])), bx1 = Math.max(...best.map(p => p[0]));
  const top = Math.min(...best.map(p => p[1])), bottom = Math.max(...best.map(p => p[1]));
  // fondo = píxeles del color del fondo conectados con el borde del recuadro
  const bw = bx1 - bx0 + 3, bh = bottom - top + 3, out = new Uint8Array(bw * bh);
  const st: number[][] = [];
  for (let x = 0; x < bw; x++) { st.push([x, 0], [x, bh - 1]); }
  for (let y = 0; y < bh; y++) { st.push([0, y], [bw - 1, y]); }
  while (st.length) {
    const [x, y] = st.pop()!;
    if (x < 0 || y < 0 || x >= bw || y >= bh || out[y * bw + x]) continue;
    const gx = bx0 - 1 + x, gy = top - 1 + y;
    if (gx >= 0 && gy >= 0 && gx < W && gy < H && !bgExact(gx, gy)) continue;
    out[y * bw + x] = 1;
    st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const px: Frame['px'] = [];
  for (let y = 1; y < bh - 1; y++) for (let x = 1; x < bw - 1; x++) if (!out[y * bw + x]) { const gx = bx0 - 1 + x, gy = top - 1 + y, i = at(gx, gy); px.push([gx, gy, d[i], d[i + 1], d[i + 2]]); }
  const keep = new Set(px.map(p => p[1] * W + p[0]));
  for (let y = top; y <= bottom; y++) for (let x = bx0; x <= bx1; x++) if (fg(x, y) && !keep.has(y * W + x)) lost++;
  // centro horizontal = centro de la cabeza (el arma no descentra el personaje)
  const head = px.filter(p => p[1] < top + (bottom - top) * 0.35);
  const cx = Math.round((Math.min(...head.map(p => p[0])) + Math.max(...head.map(p => p[0]))) / 2);
  return { px, cx, bottom, top };
}

// --find: lista los recuadros de las manchas grandes, para saber dónde está cada fotograma
if (process.argv[3] === '--find') {
  const done = new Set<number>(), boxes: number[][] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (done.has(y * W + x) || !fg(x, y)) continue;
    const c = component(x, y); c.forEach(p => done.add(p[1] * W + p[0]));
    if (c.length < 300) continue;
    const xs = c.map(p => p[0]), ys = c.map(p => p[1]);
    boxes.push([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), c.length]);
  }
  boxes.sort((p, q) => p[1] - q[1] || p[0] - q[0]).forEach(b => console.log(`x ${b[0]}-${b[2]}  y ${b[1]}-${b[3]}  centro ${(b[0] + b[2]) >> 1},${(b[1] + b[3]) >> 1}  (${b[4]} px)`));
  process.exit(0);
}

const dirs = ['front', 'back', 'side'] as const;
const frames = Object.fromEntries(dirs.map(k => [k, spec[k].map(([x, y]) => blob(x, y))])) as Record<typeof dirs[number], Frame[]>;
const all = dirs.flatMap(k => frames[k]);
for (const k of dirs) console.log(k, frames[k].map(f => `${f.px.length}px cx${f.cx} ${f.top}-${f.bottom}`).join(" | "));

// celda común: el centro de la cabeza en el centro y los pies abajo
const half = Math.max(...all.flatMap(f => f.px.map(p => Math.abs(p[0] - f.cx)))) + 2;
const w = half * 2 + 1, h = Math.max(...all.map(f => f.bottom - f.top)) + 3;
const cols = Math.max(...dirs.map(k => frames[k].length));
// hoja PNG con los colores exactos de la imagen: una fila por vista (frente, espalda, lado)
const sheet = createCanvas(cols * w, 3 * h), sg = sheet.getContext('2d') as any, img = sg.createImageData(cols * w, 3 * h);
dirs.forEach((k, row) => frames[k].forEach((f, col) => {
  const grid: (number[] | null)[] = Array(w * h).fill(null);
  for (const p of f.px) {
    const x = p[0] - f.cx + half, y = p[1] - f.bottom + h - 2;
    if (x >= 0 && y >= 0 && x < w && y < h) grid[y * w + x] = [p[2], p[3], p[4]];
  }
  // quitar el arma que trae la imagen (el juego pinta la equipada encima)
  const rects = spec.erase?.[k]?.[col] ?? [];
  if (rects.length) {
    const inR = (x: number, y: number, m: string, pad = 0) => rects.some(r => r[4][0] === m && x >= r[0] - pad && x <= r[2] + pad && y >= r[1] - pad && y <= r[3] + pad);
    const lumOf = (c: number[]) => c[0] + c[1] + c[2];
    const ink = (grid.filter(Boolean) as number[][]).reduce((a, c) => lumOf(c) < lumOf(a) ? c : a);
    // "f": cada columna se rellena prolongando la ropa de encima (mitad de arriba) y la de debajo (mitad de abajo)
    const before = grid.slice();
    for (const r of rects.filter(r => r[4] !== 'c')) {
      const mid = r[4] === 'F' ? -1 : (r[1] + r[3]) / 2;
      for (let x = r[0]; x <= r[2]; x++) {
        let up: number[] | null = null, dn: number[] | null = null;
        for (let y = r[1] - 1; y >= 0 && !up; y--) { const c = before[y * w + x]; if (c && lumOf(c) > 25) up = c; else if (!c) break; }
        for (let y = r[3] + 1; y < h && !dn; y++) { const c = before[y * w + x]; if (c && lumOf(c) > 25) dn = c; else if (!c) break; }
        for (let y = r[1]; y <= r[3]; y++) if (grid[y * w + x]) grid[y * w + x] = (y < mid ? up ?? dn : dn ?? up) ?? ink;
      }
    }
    // "c": quitar y volver a perfilar el borde que queda
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inR(x, y, 'c')) grid[y * w + x] = null;
    const edge: number[] = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (grid[y * w + x] || !inR(x, y, 'c', 1)) continue;
      if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([u, v]) => u >= 0 && v >= 0 && u < w && v < h && grid[v * w + u] && !inR(u, v, 'c'))) edge.push(y * w + x);
    }
    for (const i of edge) grid[i] = ink;
    // trozos sueltos que hayan quedado del arma
    const seen = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (!grid[i] || seen[i]) continue;
      const comp = [i], st = [i]; seen[i] = 1;
      while (st.length) { const j = st.pop()!, x = j % w, y = (j / w) | 0;
        for (const [u, v] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { const q = v * w + u; if (u >= 0 && v >= 0 && u < w && v < h && grid[q] && !seen[q]) { seen[q] = 1; st.push(q); comp.push(q); } } }
      if (comp.length < 30) for (const j of comp) grid[j] = null;
    }
  }
  // tapar muescas de 1 píxel del recorte (huecos con 3 o 4 vecinos de dibujo) con el color más oscuro vecino
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (grid[y * w + x]) continue;
    const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([u, v]) => u >= 0 && v >= 0 && u < w && v < h).map(([u, v]) => grid[v * w + u]).filter(Boolean) as number[][];
    if (nb.length >= 3) grid[y * w + x] = nb.sort((p, q) => p[0] + p[1] + p[2] - q[0] - q[1] - q[2])[0];
  }
  grid.forEach((c, i) => {
    if (!c) return;
    const o = ((row * h + Math.floor(i / w)) * cols * w + col * w + (i % w)) * 4;
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  });
}));
sg.putImageData(img, 0, 0);
mkdirSync('public/agents', { recursive: true });
const png = sheet.toBuffer('image/png');
writeFileSync(`public/agents/${id}.png`, png);
// escala para que todos los agentes midan lo mismo en el juego (~58 unidades), dibujara como dibujara la imagen
const heights = all.map(f => f.bottom - f.top + 1).sort((p, q) => p - q);
const px = Math.round(58 / heights[heights.length >> 1] * 1000) / 1000;
const data = { w, h, px, ...Object.fromEntries(dirs.map(k => [k, frames[k].length])) };
mkdirSync('src/data/agentImages', { recursive: true });
writeFileSync(`src/data/agentImages/${id}.json`, JSON.stringify(data) + '\n');
console.log(`píxeles de dibujo perdidos: ${lost}`);
console.log(`${id}: ${w}x${h}, ${dirs.map(k => `${k} ${frames[k].length}`).join(', ')}, png ${png.length} bytes`);

// índice de agentes con imagen (importa todos los .json de la carpeta)
const { readdirSync } = await import('node:fs');
const ids = readdirSync('src/data/agentImages').filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort();
writeFileSync('src/data/agentImages/index.ts', `// Generado por scripts/cut-agent.ts: agentes dibujados a partir de su hoja de sprites
// (la imagen está en public/agents/<id>.png: una fila por vista —frente, espalda, lado— y una columna por paso).
`
  + ids.map(i => `import ${i} from './${i}.json';`).join('\n')
  + `

export interface AgentImage { w: number; h: number; px: number; front: number; back: number; side: number }
`
  + `export const AGENT_IMAGES: Record<string, AgentImage> = { ${ids.join(', ')} };
`);
