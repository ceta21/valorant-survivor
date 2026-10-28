import { GameEngine, Enemy } from './GameEngine';
import { MapDef } from './types';
import { WEAPONS } from '../data/weapons';
import { SW, SH, spriteCanvas, agentSkin, IDLE, WALK, RUN, CAST, Pose } from './sprites';
import { gunCanvas, gunSize } from './weaponSprites';

type Ctx = CanvasRenderingContext2D;
type MakeCanvas = (w: number, h: number) => any;

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** Dibuja el juego en un canvas 2D. No contiene lógica de juego. */
export class Renderer {
  private ctx: Ctx;
  private makeCanvas: MakeCanvas;
  private mapCache: any = null;
  private mapId = '';
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
  }

  /** w,h = tamaño CSS del lienzo. Devuelve el tamaño de vista en unidades del mundo. */
  resize(w: number, h: number) {
    this.zoom = Math.max(0.6, Math.min(1.25, Math.min(w / 1100, h / 640)));
    this.vw = w; this.vh = h;
    this.vignette = null;
    return { w: w / this.zoom, h: h / this.zoom };
  }

  private buildMap(map: MapDef) {
    const c = this.makeCanvas(map.width, map.height);
    const g = c.getContext('2d') as Ctx;
    const col = map.colors;
    const rnd = seeded(map.id.length * 7919 + map.id.charCodeAt(0));
    g.fillStyle = col.ground; g.fillRect(0, 0, map.width, map.height);
    // baldosas con variación
    for (let ty = 0; ty < map.height; ty += 80) {
      for (let tx = 0; tx < map.width; tx += 80) {
        g.fillStyle = rnd() < 0.5 ? col.ground2 : col.ground;
        g.globalAlpha = 0.35 + rnd() * 0.4;
        g.fillRect(tx, ty, 80, 80);
      }
    }
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(255,255,255,0.045)'; g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= map.width; x += 80) { g.moveTo(x, 0); g.lineTo(x, map.height); }
    for (let y = 0; y <= map.height; y += 80) { g.moveTo(0, y); g.lineTo(map.width, y); }
    g.stroke();

    const cx = map.width / 2, cy = map.height / 2;
    if (map.id === 'ascent') {
      // calles en cruz y plaza central
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.fillRect(0, cy - 70, map.width, 140); g.fillRect(cx - 70, 0, 140, map.height);
      g.setLineDash([36, 28]); g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, cy); g.lineTo(map.width, cy); g.moveTo(cx, 0); g.lineTo(cx, map.height); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(79,208,224,0.07)'; g.beginPath(); g.arc(cx, cy, 300, 0, 7); g.fill();
      for (const r of [300, 240, 120]) { g.strokeStyle = 'rgba(79,208,224,0.25)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
      g.strokeStyle = 'rgba(79,208,224,0.35)'; g.lineWidth = 2;
      g.beginPath(); for (let a = 0; a < 8; a++) { g.moveTo(cx + Math.cos(a * 0.785) * 120, cy + Math.sin(a * 0.785) * 120); g.lineTo(cx + Math.cos(a * 0.785) * 300, cy + Math.sin(a * 0.785) * 300); } g.stroke();
    } else if (map.id === 'bind') {
      // arena y tuberías
      for (let i = 0; i < 60; i++) {
        g.fillStyle = `rgba(255,190,120,${0.03 + rnd() * 0.05})`;
        g.beginPath(); g.ellipse(rnd() * map.width, rnd() * map.height, 60 + rnd() * 120, 30 + rnd() * 60, rnd() * 3, 0, 7); g.fill();
      }
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 14; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 520); g.lineTo(1200, 520); g.lineTo(1200, 640); g.lineTo(map.width, 640); g.moveTo(0, 1060); g.lineTo(900, 1060); g.lineTo(900, 1200); g.stroke();
      g.strokeStyle = 'rgba(255,154,61,0.35)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 520); g.lineTo(1200, 520); g.lineTo(1200, 640); g.lineTo(map.width, 640); g.moveTo(0, 1060); g.lineTo(900, 1060); g.lineTo(900, 1200); g.stroke();
      // franjas de peligro
      g.fillStyle = 'rgba(255,190,0,0.14)';
      for (let i = 0; i < 20; i++) g.fillRect(cx - 200 + i * 20, cy + 400, 10, 24);
    } else {
      // jardines, estanque y caminos
      g.fillStyle = 'rgba(70,140,90,0.14)';
      for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(rnd() * map.width, rnd() * map.height, 70 + rnd() * 90, 50 + rnd() * 60, rnd() * 3, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(70,140,200,0.18)'; g.beginPath(); g.ellipse(cx, cy, 190, 120, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(160,220,255,0.3)'; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, 190, 120, 0, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(cx, cy, 190 + 24, 120 + 24, 0, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(210,180,140,0.12)'; g.lineWidth = 46;
      g.beginPath(); g.moveTo(0, cy); g.bezierCurveTo(600, cy - 300, 1700, cy + 300, map.width, cy); g.stroke();
    }

    // zonas de sitio (A/B/C) con marcas de peligro
    for (const z of map.zones ?? []) {
      g.save(); g.beginPath(); g.arc(z.x, z.y, z.r, 0, 7); g.clip();
      g.fillStyle = 'rgba(255,214,74,0.07)'; g.fillRect(z.x - z.r, z.y - z.r, z.r * 2, z.r * 2);
      g.strokeStyle = 'rgba(255,214,74,0.16)'; g.lineWidth = 10;
      g.beginPath(); for (let k = -z.r * 2; k < z.r * 2; k += 28) { g.moveTo(z.x + k, z.y - z.r); g.lineTo(z.x + k + z.r, z.y + z.r); } g.stroke();
      g.restore();
      g.strokeStyle = 'rgba(255,214,74,0.55)'; g.lineWidth = 4; g.setLineDash([22, 14]);
      g.beginPath(); g.arc(z.x, z.y, z.r, 0, 7); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,214,74,0.55)'; g.font = `900 ${Math.round(z.r * 0.9)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(z.label, z.x, z.y + 4); g.textBaseline = 'alphabetic';
    }

    // decoración dispersa que no choca con obstáculos
    const inObs = (x: number, y: number, m: number) => map.obstacles.some(o => x > o.x - m && x < o.x + o.w + m && y > o.y - m && y < o.y + o.h + m);
    for (let i = 0; i < 160; i++) {
      const x = rnd() * map.width, y = rnd() * map.height;
      if (inObs(x, y, 24)) continue;
      const k = rnd();
      if (map.id === 'haven' && k < 0.5) {
        g.fillStyle = 'rgba(40,120,70,0.55)'; g.beginPath(); g.arc(x, y, 8 + rnd() * 8, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,150,170,0.5)'; g.beginPath(); g.arc(x + 2, y - 2, 3, 0, 7); g.fill();
      } else if (map.id === 'bind' && k < 0.5) {
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 11, y - 9, 26, 22);
        g.fillStyle = '#6d4f33'; g.fillRect(x - 12, y - 12, 24, 22); g.strokeStyle = 'rgba(255,190,120,0.5)'; g.strokeRect(x - 12, y - 12, 24, 22);
      } else if (map.id === 'ascent' && k < 0.5) {
        g.fillStyle = 'rgba(255,255,255,0.1)'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill();
      } else {
        g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x, y, 10 + rnd() * 20, 2);
      }
    }

    // obstáculos con volumen
    for (const o of map.obstacles) {
      g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(o.x + 10, o.y + 12, o.w, o.h);
      g.fillStyle = col.wall; g.fillRect(o.x, o.y, o.w, o.h);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(o.x, o.y + o.h - 12, o.w, 12);
      g.fillStyle = col.wallTop; g.fillRect(o.x, o.y - 8, o.w, o.h - 4);
      g.strokeStyle = col.accent; g.globalAlpha = 0.75; g.lineWidth = 2; g.strokeRect(o.x + 0.5, o.y - 7.5, o.w - 1, o.h - 5);
      g.globalAlpha = 1;
      g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 1;
      g.beginPath();
      for (let x = o.x + 40; x < o.x + o.w - 8; x += 40) { g.moveTo(x, o.y - 8); g.lineTo(x, o.y + o.h - 12); }
      for (let y = o.y + 36; y < o.y + o.h - 12; y += 36) { g.moveTo(o.x, y); g.lineTo(o.x + o.w, y); }
      g.stroke();
    }

    // luces ambientales
    g.globalCompositeOperation = 'lighter';
    for (const o of map.obstacles) {
      for (const [lx, ly] of [[o.x, o.y + o.h], [o.x + o.w, o.y + o.h]]) {
        const gr = g.createRadialGradient(lx, ly, 2, lx, ly, 110);
        gr.addColorStop(0, hexA(col.light, 0.22)); gr.addColorStop(1, hexA(col.light, 0));
        g.fillStyle = gr; g.fillRect(lx - 110, ly - 110, 220, 220);
      }
    }
    g.globalCompositeOperation = 'source-over';
    // borde del mapa
    g.strokeStyle = col.accent; g.lineWidth = 10; g.globalAlpha = 0.6; g.strokeRect(5, 5, map.width - 10, map.height - 10); g.globalAlpha = 1;
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(0, 0, map.width, 24); g.fillRect(0, map.height - 24, map.width, 24); g.fillRect(0, 0, 24, map.height); g.fillRect(map.width - 24, 0, 24, map.height);
    this.mapCache = c;
    this.mapId = map.id;
  }

  render(e: GameEngine) {
    const g = this.ctx;
    const z = this.zoom;
    const vw = this.vw / z, vh = this.vh / z;
    if (this.mapId !== e.map.id || !this.mapCache) this.buildMap(e.map);
    const p = e.player;
    this.camX = Math.max(0, Math.min(e.map.width - vw, p.x - vw / 2));
    this.camY = Math.max(0, Math.min(e.map.height - vh, p.y - vh / 2));
    if (vw >= e.map.width) this.camX = (e.map.width - vw) / 2;
    if (vh >= e.map.height) this.camY = (e.map.height - vh) / 2;
    let sx = 0, sy = 0;
    if (this.shake && e.shakeT > 0) { const m = Math.min(1, e.shakeT * 5) * 6; sx = (Math.random() - 0.5) * m; sy = (Math.random() - 0.5) * m; }
    const cx = this.camX + sx, cy = this.camY + sy;

    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.fillStyle = '#0a0e13'; g.fillRect(0, 0, this.vw, this.vh);
    g.save();
    g.scale(z, z);
    g.translate(-cx, -cy);
    g.drawImage(this.mapCache, 0, 0);

    const L = cx - 60, T = cy - 60, R = cx + vw + 60, B = cy + vh + 60;
    const vis = (x: number, y: number, r = 0) => x + r > L && x - r < R && y + r > T && y - r < B;

    // teletransportadores
    for (const pair of e.map.portals ?? []) for (const pt of pair) {
      if (!vis(pt.x, pt.y, 60)) continue;
      const ph = e.time * 3;
      g.fillStyle = 'rgba(176,92,255,0.16)'; g.beginPath(); g.arc(pt.x, pt.y, 34, 0, 7); g.fill();
      g.strokeStyle = '#b05cff'; g.lineWidth = 3; g.beginPath(); g.arc(pt.x, pt.y, 30, 0, 7); g.stroke();
      g.strokeStyle = '#e2c4ff'; g.lineWidth = 2;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(pt.x, pt.y, 8 + i * 8, ph + i, ph + i + 3.2); g.stroke(); }
    }
    // gemas
    for (const m of e.gems) {
      if (!vis(m.x, m.y)) continue;
      const bob = Math.sin(m.t * 5) * 1.5;
      if (m.kind === 0) {
        g.fillStyle = m.v > 4 ? '#ffd24a' : m.v > 1.5 ? '#7dffcf' : '#4fd0ff';
        g.beginPath(); g.moveTo(m.x, m.y - 5 + bob); g.lineTo(m.x + 4, m.y + bob); g.lineTo(m.x, m.y + 5 + bob); g.lineTo(m.x - 4, m.y + bob); g.fill();
      } else {
        g.fillStyle = '#5dff9a'; g.fillRect(m.x - 2, m.y - 6 + bob, 4, 12); g.fillRect(m.x - 6, m.y - 2 + bob, 12, 4);
      }
    }
    // marcas de impacto de ataques de área
    for (const s of e.strikes) {
      if (!vis(s.x, s.y, s.r)) continue;
      const k = s.t / s.dur;
      g.fillStyle = hexA(s.color, 0.12 + k * 0.22); g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill();
      g.strokeStyle = hexA(s.color, 0.9); g.lineWidth = 2; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.stroke();
      g.beginPath(); g.arc(s.x, s.y, s.r * k, 0, 7); g.stroke();
    }
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
    for (const t of e.turrets) {
      if (!vis(t.x, t.y)) continue;
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.arc(t.x + 2, t.y + 3, 10, 0, 7); g.fill();
      g.fillStyle = '#2a323d'; g.beginPath(); g.arc(t.x, t.y, 10, 0, 7); g.fill();
      g.strokeStyle = t.color; g.lineWidth = 2; g.stroke();
      g.fillStyle = t.color; g.fillRect(t.x - 2, t.y - 2, 12, 4);
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
      if (b.dead || !vis(b.x, b.y)) continue;
      const sp = Math.hypot(b.vx, b.vy) || 1;
      const len = b.knife ? 14 : 9;
      g.strokeStyle = hexA(b.color, 0.45); g.lineWidth = b.r * 2.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(b.x - (b.vx / sp) * len, b.y - (b.vy / sp) * len); g.lineTo(b.x, b.y); g.stroke();
      g.strokeStyle = b.crit ? '#ffe9a0' : '#ffffff'; g.lineWidth = b.r * 0.9;
      g.beginPath(); g.moveTo(b.x - (b.vx / sp) * len * 0.6, b.y - (b.vy / sp) * len * 0.6); g.lineTo(b.x, b.y); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    // drones
    for (let i = 0; i < e.stats.drones; i++) {
      const a = e.droneAngle + (i / e.stats.drones) * Math.PI * 2;
      const dx = p.x + Math.cos(a) * 52, dy = p.y + Math.sin(a) * 52;
      g.fillStyle = '#1a2230'; g.strokeStyle = e.agent.accent; g.lineWidth = 2;
      g.beginPath(); g.moveTo(dx, dy - 6); g.lineTo(dx + 6, dy); g.lineTo(dx, dy + 6); g.lineTo(dx - 6, dy); g.closePath(); g.fill(); g.stroke();
    }
    this.drawPlayer(g, e);
    // fx
    g.globalCompositeOperation = 'lighter';
    for (const f of e.fxs.items) {
      if (f.life <= 0) continue;
      const k = 1 - f.life / f.max;
      if (f.kind === 0) {
        g.strokeStyle = hexA(f.color, 1 - k); g.lineWidth = 5 * (1 - k) + 1;
        g.beginPath(); g.arc(f.x, f.y, f.r * (0.25 + k * 0.75), 0, 7); g.stroke();
        g.fillStyle = hexA(f.color, 0.18 * (1 - k)); g.beginPath(); g.arc(f.x, f.y, f.r * (0.25 + k * 0.75), 0, 7); g.fill();
      } else {
        g.strokeStyle = hexA(f.color, 1 - k); g.lineWidth = 3;
        g.beginPath(); g.moveTo(f.x, f.y);
        const n = 4;
        for (let i = 1; i < n; i++) g.lineTo(f.x + (f.x2 - f.x) * (i / n) + (Math.random() - 0.5) * 14, f.y + (f.y2 - f.y) * (i / n) + (Math.random() - 0.5) * 14);
        g.lineTo(f.x2, f.y2); g.stroke();
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
    // números flotantes
    g.textAlign = 'center';
    for (const t of e.texts.items) {
      if (t.life <= 0 || !vis(t.x, t.y)) continue;
      g.globalAlpha = Math.min(1, t.life * 2.2);
      g.font = `800 ${t.size}px "Bahnschrift","Arial Narrow",sans-serif`;
      g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.strokeText(t.text, t.x, t.y);
      g.fillStyle = t.color; g.fillText(t.text, t.x, t.y);
    }
    g.globalAlpha = 1;
    g.restore();

    // polvo ambiental (en pantalla)
    g.fillStyle = 'rgba(255,255,255,0.10)';
    const tm = e.time;
    for (let i = 0; i < 36; i++) {
      const x = ((i * 197 + tm * (6 + (i % 5) * 3) - this.camX * 0.25) % this.vw + this.vw) % this.vw;
      const y = ((i * 311 - tm * (4 + (i % 4) * 3) - this.camY * 0.25) % this.vh + this.vh) % this.vh;
      g.fillRect(x, y, 2, 2);
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
    if (e.buffs.sprintT > 0 || e.buffs.frenzyT > 0 || e.buffs.stormT > 0) {
      g.strokeStyle = hexA(a.color, 0.6 + 0.3 * Math.sin(t * 14)); g.lineWidth = 2;
      g.beginPath(); g.arc(p.x, p.y, p.r + 12, 0, 7); g.stroke();
    }
    if (p.invuln > 0) { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, p.r + 10, 0, 7); g.stroke(); }
    if (p.shield > 0) { g.strokeStyle = 'rgba(122,215,255,0.65)'; g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, p.r + 7, 0, 7); g.stroke(); }

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
    const k = 1.95, dw = SW * k, dh = SH * k;
    const flip = Math.cos(p.face) < 0;
    const bob = casting ? -3 : moving ? (frame % 2) * 2 : Math.sin(t * 3) * 0.8;
    let lean = moving ? Math.max(-1, Math.min(1, e.inputMove.x)) * (sprint ? 0.16 : 0.07) : 0;
    let sx = 1, sy = moving || casting ? 1 : 1 + Math.sin(t * 3) * 0.018;
    if (dashing) { lean = Math.sign(p.dashVx) * 0.3; sx = 1.2; sy = 0.88; }
    if (casting) { const s = 1 + Math.sin(castK * Math.PI) * 0.12; sx = s; sy = s; }
    const spr = spriteCanvas(a.id, this.makeCanvas, 3, pose);
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
    const aimUp = Math.sin(p.face) < -0.4;
    const drawGun = () => {
      if (casting || dashing) return;
      const gs = gunSize(e.held), gc = gunCanvas(e.held, WEAPONS[e.held].color, this.makeCanvas, 3);
      const gw = gs.w * 1.5, gh = gs.h * 1.5;
      const recoil = Math.max(0, 1 - (t - e.lastShotT) / 0.09) * 4;
      g.save(); g.globalAlpha = blink ? 0.4 : 1;
      g.translate(p.x, baseY - dh * 0.42 - (moving ? (frame % 2) * 1 : 0));
      let ang = p.face;
      if (flip) { g.scale(-1, 1); ang = Math.PI - ang; }
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
  }

  private drawEnemy(g: Ctx, en: Enemy, e: GameEngine) {
    const d = en.def, r = en.r, x = en.x, y = en.y;
    const flash = en.flash > 0;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x + 2, y + r * 0.6, r, r * 0.6, 0, 0, 7); g.fill();
    const base = flash ? '#ffffff' : en.stunT > 0 ? '#8a94a6' : d.color;
    const dark = flash ? '#ffffff' : '#10151c';
    g.save(); g.translate(x, y);
    const pulse = en.fuse > 0 ? 1 + Math.sin(en.anim * 40) * 0.18 : 1;
    g.scale(pulse, pulse);
    if (!en.isBoss && en.stunT <= 0) g.rotate(Math.sin(en.anim * (d.id === 'runner' ? 16 : 9)) * 0.09);
    g.lineWidth = 2;
    switch (d.shape) {
      case 'circle':
        g.fillStyle = dark; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
        g.fillStyle = base; g.beginPath(); g.arc(0, 0, r - 3, 0, 7); g.fill(); break;
      case 'tri': {
        g.rotate(en.face);
        g.fillStyle = base; g.strokeStyle = dark;
        g.beginPath(); g.moveTo(r + 3, 0); g.lineTo(-r, -r); g.lineTo(-r * 0.4, 0); g.lineTo(-r, r); g.closePath(); g.fill(); g.stroke(); break;
      }
      case 'square':
        g.fillStyle = dark; g.fillRect(-r, -r, r * 2, r * 2);
        g.fillStyle = base; g.fillRect(-r + 3, -r + 3, r * 2 - 6, r * 2 - 6);
        g.fillStyle = dark; g.fillRect(-r + 7, -3, r * 2 - 14, 6); break;
      case 'diamond':
        g.fillStyle = base; g.strokeStyle = dark;
        g.beginPath(); g.moveTo(0, -r - 2); g.lineTo(r + 2, 0); g.lineTo(0, r + 2); g.lineTo(-r - 2, 0); g.closePath(); g.fill(); g.stroke();
        if (en.windup > 0) { g.strokeStyle = '#fff'; g.beginPath(); g.arc(0, 0, r + 6, 0, 7); g.stroke(); }
        g.fillStyle = dark; g.beginPath(); g.arc(Math.cos(en.face) * 3, Math.sin(en.face) * 3, 3, 0, 7); g.fill(); break;
      case 'spike': {
        g.fillStyle = base; g.strokeStyle = dark;
        g.beginPath();
        for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + en.anim * 2, rr = i % 2 ? r - 2 : r + 5; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        g.closePath(); g.fill(); g.stroke();
        g.fillStyle = en.fuse > 0 && Math.floor(en.anim * 14) % 2 ? '#fff' : dark; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); break;
      }
      case 'hex':
        g.fillStyle = base; g.strokeStyle = dark; g.lineWidth = 3;
        g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; g.lineTo(Math.cos(a) * (r + 3), Math.sin(a) * (r + 3)); } g.closePath(); g.fill(); g.stroke();
        g.fillStyle = dark; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
        if (en.windup > 0) { g.strokeStyle = '#fff'; g.beginPath(); g.arc(0, 0, r + 9, 0, 7); g.stroke(); }
        break;
      case 'boss': {
        g.fillStyle = dark; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
        g.lineWidth = 5; g.strokeStyle = base; g.beginPath(); g.arc(0, 0, r - 3, 0, 7); g.stroke();
        g.fillStyle = hexA(d.color, flash ? 1 : 0.35); g.beginPath(); g.arc(0, 0, r - 8, 0, 7); g.fill();
        g.save(); g.rotate(en.anim * (en.phase ? 1.4 : 0.6));
        g.fillStyle = base;
        for (let i = 0; i < 6; i++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(r - 2, -5); g.lineTo(r + 12, 0); g.lineTo(r - 2, 5); g.closePath(); g.fill(); }
        g.restore();
        g.fillStyle = base; g.beginPath(); g.arc(Math.cos(en.face) * 8, Math.sin(en.face) * 8, 9, 0, 7); g.fill();
        g.fillStyle = dark; g.beginPath(); g.arc(Math.cos(en.face) * 10, Math.sin(en.face) * 10, 4, 0, 7); g.fill();
        break;
      }
    }
    g.restore();
    if (en.markT > 0) { g.strokeStyle = '#5c8bff'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r + 5, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x - r - 8, y); g.lineTo(x - r - 2, y); g.moveTo(x + r + 2, y); g.lineTo(x + r + 8, y); g.stroke(); }
    if (en.burnT > 0) { g.fillStyle = 'rgba(255,122,61,0.45)'; g.beginPath(); g.arc(x, y - r * 0.4, r * 0.55, 0, 7); g.fill(); }
    if (en.slowT > 0) { g.strokeStyle = 'rgba(122,184,255,0.7)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r + 3, 0, 7); g.stroke(); }
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
