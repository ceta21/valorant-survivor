// Hoja para revisar los bots dibujados por código: cada nivel en sus 3 vistas y 4 fotogramas, junto al dibujo
// original recortado de art/enemigos.png. Uso: npx tsx scripts/bot-sheet.ts [tipo]  → shots/bots-<tipo>.png
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
import { botSprite, BotDir } from '../src/game/botSprites';
const kind = process.argv[2] ?? 'soldado', boss = ['coloso', 'sabio', 'reina', 'elemental', 'dragon'].includes(kind), Z = boss ? 4 : 6, make = (w: number, h: number) => createCanvas(w, h) as any;
(async () => {
  const dirs: BotDir[] = ['front', 'side', 'back'], cw = (boss ? 56 : 30) * Z, ch = (boss ? 46 : 32) * Z, rows = boss ? 1 : 3;
  const sheet = createCanvas(cw * 13, ch * rows + 40), g = sheet.getContext('2d') as any;
  g.fillStyle = '#3e6a34'; g.fillRect(0, 0, sheet.width, sheet.height); g.imageSmoothingEnabled = false;
  for (let tier = 0; tier < rows; tier++) {
    const ref = await loadImage(boss ? `public/enemies/${kind}.png` : `public/enemies/${kind}_${'nel'[tier]}.png`);
    g.drawImage(ref, 10, tier * ch + 20, ref.width * Z * 0.8, ref.height * Z * 0.8);
    dirs.forEach((d, di) => { for (let f = 0; f < 4; f++) {
      const s = botSprite(kind, tier, d, f, 'n', make);
      g.drawImage(s, cw * (1 + di * 4 + f), tier * ch + 20, s.width * Z, s.height * Z);
    } });
  }
  writeFileSync(`shots/bots-${kind}.png`, sheet.toBuffer('image/png'));
  console.log('ok');
})();
