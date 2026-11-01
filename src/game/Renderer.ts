import { elemLook, GameEngine, Enemy } from './GameEngine';
import { MapDef } from './types';
import { POWERS } from '../data/powers';
import { spriteCanvas, spriteSize, preloadAgentSheets, agentSkin, IDLE, WALK, RUN, CAST, Pose, Dir } from './sprites';
import { renderChunk, treeSprite, CPX, U } from './MapArt';
import { enemyArt, enemyFlash } from './enemyArt';
import { botSprite, hasBotSprite } from './botSprites';
import { Cell, CN, hash2 } from './World';
import { CS } from './World';
import { petCanvas, PW, PH } from './petSprites';
import { MAPS } from '../data/maps';
import { t } from '../i18n';
import { enemyCore, enemyKind, enemySprite, isBossKind } from './enemySprites';
import { WEB_LAND } from './GameEngine';
import { portalArt } from './enemyArt';
/** Alto con el que se pinta el portal y a qué altura de su dibujo cae el centro del remolino (0 arriba, 1 abajo). */
const PORTAL_H = 180, PORTAL_CY = 0.5;
import { PAL, drawSprite, pixelBeam, pixelBlast, pixelBolt, pixelCircle, pixelCone, pixelField, pixelLine, pixelRay, snapAng, sprite } from './vfx';

type Ctx = CanvasRenderingContext2D;
type MakeCanvas = (w: number, h: number) => any;

/** Unidades de mundo por píxel de juego (los sprites de personaje quedan 1:1). */
export const PX = 2;
/** Escala de los proyectiles y objetos lanzados (poderes, bombas, cohetes): se ven el doble de grandes. */
const BIG = PX * 2;
const PIXEL_FONT = '"Press Start 2P", monospace';
const OUTLINE = [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]];

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** Dibuja el juego en un canvas 2D. No contiene lógica de juego. */
export class Renderer {
  private ctx: Ctx;
  private makeCanvas: MakeCanvas;
  private chunkCache = new Map<string, any>();
  private gemCache = new Map<string, any>();
  private chunkWorld: unknown = null;
  private vignette: any = null;
  private vw = 0;
  private vh = 0;
  zoom = 1;
  dpr = 1;
  camX = 0;
  camY = 0;
  shake = true;

  constructor(ctx: Ctx, makeCanvas: MakeCanvas) {
    this.ctx = ctx;
    this.makeCanvas = makeCanvas;
    preloadAgentSheets();
  }

