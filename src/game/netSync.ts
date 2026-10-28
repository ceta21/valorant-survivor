// Cooperativo en red: el anfitrión simula la partida y envía "fotos" del estado; el invitado
// no simula: copia esas fotos en su motor, suaviza los movimientos entre una y otra y solo
// predice su propio personaje para que responda al instante.
import { Enemy, GameEngine, Pl } from './GameEngine';
import { ENEMIES } from '../data/enemies';
import { WEAPONS } from '../data/weapons';
import { BossPattern, UpgradeChoice } from './types';

const ENEMY_IDS = Object.keys(ENEMIES);
const PATTERNS: BossPattern[] = ['ring', 'spiral', 'slam', 'charge', 'summon'];
const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;

export interface PlayerSnap {
  x: number; y: number; f: number; hp: number; mhp: number; sh: number; msh: number; dead: 0 | 1; gone: 0 | 1;
  ifr: number; inv: number; dT: number; dvx: number; dvy: number; cT: number; cU: 0 | 1; held: string; shot: number;
  b: [number, number, number, string, number, number]; // sprintT, sprintRad, frenzyT, frenzyFx, stormT, stormPow
  mx: number; my: number; ult: number; cds: [number, number]; spd: number; cdr: number; area: number;
  dr: number; da: number; w: [string, number][]; tu: [number, number, number, number, number, number, string][];
  hf: number; pend: number; rr: number; ch: UpgradeChoice[];
}
export interface Snap {
  t: number; st: string; lv: number; xp: number; k: number; bk: number; dmg: number; fs: 0 | 1; fk: 0 | 1; eb: number;
  ban: [string, string, number] | 0; shk: number;
  p: PlayerSnap[];
  en: number[];   // por enemigo: id, def, x, y, hp, maxHp, flags, face*100, atk(kind+1), atkT*100, atkDur*100, atkX, atkY, atkAng*100
  pj: number[];   // por proyectil: x, y, vx, vy, r*10, look, crit, color
  ep: number[];   // por proyectil enemigo: x, y, vx, vy, r, color
  gm: number[];   // por gema: x, y, v*10, kind
  sk: unknown[][]; vf: unknown[][]; cl: string[]; ev: unknown[][];
}
const EN = 14, PJ = 8, EP = 6, GM = 4;

