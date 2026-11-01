// Bots de la grieta dibujados por código, siguiendo la estética de art/enemigos.png: chapa gris, visores y núcleos
// rojos; el élite más oscuro con detalles morados y el legendario casi negro con grietas rojas que brillan.
// Cada bot tiene vista de frente, de espaldas y de perfil (mirando a la derecha; la izquierda es el espejo) y
// 4 fotogramas al andar. Contorno oscuro automático.
import { Grid } from './sprites';

type Make = (w: number, h: number) => any;
export type BotDir = 'front' | 'back' | 'side';
const OUT = '#0d0b14';

/** Paleta de cada nivel: L claro, M medio, D oscuro, X muy oscuro, glow/glowL brillo, trim detalle propio. */
interface Pal { L: string; M: string; D: string; X: string; glow: string; glowL: string; trim: string }
export const TIER_PAL: Pal[] = [
  { L: '#b4bacb', M: '#757c96', D: '#474d66', X: '#252839', glow: '#ff3344', glowL: '#ffb0b6', trim: '#9aa1b8' },
  { L: '#9196ad', M: '#5c6079', D: '#383b52', X: '#1d1f31', glow: '#ff3344', glowL: '#ffb0b6', trim: '#a35cff' },
  { L: '#7a7088', M: '#4b425e', D: '#2e2740', X: '#171221', glow: '#ff2a40', glowL: '#ffd0d6', trim: '#ff4655' },
];

interface Pen {
  px: (x: number, y: number, c: string | null) => void;
  rect: (x: number, y: number, w: number, h: number, c: string | null) => void;
  oval: (cx: number, cy: number, rx: number, ry: number, c: string) => void;
  /** Forma redondeada con volumen: claro arriba a la izquierda, oscuro abajo a la derecha. */
  ball: (cx: number, cy: number, rx: number, ry: number, C: Pal) => void;
}

/** Soldado: casco redondo con visor que lo rodea, hombreras grandes, rifle pesado. Élite: rifle más largo y ribetes
 *  morados. Legendario: más corpulento, pinchos en las hombreras y grietas rojas que brillan. */
function soldado(P: Pen, C: Pal, dir: BotDir, f: number, tier: number) {
  const { px, rect, ball } = P;
  const y0 = f % 2;                                   // el cuerpo baja un píxel en cada paso
  const big = tier === 2 ? 1 : 0;
  // ---- piernas
  if (dir === 'side') {
    const s = f === 1 ? -2 : f === 3 ? 2 : 0;
    leg(P, C, 10 - s, 18 + y0, C.D); leg(P, C, 11 + s, 18 + y0, C.M);
  } else {
    leg(P, C, 7, 18 + y0 - (f === 1 ? 1 : 0), C.M); leg(P, C, 13, 18 + y0 - (f === 3 ? 1 : 0), C.M);
  }
  // ---- cuerpo
  if (dir === 'side') {
    ball(6 - big, 13 + y0, 3, 4, C);                                   // mochila
    px(5 - big, 13 + y0, C.glow); px(5 - big, 15 + y0, C.glow);
    ball(11, 14 + y0, 4 + big, 4, C);                                  // torso
    rect(9, 17 + y0, 6, 1, C.X);                                       // cinturón
    ball(10, 4 + y0 + 2, 5 + big, 5, C);                               // casco
    rect(12, 5 + y0, 5 + big, 3, C.X); rect(13, 6 + y0, 4 + big, 1, C.glow); px(16 + big, 6 + y0, C.glowL);   // visor
    ball(11, 11 + y0, 3 + big, 2, C); px(10, 10 + y0, C.trim); px(12, 10 + y0, C.trim);   // hombrera
    // brazo y rifle hacia delante
    rect(11, 13 + y0, 3, 3, C.D); rect(13, 14 + y0, 2, 2, C.M);
    gun(P, C, 9, 14 + y0, tier);
  } else {
    ball(10, 14 + y0, 5 + big, 4, C);                                  // torso
    rect(6 - big, 17 + y0, 9 + big * 2, 1, C.X);                       // cinturón
    ball(4 - big, 11 + y0, 3 + big, 3, C); ball(16 + big, 11 + y0, 3 + big, 3, C);   // hombreras
    px(3 - big, 9 + y0, C.trim); px(17 + big, 9 + y0, C.trim);
    if (tier === 2) { rect(2 - big, 7 + y0, 1, 2, C.L); rect(18 + big, 7 + y0, 1, 2, C.L); }
    rect(3 - big, 13 + y0, 2, 4, C.D); rect(16 + big, 13 + y0, 2, 4, C.D);   // brazos
    ball(10, 5 + y0, 5 + big, 5, C);                                   // casco
    if (dir === 'front') {
      rect(5 - big, 5 + y0, 11 + big * 2, 3, C.X); rect(6 - big, 6 + y0, 9 + big * 2, 1, C.glow); rect(9, 6 + y0, 3, 1, C.glowL);   // visor
      rect(9, 13 + y0, 3, 2, C.X); px(10, 13 + y0, C.glow); px(10, 14 + y0, C.glowL);   // núcleo
      // rifle al costado, apuntando al frente
      const gl = tier >= 1 ? 2 : 0;
      rect(15 + big, 13 + y0, 4, 3, C.X); rect(16 + big, 16 + y0, 2, 4 + gl, C.X); px(16 + big, 19 + y0 + gl, C.glow);
      rect(16 + big, 13 + y0, 2, 1, C.D);
    } else {
      rect(7, 3 + y0, 7, 1, C.D); rect(7, 5 + y0, 7, 1, C.D);          // rejilla del casco
      rect(7, 11 + y0, 7, 6, C.X); rect(8, 12 + y0, 5, 1, C.glow); rect(8, 14 + y0, 5, 1, C.glow); px(10, 16 + y0, C.glowL);   // mochila
      rect(17 + big, 6 + y0, 2, 8, C.X);                               // cañón asomando
    }
  }
  if (tier === 2) {   // grietas rojas
    const seams = dir === 'side' ? [[9, 12], [10, 13], [11, 14], [12, 16], [8, 3]] : [[7, 12], [8, 13], [12, 14], [13, 15], [6, 3], [14, 4]];
    for (const [sx, sy] of seams) px(sx, sy + y0, C.trim);
  }
}
/** Pierna con rodillera y bota. */
function leg(P: Pen, C: Pal, x: number, y: number, c: string) {
  P.rect(x, y, 3, 6, c); P.rect(x, y + 2, 3, 1, C.L); P.rect(x - 1, y + 6, 4, 2, C.X); P.px(x + 2, y + 1, C.D);
}
/** Rifle de perfil: culata, cuerpo y cañón con boca que brilla (más largo en élite y legendario). */
function gun(P: Pen, C: Pal, x: number, y: number, tier: number) {
  const gl = tier >= 1 ? 3 : 0;
  P.rect(x, y, 4, 2, C.D); P.rect(x + 4, y - 1, 6, 3, C.X); P.rect(x + 5, y - 1, 4, 1, C.M);
  P.rect(x + 10, y, 3 + gl, 1, C.X); P.px(x + 13 + gl, y, C.glow);
  if (tier >= 1) P.rect(x + 6, y - 2, 2, 1, C.trim);
}

