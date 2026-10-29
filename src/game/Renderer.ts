import { GameEngine, Enemy } from './GameEngine';
import { MapDef } from './types';
import { WEAPONS } from '../data/weapons';
import { spriteCanvas, spriteSize, preloadAgentSheets, agentSkin, IDLE, WALK, RUN, CAST, Pose, Dir } from './sprites';
import { renderChunk, CPX } from './MapArt';
import { CS } from './World';
import { gunCanvas, gunSize } from './weaponSprites';
import { petCanvas, PW, PH } from './petSprites';
import { enemyCore, enemyKind, enemySprite, isBossKind } from './enemySprites';
import { PAL, drawSprite, pixelBeam, pixelBlast, pixelBolt, pixelCircle, pixelField, pixelLine, snapAng, sprite } from './vfx';

type Ctx = CanvasRenderingContext2D;
type MakeCanvas = (w: number, h: number) => any;

/** Unidades de mundo por píxel de juego (los sprites de personaje quedan 1:1). */
export const PX = 2;
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

  /** Cristal de experiencia (o cruz de curación) en pixel art, con contorno y brillo. */
  private gemSprite(tier: string) {
    let c = this.gemCache.get(tier);
    if (c) return c;
    const PALS: Record<string, string[]> = {        // contorno, oscuro, medio, claro, brillo
      blue: ['#0b1a2a', '#1f6f9f', '#4fd0ff', '#bfeaff', '#ffffff'],
      green: ['#0b2018', '#1a8a5a', '#3fe0a0', '#c8ffe8', '#ffffff'],
      gold: ['#2a1a06', '#b07a14', '#ffd24a', '#fff2b0', '#ffffff'],
      epic: ['#1a0a2a', '#6a2aa8', '#c070ff', '#f0d0ff', '#ffffff'],
      heal: ['#0b2018', '#1f8a3a', '#5dff9a', '#d8ffe0', '#ffffff'],
    };
    const crystal = ['....O....', '...OWO...', '..OLWMO..', '.OLLWMMO.', 'OLLLWMMDO', 'OLLLMMMDO', '.OLLMMDO.', '..OLMDO..', '..OMMDO..', '...ODO...', '....O....'];
    const big = ['.....O.....', '....OWO....', '...OLWMO...', '..OLLWMMO..', '.OLLLWMMDO.', 'OLLLLWMMMDO', 'OLLLLMMMMDO', '.OLLLMMMDO.',
      '..OLLMMDO..', '..OLMMMDO..', '...OMMDO...', '...OMDDO...', '....ODO....', '.....O.....'];
    const cross = ['...OOO...', '...OWO...', 'OOOOLOOOO', 'OWLLLMMMO', 'OOOOMOOOO', '...OMO...', '...OMO...', '...ODO...', '...OOO...'];
    const rows = tier === 'heal' ? cross : tier === 'epic' || tier === 'gold' ? big : crystal;
    const [o, d, m, l, w] = PALS[tier], pal: Record<string, string> = { O: o, D: d, M: m, L: l, W: w };
    c = this.makeCanvas(rows[0].length * PX, rows.length * PX);
    const cg = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { cg.fillStyle = pal[ch]; cg.fillRect(x * PX, y * PX, PX, PX); } }));
    this.gemCache.set(tier, c);
    return c;
  }
  /** Halo del color del cristal (degradado radial ya pintado, para no recalcularlo por gema). */
  private gemGlow(tier: string) {
    const key = 'glow-' + tier;
    let c = this.gemCache.get(key);
    if (c) return c;
    const col = { blue: '79,208,255', green: '63,224,160', gold: '255,210,74', epic: '192,112,255', heal: '93,255,154' }[tier] ?? '255,255,255';
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

    const L = cx - 60, T = cy - 60, R = cx + vw + 60, B = cy + vh + 60;
    const vis = (x: number, y: number, r = 0) => x + r > L && x - r < R && y + r > T && y - r < B;

    // teletransportadores (Bind)
    for (const pair of e.world.portalsNear(p.x, p.y, 1)) for (const pt of pair) {
      if (!vis(pt.x, pt.y, 60)) continue;
      const ph = e.time * 3;
      g.fillStyle = 'rgba(176,92,255,0.16)'; g.beginPath(); g.arc(pt.x, pt.y, 34, 0, 7); g.fill();
      g.strokeStyle = '#b05cff'; g.lineWidth = 3; g.beginPath(); g.arc(pt.x, pt.y, 30, 0, 7); g.stroke();
      g.strokeStyle = '#e2c4ff'; g.lineWidth = 2;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(pt.x, pt.y, 8 + i * 8, ph + i, ph + i + 3.2); g.stroke(); }
    }
    // gemas: cristales pixel art con halo que late y un destello de vez en cuando
    g.imageSmoothingEnabled = false;
    for (const m of e.gems) {
      if (!vis(m.x, m.y)) continue;
      const tier = m.kind === 1 ? 'heal' : m.v > 10 ? 'epic' : m.v > 4 ? 'gold' : m.v > 1.5 ? 'green' : 'blue';
      const bob = Math.round(Math.sin(m.t * 5) * 1.5), ph = m.x * 0.13 + m.y * 0.07;
      const gx = Math.round(m.x / PX) * PX, gy = Math.round(m.y / PX) * PX + bob;
      // halo luminoso (suma luz)
      const glow = this.gemGlow(tier), pulse = 0.75 + 0.25 * Math.sin(e.time * 4 + ph), gs = (tier === 'epic' || tier === 'gold' ? 30 : 22) * (0.9 + 0.1 * pulse);
      const spr = this.gemSprite(tier);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(gx - 4, gy - bob + spr.height / 2 + 2, 8, 2);   // sombra en el suelo
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = pulse;
      g.drawImage(glow, gx - gs, gy - gs, gs * 2, gs * 2);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.drawImage(spr, gx - spr.width / 2, gy - spr.height / 2);
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
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(Math.round((s.ox + (s.x - s.ox) * k) / PX) * PX - 6, Math.round((s.oy + (s.y - s.oy) * k) / PX) * PX, 12, 4);
        if (s.fx === 'grenade') drawSprite(g, sprite('grenade', 'boom', this.makeCanvas), fx, fy, PX, Math.floor(k * 8) * (Math.PI / 2));
        else {
          const k2 = Math.min(1, k + 0.02), h2 = Math.sin(k2 * Math.PI) * 120;
          const ang = Math.atan2(s.oy + (s.y - s.oy) * k2 - h2 - fy, s.ox + (s.x - s.ox) * k2 - fx);
          for (let i = 1; i <= 3; i++) {
            g.fillStyle = PAL.fire[4 - i];
            g.fillRect(Math.round((fx - Math.cos(ang) * (18 + i * 5)) / PX) * PX - 2, Math.round((fy - Math.sin(ang) * (18 + i * 5)) / PX) * PX - 2, 4, 4);
          }
          drawSprite(g, sprite('rocket', 'fire', this.makeCanvas), fx, fy, PX, ang);
        }
      } else {
        g.globalAlpha = 0.5 + k * 0.5;
        pixelCircle(g, s.x, s.y, s.r, Math.floor(e.time * (6 + k * 14)) % 2 ? s.color : '#ffffff', PX, 2, e.time);
        pixelCircle(g, s.x, s.y, Math.max(6, s.r * k), s.color, PX, 1, -e.time * 2);
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
      } else if (a.kind === 'ring' || a.kind === 'spiral' || a.kind === 'summon') {
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
      this.drawEnemy(g, en, e);
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
      const len = 9;
      g.strokeStyle = hexA(b.color, 0.45); g.lineWidth = b.r * 2.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(b.x - (b.vx / sp) * len, b.y - (b.vy / sp) * len); g.lineTo(b.x, b.y); g.stroke();
      g.strokeStyle = b.crit ? '#ffe9a0' : '#ffffff'; g.lineWidth = b.r * 0.9;
      g.beginPath(); g.moveTo(b.x - (b.vx / sp) * len * 0.6, b.y - (b.vy / sp) * len * 0.6); g.lineTo(b.x, b.y); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    // dagas (Jett), flechas (Sova) y disparos de mascotas: sprites orientados con estela de píxeles
    const LOOK: Record<string, [string, string]> = { dagger: ['dagger', 'wind'], arrow: ['arrow', 'scan'], flame: ['flame', 'fire'], bolt: ['bolt', 'electric'], leaf: ['crystal', 'poison'] };
    for (const b of e.projs) {
      if (b.dead || !b.look || !vis(b.x, b.y)) continue;
      const ang = Math.atan2(b.vy, b.vx), c = Math.cos(ang), s = Math.sin(ang);
      const [sprName, pal] = LOOK[b.look] ?? LOOK.dagger;
      const trail = PAL[pal];
      for (let i = 1; i <= 3; i++) {
        g.fillStyle = trail[4 - i];
        g.fillRect(Math.round((b.x - c * (10 + i * 6)) / PX) * PX - 1, Math.round((b.y - s * (10 + i * 6)) / PX) * PX - 1, PX, PX);
      }
      drawSprite(g, sprite(sprName, b.look === 'arrow' && b.color === '#ffffff' ? 'holy' : pal, this.makeCanvas), b.x, b.y, PX, b.look === 'flame' ? 0 : ang);
    }
    // efectos de habilidad (explosiones, anillos, llamas, haces de luz)
    for (const v of e.vfx) {
      const k = v.t / v.dur;
      const fb = (e.players[v.owner ?? e.local] ?? e.me).body;
      const vx = v.follow ? fb.x + v.x : v.x, vy = v.follow ? fb.y + v.y : v.y;
      if (!vis(vx, vy, v.r)) continue;
      if (v.kind === 'blast') pixelBlast(g, vx, vy, v.r, k, v.pal, v.seed, PX);
      else if (v.kind === 'ring') pixelBlast(g, vx, vy, v.r, k, v.pal, v.seed, PX, true);
      else if (v.kind === 'gust') {
        // ráfagas de viento que salen detrás de Jett en la dirección del impulso
        const c = Math.cos(v.ang), s = Math.sin(v.ang);
        for (let i = -2; i <= 2; i++) {
          const ox = vx - s * i * 9, oy = vy + c * i * 9 + 8, len = (60 - Math.abs(i) * 12) * (1 - k);
          const off = k * 50 + Math.abs(i) * 6;
          pixelLine(g, ox - c * off, oy - s * off, ox - c * (off + len), oy - s * (off + len), PAL.wind[i === 0 ? 4 : 2], PX, i === 0 ? 2 : 1);
        }
      }
      else if (v.kind === 'beam') { g.globalAlpha = 1 - k * k; pixelBeam(g, vx, vy, v.r, k, v.pal, e.time, PX); g.globalAlpha = 1; }
      else if (v.kind === 'flames') {
        // anillo de llamas animadas que se expande y se consume (seed = número de llamas)
        const n = v.seed, img = sprite('flame', v.pal, this.makeCanvas);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2, d = v.r * (0.35 + 0.65 * Math.min(1, k * 2.5));
          const fl = Math.floor(e.time * 12 + i) % 3;
          if (k > 0.6 && (i + Math.floor(e.time * 20)) % 3 === 0) continue;
          drawSprite(g, img, Math.round((vx + Math.cos(a) * d) / PX) * PX, Math.round((vy + Math.sin(a) * d * 0.8) / PX) * PX - fl * PX, PX * (k < 0.7 ? 2 : 1), 0, fl === 1);
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
    for (let i = 0; i < 36; i++) {
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
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(p.x + 2, p.y + 14, 14, 6, 0, 0, 7); g.fill();
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
    // agentes con hoja de sprites: fotogramas propios de andar (el arma equipada se pinta igual encima)
    const imgFrame = moving || dashing ? Math.floor(t * (sprint || dashing ? 12 : 8)) : 0;
    // orientación según hacia dónde se mueve: de espaldas, de frente o de lado (izquierda = espejo)
    const mvx = dashing ? p.dashVx : e.inputMove.x, mvy = dashing ? p.dashVy : e.inputMove.y;
    const dir: Dir = !(moving || dashing) ? 'front' : Math.abs(mvy) > Math.abs(mvx) * 1.1 ? (mvy < 0 ? 'back' : 'front') : 'side';
    const flip = dir === 'side' && mvx < 0;
    const gunFlip = Math.cos(p.face) < 0;   // el arma apunta al enemigo, aunque el cuerpo mire a otro lado
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
    // de espaldas o apuntando hacia arriba, el arma queda detrás del cuerpo
    const aimUp = Math.sin(p.face) < -0.4 || dir === 'back';
    const drawGun = () => {
      if (casting || dashing) return;
      const gs = gunSize(e.held), gc = gunCanvas(e.held, WEAPONS[e.held].color, this.makeCanvas, 3, looks.weapon ?? '');
      const gw = gs.w * 1.5, gh = gs.h * 1.5;
      const recoil = Math.max(0, 1 - (t - e.lastShotT) / 0.09) * 4;
      g.save(); g.globalAlpha = blink ? 0.4 : 1;
      g.translate(p.x, baseY - dh * 0.42 - (moving ? (frame % 2) * 1 : 0));
      let ang = p.face;
      if (gunFlip) { g.scale(-1, 1); ang = Math.PI - ang; }
      g.rotate(ang);
      g.imageSmoothingEnabled = false;
      g.drawImage(gc, 2 - recoil, -gh * 0.45, gw, gh);
      g.fillStyle = agentSkin(a.id); g.fillRect(4 - recoil, -2, 4, 4); g.fillRect(gw * 0.5 - recoil, -2, 4, 4);
      if (t - e.lastShotT < 0.06) {
        g.globalCompositeOperation = 'lighter';
        const tx = gw + 2 - recoil;
        g.fillStyle = 'rgba(255,230,150,0.95)'; g.beginPath(); g.moveTo(tx, 0); g.lineTo(tx + 9, -3); g.lineTo(tx + 5, 0); g.lineTo(tx + 9, 3); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(tx + 1, 0, 3, 0, 7); g.fill();
        g.globalCompositeOperation = 'source-over';
      }
      g.restore();
    };
    if (aimUp) drawGun();
    drawBody(0, 0, blink ? 0.4 : 1);
    if (!aimUp) drawGun();
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
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(Math.round((x - r) / PX) * PX, Math.round((y + r * 0.6) / PX) * PX, Math.round(r * 2 / PX) * PX, PX * 2);
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

function hexA(hex: string, a: number) {
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16), gg = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${gg},${b},${Math.max(0, Math.min(1, a))})`;
  }
  return hex;
}