/* ------------------------------------------------------------------ anfitrión */
export function makeSnapshot(e: GameEngine): Snap {
  e.sync();
  const colors: string[] = [], cIdx = new Map<string, number>();
  const col = (c: string) => { let i = cIdx.get(c); if (i === undefined) { i = colors.length; colors.push(c); cIdx.set(c, i); } return i; };
  const en: number[] = [];
  for (const m of e.enemies) {
    if (m.dead) continue;
    const a = m.atk;
    const flags = (m.flash > 0 ? 1 : 0) | (m.stunT > 0 ? 2 : 0) | (m.markT > 0 ? 4 : 0) | (m.burnT > 0 ? 8 : 0) | (m.slowT > 0 ? 16 : 0)
      | (m.fuse > 0 ? 32 : 0) | (m.windup > 0 ? 64 : 0) | (m.phase ? 128 : 0);
    en.push(m.id, ENEMY_IDS.indexOf(m.def.id), Math.round(m.x), Math.round(m.y), Math.round(m.hp), Math.round(m.maxHp), flags, Math.round(m.face * 100),
      a ? PATTERNS.indexOf(a.kind) + 1 : 0, a ? Math.round(a.t * 100) : 0, a ? Math.round(a.dur * 100) : 0, a ? Math.round(a.x) : 0, a ? Math.round(a.y) : 0, a ? Math.round(a.ang * 100) : 0);
  }
  const pj: number[] = [];
  for (const b of e.projs) if (!b.dead) pj.push(Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy), Math.round(b.r * 10), b.look === 'dagger' ? 1 : b.look === 'arrow' ? 2 : 0, b.crit ? 1 : 0, col(b.color));
  const ep: number[] = [];
  for (const b of e.eprojs) if (!b.dead) ep.push(Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy), b.r, col(b.color));
  const gm: number[] = [];
  for (const g of e.gems) if (!g.dead) gm.push(Math.round(g.x), Math.round(g.y), Math.round(g.v * 10), g.kind);
  const p = e.players.map((pl): PlayerSnap => {
    const q = pl.body, b = pl.buffs;
    return {
      x: r1(q.x), y: r1(q.y), f: r2(q.face), hp: r1(q.hp), mhp: r1(pl.stats.maxHp), sh: r1(q.shield), msh: pl.stats.maxShield, dead: pl.dead ? 1 : 0, gone: pl.gone ? 1 : 0,
      ifr: r2(q.iframes), inv: r2(q.invuln), dT: r2(q.dashT), dvx: Math.round(q.dashVx), dvy: Math.round(q.dashVy), cT: r2(pl.castT), cU: pl.castUlt ? 1 : 0,
      held: pl.held, shot: r2(pl.lastShotT), b: [r2(b.sprintT), b.sprintRad, r2(b.frenzyT), b.frenzyFx, r2(b.stormT), b.stormPow],
      mx: r2(pl.inputMove.x), my: r2(pl.inputMove.y), ult: r1(pl.ult), cds: [r1(pl.cds.special), r1(pl.cds.secondary)],
      spd: pl.stats.speed, cdr: pl.stats.cdr, area: pl.stats.area, dr: pl.stats.drones, da: r2(pl.droneAngle),
      w: pl.weapons.map(w => [w.id, w.lvl]), tu: pl.turrets.filter(t => !t.dead).map(t => [Math.round(t.x), Math.round(t.y), r2(t.ang), r1(t.t), t.max, r2(t.cd), t.color]),
      hf: r2(pl.hurtFlash), pend: pl.pending, rr: pl.rerolls, ch: pl.choices,
    };
  });
  const ev = e.netOut ?? [];
  if (e.netOut) e.netOut = [];
  return {
    t: r2(e.time), st: e.state, lv: e.level, xp: r1(e.xp), k: e.kills, bk: e.bossKills, dmg: Math.round(e.damageDealt), fs: e.finalSpawned ? 1 : 0, fk: e.finalKilled ? 1 : 0,
    eb: r1(e.endlessBossT), ban: e.banner.t > 0 ? [e.banner.text, e.banner.color, r1(e.banner.t)] : 0, shk: r2(e.shakeT),
    p, en, pj, ep, gm,
    sk: e.strikes.filter(s => !s.dead).map(s => [Math.round(s.x), Math.round(s.y), Math.round(s.r), r2(s.t), r2(s.dur), s.fx ?? '', Math.round(s.ox), Math.round(s.oy), s.color]),
    vf: e.vfx.map(v => [v.kind, v.pal, Math.round(v.x), Math.round(v.y), Math.round(v.r), r2(v.t), r2(v.dur), r2(v.ang), v.seed, v.follow ? 1 : 0, v.sprite ?? '', v.owner ?? 0]),
    cl: colors, ev: ev.length > 400 ? ev.slice(-400) : ev,
  };
}

/* ------------------------------------------------------------------ invitado */
function blankEnemy(id: number, defIdx: number, x: number, y: number): Enemy {
  const def = ENEMIES[ENEMY_IDS[defIdx]] ?? ENEMIES.grunt;
  return {
    id, def, x, y, kx: 0, ky: 0, hp: 1, maxHp: 1, r: def.r, speed: def.speed, dmg: def.dmg, flash: 0, dead: false,
    burnT: 0, burnDps: 0, slowT: 0, slowMul: 1, stunT: 0, markT: 0, atkT: 0, windup: 0, fuse: 0, atk: null, phase: 0, isBoss: def.behavior === 'boss',
    anim: Math.random() * 6, suicide: false, face: 0, lx: x, ly: y, stuckT: 0, sideT: 0, side: 1, esc: 0, escReset: 0, tx: x, ty: y,
  };
}