/** Línea de píxeles (patas, alas, cuchillas). */
function line(P: Pen, x0: number, y0: number, x1: number, y1: number, c: string) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) P.px(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
}
/** Ojo brillante (núcleo claro y halo). */
function eye(P: Pen, C: Pal, x: number, y: number, r = 1) {
  P.oval(x, y, r, r, C.glow); P.px(x, y, C.glowL);
}

/** Araña: cúpula con un gran ojo rojo y 4 patas a cada lado que se alternan al andar. */
function arana(P0: Pen, C: Pal, dir: BotDir, f: number, tier: number) {
  const P: Pen = { px: (x, y, c) => P0.px(x + 2, y, c), rect: (x, y, w, h, c) => P0.rect(x + 2, y, w, h, c), oval: (x, y, a2, b, c) => P0.oval(x + 2, y, a2, b, c), ball: (x, y, a2, b, CC) => P0.ball(x + 2, y, a2, b, CC) };
  const big = tier === 2 ? 1 : 0, a = f % 2 ? 1 : -1;
  // 3 patas articuladas por lado: cadera → rodilla alta → pie; se alternan arriba y abajo al andar
  const legs = (side: number, cx: number) => {
    for (let i = 0; i < 3; i++) {
      const lift = (i + (a > 0 ? 1 : 0)) % 2 ? -1 : 0;
      const hx = cx + side * (4 + i), hy = 8 + i, kx = cx + side * (8 + i), ky = 3 + i * 2 + lift, fx = cx + side * (9 + i * 2 + big), fy = 14 + lift;
      line(P, hx, hy, kx, ky, C.D); line(P, kx, ky, fx, fy, C.M); P.px(fx, fy, C.X);
      if (tier >= 1) P.px(kx, ky - 1, tier === 2 ? C.trim : C.L);
    }
  };
  if (dir === 'side') {
    legs(-1, 9); legs(1, 13);
    P.ball(11, 8, 7 + big, 5, C); P.rect(6, 11, 11, 1, C.X);
    eye(P, C, 16 + big, 8, 1 + big);
  } else {
    legs(-1, 9); legs(1, 13);
    P.ball(11, 7, 7 + big, 5 + big, C); P.rect(5 - big, 11, 13 + big * 2, 1, C.X);
    if (dir === 'front') { eye(P, C, 11, 8, 2); P.px(8, 6, C.glow); P.px(14, 6, C.glow); }
    else { P.rect(9, 5, 5, 1, C.D); P.rect(9, 7, 5, 1, C.D); P.px(11, 9, C.glow); }
  }
  if (tier === 2) for (const [x, y] of [[8, 5], [9, 6], [14, 9], [13, 10]]) P.px(x, y, C.trim);
}

