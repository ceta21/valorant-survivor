// Referencias para generar hojas nuevas de los héroes (ver art/heroes-nuevos/GUIA.md): por héroe, sus 3 vistas actuales
// (frente, espalda, perfil) ampliadas sin suavizado sobre el fondo plano que se pide en las hojas nuevas.
// Uso: npx tsx scripts/hero-references.ts → art/heroes-nuevos/referencias/<id>.png
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { AGENT_IMAGES } from '../src/data/agentImages';

const BG = '#1a1424', Z = 4, GAP = 40, OUT = 'art/heroes-nuevos/referencias';
mkdirSync(OUT, { recursive: true });
for (const [id, A] of Object.entries(AGENT_IMAGES)) {
  const img = await loadImage(`public/agents/${id}.webp`);
  const c = createCanvas(3 * A.w * Z + 4 * GAP, A.h * Z + 2 * GAP), g = c.getContext('2d');
  g.fillStyle = BG; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false;
  for (let row = 0; row < 3; row++) g.drawImage(img, 0, row * A.h, A.w, A.h, GAP + row * (A.w * Z + GAP), GAP, A.w * Z, A.h * Z);
  writeFileSync(`${OUT}/${id}.png`, c.toBuffer('image/png'));
  console.log(id, `${c.width}×${c.height}`);
}