  /** Cristal de experiencia, cruz de curación o premio de caja (imán, bomba, moneda) en pixel art, con contorno y brillo. */
  private gemSprite(tier: string) {
    let c = this.gemCache.get(tier);
    if (c) return c;
    const PALS: Record<string, string[]> = {        // contorno, oscuro, medio, claro, brillo
      blue: ['#0b1a2a', '#1f6f9f', '#4fd0ff', '#bfeaff', '#ffffff'],
      green: ['#0b2018', '#1a8a5a', '#3fe0a0', '#c8ffe8', '#ffffff'],
      gold: ['#2a1a06', '#b07a14', '#ffd24a', '#fff2b0', '#ffffff'],
      epic: ['#1a0a2a', '#6a2aa8', '#c070ff', '#f0d0ff', '#ffffff'],
      heal: ['#0b2018', '#1f8a3a', '#5dff9a', '#d8ffe0', '#ffffff'],
      magnet: ['#1a0a0a', '#8a1a1a', '#e0303a', '#ff8a8a', '#ffffff'],
      bomb: ['#000000', '#1a1a22', '#3a3a48', '#7a7a8a', '#ff8a1c'],
      coin: ['#2a1a06', '#b07a14', '#ffd24a', '#fff2b0', '#ffffff'],
    };
    const crystal = ['....O....', '...OWO...', '..OLWMO..', '.OLLWMMO.', 'OLLLWMMDO', 'OLLLMMMDO', '.OLLMMDO.', '..OLMDO..', '..OMMDO..', '...ODO...', '....O....'];
    const big = ['.....O.....', '....OWO....', '...OLWMO...', '..OLLWMMO..', '.OLLLWMMDO.', 'OLLLLWMMMDO', 'OLLLLMMMMDO', '.OLLLMMMDO.',
      '..OLLMMDO..', '..OLMMMDO..', '...OMMDO...', '...OMDDO...', '....ODO....', '.....O.....'];
    const cross = ['...OOO...', '...OWO...', 'OOOOLOOOO', 'OWLLLMMMO', 'OOOOMOOOO', '...OMO...', '...OMO...', '...ODO...', '...OOO...'];
    const magnet = ['OOO...OOO', 'OWO...OWO', 'OMO...OMO', 'OMO...OMO', 'OMMOOOMMO', 'OLMMMMMDO', '.OLMMMDO.', '..OOOOO..'];
    const bomb = ['.....OO..', '....OW.O.', '...OO....', '..ODDDO..', '.ODLMMDO.', 'ODLLMMMDO', 'ODMMMMMDO', 'ODMMMMMDO', '.ODMMMDO.', '..OOOOO..'];
    const coin = ['..OOOOO..', '.OLWWLMO.', 'OLWLMMMDO', 'OLLMDMMDO', 'OLMDDDMDO', 'OLMMDMMDO', 'OMMMMMDDO', '.OMDDDDO.', '..OOOOO..'];
    const rows = tier === 'heal' ? cross : tier === 'magnet' ? magnet : tier === 'bomb' ? bomb : tier === 'coin' ? coin : tier === 'epic' || tier === 'gold' ? big : crystal;
    const [o, d, m, l, w] = PALS[tier], pal: Record<string, string> = { O: o, D: d, M: m, L: l, W: w };
    c = this.makeCanvas(rows[0].length * PX, rows.length * PX);
    const cg = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { cg.fillStyle = pal[ch]; cg.fillRect(x * PX, y * PX, PX, PX); } }));
    this.gemCache.set(tier, c);
    return c;
  }
  /** Caja de madera con bandas de hierro, cerradura dorada y un cristal morado de la grieta en la tapa. */
  private crateSprite(hit: boolean) {
    const key = hit ? 'crate-hit' : 'crate';
    let c = this.gemCache.get(key);
    if (c) return c;
    const rows = ['.OOOOOOOOOO.', 'OLLLLPPLLLLO', 'OMMMPWWPMMMO', 'OIIIIPPIIIIO', 'OMDMMMMMMDMO', 'OMDMMMMMMDMO', 'OIIIIGGIIIIO', 'OMDMMGGMMDMO', 'OMDMMMMMMDMO', 'ODDDDDDDDDDO', '.OOOOOOOOOO.'];
    const pal: Record<string, string> = hit
      ? { O: '#ffffff', L: '#ffffff', M: '#ffffff', D: '#e6e6e6', I: '#ffffff', P: '#ffffff', W: '#ffffff', G: '#ffffff' }
      : { O: '#1a0e08', L: '#c9894a', M: '#a0602a', D: '#6a3a18', I: '#4a4a58', P: '#9b5cff', W: '#e2c4ff', G: '#ffd24a' };
    const S = PX * 2;
    c = this.makeCanvas(rows[0].length * S, rows.length * S);
    const cg = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { cg.fillStyle = pal[ch]; cg.fillRect(x * S, y * S, S, S); } }));
    this.gemCache.set(key, c);
    return c;
  }
  /** Estela de cometa detrás de un proyectil: halo suave y 6 cuadrados que se estrechan, oscurecen y tiemblan. */
  private drawComet(g: Ctx, x: number, y: number, dx: number, dy: number, pal: string, r: number, t: number) {
    const ramp = PAL[pal] ?? PAL.fire;
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = hexA(ramp[2], 0.2); g.beginPath(); g.arc(x, y, 14 + r, 0, 7); g.fill();
    g.globalCompositeOperation = 'source-over';
    const nx = -dy, ny = dx;
    for (let i = 1; i <= 6; i++) {
      const sz = Math.max(1, 6 - i) * PX, wob = Math.sin(t * 40 + i * 1.7) * i * 0.8, d = 8 + i * 7;
      g.fillStyle = ramp[Math.max(0, 4 - Math.ceil(i * 0.75))];
      g.fillRect(Math.round((x + dx * d + nx * wob) / PX) * PX - sz / 2, Math.round((y + dy * d + ny * wob) / PX) * PX - sz / 2, sz, sz);
    }
  }
  /** Sprite de disco con la gama de un color (oscuro → claro), guardado en caché. */
  private tinted(kind: 'disc', color: string) {
    const key = kind + color;
    let c = this.gemCache.get(key);
    if (c) return c;
    const rows = ['...OO....', '...OLO...', 'OO.OLMO..', 'OLOOWMOOO', '.OMWWWMLO', 'OOOMWOOOO', '..OMLO.OO', '...OLO...', '....OO...'];
    const pal: Record<string, string> = { O: shade(color, -0.75), D: shade(color, -0.35), M: color, L: shade(color, 0.45), W: '#ffffff' };
    c = this.makeCanvas(rows[0].length, rows.length);
    const cg = c.getContext('2d');
    rows.forEach((r, yy) => [...r].forEach((ch, xx) => { if (pal[ch]) { cg.fillStyle = pal[ch]; cg.fillRect(xx, yy, 1, 1); } }));
    this.gemCache.set(key, c);
    return c;
  }
  /** Halo del color del cristal (degradado radial ya pintado, para no recalcularlo por gema). */
  private gemGlow(tier: string) {
    const key = 'glow-' + tier;
    let c = this.gemCache.get(key);
    if (c) return c;
    const col = { blue: '79,208,255', green: '63,224,160', gold: '255,210,74', epic: '192,112,255', heal: '93,255,154', magnet: '255,80,90', bomb: '255,140,40', coin: '255,210,74', crate: '192,112,255' }[tier] ?? '255,255,255';
    c = this.makeCanvas(64, 64);
    const cg = c.getContext('2d'), gr = cg.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, `rgba(${col},1)`); gr.addColorStop(0.25, `rgba(${col},0.6)`); gr.addColorStop(0.6, `rgba(${col},0.18)`); gr.addColorStop(1, `rgba(${col},0)`);
    cg.fillStyle = gr; cg.fillRect(0, 0, 64, 64);
    this.gemCache.set(key, c);
    return c;
  }

  /** w,h = tamaño CSS del lienzo. Devuelve el tamaño de vista en unidades del mundo. */
  resize(w: number, h: number) {
    this.zoom = Math.max(0.6, Math.min(1.25, Math.min(w / 1100, h / 640)));
    this.vw = w; this.vh = h;
    this.vignette = null;
    return { w: w / this.zoom, h: h / this.zoom };
  }

  /** Modo pixel-art: w,h = tamaño del lienzo en píxeles de juego (cada uno = PX unidades de mundo). */
  /** Calidad baja: sin animaciones del mapa (agua, lava, árboles…) ni polvo ambiental. */
  low = false;
  resizePixels(w: number, h: number) {
    this.dpr = 1;
    this.zoom = 1 / PX;
    this.vw = w; this.vh = h;
    this.vignette = null;
    return { w: w * PX, h: h * PX };
  }

  /** Chunk pixel-art ya dibujado (caché LRU: los que salen de pantalla se descartan). */
  private chunkCanvas(e: GameEngine, cx: number, cy: number) {
    if (this.chunkWorld !== e.world) { this.chunkCache.clear(); this.chunkWorld = e.world; }
    const k = `${cx},${cy}`;
    let c = this.chunkCache.get(k);
    if (c) { this.chunkCache.delete(k); this.chunkCache.set(k, c); return c; }
    c = renderChunk(e.world, e.world.chunk(cx, cy), this.makeCanvas);
    this.chunkCache.set(k, c);
    if (this.chunkCache.size > 36) this.chunkCache.delete(this.chunkCache.keys().next().value as string);
    return c;
  }

  /** Árbol con balanceo (sway −1, 0, 1), guardado en caché por zona, tamaño y fotograma. */
  private treeCanvas(zone: string, rad: number, sway: number) {
    const k = `tree|${zone}|${rad}|${sway}`;
    let c = this.gemCache.get(k);
    if (!c) { c = treeSprite(zone, rad, sway, this.makeCanvas); this.gemCache.set(k, c); }
    return c;
  }
  /** Lo que se mueve en un chunk: se dibuja cada fotograma encima del chunk ya pintado (1 píxel de arte = U unidades). */
  private drawLiveChunk(g: Ctx, e: GameEngine, cx: number, cy: number) {
    const ch = e.world.chunk(cx, cy);
    if (ch.zone < 0) return;
    const t = e.time, ox = cx * CS, oy = cy * CS, zone = MAPS[ch.zone].id;
    const px = (x: number, y: number, w: number, h: number) => g.fillRect(ox + x * U, oy + y * U, w * U, h * U);   // en píxeles de arte
    // agua: destellos que se desplazan con la corriente; lava: brillo que late y burbujas que revientan
    g.globalCompositeOperation = 'lighter';
    for (let j = 0; j < CN; j++) for (let i = 0; i < CN; i++) {
      const c = ch.cells[j * CN + i];
      if (c !== Cell.Water && c !== Cell.Sea && c !== Cell.Lava) continue;
      const h = hash2(cx * CN + i, cy * CN + j, 917), x = i * 8, y = j * 8;
      if (c === Cell.Lava) {
        g.fillStyle = `rgba(255,120,30,${(0.05 + 0.05 * Math.sin(t * 2.2 + h * 9)).toFixed(3)})`; px(x, y, 8, 8);
        if (h > 0.72) {   // burbuja: crece 1,2 s y revienta
          const k = (t * 0.8 + h * 7) % 1.6;
          if (k < 1.2) { const r = 1 + Math.floor(k * 2); g.fillStyle = 'rgba(255,230,140,0.55)'; px(x + 3, y + 4 - r, r, r); }
          else { g.fillStyle = 'rgba(255,240,180,0.6)'; px(x + 1, y + 2, 1, 1); px(x + 5, y + 2, 1, 1); px(x + 3, y, 1, 1); }
        }
      } else if (h > 0.35) {
        // reflejo de 3 píxeles que avanza por la celda (la corriente va hacia la derecha y un poco hacia abajo)
        const k = (t * (c === Cell.Sea ? 3 : 4.5) + h * 8) % 8, a = 0.18 + 0.12 * Math.sin(t * 3 + h * 6);
        g.fillStyle = `rgba(200,240,255,${a.toFixed(3)})`; px(x + Math.floor(k), y + 2 + Math.floor(h * 4), 3, 1);
        if (h > 0.8 && Math.sin(t * 4 + h * 20) > 0.7) { g.fillStyle = 'rgba(255,255,255,0.7)'; px(x + Math.floor(h * 6), y + 5, 1, 1); }   // destello
      }
    }
    // fuente: ondas que se abren desde el centro y salpicaduras
    for (const d of ch.deco) {
      if (d.type !== 'fountain') continue;
      const lx = Math.round((d.x - ox) / U), ly = Math.round((d.y - oy) / U), R = Math.round(d.rx / U) - 6;
      for (let w = 0; w < 2; w++) {
        const k = ((t * 0.5 + w * 0.5) % 1), rr = 6 + Math.round(k * (R - 6));
        g.fillStyle = `rgba(220,250,255,${(0.35 * (1 - k)).toFixed(3)})`;
        for (let a = 0; a < 24; a++) { const an = (a / 24) * Math.PI * 2; px(Math.round(lx + Math.cos(an) * rr), Math.round(ly + Math.sin(an) * rr * 0.8), 1, 1); }
      }
      if (Math.sin(t * 6) > 0) { g.fillStyle = 'rgba(255,255,255,0.6)'; px(lx - 3, ly - 15 - Math.round(Math.abs(Math.sin(t * 6)) * 2), 1, 1); px(lx + 3, ly - 14, 1, 1); }
    }
    // fuegos: hogueras, braseros y farolas parpadean
    for (const d of ch.deco) {
      if (d.type !== 'campfire' && d.type !== 'brazier' && d.type !== 'lamp') continue;
      const lx = Math.round((d.x - ox) / U), ly = Math.round((d.y - oy) / U), f = Math.sin(t * 11 + d.x) + Math.sin(t * 17 + d.y);
      if (d.type === 'lamp') { g.fillStyle = `rgba(255,200,110,${(0.35 + 0.15 * f).toFixed(3)})`; px(lx - 1, ly - 7, 2, 1); continue; }
      const big = d.type === 'brazier' && d.rx > 40, hgt = (big ? 6 : 3) + Math.round(f), w = big ? 5 : 2;
      g.fillStyle = 'rgba(255,138,28,0.75)'; px(lx - w, ly - hgt - (big ? 2 : 4), w * 2, hgt);
      g.fillStyle = 'rgba(255,224,90,0.8)'; px(lx - (w >> 1), ly - hgt - (big ? 1 : 3), Math.max(1, w), Math.max(1, hgt - 2));
      if (((t * 6 + d.x) | 0) % 3 === 0) { g.fillStyle = 'rgba(255,200,80,0.8)'; px(lx + ((t * 13 + d.y) % 5 | 0) - 2, ly - hgt - 6 - ((t * 20) % 4 | 0), 1, 1); }   // chispa
    }
    g.globalCompositeOperation = 'source-over';
    // aspas del molino: giran despacio
    for (const d of ch.deco) {
      if (d.type !== 'windmill') continue;
      const lx = Math.round((d.x - ox) / U), ly = Math.round((d.y - oy) / U) - 5, R = Math.round(d.rx / U) + 3;
      for (let b = 0; b < 4; b++) {
        const a = t * 0.9 + (b * Math.PI) / 2, c = Math.cos(a), sn = Math.sin(a);
        for (let k = 4; k < R; k++) {
          const x = Math.round(lx + c * k), y = Math.round(ly + sn * k);
          g.fillStyle = '#14110f'; px(x - 1, y - 1, 3, 3);
          g.fillStyle = k % 4 ? '#e8dcc0' : '#6a4a2a'; px(x, y, 2, 2);
        }
      }
      g.fillStyle = '#14110f'; px(lx - 3, ly - 3, 7, 7); g.fillStyle = '#6a4a2a'; px(lx - 2, ly - 2, 5, 5);
    }
    // árboles: la copa se mece con el viento (3 fotogramas), cada uno con su ritmo
    for (const o of ch.obstacles) {
      if (o.k !== 'a') continue;
      const ow = Math.max(2, Math.round(o.w / U)), oh = Math.max(2, Math.round(o.h / U));
      const bx = Math.round((o.x - ox) / U) + (ow >> 1), by = Math.round((o.y - oy) / U) + oh - 2;
      const sway = Math.round(Math.sin(t * 1.7 + o.x * 0.013 + o.y * 0.007) * 1.2);
      const spr = this.treeCanvas(zone, ow >> 1, Math.max(-1, Math.min(1, sway)));
      g.drawImage(spr, ox + (bx - (spr.width >> 1)) * U, oy + (by - (spr.height - 2)) * U, spr.width * U, spr.height * U);
    }
  }

  render(e: GameEngine) {
    e.sync();
    const g = this.ctx;
    const z = this.zoom;
    const vw = this.vw / z, vh = this.vh / z;
    const p = e.player;
    this.camX = p.x - vw / 2;
    this.camY = p.y - vh / 2;
    let sx = 0, sy = 0;
    if (this.shake && e.shakeT > 0) { const m = Math.min(1, e.shakeT * 5) * 6; sx = (Math.random() - 0.5) * m; sy = (Math.random() - 0.5) * m; }
    // cámara alineada a la rejilla de píxeles: el mundo no "tiembla" al moverse
    const cx = Math.round((this.camX + sx) * z) / z, cy = Math.round((this.camY + sy) * z) / z;

    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.fillStyle = '#0a0e13'; g.fillRect(0, 0, this.vw, this.vh);
    g.save();
    g.scale(z, z);
    g.translate(-cx, -cy);
    // mundo infinito: se dibujan solo los chunks visibles (nearest-neighbor => look pixelado)
    g.imageSmoothingEnabled = false;
    const c0x = Math.floor(cx / CS), c1x = Math.floor((cx + vw) / CS), c0y = Math.floor(cy / CS), c1y = Math.floor((cy + vh) / CS);
    for (let j = c0y; j <= c1y; j++) for (let i = c0x; i <= c1x; i++) {
      g.drawImage(this.chunkCanvas(e, i, j), 0, 0, CPX, CPX, i * CS, j * CS, CS + 1, CS + 1);
    }
    // mapa vivo: agua y lava que se mueven, árboles que se balancean, fuegos que parpadean y aspas que giran
    if (!this.low) for (let j = c0y; j <= c1y; j++) for (let i = c0x; i <= c1x; i++) this.drawLiveChunk(g, e, i, j);

    const L = cx - 60, T = cy - 60, R = cx + vw + 60, B = cy + vh + 60;
    const vis = (x: number, y: number, r = 0) => x + r > L && x - r < R && y + r > T && y - r < B;

    // portales entre zonas: el arco dibujado de la zona a la que llevan (verde → Reino, hielo → Glaciar, fuego →
    // Infierno, tecnológico → Ciudad), con un resplandor que late y chispas que giran en el remolino
    for (const pt of e.world.portals) {
      if (!vis(pt.x, pt.y, PORTAL_H)) continue;
      const col = MAPS[pt.to].colors.accent, ph = e.time;
      const pulse = 0.75 + 0.25 * Math.sin(ph * 2.4 + pt.x * 0.01);
      g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(pt.x, pt.y, 4, pt.x, pt.y, 90);
      gr.addColorStop(0, hexA(col, 0.4 * pulse)); gr.addColorStop(1, hexA(col, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(pt.x, pt.y, 90, 0, 7); g.fill();
      g.globalCompositeOperation = 'source-over';
      const art = portalArt(MAPS[pt.to].id);
      if (art) {
        const H = PORTAL_H, W = (art.width / art.height) * H;
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(pt.x, pt.y + H * 0.36, W * 0.42, 14, 0, 0, 7); g.fill();
        g.drawImage(art as any, Math.round(pt.x - W / 2), Math.round(pt.y - H * PORTAL_CY), Math.round(W), Math.round(H));
        // remolino vivo: chispas que giran dentro del arco
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.7 * pulse;
        pixelCircle(g, pt.x, pt.y - 4, 26, '#ffffff', PX, 2, -ph * 2.2);
        pixelCircle(g, pt.x, pt.y - 4, 14, col, PX, 2, ph * 3);
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        continue;
      }
      // sin dibujo (cargando o capturas): anillo de piedra con runas y remolino de energía dentro
      pixelCircle(g, pt.x, pt.y, 56, '#14102a', PX, 99);
      pixelCircle(g, pt.x, pt.y, 52, '#6a6e80', PX, 99);
      pixelCircle(g, pt.x, pt.y, 52, col, PX, 1, ph * 0.5);
      pixelCircle(g, pt.x, pt.y, 42, '#1a1030', PX, 99);
      pixelCircle(g, pt.x, pt.y, 38, col, PX, 3, ph * 1.5);
      pixelCircle(g, pt.x, pt.y, 28, '#ffffff', PX, 2, -ph * 2.2);
      pixelCircle(g, pt.x, pt.y, 18, col, PX, 2, ph * 3);
      pixelCircle(g, pt.x, pt.y, 8, '#ffffff', PX, 1, -ph * 4);
    }
    // cajas rompibles: madera con herrajes y un cristal de la grieta que brilla; parpadean en blanco al golpearlas
    for (const c of e.crates) {
      if (c.dead || !vis(c.x, c.y)) continue;
      const spr = this.crateSprite(c.flash > 0), cx = Math.round(c.x / PX) * PX, cy = Math.round(c.y / PX) * PX;
      const glow = this.gemGlow('crate'), pulse = 0.6 + 0.4 * Math.sin(e.time * 3 + c.id);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(cx - 22, cy + spr.height / 2 - 4, 44, 6);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 * pulse;
      g.drawImage(glow, cx - 40, cy - 40, 80, 80);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.drawImage(spr, cx - spr.width / 2, cy - spr.height / 2);
      if (c.hp < c.max) {
        g.fillStyle = '#000'; g.fillRect(cx - 18, cy - spr.height / 2 - 8, 36, 4);
        g.fillStyle = '#ffd24a'; g.fillRect(cx - 17, cy - spr.height / 2 - 7, Math.max(0, 34 * (c.hp / c.max)), 2);
      }
    }
    // gemas: cristales pixel art con halo que late y un destello de vez en cuando
    g.imageSmoothingEnabled = false;
    for (const m of e.gems) {
      if (!vis(m.x, m.y)) continue;
      const tier = m.kind === 1 ? 'heal' : m.kind === 2 ? 'magnet' : m.kind === 3 ? 'bomb' : m.kind === 4 ? 'coin' : m.v > 10 ? 'epic' : m.v > 4 ? 'gold' : m.v > 1.5 ? 'green' : 'blue';
      const lift = Math.round((m.z ?? 0) / PX) * PX;   // premio de caja en el aire
      const bob = lift ? 0 : Math.round(Math.sin(m.t * 5) * 1.5), ph = m.x * 0.13 + m.y * 0.07;
      const gx = Math.round(m.x / PX) * PX, gy = Math.round(m.y / PX) * PX + bob - lift;
      // halo luminoso (suma luz)
      const glow = this.gemGlow(tier), pulse = 0.75 + 0.25 * Math.sin(e.time * 4 + ph), gs = (tier === 'epic' || tier === 'gold' || m.kind >= 2 ? 30 : 22) * (0.9 + 0.1 * pulse);
      const spr = this.gemSprite(tier);
      g.fillStyle = 'rgba(0,0,0,0.35)'; const sw = m.box ? 14 : 8; g.fillRect(gx - sw / 2, gy - bob + lift + (spr.height * (m.kind >= 1 ? 2 : 1)) / 2, sw, m.box ? 3 : 2);   // sombra en el suelo
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = pulse;
      g.drawImage(glow, gx - gs, gy - gs, gs * 2, gs * 2);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      const sc = m.kind >= 1 ? 2 : 1;   // curación y premios de las cajas, al doble para que se vean
      g.drawImage(spr, gx - (spr.width * sc) / 2, gy - (spr.height * sc) / 2, spr.width * sc, spr.height * sc);
      // destello: una cruz blanca que aparece un instante
      if (((e.time * 0.7 + ph) % 1) < 0.12) {
        const sx = gx + 4, sy = gy - spr.height / 2 + 2;
        g.fillStyle = '#ffffff';
        g.fillRect(sx - 1, sy - 5, 2, 10); g.fillRect(sx - 5, sy - 1, 10, 2);
      }
    }
    // marcas de impacto de ataques de área
    for (const s of e.strikes) {
      if (!vis(s.x, s.y, s.r) && !vis(s.ox, s.oy, 40)) continue;
      const k = s.t / s.dur;
      if (s.fx === 'orbital') {
        // retícula que se cierra y parpadea más rápido al acercarse el impacto
        const blink = Math.floor(e.time * (6 + k * 18)) % 2 === 0;
        g.globalAlpha = 0.5 + k * 0.5;
        pixelCircle(g, s.x, s.y, s.r * (1.1 - 0.2 * k), blink ? '#ff9f3d' : '#ffe0a0', PX, 4, e.time * 2);
        g.globalAlpha = 1;
        pixelCircle(g, s.x, s.y, s.r * 0.35 * (1 - k * 0.5), '#ff9f3d', PX, 1, -e.time * 3);
        pixelLine(g, s.x - 10, s.y, s.x + 10, s.y, '#ffe0a0', PX); pixelLine(g, s.x, s.y - 10, s.x, s.y + 10, '#ffe0a0', PX);
        if (k > 0.75) { g.globalAlpha = (k - 0.75) * 2.4; pixelBeam(g, s.x, s.y, 10, 0, 'orbital', e.time, PX); g.globalAlpha = 1; }
      } else if (s.fx === 'grenade' || s.fx === 'rocket') {
        pixelCircle(g, s.x, s.y, s.r, Math.floor(e.time * 10) % 2 ? '#ffb02e' : '#ff6a1c', PX, 2);
        // vuelo en parábola desde donde se lanzó
        const h = Math.sin(k * Math.PI) * (s.fx === 'rocket' ? 120 : 70);
        const fx = s.ox + (s.x - s.ox) * k, fy = s.oy + (s.y - s.oy) * k - h;
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(Math.round((s.ox + (s.x - s.ox) * k) / PX) * PX - 12, Math.round((s.oy + (s.y - s.oy) * k) / PX) * PX, 24, 6);
        if (s.fx === 'grenade') drawSprite(g, sprite('grenade', 'boom', this.makeCanvas), fx, fy, BIG, Math.floor(k * 8) * (Math.PI / 2));
        else {
          const k2 = Math.min(1, k + 0.02), h2 = Math.sin(k2 * Math.PI) * 120;
          const ang = Math.atan2(s.oy + (s.y - s.oy) * k2 - h2 - fy, s.ox + (s.x - s.ox) * k2 - fx);
          for (let i = 1; i <= 3; i++) {
            g.fillStyle = PAL.fire[4 - i];
            g.fillRect(Math.round((fx - Math.cos(ang) * (30 + i * 9)) / PX) * PX - 4, Math.round((fy - Math.sin(ang) * (30 + i * 9)) / PX) * PX - 4, 8, 8);
          }
          drawSprite(g, sprite('rocket', 'fire', this.makeCanvas), fx, fy, BIG, ang);
        }
      } else {
        g.globalAlpha = 0.5 + k * 0.5;
        pixelCircle(g, s.x, s.y, s.r, Math.floor(e.time * (6 + k * 14)) % 2 ? s.color : '#ffffff', PX, 2, e.time);
        pixelCircle(g, s.x, s.y, Math.max(6, s.r * k), s.color, PX, 1, -e.time * 2);
        g.globalAlpha = 1;
      }
    }
    // peligros de los jefes: telarañas (frenan) y rayos que avisan antes de caer
    for (const h of e.hazards) {
      if (h.dead || !vis(h.x, h.y, h.r + 10)) continue;
      if (h.kind === 'web') {
        const land = Math.min(1, h.t / WEB_LAND), fade = Math.min(1, (h.dur - h.t) / 0.6), r = h.r * (0.4 + 0.6 * land);
        if (land < 1) { pixelCircle(g, h.x, h.y, h.r, Math.floor(e.time * 14) % 2 ? '#e6e9ee' : '#9ab0c8', PX, 1, e.time); continue; }
        g.globalAlpha = 0.75 * fade; g.strokeStyle = '#e6e9ee'; g.lineWidth = 2;
        g.fillStyle = 'rgba(230,233,238,0.12)'; g.beginPath(); g.arc(h.x, h.y, r, 0, 7); g.fill();
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + h.x; g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(h.x + Math.cos(a) * r, h.y + Math.sin(a) * r); g.stroke(); }
        for (const k of [0.33, 0.62, 0.9]) {
          g.beginPath();
          for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI * 2 + h.x, x = h.x + Math.cos(a) * r * k, y = h.y + Math.sin(a) * r * k; i ? g.lineTo(x, y) : g.moveTo(x, y); }
          g.stroke();
        }
        g.globalAlpha = 1;
      } else {
        const k = Math.min(1, h.t / h.dur);
        g.globalAlpha = 0.4 + 0.6 * k;
        pixelCircle(g, h.x, h.y, h.r, Math.floor(e.time * (6 + k * 18)) % 2 ? '#2fe6ff' : '#ffffff', PX, 2, e.time);
        g.globalAlpha = 0.15 + 0.25 * k; g.fillStyle = '#2fe6ff'; g.beginPath(); g.arc(h.x, h.y, h.r * k, 0, 7); g.fill();
        g.globalAlpha = 1;
      }
    }
    // obuses de los Artilleros: zona de impacto que parpadea más rápido y el proyectil volando
    for (const s of e.shells) {
      if (s.dead || !vis(s.x, s.y, s.r + 140)) continue;
      const k = Math.min(1, s.t / s.dur);
      g.globalAlpha = 0.35 + 0.65 * k;
      pixelCircle(g, s.x, s.y, s.r * (1.15 - 0.15 * k), Math.floor(e.time * (5 + k * 16)) % 2 ? '#ff4655' : '#ffb02e', PX, 2, e.time);
      g.globalAlpha = 0.18 + 0.2 * k; g.fillStyle = '#ff4655';
      g.beginPath(); g.arc(s.x, s.y, s.r * k, 0, 7); g.fill();
      g.globalAlpha = 1;
      const h = Math.sin(k * Math.PI) * 140;
      const fx = s.ox + (s.x - s.ox) * k, fy = s.oy + (s.y - s.oy) * k - h;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(Math.round((s.ox + (s.x - s.ox) * k) / PX) * PX - 4, Math.round((s.oy + (s.y - s.oy) * k) / PX) * PX, 8, 4);
      drawSprite(g, sprite('grenade', 'fire', this.makeCanvas), fx, fy, PX, Math.floor(k * 10) * (Math.PI / 2));
    }
    // efectos de habilidad a ras de suelo (campos)
    for (const v of e.vfx) if (v.kind === 'field' && vis(v.x, v.y, v.r)) pixelField(g, v.x, v.y, v.r, v.dur - v.t, v.seed, v.pal, this.makeCanvas, PX, e.time, v.sprite);
    // telegráficos de jefes
    for (const en of e.enemies) {
      const a = en.atk;
      if (!a) continue;
      if (a.kind === 'slam') {
        const k = Math.min(1, a.t / a.dur);
        g.fillStyle = `rgba(255,70,85,${0.1 + k * 0.28})`; g.beginPath(); g.arc(a.x, a.y, 135, 0, 7); g.fill();
        g.strokeStyle = '#ff4655'; g.lineWidth = 3; g.beginPath(); g.arc(a.x, a.y, 135, 0, 7); g.stroke();
        g.beginPath(); g.arc(a.x, a.y, 135 * k, 0, 7); g.stroke();
      } else if (a.kind === 'charge' && a.t < 0.9) {
        const k = a.t / 0.9;
        g.save(); g.translate(en.x, en.y); g.rotate(a.ang);
        g.fillStyle = `rgba(255,70,85,${0.12 + k * 0.25})`; g.fillRect(0, -en.r, 520 * 0.55 + 140, en.r * 2);
        g.strokeStyle = '#ff4655'; g.lineWidth = 2; g.strokeRect(0, -en.r, 520 * 0.55 + 140, en.r * 2);
        g.restore();
      } else if (a.kind === 'flame' && a.t < 0.7) {
        // aviso del aliento: cono que se va llenando
        const k = a.t / 0.7, L = 270, half = 0.42;
        g.fillStyle = `rgba(255,122,61,${0.1 + k * 0.25})`; g.strokeStyle = '#ff7a3d'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(en.x, en.y); g.arc(en.x, en.y, L, a.ang - half, a.ang + half); g.closePath(); g.fill(); g.stroke();
      } else if (a.kind === 'blink' && a.t < 0.6) {
        // el Sabio se desvanece en un remolino antes de saltar
        const k = a.t / 0.6;
        pixelCircle(g, en.x, en.y, en.r + 14 + k * 30, '#9b5cff', PX, 2, e.time * 4);
      } else if (a.kind === 'ring' || a.kind === 'spiral' || a.kind === 'summon' || a.kind === 'shield' || a.kind === 'web' || a.kind === 'storm') {
        const k = Math.min(1, a.t / Math.max(0.4, a.kind === 'ring' ? 0.7 : 0.9));
        g.strokeStyle = hexA(en.def.color, 0.9); g.lineWidth = 3;
        g.beginPath(); g.arc(en.x, en.y, en.r + 8 + (1 - k) * 36, 0, 7); g.stroke();
      }
    }
    // torretas
    for (const t of e.players.flatMap(pl => pl.turrets)) {
      if (!vis(t.x, t.y)) continue;
      if (t.t < 1.5 && Math.floor(e.time * 12) % 2) continue;   // parpadea antes de desaparecer
      const pop = Math.min(1, (t.max - t.t) * 6);               // aparece "cayendo" un instante
      const tx = Math.round(t.x / PX) * PX, ty = Math.round((t.y - (1 - pop) * 20) / PX) * PX;
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(tx - 10, Math.round(t.y / PX) * PX + 8, 20, 4);
      drawSprite(g, sprite('turret', t.flash > 0 ? 'holy' : 'turret', this.makeCanvas), tx, ty, PX);
      if (t.hp < t.maxHp) {
        const w = 24, k = Math.max(0, t.hp / t.maxHp);
        g.fillStyle = '#000'; g.fillRect(tx - w / 2 - 2, ty - 20, w + 4, 6);
        g.fillStyle = k > 0.5 ? '#ffe14a' : k > 0.25 ? '#ffb020' : '#ff4655'; g.fillRect(tx - w / 2, ty - 18, Math.round((w * k) / PX) * PX, 2);
      }
      const bc = Math.cos(snapAng(t.ang)), bs = Math.sin(snapAng(t.ang));
      drawSprite(g, sprite('barrel', 'turret', this.makeCanvas), tx + bc * 8, ty - 2 + bs * 8, PX, t.ang);
      if (t.cd > 0.25) { g.fillStyle = '#fff4b0'; g.fillRect(Math.round((tx + bc * 18) / PX) * PX - 2, Math.round((ty - 2 + bs * 18) / PX) * PX - 2, 4, 4); }
    }
    // enemigos
    for (const en of e.enemies) {
      if (en.dead || !vis(en.x, en.y, en.r + 8)) continue;
      if (en.atk?.kind === 'blink' && en.atk.t < 0.6) g.globalAlpha = 1 - en.atk.t / 0.7;
      this.drawEnemy(g, en, e);
      g.globalAlpha = 1;
      if (en.shieldT > 0) {
        // escudo del Coloso: burbuja hexagonal que brilla
        const r = en.r * 1.5, pulse = 0.5 + 0.3 * Math.sin(e.time * 8);
        g.globalAlpha = pulse; g.strokeStyle = '#5c8bff'; g.lineWidth = 3; g.fillStyle = 'rgba(92,139,255,0.16)';
        g.beginPath();
        for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI * 2 + e.time * 0.6, x = en.x + Math.cos(a) * r, y = en.y - en.r * 0.4 + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.fill(); g.stroke(); g.globalAlpha = 1;
      }
    }
    // proyectiles enemigos
    g.globalCompositeOperation = 'lighter';
    for (const b of e.eprojs) {
      if (!vis(b.x, b.y)) continue;
      g.fillStyle = hexA(b.color, 0.35); g.beginPath(); g.arc(b.x, b.y, b.r * 2, 0, 7); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(b.x, b.y, b.r * 0.7, 0, 7); g.fill();
    }
    // proyectiles del jugador
    for (const b of e.projs) {
      if (b.dead || !vis(b.x, b.y) || b.look) continue;
      const sp = Math.hypot(b.vx, b.vy) || 1;
      const len = 18;
      g.strokeStyle = hexA(b.color, 0.45); g.lineWidth = b.r * 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(b.x - (b.vx / sp) * len, b.y - (b.vy / sp) * len); g.lineTo(b.x, b.y); g.stroke();
      g.strokeStyle = b.crit ? '#ffe9a0' : '#ffffff'; g.lineWidth = b.r * 1.6;
      g.beginPath(); g.moveTo(b.x - (b.vx / sp) * len * 0.6, b.y - (b.vy / sp) * len * 0.6); g.lineTo(b.x, b.y); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    // dagas (Jett), flechas (Sova) y disparos de mascotas: sprites orientados con estela de píxeles
    // discos de bumerán: giran y dejan copias que se desvanecen
    for (const b of e.projs) {
      if (b.dead || b.look !== 'disc' || !vis(b.x, b.y)) continue;
      const sp = Math.hypot(b.vx, b.vy) || 1, img = this.tinted('disc', b.color);
      for (let i = 3; i >= 1; i--) {
        g.globalAlpha = 0.18 * (4 - i);
        drawSprite(g, img, b.x - (b.vx / sp) * i * 14, b.y - (b.vy / sp) * i * 14, PX * 3, (e.time - i * 0.03) * 14);
      }
      g.globalAlpha = 1;
      drawSprite(g, img, b.x, b.y, PX * 3, e.time * 14);
    }
    // proyectiles con aspecto propio: halo, estela que se estrecha y parpadea, y el sprite del elemento
    for (const b of e.projs) {
      if (b.dead || !b.look || b.look === 'disc' || !vis(b.x, b.y)) continue;
      const ang = Math.atan2(b.vy, b.vx), [sprName, basePal] = PROJ_LOOK[b.look] ?? PROJ_LOOK.dagger;
      const pal = b.pal && PAL[b.pal] ? b.pal : basePal;
      this.drawComet(g, b.x, b.y, -Math.cos(ang), -Math.sin(ang), pal, b.r, e.time + b.x * 0.01);
      drawSprite(g, sprite(sprName, b.look === 'arrow' && b.color === '#ffffff' ? 'holy' : pal, this.makeCanvas), b.x, b.y, BIG, SPIN.has(b.look) ? (b.look === 'star' || b.look === 'rock' ? e.time * 8 : 0) : ang);
    }
    // efectos de habilidad (explosiones, anillos, llamas, haces de luz)
    for (const v of e.vfx) {
      const k = v.t / v.dur;
      const fb = (e.players[v.owner ?? e.local] ?? e.me).body;
      const vx = v.follow ? fb.x + v.x : v.x, vy = v.follow ? fb.y + v.y : v.y;
      if (!vis(vx, vy, v.r)) continue;
      if (v.kind === 'blast') pixelBlast(g, vx, vy, v.r * 1.2, k, v.pal, v.seed, PX);
      else if (v.kind === 'ring') pixelBlast(g, vx, vy, v.r * 1.15, k, v.pal, v.seed, PX, true);
      else if (v.kind === 'gust') {
        // ráfagas de viento que salen detrás de Jett en la dirección del impulso
        const c = Math.cos(v.ang), s = Math.sin(v.ang);
        for (let i = -2; i <= 2; i++) {
          const ox = vx - s * i * 9, oy = vy + c * i * 9 + 8, len = (60 - Math.abs(i) * 12) * (1 - k);
          const off = k * 50 + Math.abs(i) * 6;
          pixelLine(g, ox - c * off, oy - s * off, ox - c * (off + len), oy - s * (off + len), PAL.wind[i === 0 ? 4 : 2], PX, i === 0 ? 2 : 1);
        }
      }
      else if (v.kind === 'beam') { g.globalAlpha = 1 - k * k; pixelBeam(g, vx, vy, v.r * 1.5, k, v.pal, e.time, PX); g.globalAlpha = 1; }
      else if (v.kind === 'ray') pixelRay(g, vx, vy - 8, v.ang, v.r, (v.w ?? 24) * 1.6, k, v.pal, e.time, PX);
      else if (v.kind === 'cone') pixelCone(g, vx, vy - 6, v.ang, v.r * 1.15, (v.w ?? 1.2) * 1.15, k, v.pal, v.seed, e.time, PX);
      else if (v.kind === 'flames') {
        // anillo de llamas animadas que se expande y se consume (seed = número de llamas)
        const n = v.seed, img = sprite('flame', v.pal, this.makeCanvas);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2, d = v.r * (0.35 + 0.65 * Math.min(1, k * 2.5));
          const fl = Math.floor(e.time * 12 + i) % 3;
          if (k > 0.6 && (i + Math.floor(e.time * 20)) % 3 === 0) continue;
          drawSprite(g, img, Math.round((vx + Math.cos(a) * d) / PX) * PX, Math.round((vy + Math.sin(a) * d * 0.8) / PX) * PX - fl * PX, PX * (k < 0.7 ? 3 : 2), 0, fl === 1);
        }
      }
    }
    // mascotas (por detrás de los jugadores)
    for (const pl of e.players) {
      const pet = pl.pet;
      if (!pet || pet.dead || pl.dead) continue;
      const px = Math.round(pet.x / PX) * PX, py = Math.round(pet.y / PX) * PX, w = PW * PX, h = PH * PX;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(px, py + 6, 11, 4, 0, 0, 7); g.fill();
      g.save(); g.imageSmoothingEnabled = false;
      if (pet.flash > 0) g.globalAlpha = 0.55;
      g.translate(px, py + 8);
      if (pet.face < 0) g.scale(-1, 1);
      g.drawImage(petCanvas(pet.id, Math.floor(pet.hop) % 2, this.makeCanvas, 3), -w / 2, -h, w, h);
      g.restore();
      if (pet.hp < pet.maxHp) {
        const bw = 24, k = Math.max(0, pet.hp / pet.maxHp), by = py + 8 - h - 6;
        g.fillStyle = '#000'; g.fillRect(px - bw / 2 - 2, by, bw + 4, 6);
        g.fillStyle = k > 0.5 ? '#5dff9a' : k > 0.25 ? '#ffb020' : '#ff4655'; g.fillRect(px - bw / 2, by + 2, Math.round((bw * k) / PX) * PX, 2);
      }
    }
    // jugadores (con sus drones); los caídos se ven como un fantasma hasta la siguiente oleada
    for (const pl of e.players) {
      if (pl.dead) { this.drawGhost(g, e, pl); continue; }
      e.withPlayer(pl, () => {
        const q = e.player;
        for (let i = 0; i < e.stats.drones; i++) {
          const a = e.droneAngle + (i / e.stats.drones) * Math.PI * 2;
          const dx = q.x + Math.cos(a) * 52, dy = q.y + Math.sin(a) * 52;
          g.fillStyle = '#1a2230'; g.strokeStyle = e.agent.accent; g.lineWidth = 2;
          g.beginPath(); g.moveTo(dx, dy - 6); g.lineTo(dx + 6, dy); g.lineTo(dx, dy + 6); g.lineTo(dx - 6, dy); g.closePath(); g.fill(); g.stroke();
        }
        this.drawPlayer(g, e);
      });
    }
    // efectos sobre el personaje: ojo (Reyna/Omen) y sprites que suben (cruces, llamas, galones)
    for (const v of e.vfx) {
      const k = v.t / v.dur;
      const ob = (e.players[v.owner ?? e.local] ?? e.me).body;
      if (v.kind === 'eye') {
        const sc = PX * (v.r || 1) * (k < 0.12 ? 0.5 : 1);
        g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        drawSprite(g, sprite('eye', v.pal, this.makeCanvas), Math.round(ob.x / PX) * PX, Math.round((ob.y + v.y - k * 10) / PX) * PX, sc);
        g.globalAlpha = 1;
      } else if (v.kind === 'rise' && v.sprite) {
        g.globalAlpha = Math.min(1, (1 - k) * 2);
        const x = ob.x + v.x + Math.sin(k * 6 + v.seed) * 4, y = ob.y + v.y - 8 - k * 46;
        drawSprite(g, sprite(v.sprite, v.pal, this.makeCanvas), Math.round(x / PX) * PX, Math.round(y / PX) * PX, PX);
        g.globalAlpha = 1;
      }
    }
    // fx
    g.globalCompositeOperation = 'lighter';
    for (const f of e.fxs.items) {
      if (f.life <= 0) continue;
      const k = 1 - f.life / f.max;
      if (f.kind === 0) {
        g.globalAlpha = 1 - k;
        pixelCircle(g, f.x, f.y, f.r * (0.25 + k * 0.75), f.color, PX, 3);
        g.globalAlpha = 1;
      } else {
        g.globalAlpha = 1 - k;
        pixelBolt(g, f.x, f.y, f.x2, f.y2, (f.x * 7 + Math.floor(e.time * 20)) | 0, 'electric', PX);
        g.globalAlpha = 1;
      }
    }
    for (const q of e.particles.items) {
      if (q.life <= 0 || !vis(q.x, q.y)) continue;
      const k = q.life / q.max;
      g.fillStyle = hexA(q.color, Math.min(1, k * 1.4));
      if (q.circle) { g.beginPath(); g.arc(q.x, q.y, q.size * k + 0.5, 0, 7); g.fill(); }
      else g.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
    }
    g.globalCompositeOperation = 'source-over';
    g.restore();

    // nombre de la zona a la que lleva cada portal
    g.textAlign = 'center';
    g.font = `${Math.max(8, Math.round(z * 12 / 8) * 8)}px ${PIXEL_FONT}`;
    for (const pt of e.world.portals) {
      if (!vis(pt.x, pt.y, PORTAL_H)) continue;
      const label = '→ ' + t(MAPS[pt.to].name), nx = Math.round((pt.x - cx) * z), ny = Math.round((pt.y - PORTAL_H * PORTAL_CY - 10 - cy) * z);
      g.fillStyle = '#000';
      for (const [ox, oy] of OUTLINE) g.fillText(label, nx + ox, ny + oy);
      g.fillStyle = MAPS[pt.to].colors.accent;
      g.fillText(label, nx, ny);
    }
    // nombres en cooperativo (solo de los compañeros)
    if (e.players.length > 1) {
      g.textAlign = 'center';
      g.font = `${Math.max(8, Math.round(z * 16 / 8) * 8)}px ${PIXEL_FONT}`;
      for (const pl of e.players) {
        if (pl === e.me) continue;
        const nx = Math.round((pl.body.x - cx) * z), ny = Math.round((pl.body.y - 62 - cy) * z);
        const label = pl.dead ? `${pl.name} (caído)` : pl.name;
        g.fillStyle = '#000';
        for (const [ox, oy] of OUTLINE) g.fillText(label, nx + ox, ny + oy);
        g.fillStyle = pl.dead ? '#8b978f' : pl.agent.color;
        g.fillText(label, nx, ny);
        // flecha en el borde si el compañero está fuera de la pantalla
        const W = this.vw, H = this.vh;
        if (nx < 0 || ny < 0 || nx > W || ny > H) {
          const ax = Math.max(10, Math.min(W - 10, nx)), ay = Math.max(14, Math.min(H - 10, ny + 20));
          g.fillStyle = pl.agent.color; g.fillRect(ax - 3, ay - 3, 6, 6);
          g.fillStyle = '#000'; g.fillRect(ax - 1, ay - 1, 2, 2);
        }
      }
    }
    // números flotantes: en pantalla, fuente pixelada a tamaño entero y contorno de 1 píxel
    g.textAlign = 'center';
    const fs = Math.max(8, Math.round(z * 16 / 8) * 8);
    g.font = `${fs}px ${PIXEL_FONT}`;
    for (const t of e.texts.items) {
      if (t.life <= 0 || !vis(t.x, t.y)) continue;
      const tx = Math.round((t.x - cx) * z), ty = Math.round((t.y - cy) * z);
      g.globalAlpha = Math.min(1, t.life * 2.2);
      g.fillStyle = '#000';
      for (const [ox, oy] of OUTLINE) g.fillText(t.text, tx + ox, ty + oy);
      g.fillStyle = t.color; g.fillText(t.text, tx, ty);
    }
    g.globalAlpha = 1;

    // polvo ambiental (en pantalla)
    g.fillStyle = 'rgba(255,255,255,0.10)';
    const tm = e.time;
    for (let i = 0; i < (this.low ? 0 : 36); i++) {
      const x = ((i * 197 + tm * (6 + (i % 5) * 3) - this.camX * 0.25) % this.vw + this.vw) % this.vw;
      const y = ((i * 311 - tm * (4 + (i % 4) * 3) - this.camY * 0.25) % this.vh + this.vh) % this.vh;
      g.fillRect(Math.floor(x), Math.floor(y), Math.max(1, Math.round(2 * this.dpr * z)), Math.max(1, Math.round(2 * this.dpr * z)));
    }
    // viñeta y destello de daño
    if (!this.vignette) {
      const v = this.makeCanvas(Math.max(2, Math.ceil(this.vw)), Math.max(2, Math.ceil(this.vh)));
      const vg = v.getContext('2d') as Ctx;
      const gr = vg.createRadialGradient(this.vw / 2, this.vh / 2, Math.min(this.vw, this.vh) * 0.35, this.vw / 2, this.vh / 2, Math.hypot(this.vw, this.vh) * 0.62);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.62)');
      vg.fillStyle = gr; vg.fillRect(0, 0, this.vw, this.vh);
      this.vignette = v;
    }
    g.drawImage(this.vignette, 0, 0);
    const hpFrac = p.hp / e.stats.maxHp;
    if (e.hurtFlash > 0 || hpFrac < 0.3) {
      const a = Math.max(e.hurtFlash * 1.2, hpFrac < 0.3 ? (0.3 - hpFrac) * (0.6 + 0.4 * Math.sin(e.time * 7)) : 0);
      const gr = g.createRadialGradient(this.vw / 2, this.vh / 2, Math.min(this.vw, this.vh) * 0.3, this.vw / 2, this.vh / 2, Math.hypot(this.vw, this.vh) * 0.6);
      gr.addColorStop(0, 'rgba(255,40,60,0)'); gr.addColorStop(1, `rgba(255,40,60,${Math.min(0.55, a)})`);
      g.fillStyle = gr; g.fillRect(0, 0, this.vw, this.vh);
    }
  }

  private drawPlayer(g: Ctx, e: GameEngine) {
    const p = e.player, a = e.agent, t = e.time;
    const blink = p.iframes > 0 && Math.floor(t * 20) % 2 === 0;
    g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.ellipse(p.x + 2, p.y + 14, 20, 9, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.36)'; g.beginPath(); g.ellipse(p.x + 2, p.y + 14, 13, 5, 0, 0, 7); g.fill();
    this.drawBuffs(g, e, false);
    if (p.invuln > 0) pixelCircle(g, p.x, p.y, p.r + 10, '#ffffff', PX, 2, t * 3);
    if (p.shield > 0) { g.globalAlpha = 0.7; pixelCircle(g, p.x, p.y, p.r + 6, '#7ad7ff', PX, 1); g.globalAlpha = 1; }

    // --- animación: reposo / andar / correr / dash / lanzar habilidad
    const sprint = e.buffs.sprintT > 0;
    const moving = Math.hypot(e.inputMove.x, e.inputMove.y) > 0.1;
    const castDur = e.castUlt ? 0.6 : 0.35;
    const castK = (t - e.castT) / castDur;
    const casting = castK >= 0 && castK < 1;
    const dashing = p.dashT > 0;
    let pose: Pose = IDLE, frame = 0;
    if (casting) pose = CAST;
    else if (dashing) pose = RUN[0];
    else if (moving) { frame = Math.floor(t * (sprint ? 18 : 11)) % 4; pose = (sprint ? RUN : WALK)[frame]; }
    const sz = spriteSize(a.id), dw = sz.w * sz.px, dh = sz.h * sz.px;
    // héroes con hoja de sprites: fotogramas propios de andar (el arma equipada se pinta igual encima)
    const imgFrame = moving || dashing ? Math.floor(t * (sprint || dashing ? 12 : 8)) : 0;
    // orientación según hacia dónde se mueve: de espaldas, de frente o de lado (izquierda = espejo)
    const mvx = dashing ? p.dashVx : e.inputMove.x, mvy = dashing ? p.dashVy : e.inputMove.y;
    const dir: Dir = !(moving || dashing) ? 'front' : Math.abs(mvy) > Math.abs(mvx) * 1.1 ? (mvy < 0 ? 'back' : 'front') : 'side';
    const flip = dir === 'side' && mvx < 0;
    const bob = casting ? -3 : moving ? (frame % 2) * 2 : Math.sin(t * 3) * 0.8;
    let lean = moving ? Math.max(-1, Math.min(1, e.inputMove.x)) * (sprint ? 0.16 : 0.07) : 0;
    let sx = 1, sy = moving || casting ? 1 : 1 + Math.sin(t * 3) * 0.018;
    if (dashing) { lean = Math.sign(p.dashVx) * 0.3; sx = 1.2; sy = 0.88; }
    if (casting) { const s = 1 + Math.sin(castK * Math.PI) * 0.12; sx = s; sy = s; }
    const looks = e.looksOf();
    const spr = spriteCanvas(a.id, this.makeCanvas, 3, pose, dir, imgFrame, looks.agent ?? '');
    const baseY = p.y + 15 - bob;
    const drawBody = (ox: number, oy: number, alpha: number) => {
      g.save(); g.globalAlpha = alpha; g.translate(p.x + ox, baseY + oy); g.rotate(lean);
      if (flip) g.scale(-1, 1);
      g.scale(sx, sy); g.imageSmoothingEnabled = false;
      g.drawImage(spr, -dw / 2, -dh, dw, dh);
      g.restore();
    };
    // estelas de velocidad (dash / sprint)
    if (dashing || sprint) {
      const dx = dashing ? p.dashVx : e.inputMove.x, dy = dashing ? p.dashVy : e.inputMove.y, l = Math.hypot(dx, dy) || 1;
      for (let i = 3; i >= 1; i--) drawBody(-(dx / l) * i * 13, -(dy / l) * i * 13, (blink ? 0.2 : 0.3) / i);
    }
    // aura al lanzar habilidad
    if (casting) {
      g.globalCompositeOperation = 'lighter';
      const rad = 26 + castK * 40, gr = g.createRadialGradient(p.x, baseY - dh * 0.5, 4, p.x, baseY - dh * 0.5, rad);
      gr.addColorStop(0, hexA(a.color, 0.55 * (1 - castK))); gr.addColorStop(1, hexA(a.color, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(p.x, baseY - dh * 0.5, rad, 0, 7); g.fill();
      g.strokeStyle = hexA(a.accent, 0.8 * (1 - castK)); g.lineWidth = 3;
      g.beginPath(); g.arc(p.x, baseY - dh * 0.5, 14 + castK * 46, 0, 7); g.stroke();
      g.globalCompositeOperation = 'source-over';
    }
    drawBody(0, 0, blink ? 0.4 : 1);
    // al lanzar el poder: destello de su color en la mano, hacia el enemigo
    const since = t - e.lastShotT, pw = POWERS[e.held];
    if (pw && since < 0.14 && !casting && !dashing) {
      const k = 1 - since / 0.14, hx = p.x + Math.cos(p.face) * 14, hy = baseY - dh * 0.42 + Math.sin(p.face) * 8;
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = hexA(pw.color, 0.35 * k); g.beginPath(); g.arc(hx, hy, 9 + 4 * k, 0, 7); g.fill();
      g.fillStyle = hexA('#ffffff', 0.8 * k); g.fillRect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4);
      g.globalCompositeOperation = 'source-over';
    }
    this.drawBuffs(g, e, true);
  }

  /** Jugador caído: silueta translúcida y quieta hasta la siguiente oleada. */
  private drawGhost(g: Ctx, e: GameEngine, pl: { agent: { id: string }; body: { x: number; y: number }; looks: { agent?: string } }) {
    const sz = spriteSize(pl.agent.id), spr = spriteCanvas(pl.agent.id, this.makeCanvas, 3, IDLE, 'front', 0, pl.looks.agent ?? ''), dw = sz.w * sz.px, dh = sz.h * sz.px;
    g.save(); g.globalAlpha = 0.3 + 0.1 * Math.sin(e.time * 4);
    g.imageSmoothingEnabled = false;
    g.drawImage(spr, Math.round(pl.body.x / PX) * PX - dw / 2, Math.round((pl.body.y + 15) / PX) * PX - dh, dw, dh);
    g.restore();
  }

  /** Efectos mientras dura una habilidad activa. front = capa por delante del personaje. */
  private drawBuffs(g: Ctx, e: GameEngine, front: boolean) {
    const p = e.player, b = e.buffs, t = e.time, mk = this.makeCanvas;
    const px = Math.round(p.x / PX) * PX, py = Math.round(p.y / PX) * PX;
    // órbita: las de delante del héroe se pintan encima y las de detrás, debajo
    if (b.orbitT > 0) {
      const look = elemLook(b.orbitFx), [sprName, basePal] = PROJ_LOOK[look], pal = PAL[b.orbitFx] ? b.orbitFx : basePal, img = sprite(sprName, pal, mk);
      g.globalAlpha = b.orbitT < 1 ? b.orbitT : 1;
      for (let i = 0; i < b.orbitN; i++) {
        const a = b.orbitAng + (i / b.orbitN) * Math.PI * 2;
        if ((Math.sin(a) > 0) !== front) continue;
        const ox = p.x + Math.cos(a) * b.orbitR, oy = p.y + Math.sin(a) * b.orbitR;
        // estela: puntos que siguen la curva por detrás (gira en sentido horario)
        const ramp = PAL[pal];
        for (let k = 1; k <= 6; k++) {
          const ak = a - k * 0.13, sz = Math.max(1, 5 - Math.floor(k * 0.7)) * PX;
          g.fillStyle = ramp[Math.max(0, 4 - Math.ceil(k * 0.7))];
          g.fillRect(Math.round((p.x + Math.cos(ak) * b.orbitR) / PX) * PX - sz / 2, Math.round((p.y + Math.sin(ak) * b.orbitR) / PX) * PX - sz / 2, sz, sz);
        }
        drawSprite(g, img, Math.round(ox / PX) * PX, Math.round(oy / PX) * PX, BIG, SPIN.has(look) ? (look === 'star' || look === 'rock' ? t * 8 : 0) : a + Math.PI / 2);
      }
      g.globalAlpha = 1;
    }
    // Neon: rayos que saltan a su alrededor
    if (b.sprintT > 0 && !front) {
      const R = b.sprintRad * e.stats.area, bucket = Math.floor(t * 14);
      for (let i = 0; i < 3; i++) {
        const a = ((bucket * 7 + i * 13) % 16) / 16 * Math.PI * 2;
        pixelBolt(g, px, py - 10, px + Math.cos(a) * R * 0.9, py + Math.sin(a) * R * 0.9, bucket * 3 + i, 'electric', PX);
      }
    }
    // Jett: dagas orbitando (las de atrás debajo del personaje, las de delante encima)
    if (b.stormT > 0) {
      const n = b.stormPow > 2 ? 6 : 3, img = sprite('dagger', 'wind', mk);
      for (let i = 0; i < n; i++) {
        const a = t * 5 + (i / n) * Math.PI * 2, sy = Math.sin(a);
        if ((sy > 0) !== front) continue;
        drawSprite(g, img, px + Math.cos(a) * 30, py - 8 + sy * 18, PX, a + Math.PI / 2);
      }
    }
    if (b.frenzyT > 0 && b.frenzyFx === 'soul') {
      if (!front) {
        // llamas de alma alrededor de los pies
        const img = sprite('flame', 'soul', mk);
        for (let i = 0; i < 6; i++) {
          const a = t * 2.5 + (i / 6) * Math.PI * 2;
          drawSprite(g, img, Math.round((px + Math.cos(a) * 22) / PX) * PX, Math.round((py + 10 + Math.sin(a) * 8) / PX) * PX - (Math.floor(t * 10 + i) % 2) * PX, PX, 0, i % 2 === 0);
        }
      } else {
        const bob = Math.round(Math.sin(t * 4) * 1.5) * PX;
        drawSprite(g, sprite('eye', 'soul', mk), px, py - 46 + bob, PX);
      }
    }
    if (b.frenzyT > 0 && b.frenzyFx === 'stim' && front) {
      // Brimstone: galones que suben en bucle
      const img = sprite('chevron', 'stim', mk);
      for (let i = 0; i < 3; i++) {
        const k = (t * 1.2 + i / 3) % 1;
        g.globalAlpha = Math.sin(k * Math.PI);
        drawSprite(g, img, px + (i - 1) * 18, Math.round((py + 6 - k * 40) / PX) * PX, PX);
      }
      g.globalAlpha = 1;
    }
  }

  private drawEnemy(g: Ctx, en: Enemy, e: GameEngine) {
    const d = en.def, r = en.r, x = en.x, y = en.y;
    const flash = en.flash > 0;
    g.fillStyle = 'rgba(0,0,0,0.14)'; g.beginPath(); g.ellipse(x, y + r * 0.7, r * 1.35, r * 0.55, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.32)'; g.beginPath(); g.ellipse(x, y + r * 0.7, r * 0.9, r * 0.32, 0, 0, 7); g.fill();
    // bots y jefes de la grieta dibujados por código: de frente, de espaldas o de perfil según hacia dónde van,
    // 4 pasos al andar, blancos al recibir un golpe y grises aturdidos
    const botKind = d.kind ?? (d.art && hasBotSprite(d.art) ? d.art : '');
    if (botKind && hasBotSprite(botKind)) {
      const stunned = en.stunT > 0, s = Math.sin(en.face), c = Math.cos(en.face);
      const dir = s > 0.55 ? 'front' : s < -0.55 ? 'back' : 'side';
      const frame = stunned ? 0 : Math.floor(en.anim * (en.isBoss ? 5 : 8)) % 4;
      const img = botSprite(botKind, d.tier ?? 0, dir, frame, en.flash > 0 ? 'hit' : stunned ? 'stun' : 'n', this.makeCanvas);
      const k = Math.max(1, Math.round(((r * (en.isBoss ? 3.6 : 2.7)) / (img.height * PX)) * 2) / 2), w = img.width * PX * k, h = img.height * PX * k;
      const left = Math.round((x - w / 2) / PX) * PX, top = Math.round((y + r * 0.9 - h) / PX) * PX;
      g.save(); g.imageSmoothingEnabled = false;
      if (dir === 'side' && c < 0) { g.translate(left + w, top); g.scale(-1, 1); g.drawImage(img, 0, 0, w, h); } else g.drawImage(img, left, top, w, h);
      g.restore();
    } else
    // bots y jefes de la grieta: su dibujo recortado, balanceándose al andar, en blanco al recibir un golpe y gris aturdido
    {
    const pic = d.art ? enemyArt(d.art) : null;
    if (pic) {
      const stunned = en.stunT > 0, step = stunned ? 0 : Math.sin(en.anim * (en.isBoss ? 4 : 9));
      const sc = PX * (en.isBoss ? Math.max(1, r / 34) : Math.max(1, r / 13)), w = pic.width * sc, h = pic.height * sc;
      const lift = Math.round(Math.abs(step) * 2) * PX * (d.behavior === 'shooter' && d.kind === 'volador' ? 2 : 1);
      const left = Math.round((x - w / 2) / PX) * PX, top = Math.round((y + r * 0.9 - h - lift) / PX) * PX;
      g.save();
      g.imageSmoothingEnabled = false;
      if (stunned) g.filter = 'grayscale(1)';
      const flip = Math.cos(en.face) < 0, img = en.flash > 0 ? enemyFlash(d.art!, pic, this.makeCanvas) : pic;
      if (flip) { g.translate(left + w, top); g.scale(-1, 1); g.drawImage(img, 0, 0, w, h); } else g.drawImage(img, left, top, w, h);
      g.restore();
    } else {
    // robot pixel-art: anda (2 fotogramas), mira hacia su objetivo, blanco al recibir golpe, gris aturdido
    const kind = enemyKind(d.id);
    const stunned = en.stunT > 0;
    const blinkFuse = en.fuse > 0 && Math.floor(en.anim * 14) % 2 === 0;
    const variant = flash || blinkFuse ? 'hit' : stunned ? 'stun' : 'n';
    const frame = stunned ? 0 : Math.floor(en.anim * (kind === 'runner' ? 14 : isBossKind(kind) ? 4 : 7));
    let core = enemyCore(kind, d.color);
    if (en.isBoss && en.phase && Math.floor(en.anim * 6) % 2) core = '#ffffff';    // 2.ª fase: el núcleo parpadea
    const img = enemySprite(kind, frame, variant, core, this.makeCanvas);
    const sc = isBossKind(kind) ? PX * Math.max(2, Math.round(r / 22)) : PX;
    const w = img.width * sc, h = img.height * sc;
    const bob = kind === 'runner' || stunned ? 0 : (frame % 2) * PX;
    const left = Math.round((x - w / 2) / PX) * PX, top = Math.round((y + r * 0.9 - h - bob) / PX) * PX;
    g.save();
    g.imageSmoothingEnabled = false;
    if (Math.cos(en.face) < 0) { g.translate(left + w, top); g.scale(-1, 1); g.drawImage(img, 0, 0, w, h); }
    else g.drawImage(img, left, top, w, h);
    g.restore();
    }
    }
    if (en.windup > 0) pixelCircle(g, x, y, r + 6, '#ffffff', PX, 1, e.time * 6);   // aviso de disparo
    if (en.markT > 0) {
      // retícula de marcado: cuatro esquinas en píxeles
      const q = Math.round((r + 6) / PX) * PX, cx = Math.round(x / PX) * PX, cy = Math.round(y / PX) * PX, L = 3 * PX;
      g.fillStyle = Math.floor(e.time * 4) % 2 ? '#c9d8ff' : '#5c8bff';
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        g.fillRect(cx + sx * q - (sx > 0 ? L : 0), cy + sy * q - (sy > 0 ? PX : 0), L, PX);
        g.fillRect(cx + sx * q - (sx > 0 ? PX : 0), cy + sy * q - (sy > 0 ? L : 0), PX, L);
      }
    }
    if (en.burnT > 0 && Math.floor(e.time * 10 + en.id) % 3 === 0) g.drawImage(sprite('flame', 'fire', this.makeCanvas), Math.round((x - 8) / PX) * PX, Math.round((y - r * 1.6) / PX) * PX, 16, 22);
    if (en.slowT > 0) pixelCircle(g, x, y + r * 0.6, r + 2, '#7ab8ff', PX, 1);
    if (d.behavior === 'elite' || (en.hp < en.maxHp && !en.isBoss && d.id === 'tank')) {
      const w = r * 2;
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x - w / 2, y - r - 10, w, 4);
      g.fillStyle = '#ff4655'; g.fillRect(x - w / 2, y - r - 10, (w * Math.max(0, en.hp)) / en.maxHp, 4);
    }
  }
}

/** Sprite y paleta de cada aspecto de proyectil (la paleta puede cambiarla la habilidad con pal). */
const PROJ_LOOK: Record<string, [string, string]> = { dagger: ['dagger', 'wind'], arrow: ['arrow', 'scan'], flame: ['flame', 'fire'], bolt: ['bolt', 'electric'], leaf: ['crystal', 'poison'], wisp: ['flame', 'soul'],
  ice: ['crystal', 'ice'], water: ['flame', 'water'], rock: ['rock', 'stim'], star: ['star', 'scan'] };
/** Aspectos sin orientación (bolas, rocas, estrellas). */
const SPIN = new Set(['flame', 'wisp', 'water', 'rock', 'star']);
/** Aclara (f > 0) u oscurece (f < 0) un color #rrggbb. */
function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16), ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const v = ch.map(c => Math.round(f >= 0 ? c + (255 - c) * f : c * (1 + f)));
  return '#' + v.map(c => c.toString(16).padStart(2, '0')).join('');
}
function hexA(hex: string, a: number) {
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16), gg = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${gg},${b},${Math.max(0, Math.min(1, a))})`;
  }
  return hex;
}