/** Copia una foto del anfitrión en el motor del invitado. Devuelve las mejoras que le tocan elegir. */
export function applySnapshot(e: GameEngine, s: Snap) {
  e.sync();
  e.time = s.t; e.state = s.st as GameEngine['state']; e.level = s.lv; e.xp = s.xp; e.kills = s.k; e.bossKills = s.bk; e.damageDealt = s.dmg;
  e.finalSpawned = !!s.fs; e.finalKilled = !!s.fk; e.endlessBossT = s.eb; e.shakeT = Math.max(e.shakeT, s.shk);
  if (s.ban) e.banner = { text: s.ban[0], color: s.ban[1], t: s.ban[2] };
  // jugadores
  s.p.forEach((ps, i) => {
    const pl: Pl | undefined = e.players[i];
    if (!pl) return;
    const q = pl.body, mine = i === e.local;
    // el propio personaje se predice en local: solo se corrige si se ha separado mucho (dash, teletransporte)
    if (!mine || ps.dead || ps.dT > 0 || Math.hypot(ps.x - q.x, ps.y - q.y) > 90) { q.x = ps.x; q.y = ps.y; }
    else { q.x += (ps.x - q.x) * 0.2; q.y += (ps.y - q.y) * 0.2; }
    if (!mine) { (q as any).tx = ps.x; (q as any).ty = ps.y; }
    q.face = ps.f; q.hp = ps.hp; q.shield = ps.sh; q.iframes = ps.ifr; q.invuln = ps.inv; q.dashT = ps.dT; q.dashVx = ps.dvx; q.dashVy = ps.dvy;
    pl.stats.maxHp = ps.mhp; pl.stats.maxShield = ps.msh; pl.stats.speed = ps.spd; pl.stats.cdr = ps.cdr; pl.stats.area = ps.area; pl.stats.drones = ps.dr;
    pl.dead = !!ps.dead; pl.gone = !!ps.gone; pl.castT = ps.cT; pl.castUlt = !!ps.cU; pl.held = ps.held; pl.lastShotT = ps.shot;
    Object.assign(pl.buffs, { sprintT: ps.b[0], sprintRad: ps.b[1], frenzyT: ps.b[2], frenzyFx: ps.b[3], stormT: ps.b[4], stormPow: ps.b[5] });
    if (!mine) { pl.inputMove.x = ps.mx; pl.inputMove.y = ps.my; }
    pl.ult = ps.ult; pl.cds.special = ps.cds[0]; pl.cds.secondary = ps.cds[1]; pl.droneAngle = ps.da;
    pl.weapons.length = 0; for (const [id, lvl] of ps.w) if (WEAPONS[id]) pl.weapons.push({ id, lvl, cd: 0 });
    pl.turrets = ps.tu.map(([x, y, ang, t, max, cd, color]) => ({ x, y, ang, t, max, cd, color, power: 0, dead: false }));
    pl.hurtFlash = Math.max(pl.hurtFlash, ps.hf); pl.pending = ps.pend; pl.rerolls = ps.rr; pl.choices = ps.ch ?? [];
  });
  // enemigos: se conservan los objetos por id para suavizar el movimiento
  const old = new Map(e.enemies.map(m => [m.id, m]));
  const list: Enemy[] = [];
  for (let i = 0; i < s.en.length; i += EN) {
    const id = s.en[i];
    const m = old.get(id) ?? blankEnemy(id, s.en[i + 1], s.en[i + 2], s.en[i + 3]);
    m.tx = s.en[i + 2]; m.ty = s.en[i + 3]; m.hp = s.en[i + 4]; m.maxHp = s.en[i + 5];
    const fl = s.en[i + 6];
    m.flash = fl & 1 ? 0.05 : 0; m.stunT = fl & 2 ? 1 : 0; m.markT = fl & 4 ? 1 : 0; m.burnT = fl & 8 ? 1 : 0; m.slowT = fl & 16 ? 1 : 0;
    m.fuse = fl & 32 ? 0.3 : 0; m.windup = fl & 64 ? 0.2 : 0; m.phase = fl & 128 ? 1 : 0; m.face = s.en[i + 7] / 100;
    const ak = s.en[i + 8];
    m.atk = ak ? { kind: PATTERNS[ak - 1], t: s.en[i + 9] / 100, dur: s.en[i + 10] / 100, x: s.en[i + 11], y: s.en[i + 12], ang: s.en[i + 13] / 100, fired: 0 } : null;
    list.push(m);
  }
  e.enemies = list;
  e.projs = [];
  for (let i = 0; i < s.pj.length; i += PJ) {
    const look = s.pj[i + 5];
    e.projs.push({ x: s.pj[i], y: s.pj[i + 1], vx: s.pj[i + 2], vy: s.pj[i + 3], r: s.pj[i + 4] / 10, look: look === 1 ? 'dagger' : look === 2 ? 'arrow' : '', crit: !!s.pj[i + 6],
      color: s.cl[s.pj[i + 7]], dmg: 0, life: 1, pierce: 0, hit: [], homing: false, target: null, burn: 0, explode: 0, mark: 0, dead: false, chain: false, owner: 0 });
  }
  e.eprojs = [];
  for (let i = 0; i < s.ep.length; i += EP) e.eprojs.push({ x: s.ep[i], y: s.ep[i + 1], vx: s.ep[i + 2], vy: s.ep[i + 3], r: s.ep[i + 4], color: s.cl[s.ep[i + 5]], dmg: 0, life: 1, dead: false });
  const oldGems = e.gems;
  e.gems = [];
  for (let i = 0; i < s.gm.length; i += GM) {
    const x = s.gm[i], y = s.gm[i + 1];
    // reutiliza la gema más cercana para que las atraídas se deslicen en vez de saltar
    const prev = oldGems[e.gems.length];
    e.gems.push({ x: prev ? prev.x : x, y: prev ? prev.y : y, tx: x, ty: y, v: s.gm[i + 2] / 10, kind: s.gm[i + 3] as 0 | 1, mag: false, dead: false, t: prev?.t ?? 0 });
  }
  e.strikes = s.sk.map(a => ({ x: a[0] as number, y: a[1] as number, r: a[2] as number, t: a[3] as number, dur: a[4] as number, fx: (a[5] || undefined) as any,
    ox: a[6] as number, oy: a[7] as number, color: a[8] as string, dmg: 0, stun: 0, burn: 0, slow: 0, mark: 0, dead: false, owner: 0 }));
  e.vfx = s.vf.map(a => ({ kind: a[0] as any, pal: a[1] as string, x: a[2] as number, y: a[3] as number, r: a[4] as number, t: a[5] as number, dur: a[6] as number,
    ang: a[7] as number, seed: a[8] as number, follow: !!a[9], sprite: (a[10] || undefined) as string | undefined, owner: a[11] as number }));
  // efectos sueltos (chispas, números de daño, ondas, sonidos)
  for (const v of s.ev) {
    if (v[0] === 's') e.sparks(v[1] as number, v[2] as number, v[3] as string, v[4] as number, v[5] as number, v[6] as number);
    else if (v[0] === 't') e.text(v[1] as number, v[2] as number, v[3] as string, v[4] as string, v[5] as number);
    else if (v[0] === 'f') e.addFx(v[1] as 0 | 1, v[2] as number, v[3] as number, 0, 0, v[4] as number, v[5] as number, v[6] as string, v[7] as number, v[8] as number);
    else if (v[0] === 'a') e.sfx(v[1] as string, 0.05);
  }
  e.reload();
}