/** Flotante: esfera que flota (sube y baja) con un ojo grande, antenas y un propulsor; élite y legendario con aura. */
function flotante(P: Pen, C: Pal, dir: BotDir, f: number, tier: number) {
  const y0 = f === 1 || f === 2 ? -1 : 0, aura = tier >= 1 ? (tier === 2 ? '#ff3dd0' : '#a35cff') : '';
  if (aura) { for (let i = 0; i < 6; i++) { const an = (i / 6) * Math.PI * 2 + f * 0.5; P.px(Math.round(10 + Math.cos(an) * 9), Math.round(9 + y0 + Math.sin(an) * 8), aura); } }
  P.ball(10, 9 + y0, 6, 6, C);
  line(P, 7, 3 + y0, 5, 0 + y0, C.D); line(P, 13, 3 + y0, 15, 0 + y0, C.D); P.px(5, 0 + y0, C.glow); P.px(15, 0 + y0, C.glow);
  P.rect(8, 15 + y0, 5, 2, C.X); P.px(10, 17 + y0 + (f % 2), C.glow);   // propulsor
  const ec = tier >= 1 ? '#c070ff' : C.glow;
  if (dir === 'front') { P.oval(10, 9 + y0, 3, 3, C.X); P.oval(10, 9 + y0, 2, 2, ec); P.px(10, 9 + y0, '#ffffff'); }
  else if (dir === 'side') { P.oval(14, 9 + y0, 2, 3, C.X); P.oval(14, 9 + y0, 1, 2, ec); P.px(15, 8 + y0, '#ffffff'); P.rect(3, 8 + y0, 2, 3, C.D); }
  else { P.rect(7, 7 + y0, 7, 1, C.D); P.rect(7, 10 + y0, 7, 1, C.D); P.px(10, 12 + y0, ec); }
}

/** Torreta / lanzacohetes: base con orugas, cuerpo y cañón (élite: doble lanzacohetes; legendario: grietas). */
function torreta(P: Pen, C: Pal, dir: BotDir, f: number, tier: number) {
  const big = tier === 2 ? 1 : 0;
  // orugas que se mueven
  P.rect(2, 14, 20, 5, C.X); P.rect(3, 15, 18, 3, C.D);
  for (let x = 3 + (f % 2); x < 21; x += 2) P.px(x, 16, C.M);
  P.ball(12, 11, 7 + big, 4, C);
  if (dir === 'side') {
    P.rect(13, 7, 5, 4, C.D);
    if (tier >= 1) { P.rect(14, 4, 9, 3, C.X); P.rect(14, 8, 9, 2, C.X); P.px(22, 5, C.glow); P.px(22, 9, C.glow); }
    else { P.rect(15, 8, 9, 2, C.X); P.px(23, 8, C.glow); }
    P.px(10, 10, C.glow);
  } else if (dir === 'front') {
    if (tier >= 1) { P.rect(6, 4, 5, 5, C.X); P.rect(13, 4, 5, 5, C.X); for (const [x, y] of [[7, 5], [9, 5], [7, 7], [9, 7], [14, 5], [16, 5], [14, 7], [16, 7]]) P.px(x, y, C.glow); }
    else { P.oval(12, 8, 3, 3, C.X); P.oval(12, 8, 1, 1, C.glow); P.px(12, 8, C.glowL); }
    P.rect(10, 12, 4, 1, C.glow);
  } else {
    P.rect(8, 6, 8, 5, C.D); P.rect(9, 7, 6, 1, C.X); P.rect(9, 9, 6, 1, C.X); P.px(12, 12, C.glow);
  }
  if (tier === 2) for (const [x, y] of [[7, 10], [8, 11], [16, 10], [17, 12]]) P.px(x, y, C.trim);
}

/** Escudo / tanque: robot pesado que lleva un gran escudo delante (legendario: escudo rojo que brilla). */
function escudo(P: Pen, C: Pal, dir: BotDir, f: number, tier: number) {
  const y0 = f % 2, big = tier >= 1 ? 1 : 0;
  const shieldC = tier === 2 ? '#7a1424' : C.D, shieldL = tier === 2 ? C.glow : C.M;
  const s = f === 1 ? -1 : f === 3 ? 1 : 0;
  leg(P, C, 7 + (dir === 'side' ? s : 0), 19 + y0, C.M); leg(P, C, 13 - (dir === 'side' ? s : 0), 19 + y0, C.M);
  if (dir === 'side') {
    P.ball(10, 14 + y0, 5 + big, 5, C); P.ball(10, 6 + y0, 4, 4, C); P.rect(11, 5 + y0, 4, 2, C.X); P.rect(12, 5 + y0, 3, 1, C.glow);
    P.rect(15 + big, 6 + y0, 4, 16, shieldC); P.rect(16 + big, 7 + y0, 2, 14, shieldL); P.px(17 + big, 13 + y0, C.glowL);
  } else if (dir === 'front') {
    P.ball(12, 14 + y0, 6 + big, 5, C); P.ball(12, 6 + y0, 4, 4, C); P.rect(9, 5 + y0, 7, 2, C.X); P.rect(10, 5 + y0, 5, 1, C.glow);
    P.ball(19 + big, 11 + y0, 2, 2, C);
    // escudo delante, a la izquierda del cuerpo
    P.rect(2 - big, 7 + y0, 9 + big, 16, shieldC); P.rect(3 - big, 8 + y0, 7 + big, 14, shieldL); P.rect(3 - big, 8 + y0, 7 + big, 1, C.L);
    P.rect(5, 12 + y0, 3, 4, shieldC); if (tier === 2) P.rect(6, 10 + y0, 1, 8, C.glowL);
  } else {
    P.ball(12, 14 + y0, 6 + big, 5, C); P.ball(12, 6 + y0, 4, 4, C); P.rect(10, 4 + y0, 5, 1, C.D);
    P.rect(9, 11 + y0, 6, 6, C.X); P.rect(10, 12 + y0, 4, 1, C.glow); P.rect(10, 14 + y0, 4, 1, C.glow);
    P.rect(19 + big, 7 + y0, 3, 16, shieldC);   // canto del escudo
  }
  if (tier >= 1) { P.px(6, 12 + y0, C.trim); P.px(18, 12 + y0, C.trim); }
}

