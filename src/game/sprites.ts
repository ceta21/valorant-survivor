// Sprites pixel-art de los agentes, dibujados por código (sin imágenes externas).
// Cada agente tiene 3 vistas: de frente, de espaldas y de lado (mirando a la derecha; la izquierda es el
// espejo), con fotogramas de andar/correr y una pose de lanzar habilidad.
import { AGENT_IMAGES } from '../data/agentImages';
import { AGENT_SKIN_BY_ID } from '../data/shop';
export const SW = 22;
export const SH = 30;
export type Grid = (string | null)[][];
export type Dir = 'front' | 'back' | 'side';

type Hair =
  | 'short' | 'fade' | 'crest' | 'jett' | 'long' | 'longpony' | 'tied' | 'beanie' | 'fedora' | 'hood' | 'helmet'
  | 'afro' | 'slick' | 'pigtails' | 'bun' | 'braid' | 'spiky' | 'topknot' | 'cap' | 'beret' | 'bald';
interface Look {
  skin: string; hair: string; style: Hair;
  top: string; top2?: string; sleeve?: string; trim: string; pants: string; boots: string;
  gloves?: string; hat?: string; beard?: string; eyes?: string; visor?: string;
  /** Sin piel visible (robot, capucha oscura): manos del color de la manga. */
  dark?: boolean;
  acc?: string[];
}
const OUT = '#10151c';

/** Pose de animación: elevación de cada pierna (lL,lR), desplazamiento de brazos (aL,aR) y brazos arriba. */
export interface Pose { lL: number; lR: number; aL: number; aR: number; raise?: boolean }
export const IDLE: Pose = { lL: 0, lR: 0, aL: 0, aR: 0 };
export const WALK: Pose[] = [
  { lL: 0, lR: 0, aL: 0, aR: 0 }, { lL: 1, lR: 0, aL: 1, aR: -1 }, { lL: 0, lR: 0, aL: 0, aR: 0 }, { lL: 0, lR: 1, aL: -1, aR: 1 },
];
export const RUN: Pose[] = [
  { lL: 2, lR: 0, aL: 2, aR: -1 }, { lL: 1, lR: 1, aL: 1, aR: 0 }, { lL: 0, lR: 2, aL: -1, aR: 2 }, { lL: 1, lR: 1, aL: 0, aR: 1 },
];
export const CAST: Pose = { lL: 0, lR: 0, aL: 0, aR: 0, raise: true };

