// Recorta los portales de art/portales.webp (hoja de 4×2 dibujos) a public/portals/<zona>.png: el de cada zona es el
// que se ve en los portales que LLEVAN a ella. Quita el fondo con un relleno desde los bordes de cada casilla, recorta
// lo que sobra y reduce. Genera también shots/portales-recortados.png para revisarlo.
// Uso: npx tsx scripts/cut-portals.ts
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';

/** Casilla (columna, fila) de la hoja para cada zona. */
const PICK: Record<string, [number, number]> = { reino: [0, 1], glaciar: [1, 0], infierno: [2, 0], ciudad: [3, 0] };
const HEIGHT = 128;   // alto final en píxeles

const img = await loadImage('art/portales.webp');
const src = createCanvas(img.width, img.height), sg = src.getContext('2d');
sg.drawImage(img, 0, 0);
const all = sg.getImageData(0, 0, img.width, img.height).data;
const CW = img.width / 4, CH = img.height / 2;
mkdirSync('public/portals', { recursive: true }); mkdirSync('shots', { recursive: true });
const done: [string, any][] = [];

for (const [zone, [col, row]] of Object.entries(PICK)) {
  const x0 = Math.round(col * CW), y0 = Math.round(row * CH), w = Math.round(CW), h = Math.round(CH);
  const px = (x: number, y: number) => { const i = ((y0 + y) * img.width + x0 + x) * 4; return [all[i], all[i + 1], all[i + 2]]; };
  const bg = px(2, 2);
  const dist = (c: number[]) => Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]);
  // relleno desde los bordes: fuera todo lo que se parece al fondo y está unido a él
  const keep = new Uint8Array(w * h).fill(1), st: number[] = [];
  for (let x = 0; x < w; x++) st.push(x, 0, x, h - 1);
  for (let y = 0; y < h; y++) st.push(0, y, w - 1, y);
  while (st.length) {
    const y = st.pop()!, x = st.pop()!;
    if (x < 0 || y < 0 || x >= w || y >= h || !keep[y * w + x] || dist(px(x, y)) > 40) continue;
    keep[y * w + x] = 0;
    st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  let mx = w, my = h, Mx = 0, My = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (keep[y * w + x]) { mx = Math.min(mx, x); my = Math.min(my, y); Mx = Math.max(Mx, x); My = Math.max(My, y); }
  const cw = Mx - mx + 1, chh = My - my + 1;
  const cut = createCanvas(cw, chh), cg = cut.getContext('2d'), id = cg.createImageData(cw, chh);
  for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
    const i = ((y0 + my + y) * img.width + x0 + mx + x) * 4, o = (y * cw + x) * 4;
    if (!keep[(my + y) * w + mx + x]) continue;
    // el brillo que se funde con el fondo queda semitransparente en vez de con un borde negro
    const a = Math.min(1, dist([all[i], all[i + 1], all[i + 2]]) / 90);
    id.data[o] = all[i]; id.data[o + 1] = all[i + 1]; id.data[o + 2] = all[i + 2]; id.data[o + 3] = Math.round(255 * a);
  }
  cg.putImageData(id, 0, 0);
  const H = HEIGHT, W = Math.round((cw / chh) * H);
  const out = createCanvas(W, H), og = out.getContext('2d');
  og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
  og.drawImage(cut, 0, 0, W, H);
  writeFileSync(`public/portals/${zone}.png`, out.toBuffer('image/png'));
  console.log(zone, `${W}×${H}`, `(recorte ${cw}×${chh})`);
  done.push([zone, out]);
}
// hoja para revisar, sobre un suelo de hierba
const sheet = createCanvas(done.length * 180, 180), sh = sheet.getContext('2d');
sh.fillStyle = '#3f7a3a'; sh.fillRect(0, 0, sheet.width, sheet.height);
done.forEach(([, c], i) => sh.drawImage(c, i * 180 + (180 - c.width) / 2, 26));
writeFileSync('shots/portales-recortados.png', sheet.toBuffer('image/png'));