/** Asesino: robot fino de cabeza redonda con dos ojos rojos y una cuchilla larga (morada en élite, roja en legendario). */
function asesino(P: Pen, C: Pal, dir: BotDir, f: number, tier: number) {
  const y0 = f % 2, blade = tier === 0 ? C.L : tier === 1 ? '#a35cff' : '#ff3d81', bladeL = tier === 0 ? '#ffffff' : tier === 1 ? '#e2c4ff' : '#ffc0d8';
  if (dir === 'side') {
    const s = f === 1 ? -3 : f === 3 ? 3 : 0;   // carrera agachada
    line(P, 9, 15 + y0, 9 - s, 22, C.M); line(P, 11, 15 + y0, 11 + s, 22, C.D); P.px(9 - s, 23, C.X); P.px(11 + s, 23, C.X);
    P.ball(10, 12 + y0, 3, 4, C); P.ball(11, 6 + y0, 4, 4, C); P.rect(12, 5 + y0, 3, 2, C.X); P.px(14, 5 + y0, C.glow);
    line(P, 11, 11 + y0, 15, 13 + y0, C.M); line(P, 15, 13 + y0, 22, 9 + y0, blade); line(P, 16, 13 + y0, 22, 10 + y0, bladeL);
    if (tier === 2) { line(P, 8, 2 + y0, 6, 0 + y0, C.trim); line(P, 7, 9 + y0, 4, 7 + y0, C.trim); }
  } else {
    const lA = f === 1 ? 1 : 0, lB = f === 3 ? 1 : 0;
    P.rect(8, 16 + y0, 2, 6 - lA, C.M); P.rect(12, 16 + y0, 2, 6 - lB, C.M); P.rect(7, 22 - lA, 3, 1, C.X); P.rect(12, 22 - lB, 3, 1, C.X);
    P.ball(11, 12 + y0, 4, 4, C); P.ball(11, 6 + y0, 4, 4, C);
    P.rect(5, 10 + y0, 2, 5, C.D); P.rect(15, 10 + y0, 2, 5, C.D);
    if (dir === 'front') { P.px(9, 6 + y0, C.glow); P.px(13, 6 + y0, C.glow); P.rect(9, 7 + y0, 5, 1, C.X); }
    else P.rect(9, 4 + y0, 5, 1, C.D);
    line(P, 16, 14 + y0, 21, 20 + y0, blade); line(P, 17, 14 + y0, 21, 19 + y0, bladeL);
    if (tier === 2) { line(P, 8, 2 + y0, 6, 0 + y0, C.trim); line(P, 14, 2 + y0, 16, 0 + y0, C.trim); }
  }
}

/** Dron volador: cuerpo con ojo rojo y dos alas que aletean (moradas en élite; de dragón en legendario). */
function volador(P: Pen, C: Pal, dir: BotDir, f: number, tier: number) {
  const up = f % 2 === 0, wc = tier === 0 ? C.M : tier === 1 ? '#7a3ae0' : '#8a1a4a', wl = tier === 0 ? C.L : tier === 1 ? '#c9a8ff' : '#ff4a8a';
  const y0 = up ? 0 : 1;
  const wing = (side: number, cx: number) => {
    const tipY = up ? 1 : 12, tipX = cx + side * 11;
    for (let i = 0; i <= 10; i++) { const x = cx + side * i, yt = Math.round(7 + (tipY - 7) * (i / 10)); line(P, x, yt, x, Math.round(9 + (i / 10) * (up ? -2 : 3)), i % 3 === 0 ? wl : wc); }
    P.px(tipX, tipY, wl);
  };
  if (dir === 'side') {
    wing(-1, 11);
    P.ball(12, 9 + y0, 5, 4, C); eye(P, C, 16, 9 + y0, 1); P.rect(6, 9 + y0, 2, 2, C.D);
  } else {
    wing(-1, 9); wing(1, 15);
    P.ball(12, 9 + y0, 4, 4, C);
    if (dir === 'front') eye(P, C, 12, 9 + y0, 1); else { P.rect(10, 8 + y0, 5, 1, C.D); P.px(12, 13 + y0, C.glow); }
  }
  P.px(12, 14 + y0, C.D); P.px(11, 15 + y0, C.D); P.px(13, 15 + y0, C.D);   // patitas
}

