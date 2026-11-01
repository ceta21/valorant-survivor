// Recorta los enemigos y jefes de art/enemigos.png (hoja con 3 filas de 8 bots y 5 jefes) a public/enemies/<id>.png.
// Quita el fondo con un relleno desde los bordes de cada casilla (color parecido al del borde), recorta lo que sobra
// y reduce a la altura de juego. Genera también shots/enemigos-recortados.png para revisarlo.
// Uso: npx tsx scripts/cut-enemies.ts
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';

/** Tipos de bot (columnas) y niveles (filas). */
export const BOT_KINDS = ['soldado', 'arana', 'flotante', 'torreta', 'escudo', 'asesino', 'volador', 'sanador'];
export const TIERS = ['n', 'e', 'l'];   // normal, élite, legendario
export const BOSS_IDS = ['coloso', 'sabio', 'reina', 'elemental', 'dragon'];

const COL_X = [85, 250, 415, 572, 736, 903, 1072, 1229];   // centro de cada columna
const ROW_Y: [number, number][] = [[110, 206], [300, 422], [514, 646]];   // arriba y abajo de cada fila (sin la etiqueta)
const BOSS_X: [number, number][] = [[24, 262], [278, 516], [530, 778], [795, 1033], [1048, 1288]];
const BOSS_Y: [number, number] = [772, 990];
/** Altura final en píxeles de arte (el juego los dibuja a 2 unidades por píxel). */
const H_BOT = [26, 30, 36], H_BOSS = 64;

