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

// Imagen para compartir el enlace (WhatsApp, Discord, X…): 1200×630, el logo sobre su propio fondo desenfocado
{
  const W = 1200, H = 630, c = createCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = BG; g.fillRect(0, 0, W, H);
  g.filter = 'blur(28px) brightness(0.45) saturate(1.3)';
  g.drawImage(logo, 0, (H - W) / 2, W, W);
  g.filter = 'none';
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7);
  v.addColorStop(0, 'rgba(17,12,30,0)'); v.addColorStop(1, 'rgba(17,12,30,0.85)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  const s = 590;
  g.shadowColor = 'rgba(155,92,255,0.6)'; g.shadowBlur = 40;
  g.drawImage(logo, (W - s) / 2, (H - s) / 2, s, s);
  writeFileSync('public/og.jpg', c.toBuffer('image/jpeg', 82));   // JPEG: WhatsApp no enseña vistas previas de más de ~300 KB
  console.log('og.jpg', W, H);
}

// Logo redondo para la pantalla de entrada y el menú: recorte circular con el borde difuminado (sin fondo cuadrado)
for (const size of [320, 128]) {
  const c = createCanvas(size, size), g = c.getContext('2d');
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(logo, 0, 0, size, size);
  g.globalCompositeOperation = 'destination-in';
  const m = g.createRadialGradient(size / 2, size / 2, size * 0.38, size / 2, size / 2, size * 0.5);
  m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = m; g.fillRect(0, 0, size, size);
  writeFileSync(`${out}/logo-${size}.png`, c.toBuffer('image/png'));
  console.log(`logo-${size}.png`);
}