/** Sanador: robot redondo que sostiene un orbe azul (élite con chispas; legendario con aureola). */
function sanador(P: Pen, C: Pal, dir: BotDir, f: number, tier: number) {
  const y0 = f % 2, blue = '#2fd8ff', blueL = '#c4faff';
  const lA = f === 1 ? 1 : 0, lB = f === 3 ? 1 : 0;
  leg(P, C, 7, 18 + y0 - lA, C.M); leg(P, C, 12, 18 + y0 - lB, C.M);
  P.ball(10, 14 + y0, 4, 4, C); P.rect(9, 9 + y0, 3, 1, C.X); P.ball(10, 5 + y0, 4, 4, C);   // cuerpo, cuello y cabeza
  P.rect(5, 11 + y0, 2, 5, C.D); P.rect(14, 11 + y0, 2, 3, C.D);   // brazos
  if (tier === 2) for (let a = 0; a < 16; a++) { const an = (a / 16) * Math.PI * 2; P.px(Math.round(10 + Math.cos(an) * 5), Math.round(-2 + y0 + Math.sin(an) * 1.5), a % 4 ? blue : blueL); }
  const orbX = dir === 'side' ? 17 : 18, orbY = 13 + y0 + (f === 2 ? -1 : 0);
  if (dir !== 'back') { P.oval(orbX, orbY, 2, 2, blue); P.px(orbX, orbY, blueL); P.rect(14, 13 + y0, 3, 2, C.D); }
  if (dir === 'front') { P.rect(7, 4 + y0, 7, 2, C.X); P.rect(8, 4 + y0, 5, 1, C.glow); P.oval(10, 14 + y0, 1, 1, blue); }
  else if (dir === 'side') { P.rect(11, 4 + y0, 4, 2, C.X); P.rect(12, 4 + y0, 3, 1, C.glow); }
  else { P.rect(8, 4 + y0, 5, 1, C.D); P.rect(8, 11 + y0, 5, 4, C.X); P.px(10, 12 + y0, blue); P.px(17, 12 + y0, blue); }
  if (tier >= 1) { const sp = [[1, 4], [19, 3], [2, 15], [20, 18]]; const [sx, sy] = sp[f % 4]; P.px(sx, sy + y0, blueL); P.px(sx + 1, sy + y0, blue); }
}

/* ------------------------------------------------------------------ jefes */
/** Paletas propias de cada jefe. */
const BOSS_PAL: Record<string, Pal> = {
  coloso: { L: '#b9bdc9', M: '#7a8090', D: '#474c5c', X: '#22252f', glow: '#ff3344', glowL: '#ffc0c4', trim: '#ff6a1c' },
  sabio: { L: '#c9a8ff', M: '#7a3ae0', D: '#45178f', X: '#1c0b33', glow: '#e2c4ff', glowL: '#ffffff', trim: '#b98cff' },
  reina: { L: '#a8504c', M: '#6e2c2c', D: '#3e1616', X: '#1c0808', glow: '#ff3344', glowL: '#ffd0d0', trim: '#ff6a4a' },
  elemental: { L: '#a49a90', M: '#70675f', D: '#463f3a', X: '#231f1c', glow: '#2fe6ff', glowL: '#e0fbff', trim: '#4fb8ff' },
  dragon: { L: '#9a66b0', M: '#62327a', D: '#381a4c', X: '#1a0a24', glow: '#ff3dd0', glowL: '#ffd0f4', trim: '#ff4a8a' },
};