/** Aclara (k>0) u oscurece (k<0) un color #rrggbb. */
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k))));
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map(c => f(c).toString(16).padStart(2, '0')).join('')}`;
}

/* ------------------------------------------------------------------ aspecto de cada agente */
const LOOKS: Record<string, Look> = {
  // exclusivos del mercado nocturno (los héroes usan su hoja de sprites)
  eclipse: { skin: '#d8b49a', hair: '#1b1530', style: 'long', top: '#2a1f4a', top2: '#9b7bff', trim: '#ffd24a', pants: '#181230', boots: '#0e0a1c', eyes: '#ffd24a', acc: ['goldface'] },
  vortice: { skin: '#c98d6a', hair: '#ff3d81', style: 'pigtails', top: '#1f1f2a', top2: '#ff3d81', trim: '#ffffff', pants: '#2a2a36', boots: '#ff3d81', acc: ['goggles'] },
  quimera: { skin: '#8a5a3a', hair: '#e8f1f8', style: 'crest', hat: '#5dff9a', beard: '#e8f1f8', top: '#24413a', top2: '#5dff9a', trim: '#ffe14a', pants: '#1a2a26', boots: '#0f1a18', acc: ['beard'] },
};
export const agentSkin = (id: string) => (LOOKS[id] ?? LOOKS.eclipse).skin;

/* ------------------------------------------------------------------ dibujo */
export function buildSprite(id: string, pose: Pose = IDLE, dir: Dir = 'front'): Grid {
  const L = LOOKS[id] ?? LOOKS.eclipse;
  const g: Grid = Array.from({ length: SH }, () => Array<string | null>(SW).fill(null));
  const px = (x: number, y: number, c: string | null) => { if (x >= 0 && x < SW && y >= 0 && y < SH) g[y][x] = c; };
  const rect = (x: number, y: number, w: number, h: number, c: string | null) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };

  const sleeve = L.sleeve ?? L.top, hand = L.gloves ?? (L.dark ? sleeve : L.skin);
  const top2 = L.top2 ?? shade(L.top, -0.2), hat = L.hat ?? L.hair, beard = L.beard ?? L.hair;
  const skinD = shade(L.skin, -0.18), topD = shade(L.top, -0.22), pantsD = shade(L.pants, -0.25), sleeveD = shade(sleeve, -0.22);
  const eye = L.eyes ?? '#1a1f2b';
  const has = (a: string) => (L.acc ?? []).includes(a);

  if (dir === 'side') drawSide(); else drawFrontBack(dir === 'back');

  /* ---------------- de frente / de espaldas */
  function drawFrontBack(back: boolean) {
    // piernas y botas (las rodillas suben al andar)
    const legL = 8 - pose.lL, legR = 8 - pose.lR;
    rect(7, 17, 3, legL, L.pants); rect(12, 17, 3, legR, L.pants);
    rect(9, 17, 1, legL, pantsD); rect(14, 17, 1, legR, pantsD);
    rect(6, 17 + legL, 4, 2, L.boots); rect(12, 17 + legR, 4, 2, L.boots);
    // brazos
    if (pose.raise) {
      rect(4, 5, 2, 6, sleeve); rect(16, 5, 2, 6, sleeve); rect(4, 3, 2, 2, hand); rect(16, 3, 2, 2, hand);
    } else {
      rect(4, 11 + pose.aL, 2, 6, sleeve); rect(16, 11 + pose.aR, 2, 6, sleeve);
      rect(4, 11 + pose.aL, 1, 6, sleeveD); rect(17, 11 + pose.aR, 1, 6, sleeveD);
      rect(4, 17 + pose.aL, 2, 2, hand); rect(16, 17 + pose.aR, 2, 2, hand);
    }
    // torso
    rect(6, 10, 10, 2, L.top); rect(7, 12, 8, 5, L.top);
    rect(7, 12, 1, 5, topD); rect(14, 12, 1, 5, topD);
    if (back) rect(8, 11, 6, 5, shade(L.top, -0.12));     // espalda: panel liso
    else { rect(9, 11, 4, 5, top2); px(9, 11, L.top); px(12, 11, L.top); }  // frente: prenda interior
    rect(7, 16, 8, 1, L.trim);                              // cinturón
    rect(10, 9, 2, 1, L.dark ? sleeve : skinD);             // cuello
    head(back);
  }

  function head(back: boolean) {
    const st = L.style;
    const covered = ['hood', 'helmet', 'beanie', 'fedora', 'cap', 'beret', 'bald'].includes(st);
    // base de la cabeza: cara de frente, pelo de espaldas
    if (st === 'hood') { rect(6, 0, 10, 10, hat); rect(5, 4, 1, 6, hat); rect(16, 4, 1, 6, hat); if (!back) rect(8, 3, 6, 6, L.skin); }
    else if (st === 'helmet') { rect(7, 0, 8, 9, hat); rect(7, 0, 1, 9, shade(hat, -0.2)); if (!back) { rect(8, 3, 6, 2, L.visor ?? '#2fe6ff'); rect(9, 6, 4, 2, shade(hat, -0.3)); } }
    else {
      // de espaldas se ve el pelo (también bajo gorras y sombreros), salvo si es calvo
      rect(7, 2, 8, 7, back && st !== 'bald' ? L.hair : L.skin);
      if (back && covered) rect(7, 8, 8, 1, skinD);
      if (!back) { px(7, 5, skinD); px(14, 5, skinD); }
    }
    // peinados y sombreros
    switch (st) {
      case 'short': case 'fade': case 'crest': case 'jett': case 'tied': case 'slick': case 'bun': case 'braid': case 'spiky': case 'topknot': case 'pigtails': case 'longpony':
        rect(7, 1, 8, 2, L.hair); if (!back) { px(7, 3, L.hair); px(14, 3, L.hair); }
        break;
      case 'long': rect(7, 1, 8, 2, L.hair); rect(6, 2, 2, 9, L.hair); rect(14, 2, 2, 9, L.hair); if (back) rect(7, 2, 8, 9, L.hair); break;
      case 'afro': rect(5, 0, 12, 5, L.hair); rect(4, 2, 1, 3, L.hair); rect(17, 2, 1, 3, L.hair); px(6, 1, '#ffd24a'); px(15, 2, '#ffd24a'); px(10, 0, '#ffd24a'); if (back) rect(6, 5, 10, 3, L.hair); break;
      case 'beanie': rect(6, 0, 10, 3, hat); rect(6, 2, 10, 1, shade(hat, -0.25)); px(10, 0, shade(hat, 0.3)); break;
      case 'fedora': rect(7, 0, 8, 2, hat); rect(7, 1, 8, 1, '#3a3a40'); rect(5, 2, 12, 1, shade(hat, -0.15)); break;
      case 'cap': rect(7, 0, 8, 2, hat); if (!back) rect(6, 2, 10, 1, shade(hat, -0.3)); else rect(7, 2, 8, 1, shade(hat, -0.3)); break;
      case 'beret': rect(6, 0, 9, 2, hat); px(15, 1, hat); px(5, 1, shade(hat, -0.2)); rect(7, 2, 8, 1, shade(hat, -0.35)); break;
    }
    if (st === 'fade') rect(8, 0, 6, 1, L.hair);
    if (st === 'crest') { rect(9, 0, 4, 1, hat); px(10, 0, shade(hat, 0.3)); }
    if (st === 'spiky') { for (const x of [7, 9, 11, 13]) px(x, 0, L.hair); }
    if (st === 'topknot') rect(10, 0, 2, 1, L.hair);
    if (st === 'bun') rect(9, 0, 4, 1, L.hair);
    if (st === 'slick') px(9, 1, shade(L.hair, 0.35));
    if (st === 'jett') { if (back) rect(10, 8, 2, 2, L.hair); else { rect(15, 3, 1, 3, L.hair); px(16, 4, L.hair); } }
    if (st === 'tied') { if (back) rect(10, 0, 2, 2, L.hair); else rect(14, 1, 2, 2, L.hair); }
    if (st === 'longpony') { if (back) rect(10, 8, 2, 6, L.hair); else { rect(7, 2, 2, 1, L.hair); rect(15, 3, 1, 5, L.hair); } }
    if (st === 'braid') { if (back) rect(10, 8, 2, 6, L.hair); else rect(15, 3, 1, 7, L.hair); }
    if (st === 'pigtails') { rect(4, 2, 2, 7, L.hair); rect(16, 2, 2, 7, L.hair); }
    if (back) { if (has('goggles')) rect(7, 3, 8, 1, '#2a2a2a'); if (has('scarf')) rect(7, 9, 8, 2, '#f2f6fa'); return; }
    // cara (de frente)
    if (st !== 'helmet') {
      px(9, 5, eye); px(12, 5, eye);
      if (!L.dark) { px(10, 7, skinD); px(11, 7, skinD); }
    }
    if (has('beard')) { rect(7, 7, 8, 2, beard); px(7, 6, beard); px(14, 6, beard); px(10, 7, shade(L.skin, -0.35)); px(11, 7, shade(L.skin, -0.35)); }
    if (has('mustache')) rect(9, 7, 4, 1, beard);
    if (has('respirator')) { rect(8, 6, 6, 3, '#2f5a34'); px(9, 7, '#5dff9a'); px(12, 7, '#5dff9a'); }
    if (has('mask')) { rect(7, 5, 8, 4, '#efe9da'); px(9, 5, '#4fd0ff'); px(12, 5, '#4fd0ff'); rect(9, 7, 4, 1, '#c8c0aa'); }
    if (has('goggles')) { rect(7, 3, 8, 1, '#2a2a2a'); rect(8, 3, 2, 1, '#ffd37a'); rect(12, 3, 2, 1, '#ffd37a'); }
    if (has('glasses')) { px(8, 5, '#111'); px(10, 5, '#111'); px(11, 5, '#111'); px(13, 5, '#111'); px(9, 5, '#9adfff'); px(12, 5, '#9adfff'); }
    if (has('cybereye')) px(12, 5, '#4fd0ff');
    if (has('goldface')) { px(8, 6, '#ffd24a'); px(13, 6, '#ffd24a'); }
    if (has('scarf')) rect(7, 9, 8, 2, '#f2f6fa');
    if (has('bolt')) for (const [x, y] of [[11, 12], [10, 13], [11, 13], [10, 14]]) px(x, y, L.trim);
  }

  /* ---------------- de lado (mirando a la derecha) */
  function drawSide() {
    // zancada: la pierna que avanza va adelante y la otra atrás
    const stride = pose.lL - pose.lR;
    const nearX = 10 + Math.sign(stride), farX = 10 - Math.sign(stride);
    rect(farX, 17, 3, 8 - pose.lR, pantsD); rect(farX - 1 + (stride < 0 ? 1 : 0), 25 - pose.lR, 4, 2, shade(L.boots, -0.2));
    // brazo de atrás
    if (!pose.raise) { rect(9 - pose.aR, 11, 2, 6, sleeveD); rect(9 - pose.aR, 17, 2, 2, shade(hand, -0.2)); }
    // torso
    rect(8, 10, 6, 7, L.top); rect(8, 10, 1, 7, topD); rect(12, 11, 2, 5, top2); rect(8, 16, 6, 1, L.trim);
    rect(10, 9, 2, 1, L.dark ? sleeve : skinD);
    // pierna de delante
    rect(nearX, 17, 3, 8 - pose.lL, L.pants); rect(nearX + (stride > 0 ? 0 : -1), 25 - pose.lL, 4, 2, L.boots); px(nearX + 3 + (stride > 0 ? 0 : -1), 26 - pose.lL, L.boots);
    // brazo de delante
    if (pose.raise) { rect(11, 4, 2, 7, sleeve); rect(11, 2, 2, 2, hand); }
    else { rect(10 + pose.aL, 11, 2, 6, sleeve); rect(10 + pose.aL, 17, 2, 2, hand); }
    sideHead();
  }

  function sideHead() {
    const st = L.style;
    if (st === 'hood') { rect(7, 0, 8, 10, hat); rect(11, 3, 4, 6, L.skin); px(13, 5, eye); return; }
    if (st === 'helmet') { rect(8, 0, 7, 9, hat); rect(8, 0, 1, 9, shade(hat, -0.2)); rect(12, 3, 3, 2, L.visor ?? '#2fe6ff'); rect(12, 6, 3, 2, shade(hat, -0.3)); return; }
    rect(9, 2, 6, 7, L.skin); px(15, 5, L.skin); px(10, 5, skinD);   // cara, nariz y oreja
    // pelo detrás y arriba
    const back = () => { rect(8, 1, 6, 2, L.hair); rect(8, 3, 2, 4, L.hair); };
    switch (st) {
      case 'short': case 'fade': case 'crest': case 'jett': case 'tied': case 'slick': case 'bun': case 'braid': case 'spiky': case 'topknot': case 'pigtails': case 'longpony': back(); break;
      case 'long': back(); rect(7, 2, 3, 9, L.hair); break;
      case 'afro': rect(6, 0, 9, 6, L.hair); px(7, 1, '#ffd24a'); px(12, 0, '#ffd24a'); break;
      case 'beanie': rect(8, 0, 7, 3, hat); rect(8, 2, 7, 1, shade(hat, -0.25)); rect(8, 3, 2, 3, L.hair); break;
      case 'fedora': rect(8, 0, 7, 2, hat); rect(8, 1, 7, 1, '#3a3a40'); rect(6, 2, 11, 1, shade(hat, -0.15)); rect(8, 3, 2, 3, L.hair); break;
      case 'cap': rect(8, 0, 7, 2, hat); rect(14, 2, 3, 1, shade(hat, -0.3)); rect(8, 2, 2, 3, L.hair); break;
      case 'beret': rect(8, 0, 7, 2, hat); px(7, 1, hat); rect(8, 2, 6, 1, shade(hat, -0.35)); rect(8, 3, 2, 3, L.hair); break;
      default: break;
    }
    if (st === 'fade') rect(9, 0, 4, 1, L.hair);
    if (st === 'crest') { rect(10, 0, 4, 1, hat); px(13, 0, shade(hat, 0.3)); }
    if (st === 'spiky') { px(8, 0, L.hair); px(10, 0, L.hair); px(12, 0, L.hair); px(7, 1, L.hair); }
    if (st === 'topknot') rect(9, 0, 2, 1, L.hair);
    if (st === 'bun') rect(7, 0, 3, 2, L.hair);
    if (st === 'jett') rect(7, 3, 1, 3, L.hair);
    if (st === 'tied') rect(6, 2, 2, 2, L.hair);
    if (st === 'longpony') { rect(7, 3, 1, 3, L.hair); rect(6, 5, 1, 5, L.hair); }
    if (st === 'braid') rect(7, 3, 1, 8, L.hair);
    if (st === 'pigtails') rect(7, 3, 1, 7, L.hair);
    // cara de perfil
    px(13, 5, eye);
    if (!L.dark) px(14, 7, skinD);
    if (has('beard')) { rect(11, 6, 4, 3, beard); px(14, 7, shade(L.skin, -0.35)); }
    if (has('mustache')) rect(13, 7, 2, 1, beard);
    if (has('respirator')) { rect(12, 6, 3, 3, '#2f5a34'); px(14, 7, '#5dff9a'); }
    if (has('mask')) { rect(11, 5, 4, 4, '#efe9da'); px(13, 5, '#4fd0ff'); }
    if (has('goggles')) { rect(8, 3, 6, 1, '#2a2a2a'); rect(13, 3, 2, 1, '#ffd37a'); }
    if (has('glasses')) { rect(12, 5, 3, 1, '#111'); px(13, 5, '#9adfff'); }
    if (has('cybereye')) px(13, 5, '#4fd0ff');
    if (has('goldface')) px(13, 6, '#ffd24a');
    if (has('scarf')) rect(9, 9, 5, 2, '#f2f6fa');
    if (has('bolt')) px(12, 12, L.trim);
  }

  // contorno automático
  const out: Grid = g.map(r => r.slice());
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    if (g[y][x]) continue;
    if (g[y - 1]?.[x] || g[y + 1]?.[x] || g[y]?.[x - 1] || g[y]?.[x + 1]) out[y][x] = OUT;
  }
  return out;
}

/* ------------------------------------------------------------------ agentes sacados de su hoja de sprites */
// Fotogramas recortados de la imagen del agente (scripts/cut-agent.ts) y guardados con sus colores exactos en
// public/agents/<id>.png: una fila por vista (frente, espalda, lado) y una columna por paso. Ya traen su
// contorno y su arma. "side" mira a la derecha; la izquierda es el espejo.
const ROW: Record<Dir, number> = { front: 0, back: 1, side: 2 };
const sheets = new Map<string, any>();   // id → imagen cargada (null mientras carga)
/** Dirección de la hoja de un agente. */
export const agentSheetUrl = (id: string) => `${(import.meta as any).env?.BASE_URL ?? './'}agents/${id}.png`;
/** Columnas de la hoja (el máximo de pasos entre las tres vistas). */
export const sheetCols = (id: string) => { const A = AGENT_IMAGES[id]; return Math.max(A.front, A.back, A.side); };
/** Da la hoja ya cargada (las herramientas de Node la pasan a mano). */
export function setAgentSheet(id: string, img: any) {
  sheets.set(id, img);
  for (const k of [...cache.keys()]) if (k.startsWith(id + '@')) cache.delete(k);
}
const waiting = new Map<string, Promise<void>>();
function sheetOf(id: string) {
  if (!sheets.has(id) && typeof Image !== 'undefined') {
    sheets.set(id, null);
    const im = new Image();
    waiting.set(id, new Promise(ok => { im.onload = () => { setAgentSheet(id, im); ok(); }; im.onerror = () => ok(); }));
    im.src = agentSheetUrl(id);
  }
  return sheets.get(id) ?? null;
}
/** Espera a que la hoja del agente esté cargada (o ya no haga falta). */
export function agentSheetReady(id: string): Promise<void> {
  if (!hasImage(id) || sheetOf(id)) return Promise.resolve();
  return waiting.get(id) ?? Promise.resolve();
}
/** Empieza a cargar todas las hojas (al arrancar el juego, para que estén listas al jugar). */
export function preloadAgentSheets() { for (const id of Object.keys(AGENT_IMAGES)) sheetOf(id); }
/** El agente usa los fotogramas de su imagen (y no el muñeco dibujado por código). */
export const hasImage = (id: string) => id in AGENT_IMAGES;
/** Tamaño del sprite en píxeles y unidades de mundo por píxel. */
export function spriteSize(id: string) {
  const A = AGENT_IMAGES[id];
  return A ? { w: A.w, h: A.h, px: A.px } : { w: SW, h: SH, px: 2 };
}
/** Número de fotogramas de andar de una vista (1 = se anima con la pose). */
export const walkFrames = (id: string, dir: Dir) => AGENT_IMAGES[id]?.[dir] ?? 1;

/** Runs horizontales del mismo color (para dibujar SVG con pocos nodos). Vista de frente del muñeco dibujado. */
export function spriteRuns(id: string): { x: number; y: number; w: number; c: string }[] {
  const g = buildSprite(id), runs: { x: number; y: number; w: number; c: string }[] = [];
  for (let y = 0; y < SH; y++) {
    let x = 0;
    while (x < SW) {
      const c = g[y][x];
      if (!c) { x++; continue; }
      let w = 1;
      while (x + w < SW && g[y][x + w] === c) w++;
      runs.push({ x, y, w, c });
      x += w;
    }
  }
  return runs;
}

/** Estilo de agente (tienda): pasa la ropa y la armadura a la gama del estilo según su brillo.
 *  No toca el contorno ni los tonos de piel. */
function applySkin(c: any, skin: string) {
  const ramp = AGENT_SKIN_BY_ID[skin]?.ramp;
  if (!ramp) return;
  const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data;
  const rgb = ramp.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255;
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2;
    if (l < 0.13) continue;   // contorno
    const s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
    let hue = 0;
    if (mx !== mn) hue = mx === r ? ((gg - b) / (mx - mn)) % 6 : mx === gg ? (b - r) / (mx - mn) + 2 : (r - gg) / (mx - mn) + 4;
    hue = (hue * 60 + 360) % 360;
    if (hue >= 8 && hue <= 45 && s > 0.25 && s < 0.9 && l > 0.42 && l < 0.9) continue;   // piel
    const k = Math.min(rgb.length - 1, Math.max(0, Math.round(((l - 0.13) / 0.87) * (rgb.length - 1) + 0.3)));
    [d[i], d[i + 1], d[i + 2]] = rgb[k];
  }
  g.putImageData(im, 0, 0);
}

const cache = new Map<string, any>();
/** Sprite ya pintado en un canvas (escala entera, sin suavizado). `skin`: estilo de agente de la tienda. */
export function spriteCanvas(id: string, make: (w: number, h: number) => any, scale = 3, pose: Pose = IDLE, dir: Dir = 'front', frame = 0, skin = '') {
  const { w: GW, h: GH } = spriteSize(id);
  if (hasImage(id)) {
    const col = frame % walkFrames(id, dir), key = `${id}@${scale}|${dir}|f${col}|${skin}`, sheet = sheetOf(id);
    let c = cache.get(key);
    if (c) return c;
    c = make(GW * scale, GH * scale);
    if (!sheet) return c;   // aún cargando: transparente (sin guardar)
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(sheet, col * GW, ROW[dir] * GH, GW, GH, 0, 0, GW * scale, GH * scale);
    applySkin(c, skin);
    cache.set(key, c);
    return c;
  }
  const key = `${id}@${scale}|${dir}|${pose.lL}${pose.lR}${pose.aL}${pose.aR}${pose.raise ? 1 : 0}|${skin}`;
  let c = cache.get(key);
  if (c) return c;
  c = make(GW * scale, GH * scale);
  const g = c.getContext('2d');
  const grid = buildSprite(id, pose, dir);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const col = grid[y][x];
    if (col) { g.fillStyle = col; g.fillRect(x * scale, y * scale, scale, scale); }
  }
  applySkin(c, skin);
  cache.set(key, c);
  return c;
}
