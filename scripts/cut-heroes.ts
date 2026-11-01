// Recorta las hojas nuevas de los héroes (art/heroes-nuevos/<id>.png|jpg: 3 filas —frente, espalda, perfil mirando a
// la derecha— × 5 columnas —reposo y 4 pasos—) y las guarda como public/agents/<id>.webp (misma rejilla, casillas
// iguales) + src/data/agentImages/<id>.json. Ver art/heroes-nuevos/GUIA.md.
// - Hojas en vertical (5 filas × 3 columnas, el personaje tumbado) se enderezan solas.
// - El fondo se quita con un relleno desde los bordes de cada casilla (tolera el ruido de las JPG) y se descartan
//   motas sueltas; los efectos que van aparte (bolas de fuego, rayos…) se conservan si no son diminutos.
// - Todos los dibujos de un héroe se reducen con la misma escala; se alinean por los pies y por el centro del
//   torso (así al andar no «baila» de lado aunque las piernas se abran).
// Uso: npx tsx scripts/cut-heroes.ts [id …]   (sin ids: todas las hojas). Genera shots/heroes-recortados.png.
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';

const DIR = 'art/heroes-nuevos', COLS = 5, ROWS = 3;
/** Alto en píxeles del reposo de frente en la hoja final (las demás posturas guardan su proporción). */
const IDLE_H = 150;
/** Alto con el que se ve en el juego, en unidades de mundo (el de antes). */
const WORLD_H = 58;

/** Casillas que la herramienta dibujó mal (otra vista u otro personaje): fila → { columna mala: columna buena }.
 *  Filas: 0 frente, 1 espalda, 2 perfil; columnas: 0 reposo, 1-4 pasos. */
const FIX: Record<string, Record<number, Record<number, number>>> = {
  zahir: { 0: { 2: 4 } },          // de frente, un paso salió de espaldas
  zephyr: { 0: { 3: 1, 4: 2 } },   // de frente, dos pasos salieron de perfil
};

const ids = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(DIR).filter(f => /\.(png|jpg)$/.test(f)).map(f => f.replace(/\.\w+$/, ''));
mkdirSync('public/agents', { recursive: true }); mkdirSync('shots', { recursive: true });

type Cut = { c: any; w: number; h: number; ax: number };   // dibujo recortado, su tamaño y el centro del torso
const review: { id: string; sheet: any }[] = [];