/** Coloso mecánico: robot enorme blanco y gris con núcleo rojo, brazos gigantes con puños que brillan. */
function coloso(P: Pen, C: Pal, dir: BotDir, f: number) {
  const y0 = f % 2, s = f === 1 ? -2 : f === 3 ? 2 : 0;
  // piernas
  if (dir === 'side') { P.rect(17 - s, 30 + y0, 6, 10 - y0, C.D); P.rect(19 + s, 30 + y0, 6, 10 - y0, C.M); P.rect(16 - s, 39, 8, 3, C.X); P.rect(18 + s, 39, 8, 3, C.X); }
  else { P.rect(13, 30 + y0, 7, 10 - y0 - (f === 1 ? 1 : 0), C.M); P.rect(25, 30 + y0, 7, 10 - y0 - (f === 3 ? 1 : 0), C.M); P.rect(12, 39 - (f === 1 ? 1 : 0), 9, 3, C.X); P.rect(24, 39 - (f === 3 ? 1 : 0), 9, 3, C.X); }
  if (dir === 'side') {
    P.ball(14, 20 + y0, 6, 8, C);                                         // reactor de la espalda
    P.rect(11, 16 + y0, 2, 8, C.glow);
    P.ball(22, 20 + y0, 9, 10, C);                                        // torso
    P.ball(26, 8 + y0, 5, 5, C); P.rect(27, 7 + y0, 6, 2, C.X); P.rect(28, 7 + y0, 5, 1, C.glow);   // cabeza
    P.ball(30, 24 + y0, 6, 9, C); P.oval(32, 33 + y0, 4, 3, C.X); P.oval(32, 33 + y0, 3, 2, C.glow); P.px(32, 33 + y0, C.glowL);   // brazo y puño
    P.px(24, 18 + y0, C.glow); P.px(25, 18 + y0, C.glow);
  } else {
    P.ball(22, 20 + y0, 11, 10, C);                                       // torso
    P.ball(7, 18 + y0, 6, 10, C); P.ball(37, 18 + y0, 6, 10, C);           // brazos
    P.ball(7, 9 + y0, 6, 4, C); P.ball(37, 9 + y0, 6, 4, C);               // hombreras
    P.oval(7, 29 + y0, 5, 4, C.X); P.oval(37, 29 + y0, 5, 4, C.X);
    P.oval(7, 29 + y0, 3, 3, C.glow); P.oval(37, 29 + y0, 3, 3, C.glow); P.px(7, 29 + y0, C.glowL); P.px(37, 29 + y0, C.glowL);   // puños
    P.ball(22, 7 + y0, 5, 5, C);                                          // cabeza
    if (dir === 'front') {
      P.rect(18, 6 + y0, 9, 3, C.X); P.rect(19, 7 + y0, 7, 1, C.glow);
      P.oval(22, 20 + y0, 4, 4, C.X); P.oval(22, 20 + y0, 3, 3, C.glow); P.oval(22, 20 + y0, 1, 1, C.glowL);   // núcleo
      for (const [x, y] of [[14, 14], [30, 14], [15, 26], [29, 26]]) P.px(x, y + y0, C.trim);
    } else {
      P.rect(15, 13 + y0, 14, 12, C.D); for (let i = 0; i < 4; i++) P.rect(17, 14 + i * 3 + y0, 10, 1, C.glow);   // rejilla del reactor
    }
  }
}

/** Sabio oscuro: figura encapuchada de túnica morada que flota, con cubos de energía girando alrededor. */
function sabio(P: Pen, C: Pal, dir: BotDir, f: number) {
  const y0 = f === 1 || f === 2 ? -1 : 0;
  // cubos que orbitan
  for (let i = 0; i < 4; i++) {
    const an = (i / 4) * Math.PI * 2 + f * (Math.PI / 8), x = Math.round(20 + Math.cos(an) * 18), y = Math.round(22 + Math.sin(an) * 9);
    P.rect(x - 2, y - 2, 4, 4, C.D); P.rect(x - 1, y - 1, 2, 2, C.glow); P.px(x - 1, y - 2, C.L);
  }
  // túnica que se ensancha y ondea abajo
  for (let y = 12; y < 40; y++) {
    const w = Math.round(5 + (y - 12) * 0.45), wave = y > 34 ? Math.round(Math.sin(y * 0.9 + f * 1.6)) : 0;
    P.rect(20 - w + wave, y + y0, w * 2, 1, y < 16 ? C.M : (y + f) % 7 === 0 ? C.L : C.M);
    P.px(20 - w + wave, y + y0, C.L); P.px(20 + w - 1 + wave, y + y0, C.D);
  }
  P.ball(20, 9 + y0, 7, 7, C);                                             // capucha
  if (dir === 'front') { P.oval(20, 10 + y0, 4, 4, C.X); P.px(18, 10 + y0, C.glow); P.px(22, 10 + y0, C.glow); P.oval(20, 24 + y0, 2, 2, C.glow); }
  else if (dir === 'side') { P.oval(24, 10 + y0, 3, 4, C.X); P.px(25, 10 + y0, C.glow); P.rect(24, 20 + y0, 6, 2, C.M); P.oval(31, 21 + y0, 2, 2, C.glow); }
  else { P.rect(18, 4 + y0, 4, 10, C.D); P.rect(19, 18 + y0, 2, 18, C.D); }
}

/** Reina araña: araña gigante roja con abdomen enorme, muchos ojos y 4 patas con pinchos por lado. */
function reina(P: Pen, C: Pal, dir: BotDir, f: number) {
  const a = f % 2;
  const legs = (side: number, cx: number) => {
    for (let i = 0; i < 4; i++) {
      const lift = (i + a) % 2 ? -2 : 0;
      const kx = cx + side * (12 + i * 2), ky = 4 + i * 3 + lift, fx = cx + side * (14 + i * 3), fy = 30 + lift;
      for (const d of [0, 1]) { const hx = cx + side * (6 + i), hy = 14 + i * 2; P.px(hx, hy + d, C.D); }
      // patas gruesas de 2 píxeles
      for (const o of [0, 1]) { line(P, cx + side * (6 + i), 14 + i * 2 + o, kx, ky + o, C.M); line(P, kx, ky + o, fx, fy + o, C.D); }
      P.px(kx, ky - 1, C.trim); P.px(fx, fy + 2, C.trim);
    }
  };
  legs(-1, 24); legs(1, 24);
  if (dir === 'side') {
    P.ball(16, 18, 11, 9, C); P.ball(31, 18, 6, 6, C);
    for (const [x, y] of [[34, 16], [36, 17], [34, 19]]) P.px(x, y, C.glow);
    P.px(37, 20, C.trim); P.px(38, 21, C.trim);
  } else {
    P.ball(24, 20, 12, 10, C); P.ball(24, 12, 7, 5, C);
    if (dir === 'front') { for (const [x, y] of [[21, 11], [27, 11], [23, 13], [25, 13], [19, 13], [29, 13]]) P.px(x, y, C.glow); P.oval(24, 12, 1, 1, C.glowL); P.rect(22, 17, 5, 2, C.trim); }
    else { for (const [x, y] of [[20, 18], [24, 15], [28, 18], [24, 22]]) P.oval(x, y, 1, 1, C.trim); }
  }
}