async function main() {
  const img = await loadImage('art/enemigos.png');
  const src = createCanvas(img.width, img.height), sg = src.getContext('2d');
  sg.drawImage(img, 0, 0);
  const all = sg.getImageData(0, 0, img.width, img.height).data;
  mkdirSync('public/enemies', { recursive: true }); mkdirSync('shots', { recursive: true });
  const out: { id: string; c: any }[] = [];

  const cut = (id: string, x0: number, y0: number, x1: number, y1: number, height: number, tol = 30) => {
    const w = x1 - x0, h = y1 - y0, keep = new Uint8Array(w * h).fill(1);
    const px = (x: number, y: number) => { const i = ((y0 + y) * img.width + x0 + x) * 4; return [all[i], all[i + 1], all[i + 2]]; };
    // color de fondo: el más común del borde
    const border: number[][] = [];
    for (let x = 0; x < w; x++) { border.push(px(x, 0), px(x, h - 1)); }
    for (let y = 0; y < h; y++) { border.push(px(0, y), px(w - 1, y)); }
    const bg = border.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]))[border.length >> 1];
    const near = (c: number[]) => Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]) < tol;
    // relleno desde los bordes
    const st: number[] = [];
    for (let x = 0; x < w; x++) st.push(x, 0, x, h - 1);
    for (let y = 0; y < h; y++) st.push(0, y, w - 1, y);
    while (st.length) {
      const y = st.pop()!, x = st.pop()!;
      if (x < 0 || y < 0 || x >= w || y >= h || !keep[y * w + x] || !near(px(x, y))) continue;
      keep[y * w + x] = 0;
      st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
    // fuera los trozos sueltos muy pequeños (motas, bordes de etiquetas): menos del 1,5 % de la pieza mayor
    const comp = new Int32Array(w * h).fill(-1), sizes: number[] = [];
    for (let i0 = 0; i0 < w * h; i0++) {
      if (!keep[i0] || comp[i0] >= 0) continue;
      const id = sizes.length, q = [i0]; comp[i0] = id; let n = 0;
      while (q.length) { const i = q.pop()!, x = i % w, y = (i / w) | 0; n++;
        for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && keep[j] && comp[j] < 0) { comp[j] = id; q.push(j); } }
      sizes.push(n);
    }
    const big = Math.max(...sizes);
    for (let i = 0; i < w * h; i++) if (keep[i] && sizes[comp[i]] < big * 0.015) keep[i] = 0;
    // recorte al contenido
    let mx = w, my = h, Mx = 0, My = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (keep[y * w + x]) { mx = Math.min(mx, x); my = Math.min(my, y); Mx = Math.max(Mx, x); My = Math.max(My, y); }
    const cw = Mx - mx + 1, ch = My - my + 1;
    const full = createCanvas(cw, ch), fg = full.getContext('2d'), fd = fg.createImageData(cw, ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const k = keep[(y + my) * w + x + mx], c = px(x + mx, y + my), i = (y * cw + x) * 4;
      fd.data[i] = c[0]; fd.data[i + 1] = c[1]; fd.data[i + 2] = c[2]; fd.data[i + 3] = k ? 255 : 0;
    }
    fg.putImageData(fd, 0, 0);
    // reducción por bloques: cada píxel final es la media de su bloque (si más de la mitad es opaco)
    const s = ch / height, ow = Math.max(1, Math.round(cw / s)), oh = height;
    const small = createCanvas(ow, oh), smg = small.getContext('2d'), sd = smg.createImageData(ow, oh);
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      let r = 0, g = 0, b = 0, n = 0, tot = 0;
      for (let yy = Math.floor(y * s); yy < Math.min(ch, Math.floor((y + 1) * s)); yy++) for (let xx = Math.floor(x * s); xx < Math.min(cw, Math.floor((x + 1) * s)); xx++) {
        tot++; const i = (yy * cw + xx) * 4; if (!fd.data[i + 3]) continue; r += fd.data[i]; g += fd.data[i + 1]; b += fd.data[i + 2]; n++;
      }
      const i = (y * ow + x) * 4;
      if (n > tot * 0.45) { sd.data[i] = r / n; sd.data[i + 1] = g / n; sd.data[i + 2] = b / n; sd.data[i + 3] = 255; }
    }
    // contorno oscuro de 1 píxel para que se lea sobre cualquier suelo
    const o = new Uint8ClampedArray(sd.data);
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      const i = (y * ow + x) * 4;
      if (sd.data[i + 3]) continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < ow && Y < oh && sd.data[(Y * ow + X) * 4 + 3]; });
      if (nb) { o[i] = 12; o[i + 1] = 10; o[i + 2] = 18; o[i + 3] = 255; }
    }
    smg.putImageData(new (sd.constructor as any)(o, ow, oh), 0, 0);
    writeFileSync(`public/enemies/${id}.png`, small.toBuffer('image/png'));
    out.push({ id, c: small });
  };

  // recuadros más estrechos donde el vecino invade (el ala del dragón junto al sanador legendario)
  const narrow: Record<string, [number, number]> = { sanador_l: [1186, 1300], flotante_l: [350, 490] };
  TIERS.forEach((tier, r) => BOT_KINDS.forEach((k, c) => { const id = `${k}_${tier}`, [a, b] = narrow[id] ?? [COL_X[c] - 80, COL_X[c] + 80]; cut(id, a, ROW_Y[r][0], b, ROW_Y[r][1], H_BOT[r]); }));
  BOSS_IDS.forEach((id, i) => cut(id, BOSS_X[i][0], BOSS_Y[0], BOSS_X[i][1], BOSS_Y[1], H_BOSS, 26));

  // hoja de revisión (×4)
  const Z = 4, cell = 70 * Z, sheet = createCanvas(8 * cell, 4 * cell + 140), g = sheet.getContext('2d') as any;
  g.fillStyle = '#3a5a34'; g.fillRect(0, 0, sheet.width, sheet.height); g.imageSmoothingEnabled = false;
  out.forEach(({ c }, i) => {
    const col = i < 24 ? i % 8 : (i - 24), row = i < 24 ? Math.floor(i / 8) : 3;
    const w = c.width * Z * (row === 3 ? 0.9 : 1), h = c.height * Z * (row === 3 ? 0.9 : 1);
    g.drawImage(c, col * cell + (cell - w) / 2, row * cell + (cell - h) / 2 + (row === 3 ? 60 : 0), w, h);
  });
  writeFileSync('shots/enemigos-recortados.png', sheet.toBuffer('image/png'));
  console.log('recortados', out.length);
}
main();