for (const id of ids) {
  const file = ['png', 'jpg'].map(e => `${DIR}/${id}.${e}`).find(existsSync);
  if (!file) { console.log(id, 'sin hoja'); continue; }
  let img: any = await loadImage(file);
  // enderezar: si es vertical, el personaje está tumbado (cabeza a la izquierda) → girar 90° a la derecha
  let flipCols = false;
  if (img.height > img.width) {
    const r = createCanvas(img.height, img.width), g = r.getContext('2d');
    g.translate(img.height, 0); g.rotate(Math.PI / 2); g.drawImage(img, 0, 0);
    img = r; flipCols = true;   // al girar, la primera fila (reposo) queda a la derecha
  }
  const W = img.width, H = img.height, base = createCanvas(W, H), bg0 = base.getContext('2d');
  bg0.drawImage(img, 0, 0);
  const d = bg0.getImageData(0, 0, W, H).data;
  // color de fondo: el más común en las esquinas
  const corners: number[][] = [];
  for (const [x, y] of [[4, 4], [W - 5, 4], [4, H - 5], [W - 5, H - 5], [W >> 1, 4], [4, H >> 1]]) { const i = (y * W + x) * 4; corners.push([d[i], d[i + 1], d[i + 2]]); }
  const bg = [0, 1, 2].map(k => corners.map(c => c[k]).sort((a, b) => a - b)[corners.length >> 1]);
  // tolerancia del fondo: en las JPG el contorno y la ropa oscura se parecen mucho al fondo, así que se baja
  // (si no, el relleno se «come» el contorno y deja agujeros); en las PNG el fondo es liso de verdad
  const TOL = Number(process.env.TOL) || (file.endsWith('.jpg') ? 16 : 46);
  const dist = (i: number) => Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]);

  const cw = W / COLS, ch = H / ROWS, raw: { x0: number; y0: number; w: number; h: number; keep: Uint8Array; box: number[] }[][] = [];
  for (let row = 0; row < ROWS; row++) {
    raw.push([]);
    for (let col = 0; col < COLS; col++) {
      const x0 = Math.round(col * cw), y0 = Math.round(row * ch), w = Math.round(cw), h = Math.round(ch);
      const keep = new Uint8Array(w * h).fill(1), st: number[] = [];
      const px = (x: number, y: number) => ((y0 + y) * W + x0 + x) * 4;
      for (let x = 0; x < w; x++) st.push(x, 0, x, h - 1);
      for (let y = 0; y < h; y++) st.push(0, y, w - 1, y);
      while (st.length) {
        const y = st.pop()!, x = st.pop()!;
        if (x < 0 || y < 0 || x >= w || y >= h || !keep[y * w + x] || dist(px(x, y)) > TOL) continue;
        keep[y * w + x] = 0; st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
      }
      // fuera las motas: trozos de menos del 1,2 % del mayor
      const comp = new Int32Array(w * h).fill(-1), sizes: number[] = [];
      for (let i0 = 0; i0 < w * h; i0++) {
        if (!keep[i0] || comp[i0] >= 0) continue;
        const cid = sizes.length, q = [i0]; comp[i0] = cid; let n = 0;
        while (q.length) { const i = q.pop()!, x = i % w, y = (i / w) | 0; n++;
          for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && keep[j] && comp[j] < 0) { comp[j] = cid; q.push(j); } }
        sizes.push(n);
      }
      const big = Math.max(1, ...sizes);
      let mx = w, my = h, Mx = -1, My = -1;
      for (let i = 0; i < w * h; i++) {
        if (keep[i] && sizes[comp[i]] < big * 0.012) keep[i] = 0;
        if (keep[i]) { const x = i % w, y = (i / w) | 0; mx = Math.min(mx, x); my = Math.min(my, y); Mx = Math.max(Mx, x); My = Math.max(My, y); }
      }
      raw[row].push({ x0, y0, w, h, keep, box: [mx, my, Mx, My] });
    }
    if (flipCols) raw[row].reverse();
    for (const [bad, good] of Object.entries(FIX[id]?.[row] ?? {})) raw[row][+bad] = raw[row][good];
  }
  // escala común: el reposo de frente mide IDLE_H
  const idle = raw[0][0].box, scale = IDLE_H / (idle[3] - idle[1] + 1);
  const cuts: Cut[][] = raw.map(r => r.map(f => {
    const [mx, my, Mx, My] = f.box, bw = Mx - mx + 1, bh = My - my + 1;
    const src = createCanvas(bw, bh), sg = src.getContext('2d'), id2 = sg.createImageData(bw, bh);
    let tx = 0, tn = 0;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      if (!f.keep[(my + y) * f.w + mx + x]) continue;
      const i = ((f.y0 + my + y) * W + f.x0 + mx + x) * 4, o = (y * bw + x) * 4;
      id2.data[o] = d[i]; id2.data[o + 1] = d[i + 1]; id2.data[o + 2] = d[i + 2]; id2.data[o + 3] = 255;
      if (y < bh * 0.45) { tx += x; tn++; }   // centro del torso y la cabeza
    }
    sg.putImageData(id2, 0, 0);
    // reducir a mitades (mezclando) y luego al tamaño final; borde duro
    let s: any = src, sw = bw, sh = bh;
    const tw = Math.max(1, Math.round(bw * scale)), th = Math.max(1, Math.round(bh * scale));
    while (sw / 2 > tw * 1.3) { const n = createCanvas(Math.round(sw / 2), Math.round(sh / 2)), g = n.getContext('2d'); g.imageSmoothingEnabled = true; (g as any).imageSmoothingQuality = 'high'; g.drawImage(s, 0, 0, n.width, n.height); s = n; sw = n.width; sh = n.height; }
    const c = createCanvas(tw, th), g = c.getContext('2d'); g.imageSmoothingEnabled = true; (g as any).imageSmoothingQuality = 'high'; g.drawImage(s, 0, 0, tw, th);
    const im = g.getImageData(0, 0, tw, th);
    for (let i = 3; i < im.data.length; i += 4) {
      const a = im.data[i];
      if (a < 128) { im.data[i] = 0; continue; }
      for (let k = 1; k <= 3; k++) im.data[i - k] = Math.min(255, (im.data[i - k] * 255) / a);
      im.data[i] = 255;
    }
    g.putImageData(im, 0, 0);
    return { c, w: tw, h: th, ax: tn ? (tx / tn) * scale : tw / 2 };
  }));
  // casilla común: cabe cualquier postura alineada por el torso y los pies
  const half = Math.ceil(Math.max(...cuts.flat().map(k => Math.max(k.ax, k.w - k.ax)))) + 2;
  const cellW = half * 2, cellH = Math.max(...cuts.flat().map(k => k.h)) + 2;
  const out = createCanvas(cellW * COLS, cellH * ROWS), og = out.getContext('2d');
  cuts.forEach((r, row) => r.forEach((k, col) => og.drawImage(k.c, Math.round(col * cellW + half - k.ax), row * cellH + cellH - 1 - k.h)));
  // WebP al 92 %: pesa ~4 veces menos que PNG y a este tamaño no se nota (la app guarda todas en el dispositivo)
  writeFileSync(`public/agents/${id}.webp`, out.toBuffer('image/webp', 92));
  if (existsSync(`public/agents/${id}.png`)) unlinkSync(`public/agents/${id}.png`);
  const px = Math.round((WORLD_H / IDLE_H) * 1000) / 1000;
  writeFileSync(`src/data/agentImages/${id}.json`, JSON.stringify({ w: cellW, h: cellH, px, front: COLS, back: COLS, side: COLS, idle: 1 }) + '\n');
  console.log(id, `casilla ${cellW}×${cellH}`, `escala ${scale.toFixed(3)}`, flipCols ? '(enderezada)' : '');
  review.push({ id, sheet: out });
}
// hoja para revisar: todos los héroes recortados, sobre hierba
if (review.length) {
  const S = 0.5, colW = Math.max(...review.map(r => r.sheet.width)) * S + 16, rowH = Math.max(...review.map(r => r.sheet.height)) * S + 16, per = 4;
  const sh = createCanvas(colW * per, rowH * Math.ceil(review.length / per)), g = sh.getContext('2d');
  g.fillStyle = '#3f7a3a'; g.fillRect(0, 0, sh.width, sh.height);
  review.forEach((r, i) => g.drawImage(r.sheet, (i % per) * colW + 8, Math.floor(i / per) * rowH + 8, r.sheet.width * S, r.sheet.height * S));
  writeFileSync('shots/heroes-recortados.png', sh.toBuffer('image/png'));
}
// índice con las medidas de todos (también los que no tienen hoja nueva)
const all = readdirSync('src/data/agentImages').filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')).sort();
writeFileSync('src/data/agentImages/index.ts', readFileSync('src/data/agentImages/index.ts', 'utf8')
  .replace(/export interface AgentImage \{[^}]*\}/, 'export interface AgentImage { w: number; h: number; px: number; front: number; back: number; side: number; /** 1 = la primera columna es el reposo y las demás, los pasos. */ idle?: number }'));
console.log('héroes con medidas:', all.length);