/** Elemental de energía: gólem de rocas con grietas azules y rayos que chisporrotean. */
function elemental(P: Pen, C: Pal, dir: BotDir, f: number) {
  const y0 = f % 2, s = f === 1 ? -2 : f === 3 ? 2 : 0;
  const rock = (x: number, y: number, rx: number, ry: number) => P.ball(x, y, rx, ry, C);
  if (dir === 'side') { rock(18 - s, 36 + y0, 4, 5); rock(24 + s, 36 + y0, 4, 5); }
  else { rock(15, 36 + y0 - (f === 1 ? 1 : 0), 5, 5); rock(30, 36 + y0 - (f === 3 ? 1 : 0), 5, 5); }
  if (dir === 'side') {
    rock(20, 22 + y0, 9, 10); rock(24, 9 + y0, 5, 5); rock(30, 24 + y0, 5, 8);
    P.px(27, 8 + y0, C.glow); P.px(28, 8 + y0, C.glowL);
  } else {
    rock(22, 22 + y0, 11, 10); rock(8, 22 + y0, 5, 9); rock(36, 22 + y0, 5, 9); rock(8, 12 + y0, 6, 4); rock(36, 12 + y0, 6, 4); rock(22, 9 + y0, 6, 5);
    if (dir === 'front') { P.rect(19, 8 + y0, 2, 2, C.glow); P.rect(24, 8 + y0, 2, 2, C.glow); P.px(19, 8 + y0, C.glowL); P.px(24, 8 + y0, C.glowL); P.oval(22, 21 + y0, 3, 3, C.glow); P.px(22, 21 + y0, C.glowL); }
  }
  // grietas azules que cambian
  const cracks = [[14, 16, 18, 22], [26, 14, 30, 20], [20, 26, 16, 31], [28, 26, 31, 31], [6, 18, 9, 26], [36, 16, 38, 26]];
  cracks.forEach(([x0, yy0, x1, yy1], i) => { if ((i + f) % 3 !== 0) line(P, x0, yy0 + y0, x1, yy1 + y0, i % 2 ? C.glow : C.trim); });
  // chispas que saltan alrededor
  const sp = [[2, 6], [41, 4], [4, 34], [42, 30]][f % 4];
  line(P, sp[0], sp[1], sp[0] + 2, sp[1] + 3, C.glowL); P.px(sp[0] + 1, sp[1] + 1, C.glow);
}

/** Dragón cibernético: dragón morado con alas que baten, cola y fuego magenta en la boca. */
function dragon(P: Pen, C: Pal, dir: BotDir, f: number) {
  const up = f % 2 === 0, y0 = up ? 0 : 1;
  const wing = (side: number, cx: number, cy: number) => {
    const tipY = up ? 2 : cy + 10, tipX = cx + side * 20;
    for (let i = 0; i <= 20; i++) {
      const x = cx + side * i, top = Math.round(cy + (tipY - cy) * (i / 20)), bot = Math.round(cy + 8 - (i / 20) * (up ? 4 : -2));
      if (top <= bot) line(P, x, top, x, bot, i % 5 === 0 ? C.L : (i % 2 ? C.D : '#8a1a4a'));
      else line(P, x, bot, x, top, i % 5 === 0 ? C.L : C.D);
    }
    line(P, cx, cy, tipX, tipY, C.L);
  };
  if (dir === 'side') {
    wing(-1, 22, 12);
    line(P, 10, 28 + y0, 2, 34, C.M); line(P, 10, 29 + y0, 2, 35, C.D); P.px(1, 35, C.trim);   // cola
    P.ball(18, 24 + y0, 10, 8, C);                                        // cuerpo
    P.rect(13, 30 + y0, 4, 8, C.D); P.rect(22, 30 + y0, 4, 8, C.D); P.rect(12, 37, 6, 2, C.X); P.rect(21, 37, 6, 2, C.X);
    line(P, 25, 20 + y0, 33, 12 + y0, C.M); line(P, 26, 21 + y0, 34, 13 + y0, C.M);   // cuello
    P.ball(37, 11 + y0, 5, 4, C); P.rect(40, 12 + y0, 5, 2, C.D); P.px(37, 9 + y0, C.glow);
    line(P, 34, 6 + y0, 31, 2 + y0, C.L); line(P, 37, 7 + y0, 36, 2 + y0, C.L);   // cuernos
    for (let i = 0; i < 6; i++) P.rect(45 + i, 12 + y0 - (i >> 1) + (f % 2), 1, 2 + (i >> 1), i % 2 ? C.glow : C.glowL);   // aliento
    P.px(17, 22 + y0, C.trim); P.px(19, 25 + y0, C.trim);
  } else {
    wing(-1, 20, 12); wing(1, 32, 12);
    P.ball(26, 24 + y0, 9, 9, C);
    P.rect(19, 31 + y0, 4, 7, C.D); P.rect(29, 31 + y0, 4, 7, C.D); P.rect(18, 37, 6, 2, C.X); P.rect(28, 37, 6, 2, C.X);
    if (dir === 'front') {
      P.ball(26, 12 + y0, 6, 5, C); line(P, 22, 8 + y0, 20, 2 + y0, C.L); line(P, 30, 8 + y0, 32, 2 + y0, C.L);
      P.px(23, 11 + y0, C.glow); P.px(29, 11 + y0, C.glow); P.rect(24, 15 + y0, 5, 2, C.X); P.rect(25, 15 + y0, 3, 1 + (f % 2), C.glow);
      P.rect(23, 21 + y0, 7, 8, C.L); for (let i = 0; i < 3; i++) P.rect(23, 22 + i * 3 + y0, 7, 1, C.M);   // vientre
    } else {
      P.ball(26, 13 + y0, 5, 4, C); line(P, 26, 30 + y0, 26, 40, C.M); P.px(26, 41, C.trim);
      for (let i = 0; i < 5; i++) P.px(26, 16 + i * 3 + y0, C.trim);   // pinchos del lomo
    }
  }
}

