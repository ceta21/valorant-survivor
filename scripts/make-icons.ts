// Genera los iconos de la app (PWA, pestaña, iPhone) a partir de art/LOGO.png. Uso: npx tsx scripts/make-icons.ts
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';

const BG = '#110c1e';   // fondo del juego
const out = 'public/icons';
mkdirSync(out, { recursive: true });
const logo = await loadImage('art/LOGO.png');

/** Icono cuadrado de `size` px; `pad` = margen (los "maskable" lo necesitan porque el móvil recorta en círculo). */
function icon(name: string, size: number, pad = 0) {
  const c = createCanvas(size, size), g = c.getContext('2d');
  g.fillStyle = BG; g.fillRect(0, 0, size, size);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  const s = size * (1 - pad * 2);
  g.drawImage(logo, (size - s) / 2, (size - s) / 2, s, s);
  writeFileSync(`${out}/${name}`, c.toBuffer('image/png'));
  console.log(name, size);
}
icon('icon-512.png', 512);
icon('icon-192.png', 192);
icon('maskable-512.png', 512, 0.1);
icon('apple-touch-icon.png', 180);
icon('favicon-64.png', 64);
icon('favicon-32.png', 32);