/**
 * Invitado, cada fotograma: suaviza lo recibido, mueve proyectiles y predice el propio personaje.
 * move = dirección que está pulsando el jugador.
 */
export function mirrorTick(e: GameEngine, dt: number) {
  const k = Math.min(1, dt * 14);
  for (const m of e.enemies) {
    m.anim += dt;
    if (m.tx !== undefined && m.ty !== undefined) { m.x += (m.tx - m.x) * k; m.y += (m.ty - m.y) * k; }
  }
  for (const g of e.gems) { g.t += dt; if (g.tx !== undefined && g.ty !== undefined) { g.x += (g.tx - g.x) * k; g.y += (g.ty - g.y) * k; } }
  for (const b of e.projs) { b.x += b.vx * dt; b.y += b.vy * dt; }
  for (const b of e.eprojs) { b.x += b.vx * dt; b.y += b.vy * dt; }
  for (const s of e.strikes) s.t = Math.min(s.dur, s.t + dt);
  for (const v of e.vfx) v.t += dt;
  e.vfx = e.vfx.filter(v => v.t < v.dur);
  for (const pl of e.players) {
    const q = pl.body as typeof pl.body & { tx?: number; ty?: number };
    if (pl.idx === e.local) {
      if (pl.dead || e.state !== 'playing') continue;
      // predicción del propio movimiento (el anfitrión hace lo mismo con nuestras entradas)
      const mv = pl.inputMove, l = Math.hypot(mv.x, mv.y);
      if (q.dashT > 0) { q.x += q.dashVx * dt; q.y += q.dashVy * dt; q.dashT -= dt; }
      else if (l > 0.01) {
        const sp = pl.stats.speed * (pl.buffs.sprintT > 0 ? 1.6 : 1) / Math.max(1, l);
        q.x += mv.x * sp * dt; q.y += mv.y * sp * dt;
      }
      e.resolve(q, q.r);
    } else if (q.tx !== undefined && q.ty !== undefined) { q.x += (q.tx - q.x) * k; q.y += (q.ty - q.y) * k; }
  }
  if (e.state === 'playing') e.time += dt;   // el reloj avanza entre fotos (la siguiente lo corrige)
  e.tickVisuals(dt);
}