const DRAW: Record<string, (P: Pen, C: Pal, dir: BotDir, f: number, tier: number) => void> = { soldado, arana, flotante, torreta, escudo, asesino, volador, sanador, coloso, sabio, reina, elemental, dragon };
/** Tamaño de la rejilla de cada bot (con margen para el contorno). */
const SIZE: Record<string, [number, number]> = {
  soldado: [28, 29], arana: [30, 19], flotante: [22, 21], torreta: [27, 22], escudo: [25, 29], asesino: [26, 26], volador: [28, 20], sanador: [24, 28],
  coloso: [46, 44], sabio: [42, 44], reina: [52, 36], elemental: [46, 44], dragon: [54, 44],
};
export const hasBotSprite = (kind: string) => kind in DRAW;

function build(kind: string, tier: number, dir: BotDir, frame: number): Grid {
  const [W, H] = SIZE[kind];
  const g: Grid = Array.from({ length: H }, () => Array<string | null>(W).fill(null));
  const px = (x: number, y: number, c: string | null) => { x += 1; y += 1; if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
  const rect = (x: number, y: number, w: number, h: number, c: string | null) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
  const oval = (cx: number, cy: number, rx: number, ry: number, c: string) => {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.6) + (y * y) / (ry * ry + 0.6) <= 1) px(cx + x, cy + y, c);
  };
  const ball = (cx: number, cy: number, rx: number, ry: number, C: Pal) => {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx + 0.6) + (y * y) / (ry * ry + 0.6);
      if (d > 1) continue;
      const l = (x / (rx + 0.5)) + (y / (ry + 0.5));   // −2 (arriba-izquierda) … 2 (abajo-derecha)
      px(cx + x, cy + y, l < -0.7 ? C.L : l > 0.8 || d > 0.82 && l > 0 ? C.D : C.M);
    }
  };
  DRAW[kind]({ px, rect, oval, ball }, BOSS_PAL[kind] ?? TIER_PAL[tier], dir, frame % 4, tier);
  // contorno: toda celda vacía junto a una llena
  const out = g.map(r => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy]?.[x + dx])) out[y][x] = OUT;
  }
  return out;
}

const cache = new Map<string, any>();
/** Sprite de un bot: kind, nivel (0-2), vista, fotograma (0-3) y variante ('hit' blanco, 'stun' gris). */
export function botSprite(kind: string, tier: number, dir: BotDir, frame: number, variant: 'n' | 'hit' | 'stun', make: Make) {
  const key = `${kind}|${tier}|${dir}|${frame % 4}|${variant}`;
  let c = cache.get(key);
  if (c) return c;
  const grid = build(kind, tier, dir, frame);
  c = make(grid[0].length, grid.length);
  const g = c.getContext('2d');
  grid.forEach((row, y) => row.forEach((col, x) => {
    if (!col) return;
    if (variant === 'hit') g.fillStyle = col === OUT ? '#ffd6da' : '#ffffff';
    else if (variant === 'stun') { const n = parseInt(col.slice(1), 16), v = Math.round(((n >> 16) + ((n >> 8) & 255) + (n & 255)) / 3); g.fillStyle = `rgb(${v},${v},${v})`; }
    else g.fillStyle = col;
    g.fillRect(x, y, 1, 1);
  }));
  cache.set(key, c);
  return c;
}
