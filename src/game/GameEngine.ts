import {
  AbilityDef, AbilityFx, AgentDef, BossPattern, EnemyDef, MapDef, Rarity, RunResult, Stats, UpgradeChoice,
} from './types';
import { WEAPONS, WEAPON_LIST } from '../data/weapons';
import {
  BOSS_SCHEDULE, ENDLESS_BOSSES, ENDLESS_BOSS_MIN, ENDLESS_BOSS_START, ENDLESS_MAX_BOSSES, ENEMIES, FINAL_TIME, SPAWNABLE, WAVE_TIMES,
} from '../data/enemies';
import { DIFFICULTY_BY_ID, DifficultyDef } from '../data/difficulty';
import { UPGRADES, UPGRADE_BY_ID } from '../data/upgrades';
import { META } from '../data/meta';
import { World } from './World';
import type { MetaLevels } from '../utils/storage';

const DT = 1 / 60;
const CELL = 64;
const GRID = 64; // rejilla toroidal 64×64 celdas (cubre ±2048 unidades alrededor del jugador)
const gidx = (cx: number, cy: number) => ((cy & 63) << 6) | (cx & 63);
const MAX_ENEMIES = 230;
const MAX_GEMS = 320;
const rnd = (a = 1, b?: number) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export interface WeaponInst { id: string; lvl: number; cd: number }
export interface BossAtk { kind: BossPattern; t: number; dur: number; x: number; y: number; ang: number; fired: number }
export interface Enemy {
  id: number; def: EnemyDef; x: number; y: number; kx: number; ky: number;
  hp: number; maxHp: number; r: number; speed: number; dmg: number; flash: number; dead: boolean;
  burnT: number; burnDps: number; slowT: number; slowMul: number; stunT: number; markT: number;
  atkT: number; windup: number; fuse: number; atk: BossAtk | null; phase: number; isBoss: boolean;
  anim: number; suicide: boolean; face: number;
  lx: number; ly: number; stuckT: number; sideT: number; side: number; esc: number; escReset: number;
  /** Solo en el invitado: posición recibida hacia la que se suaviza el movimiento. */
  tx?: number; ty?: number;
}
export interface Proj {
  x: number; y: number; vx: number; vy: number; dmg: number; r: number; life: number; pierce: number;
  crit: boolean; color: string; hit: number[]; homing: boolean; target: Enemy | null; burn: number;
  explode: number; mark: number; dead: boolean; look: ProjLook; chain: boolean; owner: number;
}
export interface EProj { x: number; y: number; vx: number; vy: number; dmg: number; r: number; life: number; color: string; dead: boolean }
/** Obús de mortero enemigo: vuela desde (ox,oy) y estalla en (x,y) al acabar dur. */
export interface Shell { x: number; y: number; ox: number; oy: number; t: number; dur: number; r: number; dmg: number; dead: boolean }
export interface Gem { x: number; y: number; v: number; kind: 0 | 1; mag: boolean; dead: boolean; t: number; tx?: number; ty?: number }
export interface Turret { x: number; y: number; t: number; cd: number; power: number; dead: boolean; color: string; ang: number; max: number }
export interface Strike { x: number; y: number; r: number; t: number; dur: number; dmg: number; color: string; stun: number; burn: number; slow: number; mark: number; dead: boolean; fx?: AbilityFx; ox: number; oy: number; owner: number }
/** Efecto visual de habilidad (solo decorativo). follow: x,y son relativos al jugador. */
export interface Vfx { kind: VfxKind; pal: string; x: number; y: number; r: number; t: number; dur: number; ang: number; seed: number; follow?: boolean; sprite?: string; owner?: number }
export type VfxKind = 'blast' | 'ring' | 'flames' | 'beam' | 'field' | 'eye' | 'gust' | 'rise';
export type ProjLook = '' | 'dagger' | 'arrow';
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; circle: boolean }
export interface FloatText { x: number; y: number; life: number; text: string; color: string; size: number }
export interface PlayerBody {
  x: number; y: number; r: number; hp: number; shield: number; face: number; iframes: number; invuln: number; sinceHit: number;
  dashT: number; dashVx: number; dashVy: number; dashPow: number; dashHit: number[]; lastDirX: number; lastDirY: number;
}
export type Buffs = { sprintT: number; sprintPow: number; sprintRad: number; sprintAcc: number; frenzyT: number; frenzyMul: number; frenzyHeal: number; frenzyFx: string; stormT: number; stormAcc: number; stormPow: number };
/** Datos con los que entra cada jugador a la partida. */
export interface PlayerSetup { agent: AgentDef; meta: MetaLevels; startWeapon: string; name: string }
/** Estado propio de cada jugador. El motor "carga" uno a la vez en sus campos (ver use()). */
export interface Pl {
  idx: number; name: string; agent: AgentDef; stats: Stats; body: PlayerBody; buffs: Buffs; cds: { special: number; secondary: number };
  ult: number; weapons: WeaponInst[]; held: string; heldSince: number; lastShotT: number; castT: number; castUlt: boolean;
  inputMove: { x: number; y: number }; taken: Record<string, number>; rerolls: number; choices: UpgradeChoice[]; pending: number;
  droneAngle: number; droneCd: number[]; turrets: Turret[]; portalCd: number; healTextT: number; hurtFlash: number;
  /** Caído: vuelve en la siguiente oleada (en solitario, caer termina la partida). */
  dead: boolean;
  /** Se fue de la partida (cooperativo): ya no vuelve. */
  gone?: boolean;
}
export interface Fx { kind: 0 | 1; x: number; y: number; x2: number; y2: number; r: number; life: number; max: number; color: string }

export interface EngineEvents {
  /** idx = jugador al que le toca elegir (0 en solitario). */
  onLevelUp(choices: UpgradeChoice[], idx: number): void;
  onEnd(r: RunResult): void;
  sfx(name: string): void;
}
export type EngineState = 'playing' | 'paused' | 'levelup' | 'won' | 'lost';

function ring<T>(n: number, make: () => T) {
  const items: T[] = [];
  for (let i = 0; i < n; i++) items.push(make());
  return { items, i: 0, next(): T { this.i = (this.i + 1) % n; return items[this.i]; } };
}

export class GameEngine {
  /** Jugadores de la partida (1 en solitario, 2 en cooperativo) y cuál es el de esta pantalla. */
  players: Pl[] = [];
  local = 0;
  private cur!: Pl;
  // --- campos del jugador cargado ahora mismo (ver use())
  agent!: AgentDef;
  map: MapDef;
  world: World;
  ev: EngineEvents;
  stats!: Stats;
  state: EngineState = 'playing';
  time = 0;
  kills = 0;
  bossKills = 0;
  damageDealt = 0;
  level = 1;
  xp = 0;
  taken!: Record<string, number>;
  weapons!: WeaponInst[];
  viewW = 1100;
  viewH = 650;
  shakeT = 0;
  hurtFlash = 0;
  banner = { text: '', t: 0, color: '#ff4655' };
  inputMove!: { x: number; y: number };
  held = 'classic';
  heldSince = -9;
  lastShotT = -9;
  castT = -9;
  castUlt = false;
  portalCd = 0;

  player!: PlayerBody;
  buffs!: Buffs;
  cds!: { special: number; secondary: number };
  ult = 25;

  enemies: Enemy[] = [];
  projs: Proj[] = [];
  eprojs: EProj[] = [];
  shells: Shell[] = [];
  gems: Gem[] = [];
  turrets: Turret[] = [];
  strikes: Strike[] = [];
  vfx: Vfx[] = [];
  droneAngle = 0;
  droneCd!: number[];
  particles = ring<Particle>(700, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: '#fff', circle: false }));
  texts = ring<FloatText>(70, () => ({ x: 0, y: 0, life: 0, text: '', color: '#fff', size: 12 }));
  fxs = ring<Fx>(120, () => ({ kind: 0, x: 0, y: 0, x2: 0, y2: 0, r: 0, life: 0, max: 1, color: '#fff' }));

  private enemyPool: Enemy[] = [];
  private projPool: Proj[] = [];
  private nextId = 1;
  private acc = 0;
  private grid: number[][] = [];
  private gridUsed: number[] = [];
  private pruneT = 0;
  private spawnAcc = 0;
  private waveIdx = 0;
  private bossIdx = 0;
  private eliteT = 200;
  private sfxT: Record<string, number> = {};
  finalSpawned = false;
  finalKilled = false;
  /** Anfitrión en cooperativo: aquí se apuntan los efectos visuales para enviarlos al invitado. */
  netOut: unknown[][] | null = null;
  private healTextT = 0;
  diff: DifficultyDef;
  endlessBossT: number;
  private endlessWaveT = 0;

  /** coop: varios jugadores; local = índice del de esta pantalla. Sin coop, partida en solitario. */
  constructor(agent: AgentDef, map: MapDef, meta: MetaLevels, ev: EngineEvents, diff: DifficultyDef = DIFFICULTY_BY_ID.normal, startWeapon = 'classic',
    coop?: { setups: PlayerSetup[]; local: number }) {
    this.map = map;
    this.ev = ev;
    this.diff = diff;
    this.endlessBossT = FINAL_TIME + ENDLESS_BOSS_START * diff.bossEvery;
    this.world = new World(map);
    for (let i = 0; i < GRID * GRID; i++) this.grid.push([]);
    const setups = coop?.setups ?? [{ agent, meta, startWeapon, name: '' }];
    this.players = setups.map((st, i) => this.makePlayer(i, st));
    this.local = coop?.local ?? 0;
    this.use(this.players[this.local]);
    this.showBanner('¡SOBREVIVE!', '#ff4655', 2);
  }

  private makePlayer(idx: number, st: PlayerSetup): Pl {
    const m = (id: keyof MetaLevels) => st.meta[id] * META.find(x => x.id === id)!.per;
    const a = st.agent;
    const stats: Stats = {
      maxHp: a.hp * (1 + m('hp')), speed: a.speed * (1 + m('speed')), dmg: a.damage / 10 + m('dmg'),
      aspd: 1, crit: 0.05, critMul: 1.6, extraProj: 0, pierce: 0, range: 1, area: 1, cdr: 0, heal: 1,
      xp: 1 + m('xp'), chain: 0, drones: 0, maxShield: 0, killExplode: 0, regen: 0.5, magnet: 1, burn: 0, ult: 1, lifeOnKill: 0,
    };
    for (const k of Object.keys(a.trait.mods) as (keyof Stats)[]) stats[k] += a.trait.mods[k] as number;
    const w = WEAPONS[st.startWeapon] ? st.startWeapon : 'classic';
    const sp = this.world.spawn;
    const droneCd: number[] = [];
    while (droneCd.length < stats.drones) droneCd.push(rnd(0.5));
    return {
      idx, name: st.name, agent: a, stats,
      body: { x: sp.x + idx * 36, y: sp.y, r: 12, hp: stats.maxHp, shield: stats.maxShield, face: 0, iframes: 0, invuln: 0, sinceHit: 99,
        dashT: 0, dashVx: 0, dashVy: 0, dashPow: 0, dashHit: [], lastDirX: 1, lastDirY: 0 },
      buffs: { sprintT: 0, sprintPow: 0, sprintRad: 0, sprintAcc: 0, frenzyT: 0, frenzyMul: 1, frenzyHeal: 0, frenzyFx: '', stormT: 0, stormAcc: 0, stormPow: 0 },
      cds: { special: 0, secondary: 0 }, ult: 25, weapons: [{ id: w, lvl: 1, cd: 0.2 }], held: w, heldSince: -9, lastShotT: -9, castT: -9, castUlt: false,
      inputMove: { x: 0, y: 0 }, taken: {}, rerolls: 2, choices: [], pending: 0, droneAngle: 0, droneCd, turrets: [], portalCd: 0, healTextT: 0, hurtFlash: 0, dead: false,
    };
  }

  /**
   * Carga un jugador en los campos del motor (player, stats, buffs…). Toda la lógica de un
   * jugador lee esos campos, así que funciona igual con 1 que con 2 jugadores.
   */
  use(pl: Pl) {
    if (this.cur === pl) return;
    this.sync();
    this.cur = pl;
    this.agent = pl.agent; this.stats = pl.stats; this.player = pl.body; this.buffs = pl.buffs; this.cds = pl.cds; this.weapons = pl.weapons;
    this.inputMove = pl.inputMove; this.taken = pl.taken; this.droneCd = pl.droneCd; this.turrets = pl.turrets;
    this.ult = pl.ult; this.held = pl.held; this.heldSince = pl.heldSince; this.lastShotT = pl.lastShotT; this.castT = pl.castT; this.castUlt = pl.castUlt;
    this.droneAngle = pl.droneAngle; this.portalCd = pl.portalCd; this.healTextT = pl.healTextT; this.hurtFlash = pl.hurtFlash;
  }
  /** Guarda en su Pl el estado del jugador cargado (antes de leer los Pl desde fuera). */
  sync() {
    const c = this.cur;
    if (!c) return;
    c.ult = this.ult; c.held = this.held; c.heldSince = this.heldSince; c.lastShotT = this.lastShotT; c.castT = this.castT; c.castUlt = this.castUlt;
    c.droneAngle = this.droneAngle; c.turrets = this.turrets; c.portalCd = this.portalCd; c.healTextT = this.healTextT; c.hurtFlash = this.hurtFlash;
  }
  /** Ejecuta fn con otro jugador cargado y vuelve al anterior (para dibujar o leer su estado). */
  withPlayer<T>(pl: Pl, fn: () => T): T { const back = this.cur; this.use(pl); try { return fn(); } finally { this.use(back); } }
  get me() { return this.players[this.local]; }
  get current() { return this.cur; }
  /** Opciones de mejora del jugador de esta pantalla. */
  get choices() { return this.me.choices; }
  get rerolls() { return this.me.rerolls; }
  private alivePlayers() { return this.players.filter(p => !p.dead); }
  /** Jugador vivo más cercano a un punto (al que persiguen los enemigos). */
  nearestPlayer(x: number, y: number): Pl {
    let best = this.cur, bd = Infinity;
    for (const pl of this.players) {
      if (pl.dead) continue;
      const d = (pl.body.x - x) ** 2 + (pl.body.y - y) ** 2;
      if (d < bd) { bd = d; best = pl; }
    }
    return best;
  }
  /** Alrededor de quién aparecen los enemigos: un jugador vivo al azar. */
  private spawnFocus() { const a = this.alivePlayers(); return (a.length ? a[(Math.random() * a.length) | 0] : this.cur).body; }

  /* ------------------------------------------------------------------ utilidades */
  setView(w: number, h: number) { this.viewW = w; this.viewH = h; }
  showBanner(text: string, color = '#ff4655', t = 2.4) { this.banner = { text, t, color }; }
  sfx(name: string, gap = 0.03) {
    if (this.netOut) this.netOut.push(['a', name]);
    const now = performance_now();
    if ((this.sfxT[name] ?? -9) + gap > now) return;
    this.sfxT[name] = now;
    this.ev.sfx(name);
  }
  get need() { return Math.round(5 + this.level * 5 + this.level * this.level * 0.55); }
  /** Segundos transcurridos en modo infinito (tras la aparición del jefe final). */
  get overtime() { return Math.max(0, this.time - FINAL_TIME); }
  get hpScale() { const m = this.time / 60; return (1 + m * 0.24 + m * m * 0.02) * this.diff.hp * (1 + this.overtime / 300); }
  get dmgScale() { return (1 + (this.time / 60) * 0.07) * this.diff.dmg * (1 + this.overtime / 400); }
  private syncDrones() {
    while (this.droneCd.length < this.stats.drones) this.droneCd.push(rnd(0.5));
  }
  private abCd(ab: AbilityDef) { return ab.cd * (1 - this.stats.cdr); }

  private inObstacle(x: number, y: number, r: number) { return this.world.hit(x, y, r); }
  /** Empuja un círculo fuera de los obstáculos (deslizamiento natural). El mundo es infinito: no hay bordes. */
  resolve(o: { x: number; y: number }, r: number) { this.world.resolve(o, r); }

  /* ------------------------------------------------------------------ bucle */
  update(dtReal: number) {
    if (this.state !== 'playing') return;
    this.acc += Math.min(dtReal, 0.1);
    let n = 0;
    while (this.acc >= DT && n < 6 && this.state === 'playing') {
      this.step(DT);
      this.acc -= DT;
      n++;
    }
  }

  private step(dt: number) {
    this.time += dt;
    if (this.banner.t > 0) this.banner.t -= dt;
    if (this.shakeT > 0) this.shakeT -= dt;
    this.buildGrid();
    for (const pl of this.players) {
      this.use(pl);
      if (this.hurtFlash > 0) this.hurtFlash -= dt;
      if (pl.dead) continue;
      this.updatePlayer(dt);
      this.updateWeapons(dt);
      this.updateAllies(dt);
      this.ult = Math.min(100, this.ult + dt * 0.6 * this.stats.ult);
    }
    this.updateProjs(dt);
    this.updateEnemies(dt);
    this.updateEProjs(dt);
    this.updateShells(dt);
    this.updateStrikes(dt);
    this.updateGems(dt);
    this.updateSpawner(dt);
    this.updateFx(dt);
    this.cleanup();
    this.pruneT -= dt;
    if (this.pruneT <= 0) { this.pruneT = 3; const f = this.me.body; this.world.prune(f.x, f.y, this.players.length > 1 ? 12 : 6); }
    this.use(this.me);
  }

  private buildGrid() {
    for (let i = 0; i < this.gridUsed.length; i++) this.grid[this.gridUsed[i]].length = 0;
    this.gridUsed.length = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      const gi = gidx(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
      if (this.grid[gi].length === 0) this.gridUsed.push(gi);
      this.grid[gi].push(i);
    }
  }
  /** Llama a cb para cada enemigo vivo dentro del círculo. */
  forEnemiesIn(x: number, y: number, r: number, cb: (e: Enemy) => void) {
    const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL);
    const y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const cell = this.grid[gidx(cx, cy)];
        for (let k = 0; k < cell.length; k++) {
          const e = this.enemies[cell[k]];
          if (!e || e.dead) continue;
          const dx = e.x - x, dy = e.y - y, rr = r + e.r;
          if (dx * dx + dy * dy <= rr * rr) cb(e);
        }
      }
    }
  }
  nearestEnemy(x: number, y: number, maxD: number, skip?: Enemy | number[]): Enemy | null {
    let best: Enemy | null = null, bd = maxD * maxD;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      if (Array.isArray(skip) && skip.includes(e.id)) continue;
      if (skip === e) continue;
      const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  /* ------------------------------------------------------------------ jugador */
  private updatePlayer(dt: number) {
    const p = this.player, s = this.stats, b = this.buffs;
    if (p.iframes > 0) p.iframes -= dt;
    if (p.invuln > 0) p.invuln -= dt;
    p.sinceHit += dt;
    if (s.regen > 0 && p.hp < s.maxHp) p.hp = Math.min(s.maxHp, p.hp + s.regen * dt * s.heal);
    if (s.maxShield > 0 && p.sinceHit > 5 && p.shield < s.maxShield) p.shield = Math.min(s.maxShield, p.shield + 4 * dt);
    if (p.shield > s.maxShield + 100) p.shield = s.maxShield + 100;
    this.cds.special = Math.max(0, this.cds.special - dt);
    this.cds.secondary = Math.max(0, this.cds.secondary - dt);

    let mx = this.inputMove.x, my = this.inputMove.y;
    const ml = Math.hypot(mx, my);
    if (ml > 0.01) {
      if (ml > 1) { mx /= ml; my /= ml; }
      p.lastDirX = mx / (ml > 1 ? 1 : ml); p.lastDirY = my / (ml > 1 ? 1 : ml);
      const l2 = Math.hypot(p.lastDirX, p.lastDirY) || 1; p.lastDirX /= l2; p.lastDirY /= l2;
    }
    let sp = s.speed;
    if (b.sprintT > 0) {
      b.sprintT -= dt; sp *= 1.6;
      b.sprintAcc += dt;
      if (b.sprintAcc >= 0.15) {
        b.sprintAcc = 0;
        const dmg = b.sprintPow * 10 * s.dmg * 0.4;
        this.forEnemiesIn(p.x, p.y, b.sprintRad * s.area, e => this.damageEnemy(e, dmg, false, { noText: true, kx: e.x - p.x, ky: e.y - p.y, knock: 60 }));
        this.addFx(0, p.x, p.y, 0, 0, b.sprintRad * s.area, 0.2, this.agent.color);
        if (Math.random() < 0.5) this.sparks(p.x, p.y, this.agent.color, 3, 160);
      }
    }
    if (b.frenzyT > 0) b.frenzyT -= dt;
    if (b.stormT > 0) {
      b.stormT -= dt; b.stormAcc += dt;
      while (b.stormAcc >= 0.07) {
        b.stormAcc -= 0.07;
        const t = this.nearestEnemy(p.x, p.y, 520);
        if (t) {
          const a = Math.atan2(t.y - p.y, t.x - p.x) + rnd(-0.08, 0.08);
          this.spawnProj(p.x, p.y, a, 760, b.stormPow * 10 * s.dmg, 4, 560, 4 + s.pierce, false, this.agent.accent, { look: 'dagger' });
        }
      }
    }
    if (p.dashT > 0) {
      p.dashT -= dt;
      p.x += p.dashVx * dt; p.y += p.dashVy * dt;
      this.forEnemiesIn(p.x, p.y, 26, e => {
        if (p.dashHit.includes(e.id)) return;
        p.dashHit.push(e.id);
        this.damageEnemy(e, p.dashPow * 10 * s.dmg, false, { kx: p.dashVx, ky: p.dashVy, knock: 220 });
      });
      if (Math.random() < 0.8) this.sparks(p.x, p.y, this.agent.color, 1, 60);
    } else {
      p.x += mx * sp * dt; p.y += my * sp * dt;
    }
    this.resolve(p, p.r);
    // teletransportadores (Bind): pisas uno y apareces en su pareja
    if (this.portalCd > 0) this.portalCd -= dt;
    else if (this.map.id === 'bind') {
      for (const [A, B] of this.world.portalsNear(p.x, p.y)) {
        for (const [from, to] of [[A, B], [B, A]]) {
          if (Math.hypot(p.x - from.x, p.y - from.y) < 30) {
            this.addFx(0, from.x, from.y, 0, 0, 80, 0.4, '#b05cff');
            p.x = to.x + p.lastDirX * 44; p.y = to.y + p.lastDirY * 44;
            this.resolve(p, p.r);
            this.addFx(0, to.x, to.y, 0, 0, 80, 0.4, '#b05cff');
            this.sparks(to.x, to.y, '#b05cff', 14, 220, 0.5);
            this.portalCd = 1.5; this.sfx('ability', 0);
            return;
          }
        }
      }
    }
  }

    hurtPlayer(amount: number, kx = 0, ky = 0) {
    const p = this.player;
    if (p.iframes > 0 || p.invuln > 0 || this.state !== 'playing') return;
    let a = amount;
    p.iframes = 0.55;
    p.sinceHit = 0;
    this.hurtFlash = 0.25;
    this.shakeT = Math.max(this.shakeT, 0.15);
    if (p.shield > 0) {
      const ab = Math.min(p.shield, a);
      p.shield -= ab; a -= ab;
      this.text(p.x, p.y - 20, `-${Math.round(ab)}`, '#7ad7ff', 13);
    }
    if (a > 0) {
      p.hp -= a;
      this.text(p.x, p.y - 20, `-${Math.round(a)}`, '#ff4655', 15);
      this.sparks(p.x, p.y, '#ff4655', 8, 200);
    }
    this.sfx('hurt', 0.1);
    if (p.hp <= 0) { p.hp = 0; this.playerDown(); }
  }
  private playerDown() {
    const pl = this.cur, p = pl.body;
    pl.dead = true; p.dashT = 0;
    this.buffs.sprintT = this.buffs.frenzyT = this.buffs.stormT = 0;
    if (this.players.every(x => x.dead)) { this.end(); return; }
    this.sparks(p.x, p.y, '#ff4655', 30, 300, 0.8);
    this.addFx(0, p.x, p.y, 0, 0, 90, 0.5, '#ff4655');
    this.showBanner(`¡${(pl.name || 'Jugador').toUpperCase()} HA CAÍDO! VUELVE EN LA PRÓXIMA OLEADA`, '#ff4655', 3);
  }
  /** Al empezar una oleada, los caídos vuelven junto a un compañero con media vida. */
  private reviveDead() {
    const back = this.cur, alive = this.alivePlayers();
    if (!alive.length) return;
    for (const pl of this.players) {
      if (!pl.dead || pl.gone) continue;
      const mate = alive[0].body;
      pl.dead = false;
      pl.body.x = mate.x + 40; pl.body.y = mate.y; this.resolve(pl.body, pl.body.r);
      pl.body.hp = pl.stats.maxHp * 0.5; pl.body.invuln = 2.5; pl.body.iframes = 0;
      this.addFx(0, pl.body.x, pl.body.y, 0, 0, 110, 0.6, '#5dff9a');
      this.sparks(pl.body.x, pl.body.y, '#5dff9a', 24, 260, 0.7);
      this.showBanner(`¡${(pl.name || 'Jugador').toUpperCase()} HA VUELTO!`, '#5dff9a', 2.4);
    }
    this.use(back);
  }
  heal(amount: number, quiet = false) {
    const p = this.player;
    const a = amount * this.stats.heal;
    if (a <= 0 || p.hp >= this.stats.maxHp) return;
    p.hp = Math.min(this.stats.maxHp, p.hp + a);
    if (!quiet && a >= 1 && this.time > this.healTextT) {
      this.healTextT = this.time + 0.4;
      this.text(p.x, p.y - 26, `+${Math.round(a)}`, '#5dff9a', 13);
    }
  }
  healPct(frac: number) { this.heal(frac * this.stats.maxHp); }

  /* ------------------------------------------------------------------ armas */
  private weaponCd(w: WeaponInst) {
    const d = WEAPONS[w.id];
    const ev = w.lvl >= 5 ? d.evolved : null;
    const cd = d.cooldown * (1 - 0.06 * (w.lvl - 1)) * (ev?.cdMul ?? 1);
    return cd / (this.stats.aspd * (this.buffs.frenzyT > 0 ? this.buffs.frenzyMul : 1));
  }
  private updateWeapons(dt: number) {
    for (const w of this.weapons) {
      w.cd -= dt;
      if (w.cd <= 0) w.cd = this.fire(w) ? this.weaponCd(w) : 0.05;
    }
  }
  private fire(w: WeaponInst): boolean {
    const d = WEAPONS[w.id], s = this.stats, p = this.player;
    const ev = w.lvl >= 5 ? d.evolved : null;
    const range = d.range * s.range;
    const t = this.nearestEnemy(p.x, p.y, range + 20);
    if (!t) return false;
    const base = Math.atan2(t.y - p.y, t.x - p.x);
    p.face = base;
    if (w.id !== this.held && this.time - this.heldSince > 0.8) { this.held = w.id; this.heldSince = this.time; }
    if (w.id === this.held) this.lastShotT = this.time;
    const count = d.count + (ev?.count ?? 0) + s.extraProj;
    const dmg = d.damage * (1 + 0.22 * (w.lvl - 1)) * (ev?.dmgMul ?? 1) * s.dmg;
    const pierce = d.pierce + (ev?.pierce ?? 0) + s.pierce;
    const critCh = s.crit + d.crit + (ev?.crit ?? 0);
    const critMul = s.critMul + d.critMul;
    const explode = (d.explode ?? 0) + (ev?.explode ?? 0);
    const fan = d.count > 1 ? d.fan * 0.9 : d.fan;
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * fan + rnd(-d.jitter, d.jitter);
      const crit = Math.random() < critCh;
      this.spawnProj(p.x + Math.cos(a) * 12, p.y + Math.sin(a) * 12, a, d.speed, crit ? dmg * critMul : dmg, d.size, range, pierce, crit, d.color, { burn: s.burn * s.dmg, explode, chain: s.chain > 0 });
    }
    this.sfx(d.heavy ? 'shoot_heavy' : 'shoot', d.heavy ? 0.06 : 0.045);
    const mx = p.x + Math.cos(base) * 16, my = p.y + Math.sin(base) * 16;
    this.sparks(mx, my, d.color, 1, 80, 0.12);
    return true;
  }

  spawnProj(x: number, y: number, a: number, speed: number, dmg: number, r: number, range: number, pierce: number, crit: boolean, color: string,
    o: { homing?: boolean; burn?: number; explode?: number; mark?: number; look?: ProjLook; chain?: boolean; target?: Enemy | null } = {}) {
    const p = this.projPool.pop() ?? ({ hit: [] } as unknown as Proj);
    p.x = x; p.y = y; p.vx = Math.cos(a) * speed; p.vy = Math.sin(a) * speed; p.dmg = dmg; p.r = r;
    p.life = range / speed; p.pierce = pierce; p.crit = crit; p.color = color; p.hit.length = 0;
    p.homing = !!o.homing; p.target = o.target ?? null; p.burn = o.burn ?? 0; p.explode = o.explode ?? 0;
    p.mark = o.mark ?? 0; p.dead = false; p.look = o.look ?? ''; p.chain = !!o.chain; p.owner = this.cur.idx;
    this.projs.push(p);
  }

  private updateProjs(dt: number) {
    for (let i = 0; i < this.projs.length; i++) {
      const p = this.projs[i];
      if (p.dead) continue;
      this.use(this.players[p.owner] ?? this.cur);
      if (p.homing) {
        if (!p.target || p.target.dead) p.target = this.nearestEnemy(p.x, p.y, 600);
        if (p.target) {
          const sp = Math.hypot(p.vx, p.vy);
          const want = Math.atan2(p.target.y - p.y, p.target.x - p.x);
          let cur = Math.atan2(p.vy, p.vx);
          let diff = want - cur;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          cur += clamp(diff, -6 * dt, 6 * dt);
          p.vx = Math.cos(cur) * sp; p.vy = Math.sin(cur) * sp;
        }
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) { p.dead = true; continue; }
      if (this.inObstacle(p.x, p.y, 0)) {
        p.dead = true;
        this.sparks(p.x, p.y, p.color, 2, 90, 0.2);
        continue;
      }
      this.forEnemiesIn(p.x, p.y, p.r, e => {
        if (p.dead || p.hit.includes(e.id)) return;
        p.hit.push(e.id);
        const stats = this.stats;
        this.damageEnemy(e, p.dmg, p.crit, { kx: p.vx, ky: p.vy, knock: p.dmg > 30 ? 120 : 70 });
        if (p.burn > 0) { e.burnT = 3; e.burnDps = Math.max(e.burnDps, p.burn); }
        if (p.mark > 0) e.markT = p.mark;
        if (p.explode > 0) this.explodeAt(e.x, e.y, 70 * stats.area, p.dmg * p.explode, '#d6a8ff');
        if (p.chain && stats.chain > 0) this.chainFrom(e, p.dmg * 0.45, stats.chain);
        if (p.pierce <= 0) p.dead = true; else p.pierce--;
      });
    }
  }

  private chainFrom(src: Enemy, dmg: number, jumps: number) {
    const hit: number[] = [src.id];
    let cur = src;
    for (let j = 0; j < jumps; j++) {
      const nx = this.nearestEnemy(cur.x, cur.y, 150, hit);
      if (!nx) break;
      hit.push(nx.id);
      this.addFx(1, cur.x, cur.y, 0, 0, 0, 0.16, '#7ad7ff', nx.x, nx.y);
      this.damageEnemy(nx, dmg, false, { noChain: true, noText: false });
      cur = nx;
    }
  }

  damageEnemy(e: Enemy, dmg: number, crit: boolean, o: { kx?: number; ky?: number; knock?: number; noText?: boolean; noChain?: boolean; blast?: boolean } = {}) {
    if (e.dead || dmg <= 0) return;
    if (e.markT > 0) dmg *= 1.3;
    e.hp -= dmg;
    e.flash = 0.09;
    this.damageDealt += dmg;
    if (!o.noText) this.text(e.x + rnd(-6, 6), e.y - e.r - 4, `${Math.round(dmg)}`, crit ? '#ffd24a' : '#ffffff', crit ? 17 : 12);
    if (o.knock && !e.isBoss) {
      const l = Math.hypot(o.kx ?? 0, o.ky ?? 0) || 1;
      e.kx += ((o.kx ?? 0) / l) * o.knock;
      e.ky += ((o.ky ?? 0) / l) * o.knock;
    }
    this.sparks(e.x, e.y, e.def.color, crit ? 4 : 2, 120, 0.25);
    this.sfx(crit ? 'crit' : 'hit', 0.04);
    if (e.hp <= 0) this.killEnemy(e, !!o.blast);
  }

  explodeAt(x: number, y: number, r: number, dmg: number, color: string, o: { stun?: number; burn?: number; slow?: number; mark?: number } = {}) {
    this.addFx(0, x, y, 0, 0, r, 0.35, color);
    this.sparks(x, y, color, Math.min(18, 6 + (r / 12) | 0), 260, 0.5);
    this.forEnemiesIn(x, y, r, e => {
      this.damageEnemy(e, dmg, false, { kx: e.x - x, ky: e.y - y, knock: 180, blast: true });
      if (e.dead) return;
      if (o.stun && !e.isBoss) e.stunT = Math.max(e.stunT, o.stun);
      if (o.burn) { e.burnT = 4; e.burnDps = Math.max(e.burnDps, o.burn); }
      if (o.slow) { e.slowT = 3; e.slowMul = o.slow; }
      if (o.mark) e.markT = o.mark;
    });
    this.sfx('explosion', 0.08);
    this.shakeT = Math.max(this.shakeT, r > 120 ? 0.3 : 0.1);
  }

  /* ------------------------------------------------------------------ enemigos */
  private makeEnemy(def: EnemyDef, x: number, y: number): Enemy {
    const e = this.enemyPool.pop() ?? ({} as Enemy);
    const boss = def.behavior === 'boss';
    const t = this.time;
    const hpMul = boss ? (1 + t / 900) * this.diff.hp * (1 + this.overtime / 300) : this.hpScale;
    e.id = this.nextId++; e.def = def; e.x = x; e.y = y; e.kx = 0; e.ky = 0;
    e.maxHp = e.hp = def.hp * hpMul; e.r = def.r; e.speed = def.speed * (boss ? 1 : 1 + Math.min(0.25, t / 1500)); e.dmg = def.dmg;
    e.flash = 0; e.dead = false; e.burnT = 0; e.burnDps = 0; e.slowT = 0; e.slowMul = 1; e.stunT = 0; e.markT = 0;
    e.atkT = boss ? 2 : rnd(0.5, 2.5); e.windup = 0; e.fuse = 0; e.atk = null; e.phase = 0; e.isBoss = boss;
    e.anim = rnd(6); e.suicide = false; e.face = 0;
    e.lx = x; e.ly = y; e.stuckT = 0; e.sideT = 0; e.side = Math.random() < 0.5 ? -1 : 1; e.esc = 0; e.escReset = 0;
    this.enemies.push(e);
    return e;
  }
  private edgeSpawn(): { x: number; y: number } {
    const p = this.spawnFocus(), R = Math.hypot(this.viewW, this.viewH) / 2 + 50;
    for (let i = 0; i < 14; i++) {
      const a = rnd(Math.PI * 2);
      const x = p.x + Math.cos(a) * R, y = p.y + Math.sin(a) * R;
      if (this.inObstacle(x, y, 16)) continue;
      return { x, y };
    }
    const a = rnd(Math.PI * 2);
    return { x: p.x + Math.cos(a) * R, y: p.y + Math.sin(a) * R };
  }
  spawnEnemy(id: string, x?: number, y?: number) {
    const pos = x === undefined ? this.edgeSpawn() : { x, y: y as number };
    const e = this.makeEnemy(ENEMIES[id], pos.x, pos.y);
    this.resolve(e, e.r);
    return e;
  }
  private alive() { let n = 0; for (const e of this.enemies) if (!e.dead) n++; return n; }

  private updateSpawner(dt: number) {
    const t = this.time;
    const bossAlive = this.enemies.some(e => e.isBoss && !e.dead);
    // jefes
    if (this.bossIdx < BOSS_SCHEDULE.length && t >= BOSS_SCHEDULE[this.bossIdx].time) {
      const b = BOSS_SCHEDULE[this.bossIdx++];
      const e = this.spawnEnemy(b.id);
      if (b.id === 'final') this.finalSpawned = true;
      this.showBanner(`¡JEFE: ${ENEMIES[b.id].name.toUpperCase()}!`, '#ff4655', 3);
      this.sfx('boss', 0.5);
      this.shakeT = 0.5;
      this.addFx(0, e.x, e.y, 0, 0, 200, 0.6, '#ff4655');
    }
    // oleadas intensas
    if (this.waveIdx < WAVE_TIMES.length && t >= WAVE_TIMES[this.waveIdx]) {
      const n = 22 + this.waveIdx * 6;
      this.showBanner('¡OLEADA INTENSA!', '#ffb020', 2.6);
      this.reviveDead();
      this.sfx('wave', 0.5);
      const types = SPAWNABLE.filter(id => ENEMIES[id].minTime <= t && id !== 'tank');
      const p = this.spawnFocus(), R = Math.hypot(this.viewW, this.viewH) / 2 + 60;
      for (let i = 0; i < n && this.alive() < MAX_ENEMIES + 40; i++) {
        const a = (i / n) * Math.PI * 2;
        const x = p.x + Math.cos(a) * R, y = p.y + Math.sin(a) * R;
        if (this.inObstacle(x, y, 14)) continue;
        this.spawnEnemy(types[(Math.random() * types.length) | 0], x, y);
      }
      this.waveIdx++;
      if (this.waveIdx === WAVE_TIMES.length) this.endlessWaveT = FINAL_TIME + 30;
    }
    // modo infinito: jefes cada vez más seguidos y oleadas periódicas, sin final
    if (t >= this.endlessBossT) {
      const bosses = this.enemies.filter(e => e.isBoss && !e.dead).length;
      if (bosses < ENDLESS_MAX_BOSSES) {
        const n = 1 + Math.floor(this.overtime / 300);
        for (let i = 0; i < n; i++) {
          const id = ENDLESS_BOSSES[(Math.random() * ENDLESS_BOSSES.length) | 0];
          const e = this.spawnEnemy(id);
          this.addFx(0, e.x, e.y, 0, 0, 200, 0.6, '#ff4655');
          this.showBanner(`¡JEFE: ${ENEMIES[id].name.toUpperCase()}!`, '#ff4655', 2.4);
        }
        this.sfx('boss', 0.5);
        this.shakeT = 0.5;
      }
      this.endlessBossT = t + this.endlessGap;
    }
    if (this.endlessWaveT > 0 && t >= this.endlessWaveT) {
      const n = 40 + Math.floor(this.overtime / 30) * 4;
      this.showBanner('¡OLEADA INTENSA!', '#ffb020', 2.2);
      this.reviveDead();
      this.sfx('wave', 0.5);
      const types = SPAWNABLE.filter(id => id !== 'tank');
      const p = this.spawnFocus(), R = Math.hypot(this.viewW, this.viewH) / 2 + 60;
      for (let i = 0; i < n && this.alive() < MAX_ENEMIES + 60; i++) {
        const a = (i / n) * Math.PI * 2;
        const x = p.x + Math.cos(a) * R, y = p.y + Math.sin(a) * R;
        if (this.inObstacle(x, y, 14)) continue;
        this.spawnEnemy(types[(Math.random() * types.length) | 0], x, y);
      }
      this.endlessWaveT = t + 55;
    }
    // élites
    if (t >= this.eliteT) {
      const n = 1 + Math.floor((t - 200) / 130);
      for (let i = 0; i < n; i++) this.spawnEnemy('elite');
      this.eliteT += 42;
    }
    // flujo normal
    const alive = this.alive();
    const desired = Math.min(MAX_ENEMIES, (9 + t * 0.3) * this.diff.spawn) * (bossAlive && t < FINAL_TIME ? 0.55 : 1);
    if (alive < desired) {
      this.spawnAcc += (2.4 + t / 40) * this.diff.spawn * dt;
      while (this.spawnAcc >= 1) {
        this.spawnAcc -= 1;
        this.spawnEnemy(this.pickType(t));
      }
    } else this.spawnAcc = Math.min(this.spawnAcc, 1);
  }
  private pickType(t: number): string {
    let total = 0;
    const ws: number[] = [];
    for (const id of SPAWNABLE) {
      const d = ENEMIES[id];
      let w = t >= d.minTime ? d.weight : 0;
      if (id === 'grunt') w *= Math.max(0.35, 1 - t / 700);
      ws.push(w); total += w;
    }
    let r = Math.random() * total;
    for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return SPAWNABLE[i]; }
    return 'grunt';
  }

  private updateEnemies(dt: number) {
    const dmgScale = this.dmgScale;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      this.use(this.nearestPlayer(e.x, e.y));
      const p = this.player;
      e.anim += dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.markT > 0) e.markT -= dt;
      if (e.burnT > 0) {
        e.burnT -= dt;
        const b = e.burnDps * dt;
        e.hp -= b; this.damageDealt += b;
        if (Math.random() < 0.15) this.sparks(e.x, e.y, '#ff7a3d', 1, 50, 0.4);
        if (e.hp <= 0) { this.killEnemy(e, false); continue; }
      }
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const nx = dx / d, ny = dy / d;
      e.face = Math.atan2(dy, dx);
      let sp = e.speed;
      if (e.slowT > 0) { e.slowT -= dt; sp *= e.isBoss ? (1 + e.slowMul) / 2 : e.slowMul; }
      let mx = 0, my = 0;
      if (e.stunT > 0) e.stunT -= dt;
      else {
        switch (e.def.behavior) {
          case 'chase': mx = nx * sp; my = ny * sp; break;
          case 'mortar': {
            // se queda a media distancia y lanza obuses a donde está el jugador
            if (d > 380) { mx = nx * sp; my = ny * sp; }
            else if (d < 240) { mx = -nx * sp; my = -ny * sp; }
            else { mx = -ny * sp * 0.35; my = nx * sp * 0.35; }
            this.mortarLogic(e, dt, d);
            break;
          }
          case 'shooter': {
            if (d > 280) { mx = nx * sp; my = ny * sp; }
            else if (d < 200) { mx = -nx * sp * 0.8; my = -ny * sp * 0.8; }
            else { mx = -ny * sp * 0.5; my = nx * sp * 0.5; }
            this.shootLogic(e, dt, d, 1, 0.3, 2.2, 230);
            break;
          }
          case 'elite': {
            mx = nx * sp; my = ny * sp;
            this.shootLogic(e, dt, d, 3, 0.4, 2.8, 250);
            break;
          }
          case 'exploder': {
            if (e.fuse > 0) {
              e.fuse -= dt; sp *= 0.25;
              if (e.fuse <= 0) { this.exploderBoom(e); continue; }
            } else if (d < 52) e.fuse = 0.55;
            mx = nx * sp; my = ny * sp;
            break;
          }
          case 'boss': {
            const v = this.bossLogic(e, dt, nx, ny, d, sp);
            mx = v[0]; my = v[1];
            break;
          }
        }
      }
      // desatasco: si empuja contra un muro sin avanzar, rodea (de lado) y, si sigue atrapado, retrocede
      if (e.stunT <= 0 && d > 70) {
        const moved = Math.hypot(e.x - e.lx, e.y - e.ly), want = Math.hypot(mx, my) * dt;
        if (want > 0.01 && moved < want * 0.35) e.stuckT += dt; else e.stuckT = Math.max(0, e.stuckT - dt * 2);
        if (e.stuckT > 0.3 && e.sideT <= 0) {
          e.stuckT = 0; e.sideT = 1.1 + Math.random() * 0.5; e.esc++; e.escReset = 5;
          if (e.esc <= 1) e.side = Math.random() < 0.5 ? -1 : 1; else e.side = -e.side;
        }
        if (e.sideT > 0) {
          e.sideT -= dt;
          const k = e.esc >= 2 ? -0.7 : 0.15;                  // al 2.º intento: retrocede para salir del bolsillo
          const sm = Math.hypot(mx, my) || sp;
          mx = (nx * k - ny * e.side * 0.9) * sm; my = (ny * k + nx * e.side * 0.9) * sm;
        }
        if (e.escReset > 0) { e.escReset -= dt; if (e.escReset <= 0) e.esc = 0; }
      }
      e.lx = e.x; e.ly = e.y;
      // separación entre enemigos
      let sx = 0, sy = 0;
      if (!e.isBoss) {
        const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          for (let gx = cx - 1; gx <= cx + 1; gx++) {
            const cell = this.grid[gidx(gx, gy)];
            for (let k = 0; k < cell.length; k++) {
              const o = this.enemies[cell[k]];
              if (o === e || !o || o.dead) continue;
              const ox = e.x - o.x, oy = e.y - o.y, rr = e.r + o.r;
              const d2 = ox * ox + oy * oy;
              if (d2 < rr * rr && d2 > 0.01) {
                const dd = Math.sqrt(d2), f = (rr - dd) / rr;
                sx += (ox / dd) * f * 90; sy += (oy / dd) * f * 90;
              }
            }
          }
        }
      }
      e.x += (mx + e.kx + sx) * dt;
      e.y += (my + e.ky + sy) * dt;
      const kd = Math.pow(0.0005, dt);
      e.kx *= kd; e.ky *= kd;
      this.resolve(e, e.r);
      // lejos del jugador: reubicar
      if (d > (e.isBoss ? 1500 : 1100)) { const s = this.edgeSpawn(); e.x = s.x; e.y = s.y; e.kx = 0; e.ky = 0; if (e.atk) e.atk = null; }
      // contacto
      const cd = e.r + p.r;
      if (d < cd + 1 && e.def.behavior !== 'exploder') {
        const charging = e.atk && e.atk.kind === 'charge' && e.atk.t > 0.9;
        this.hurtPlayer(e.dmg * dmgScale * (charging ? 1.4 : 1), nx, ny);
      }
    }
  }

  private shootLogic(e: Enemy, dt: number, d: number, count: number, wind: number, cd: number, speed: number) {
    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        const a = Math.atan2(this.player.y - e.y, this.player.x - e.x);
        for (let i = 0; i < count; i++) this.enemyShot(e.x, e.y, a + (i - (count - 1) / 2) * 0.22, speed, e.dmg * this.dmgScale, e.def.color);
        e.atkT = cd + rnd(0.6);
      }
    } else {
      e.atkT -= dt;
      if (e.atkT <= 0 && d < 440) e.windup = wind;
    }
  }
  enemyShot(x: number, y: number, a: number, speed: number, dmg: number, color: string, r = 5) {
    this.eprojs.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg, r, life: 4, color, dead: false });
  }
  private exploderBoom(e: Enemy) {
    const p = this.player;
    const R = 78;
    this.addFx(0, e.x, e.y, 0, 0, R, 0.3, '#ff5a36');
    this.sparks(e.x, e.y, '#ff5a36', 12, 260, 0.5);
    this.sfx('explosion', 0.08);
    this.shakeT = Math.max(this.shakeT, 0.12);
    if (Math.hypot(p.x - e.x, p.y - e.y) < R + p.r) this.hurtPlayer(e.dmg * this.dmgScale);
    e.suicide = true;
    this.killEnemy(e, true);
  }

  private bossLogic(e: Enemy, dt: number, nx: number, ny: number, d: number, sp: number): [number, number] {
    const p = this.player;
    e.phase = e.hp < e.maxHp * 0.5 ? 1 : 0;
    if (!e.atk) {
      e.atkT -= dt;
      if (e.atkT <= 0) {
        const pats = e.def.patterns as BossPattern[];
        const kind = pats[(Math.random() * pats.length) | 0];
        const dur = kind === 'ring' ? 0.7 : kind === 'spiral' ? 2.6 : kind === 'slam' ? (e.phase ? 0.8 : 1.0) : kind === 'charge' ? 1.5 : 0.9;
        e.atk = { kind, t: 0, dur, x: p.x, y: p.y, ang: Math.atan2(p.y - e.y, p.x - e.x), fired: 0 };
        this.sfx('warn', 0.3);
      }
      return d > 150 ? [nx * sp, ny * sp] : [0, 0];
    }
    const a = e.atk;
    a.t += dt;
    const dm = e.dmg * this.dmgScale;
    switch (a.kind) {
      case 'ring': {
        if (a.t >= a.dur && a.fired === 0) { this.bossRing(e, 16 + e.phase * 8, 0, 210, dm * 0.45); a.fired = 1; if (e.phase) a.dur += 0.4; }
        else if (a.t >= a.dur && a.fired === 1) { this.bossRing(e, 16 + e.phase * 8, Math.PI / 16, 230, dm * 0.45); a.fired = 2; }
        if (a.t >= a.dur && a.fired >= (e.phase ? 2 : 1)) { this.endAtk(e); }
        return [0, 0];
      }
      case 'spiral': {
        if (a.t > 0.4) {
          const total = Math.floor((a.t - 0.4) / 0.08);
          while (a.fired < total) {
            const k = a.fired++;
            for (let arm = 0; arm < 2 + e.phase; arm++) this.enemyShot(e.x, e.y, k * 0.32 + (arm * Math.PI * 2) / (2 + e.phase), 190, dm * 0.4, '#ff9f3d', 5);
          }
        }
        if (a.t >= a.dur) this.endAtk(e);
        return [0, 0];
      }
      case 'slam': {
        if (a.t >= a.dur) {
          const R = 135;
          this.addFx(0, a.x, a.y, 0, 0, R, 0.4, '#ff4655');
          this.sparks(a.x, a.y, '#ff4655', 18, 300, 0.6);
          this.shakeT = 0.35;
          this.sfx('explosion', 0.1);
          if (Math.hypot(p.x - a.x, p.y - a.y) < R + p.r) this.hurtPlayer(dm * 0.9);
          this.endAtk(e);
        }
        return [0, 0];
      }
      case 'charge': {
        if (a.t < 0.9) { if (a.t < 0.55) a.ang = Math.atan2(p.y - e.y, p.x - e.x); return [0, 0]; }
        if (a.t >= a.dur) { this.endAtk(e); return [0, 0]; }
        return [Math.cos(a.ang) * 520, Math.sin(a.ang) * 520];
      }
      case 'summon': {
        if (a.t >= a.dur) {
          for (let i = 0; i < 6 && this.alive() < MAX_ENEMIES + 60; i++) {
            const ang = (i / 6) * Math.PI * 2;
            this.spawnEnemy(i % 3 === 0 ? 'runner' : 'grunt', e.x + Math.cos(ang) * (e.r + 30), e.y + Math.sin(ang) * (e.r + 30));
          }
          this.addFx(0, e.x, e.y, 0, 0, e.r + 60, 0.4, e.def.color);
          this.endAtk(e);
        }
        return [0, 0];
      }
    }
    return [0, 0];
  }
  private endAtk(e: Enemy) { e.atk = null; e.atkT = 1.5 - e.phase * 0.5 + rnd(0.8); }
  private bossRing(e: Enemy, n: number, off: number, speed: number, dmg: number) {
    for (let i = 0; i < n; i++) this.enemyShot(e.x, e.y, off + (i / n) * Math.PI * 2, speed, dmg, e.def.color, 6);
    this.addFx(0, e.x, e.y, 0, 0, e.r + 40, 0.3, e.def.color);
    this.sfx('warn', 0.2);
  }

  private mortarLogic(e: Enemy, dt: number, d: number) {
    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        const p = this.player;
        // apunta un poco por delante de hacia donde se mueve el jugador
        const lead = 0.5, sp = this.stats.speed;
        const tx = p.x + this.inputMove.x * sp * lead + rnd(-20, 20), ty = p.y + this.inputMove.y * sp * lead + rnd(-20, 20);
        this.shells.push({ x: tx, y: ty, ox: e.x, oy: e.y - e.r, t: 0, dur: 1.15, r: 62, dmg: e.dmg * this.dmgScale, dead: false });
        this.sparks(e.x, e.y - e.r, '#ffd24a', 5, 120, 0.3);
        this.sfx('shoot', 0.1);
        e.atkT = 3.2 + rnd(1.2);
      }
    } else {
      e.atkT -= dt;
      if (e.atkT <= 0 && d < 520) e.windup = 0.45;
    }
  }
  private updateShells(dt: number) {
    for (const s of this.shells) {
      if (s.dead) continue;
      s.t += dt;
      if (s.t < s.dur) continue;
      s.dead = true;
      this.addVfx('blast', 'boom', s.x, s.y, s.r, 0.5);
      this.sparks(s.x, s.y, '#ffb02e', 10, 240, 0.5);
      this.sfx('explosion', 0.08);
      for (const pl of this.players) {
        if (pl.dead) continue;
        if (Math.hypot(pl.body.x - s.x, pl.body.y - s.y) < s.r + pl.body.r) { this.use(pl); this.hurtPlayer(s.dmg); }
      }
    }
  }
  private updateEProjs(dt: number) {
    for (const b of this.eprojs) {
      if (b.dead) continue;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || this.inObstacle(b.x, b.y, 0)) { b.dead = true; continue; }
      for (const pl of this.players) {
        if (pl.dead) continue;
        const p = pl.body, dx = b.x - p.x, dy = b.y - p.y, rr = b.r + p.r;
        if (dx * dx + dy * dy < rr * rr) { this.use(pl); this.hurtPlayer(b.dmg); b.dead = true; break; }
      }
    }
  }

  killEnemy(e: Enemy, fromBlast: boolean) {
    if (e.dead) return;
    e.dead = true;
    if (!e.suicide) { this.kills++; this.ult = Math.min(100, this.ult + (e.isBoss ? 20 : 1.1 * this.stats.ult)); }
    const frenzy = this.buffs.frenzyT > 0 ? 3 : 1;
    if (this.stats.lifeOnKill > 0 || this.buffs.frenzyT > 0) this.heal(this.stats.lifeOnKill * frenzy + (this.buffs.frenzyT > 0 ? this.buffs.frenzyHeal * 8 : 0), true);
    this.sparks(e.x, e.y, e.def.color, e.isBoss ? 40 : 8, e.isBoss ? 420 : 200, 0.6);
    this.sfx('kill', 0.05);
    const v = e.def.xp;
    if (e.isBoss) {
      for (let i = 0; i < 12; i++) this.dropGem(e.x + rnd(-40, 40), e.y + rnd(-40, 40), v / 12, 0);
      for (let i = 0; i < 3; i++) this.dropGem(e.x + rnd(-40, 40), e.y + rnd(-40, 40), 0.25, 1);
      this.bossKills++;
      this.shakeT = 0.5;
      this.addFx(0, e.x, e.y, 0, 0, 260, 0.6, '#ffffff');
      this.showBanner(`¡${e.def.name.toUpperCase()} ELIMINADO!`, '#4ad66d', 2.6);
      if (e.def.id === 'final' && !this.finalKilled) {
        this.finalKilled = true;
        this.showBanner('¡MODO INFINITO!', '#ffd24a', 3);
      }
    } else {
      this.dropGem(e.x, e.y, v, e.def.behavior === 'elite' ? 1 : Math.random() < 0.008 ? 1 : 0, e.def.behavior === 'elite' ? 0.2 : 0.1);
      if (e.def.behavior === 'elite') this.dropGem(e.x + 10, e.y, v, 0);
    }
    if (this.stats.killExplode > 0 && !fromBlast && !e.suicide) {
      this.explodeAt(e.x, e.y, 62 * this.stats.area, this.stats.killExplode * 12 * this.stats.dmg, '#ff9f3d');
    }
  }

  /* ------------------------------------------------------------------ gemas y experiencia */
  private dropGem(x: number, y: number, v: number, kind: 0 | 1, healFrac = 0.12) {
    if (kind === 1) v = healFrac;
    if (this.gems.length >= MAX_GEMS && kind === 0) {
      const g = this.gems[(Math.random() * this.gems.length) | 0];
      if (g && g.kind === 0) { g.v += v; return; }
    }
    const near = Math.hypot(x - this.player.x, y - this.player.y) < 420 * this.stats.magnet;
    this.gems.push({ x, y, v, kind, mag: near, dead: false, t: 0 });
  }
  private updateGems(dt: number) {
    for (const g of this.gems) {
      if (g.dead) continue;
      this.use(this.nearestPlayer(g.x, g.y));
      const p = this.player, mag = 120 * this.stats.magnet;
      g.t += dt;
      const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy) || 1;
      if (d < mag || g.t > 8) g.mag = true;
      if (g.mag) {
        const s = 380 + (300 - Math.min(300, d)) * 1.4;
        g.x += (dx / d) * s * dt; g.y += (dy / d) * s * dt;
      }
      if (d < p.r + 8) {
        g.dead = true;
        if (g.kind === 0) { this.addXp(g.v); this.sfx('gem', 0.05); }
        else { this.healPct(g.v); this.sfx('pick', 0.1); }
      }
    }
  }
  addXp(v: number) {
    this.xp += v * this.stats.xp;
    while (this.xp >= this.need) {
      this.xp -= this.need;
      this.level++;
      for (const pl of this.players) if (!pl.gone) pl.pending++;
    }
    if (this.state === 'playing' && this.players.some(pl => pl.pending > 0)) this.startLevelUp();
  }
  /** Subida de nivel: la partida se detiene hasta que todos los jugadores eligen. */
  private startLevelUp() {
    this.state = 'levelup';
    const back = this.cur;
    for (const pl of this.players) {
      if (pl.pending <= 0 || pl.choices.length) continue;
      this.use(pl);
      pl.choices = this.rollChoices();
      this.ev.onLevelUp(pl.choices, pl.idx);
    }
    this.use(back);
    this.sfx('levelup', 0);
  }

  private rollRarity(): Rarity {
    const L = this.level;
    const w = [Math.max(20, 60 - L * 0.8), 28 + L * 0.6, 10 + L * 0.5, 2 + L * 0.15];
    let r = Math.random() * (w[0] + w[1] + w[2] + w[3]);
    for (let i = 0; i < 4; i++) { r -= w[i]; if (r <= 0) return i as Rarity; }
    return 0;
  }
  private rollChoices(): UpgradeChoice[] {
    type Cand = { weight: number; make: () => UpgradeChoice };
    const cands: Cand[] = [];
    for (const u of UPGRADES) {
      if (u.max && (this.taken[u.id] ?? 0) >= u.max) continue;
      cands.push({
        weight: u.weight,
        make: () => {
          let r = this.rollRarity();
          while (r > 0 && u.v[r] <= 0) r = (r - 1) as Rarity;
          if (u.v[r] <= 0) for (let k = 1; k < 4; k++) if (u.v[k] > 0) { r = k as Rarity; break; }
          return { id: u.id, kind: 'stat', name: u.name, desc: u.text(u.v[r]), icon: u.icon, rarity: r, value: u.v[r] };
        },
      });
    }
    const owned = new Set(this.weapons.map(w => w.id));
    if (this.weapons.length < 4) {
      for (const w of WEAPON_LIST) {
        if (owned.has(w.id)) continue;
        cands.push({
          weight: (this.weapons.length < 2 ? 9 : 4) * (w.rare === 2 ? 0.6 : 1),
          make: () => ({ id: w.id, kind: 'weapon-new', name: w.name, desc: `Nueva arma: ${w.desc}`, icon: '⌖', rarity: w.rare, value: 0, weaponId: w.id }),
        });
      }
    }
    for (const inst of this.weapons) {
      if (inst.lvl >= 5) continue;
      const w = WEAPONS[inst.id];
      const nl = inst.lvl + 1;
      cands.push({
        weight: 7,
        make: () => ({
          id: w.id + '_up', kind: 'weapon-up', weaponId: w.id, icon: '⌖', value: nl,
          rarity: (nl >= 5 ? 3 : nl >= 4 ? 2 : 1) as Rarity,
          name: nl >= 5 ? `${w.evolved.name}` : `${w.name} Nv.${nl}`,
          desc: nl >= 5 ? `EVOLUCIÓN: ${w.evolved.desc}` : `${w.name}: +22% daño y -6% de recarga`,
        }),
      });
    }
    const out: UpgradeChoice[] = [];
    for (let i = 0; i < 3 && cands.length; i++) {
      const total = cands.reduce((s, c) => s + c.weight, 0);
      let r = Math.random() * total, idx = 0;
      for (; idx < cands.length; idx++) { r -= cands[idx].weight; if (r <= 0) break; }
      idx = Math.min(idx, cands.length - 1);
      out.push(cands[idx].make());
      cands.splice(idx, 1);
    }
    if (!out.length) out.push({ id: 'healnow', kind: 'stat', name: 'Kit de reparación', desc: 'Recuperas 30% de vida', icon: '♥', rarity: 0, value: 0.3 });
    return out;
  }
  reroll(idx = this.local) {
    const pl = this.players[idx];
    if (this.state !== 'levelup' || !pl || pl.rerolls <= 0 || !pl.choices.length) return;
    this.withPlayer(pl, () => { pl.rerolls--; pl.choices = this.rollChoices(); });
    this.ev.onLevelUp(pl.choices, idx);
  }
  chooseUpgrade(i: number, idx = this.local) {
    const pl = this.players[idx];
    if (this.state !== 'levelup' || !pl) return;
    const c = pl.choices[i];
    if (!c) return;
    const back = this.cur;
    this.use(pl);
    if (c.kind === 'stat') {
      this.taken[c.id] = (this.taken[c.id] ?? 0) + 1;
      UPGRADE_BY_ID[c.id]?.apply({ stats: this.stats, healPct: f => this.healPct(f) }, c.value);
      this.syncDrones();
    } else if (c.kind === 'weapon-new') {
      this.weapons.push({ id: c.weaponId as string, lvl: 1, cd: 0.1 });
    } else {
      const w = this.weapons.find(x => x.id === c.weaponId);
      if (w) { w.lvl++; if (w.lvl >= 5) this.showBanner(`¡${WEAPONS[w.id].evolved.name.toUpperCase()}!`, '#ffb020', 2.2); }
    }
    this.sfx('pick', 0);
    pl.pending--;
    pl.choices = pl.pending > 0 ? this.rollChoices() : [];
    if (pl.choices.length) this.ev.onLevelUp(pl.choices, idx);
    this.use(back);
    if (this.players.every(x => x.pending <= 0)) this.state = 'playing';
  }

  /* ------------------------------------------------------------------ aliados: drones y torretas */
  private updateAllies(dt: number) {
    const p = this.player, s = this.stats;
    this.droneAngle += dt * 2.2;
    for (let i = 0; i < s.drones; i++) {
      this.droneCd[i] -= dt;
      if (this.droneCd[i] <= 0) {
        const a = this.droneAngle + (i / s.drones) * Math.PI * 2;
        const dx = p.x + Math.cos(a) * 52, dy = p.y + Math.sin(a) * 52;
        const t = this.nearestEnemy(dx, dy, 330);
        if (t) {
          this.spawnProj(dx, dy, Math.atan2(t.y - dy, t.x - dx), 560, 8 * s.dmg * 1.2, 3, 340, s.pierce, false, this.agent.accent, { chain: s.chain > 0 });
          this.droneCd[i] = 0.7;
          this.sfx('shoot', 0.06);
        } else this.droneCd[i] = 0.2;
      }
    }
    for (const t of this.turrets) {
      if (t.dead) continue;
      t.t -= dt; t.cd -= dt;
      if (t.t <= 0) { t.dead = true; this.sparks(t.x, t.y, t.color, 8, 120, 0.4); continue; }
      if (t.cd <= 0) {
        const tg = this.nearestEnemy(t.x, t.y, 340);
        if (tg) {
          const a = Math.atan2(tg.y - t.y, tg.x - t.x);
          t.ang = a;
          this.spawnProj(t.x, t.y, a, 640, t.power * 10 * s.dmg, 4, 360, 1 + s.pierce, false, t.color, { chain: s.chain > 0 });
          t.cd = 0.3;
          this.sfx('shoot', 0.06);
        } else t.cd = 0.15;
      }
    }
  }

  /* ------------------------------------------------------------------ habilidades */
  cast(slot: 'special' | 'secondary' | 'ultimate', idx = this.local) {
    const pl = this.players[idx];
    if (this.state !== 'playing' || !pl || pl.dead) return false;
    return this.withPlayer(pl, () => this.castNow(slot));
  }
  private castNow(slot: 'special' | 'secondary' | 'ultimate') {
    const ab = slot === 'special' ? this.agent.special : slot === 'secondary' ? this.agent.secondary : this.agent.ultimate;
    if (!ab) return false;
    if (slot === 'ultimate') {
      if (this.ult < 100) return false;
      this.ult = 0;
    } else {
      if (this.cds[slot] > 0) return false;
      this.cds[slot] = this.abCd(ab);
    }
    this.castT = this.time; this.castUlt = slot === 'ultimate';
    this.perform(ab, slot === 'ultimate');
    this.sfx(slot === 'ultimate' ? 'ult' : 'ability', 0);
    return true;
  }

  private perform(ab: AbilityDef, ult: boolean) {
    const p = this.player, s = this.stats, b = this.buffs;
    const dmg = ab.power * 10 * s.dmg;
    const ox = p.x, oy = p.y;
    this.abilityFx(ab, ult, ox, oy, true);
    switch (ab.kind) {
      case 'dash': {
        const dist = (ab.radius ?? 180), T = 0.18;
        p.dashT = T; p.dashVx = p.lastDirX * dist / T; p.dashVy = p.lastDirY * dist / T; p.dashPow = ab.power; p.dashHit.length = 0;
        p.invuln = Math.max(p.invuln, ab.invuln ?? 0.25);
        break;
      }
      case 'sprint':
        b.sprintT = ab.duration ?? 5; b.sprintPow = ab.power; b.sprintRad = ab.radius ?? 70;
        break;
      case 'nova': {
        const R = (ab.radius ?? 150) * s.area;
        this.explodeAt(p.x, p.y, R, dmg, ab.color, { stun: ab.stun, burn: ab.burn ? ab.burn * s.dmg : 0, slow: ab.slow, mark: ab.mark });
        if (ab.slow) this.forEnemiesIn(p.x, p.y, R, e => { e.slowT = ab.duration ?? 3; });
        break;
      }
      case 'strike': {
        const n = ab.count ?? 3, R = (ab.radius ?? 100) * s.area;
        const pool: Enemy[] = [];
        for (const e of this.enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 560) pool.push(e);
        for (let i = 0; i < n; i++) {
          let x: number, y: number;
          if (pool.length) { const e = pool[(Math.random() * pool.length) | 0]; x = e.x + rnd(-20, 20); y = e.y + rnd(-20, 20); }
          else { const a = rnd(Math.PI * 2), d = rnd(120, 300); x = p.x + Math.cos(a) * d; y = p.y + Math.sin(a) * d; }
          const delay = (ab.delay ?? 0.5) + (ult ? i * 0.07 : i * 0.12);
          this.strikes.push({ x, y, r: R, t: 0, dur: delay, dmg, color: ab.color, stun: 0, burn: 0, slow: 0, mark: 0, dead: false, fx: ab.fx, ox: p.x, oy: p.y, owner: this.cur.idx });
        }
        break;
      }
      case 'turret': {
        const n = ab.count ?? 1;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rnd(0.5);
          const o = { x: p.x + Math.cos(a) * 44, y: p.y + Math.sin(a) * 44 };
          this.resolve(o, 10);
          this.turrets.push({ x: o.x, y: o.y, t: ab.duration ?? 12, max: ab.duration ?? 12, cd: 0.2, power: ab.power, dead: false, color: ab.color, ang: a });
          this.sparks(o.x, o.y, ab.color, 6, 100, 0.4);
        }
        break;
      }
      case 'seekers': {
        const n = ab.count ?? 4;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          this.spawnProj(p.x, p.y, a, 380, dmg, 6, 1500, ult ? 99 : 3 + s.pierce, false, ab.color, { homing: true, mark: ab.mark ?? 0, look: 'arrow' });
        }
        break;
      }
      case 'blink': {
        const dist = ab.radius ?? 220;
        this.sparks(p.x, p.y, ab.color, 14, 220, 0.5);
        let nx = p.x, ny = p.y;
        const steps = 12;
        for (let i = 1; i <= steps; i++) {
          const tx = p.x + (p.lastDirX * dist * i) / steps, ty = p.y + (p.lastDirY * dist * i) / steps;
          if (this.inObstacle(tx, ty, p.r)) break;
          nx = tx; ny = ty;
        }
        p.x = nx; p.y = ny;
        p.invuln = Math.max(p.invuln, 0.3);
        this.explodeAt(p.x, p.y, (ab.count ?? 110) * s.area, dmg, ab.color, { stun: ab.stun, slow: ab.slow });
        break;
      }
      case 'frenzy':
        b.frenzyT = ab.duration ?? 5; b.frenzyMul = ab.power; b.frenzyHeal = ab.heal ?? 0; b.frenzyFx = ab.fx ?? '';
        this.addFx(0, p.x, p.y, 0, 0, 80, 0.4, ab.color);
        break;
      case 'storm':
        b.stormT = ab.duration ?? 3; b.stormPow = ab.power;
        break;
      case 'heal':
        this.addFx(0, p.x, p.y, 0, 0, 70, 0.5, ab.color);
        break;
    }
    if (ab.heal && ab.kind !== 'frenzy') this.healPct(ab.heal);
    else if (ab.heal && ab.kind === 'frenzy') this.healPct(ab.heal);
    if (ab.shield) p.shield = Math.min(s.maxShield + 100, p.shield + ab.shield);
    if (ab.invuln && ab.kind !== 'dash') p.invuln = Math.max(p.invuln, ab.invuln);
    if (ab.kind === 'heal' || ab.heal) this.sparks(p.x, p.y, '#5dff9a', 10, 120, 0.7);
    if (ult) { this.showBanner(ab.name.toUpperCase(), ab.color, 1.6); this.shakeT = Math.max(this.shakeT, 0.3); }
    this.abilityFx(ab, ult, ox, oy, false);
  }

  /* ------------------------------------------------------------------ efectos de habilidades (decorativos) */
  addVfx(kind: Vfx['kind'], pal: string, x: number, y: number, r: number, dur: number, o: Partial<Vfx> = {}) {
    if (this.vfx.length > 160) return;
    this.vfx.push({ kind, pal, x, y, r, t: 0, dur, ang: 0, seed: (Math.random() * 1e6) | 0, owner: this.cur.idx, ...o });
  }
  /** Lanza los efectos de una habilidad. before = antes de aplicarla (p. ej. origen de un teletransporte). */
  private abilityFx(ab: AbilityDef, ult: boolean, ox: number, oy: number, before: boolean) {
    const p = this.player, s = this.stats, R = (ab.radius ?? 150) * s.area, big = ult ? 1.4 : 1;
    const rise = (sprite: string, pal: string, n: number, spread: number, dur: number) => {
      for (let i = 0; i < n; i++) {
        const a = rnd(Math.PI * 2), d = rnd(spread * 0.3, spread);
        this.addVfx('rise', pal, Math.cos(a) * d, Math.sin(a) * d * 0.6, 0, rnd(dur * 0.7, dur), { follow: true, sprite, ang: rnd(0.35) });
      }
    };
    if (before) {
      if (ab.fx === 'shadow') this.addVfx('blast', 'shadow', ox, oy, 70 * big, 0.7);
      if (ab.fx === 'wind') this.addVfx('gust', 'wind', ox, oy, 70, 0.4, { ang: Math.atan2(p.lastDirY, p.lastDirX) });
      return;
    }
    switch (ab.fx) {
      case 'wind': this.addVfx('blast', 'wind', ox, oy, 46, 0.35); break;
      case 'blades': this.addVfx('blast', 'wind', p.x, p.y, 60 * big, 0.35, { kind: 'ring' }); break;
      case 'fire':
        this.addVfx('blast', 'fire', p.x, p.y, R, 0.6 * big);
        this.addVfx('flames', 'fire', p.x, p.y, R * 0.75, 0.9 * big, { seed: ult ? 22 : 12 });
        if (ult) this.addVfx('beam', 'fire', p.x, p.y, 70, 0.8);
        break;
      case 'hothands':
        this.addVfx('blast', 'fire', p.x, p.y, 56, 0.45);
        rise('flame', 'fire', 10, 34, 0.9);
        break;
      case 'heal':
        this.addVfx('blast', 'heal', p.x, p.y, 64, 0.5);
        rise('cross', 'heal', 9, 30, 1);
        break;
      case 'ice':
        this.addVfx('blast', 'ice', p.x, p.y, R, 0.5);
        this.addVfx('field', 'ice', p.x, p.y, R, ab.duration ?? 3);
        break;
      case 'holy':
        this.addVfx('beam', 'holy', p.x, p.y, 90, 1.1);
        this.addVfx('blast', 'holy', p.x, p.y, R, 0.8);
        rise('cross', 'holy', 14, 46, 1.3);
        break;
      case 'soul':
        this.addVfx('eye', 'soul', 0, -44, 0, 0.9, { follow: true, r: ult ? 2 : 1 });
        this.addVfx('blast', 'soul', p.x, p.y, 70 * big, 0.5);
        break;
      case 'boom':
        this.addVfx('blast', 'boom', p.x, p.y, R, 0.55);
        this.addVfx('blast', 'smoke', p.x, p.y, R * 1.15, 1.1);
        break;
      case 'arrow': this.addVfx('blast', 'scan', p.x, p.y, 50 * big, 0.35, { kind: 'ring' }); break;
      case 'scan':
        this.addVfx('ring', 'scan', p.x, p.y, R, 0.9);
        this.addVfx('ring', 'scan', p.x, p.y, R * 0.6, 0.7);
        break;
      case 'electric': this.addVfx('blast', 'electric', p.x, p.y, 70 * big, 0.4); break;
      case 'shadow': this.addVfx('blast', 'shadow', p.x, p.y, (ab.count ?? 110) * s.area, 0.7); break;
      case 'paranoia':
        this.addVfx('blast', 'shadow', p.x, p.y, R, 0.8);
        this.addVfx('eye', 'shadow', 0, -44, 0, 0.9, { follow: true, r: 1 });
        break;
      case 'turret': this.addVfx('blast', 'turret', p.x, p.y, 54, 0.35, { kind: 'ring' }); break;
      case 'stim':
        this.addVfx('blast', 'stim', p.x, p.y, 60, 0.4, { kind: 'ring' });
        rise('chevron', 'stim', 8, 30, 0.9);
        break;
      // grenade / rocket / orbital: se dibujan en vuelo (strikes) y estallan en updateStrikes
    }
  }

  private updateStrikes(dt: number) {
    for (const s of this.strikes) {
      if (s.dead) continue;
      s.t += dt;
      if (s.t >= s.dur) {
        s.dead = true;
        this.use(this.players[s.owner] ?? this.cur);
        this.explodeAt(s.x, s.y, s.r, s.dmg, s.color);
        if (s.fx === 'orbital') {
          this.addVfx('beam', 'orbital', s.x, s.y, s.r * 0.8, 0.45);
          this.addVfx('blast', 'orbital', s.x, s.y, s.r, 0.6);
        } else if (s.fx === 'grenade' || s.fx === 'rocket') {
          this.addVfx('blast', 'boom', s.x, s.y, s.r, 0.55);
          if (s.fx === 'rocket') this.addVfx('blast', 'smoke', s.x, s.y, s.r * 1.1, 1);
        }
      }
    }
    for (const v of this.vfx) v.t += dt;
    if (this.vfx.length) this.vfx = this.vfx.filter(v => v.t < v.dur);
  }

  /* ------------------------------------------------------------------ efectos visuales */
  sparks(x: number, y: number, color: string, n: number, speed: number, life = 0.4) {
    if (this.netOut) this.netOut.push(['s', Math.round(x), Math.round(y), color, n, Math.round(speed), life]);
    for (let i = 0; i < n; i++) {
      const p = this.particles.next();
      const a = rnd(Math.PI * 2), sp = rnd(speed * 0.3, speed);
      p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      p.life = p.max = rnd(life * 0.5, life); p.size = rnd(1.5, 3.5); p.color = color; p.circle = Math.random() < 0.5;
    }
  }
  text(x: number, y: number, text: string, color: string, size: number) {
    if (this.netOut) this.netOut.push(['t', Math.round(x), Math.round(y), text, color, size]);
    const t = this.texts.next();
    t.x = x; t.y = y; t.text = text; t.color = color; t.size = size; t.life = 0.7;
  }
  addFx(kind: 0 | 1, x: number, y: number, _a: number, _b: number, r: number, life: number, color: string, x2 = 0, y2 = 0) {
    if (this.netOut) this.netOut.push(['f', kind, Math.round(x), Math.round(y), Math.round(r), life, color, Math.round(x2), Math.round(y2)]);
    const f = this.fxs.next();
    f.kind = kind; f.x = x; f.y = y; f.x2 = x2; f.y2 = y2; f.r = r; f.life = f.max = life; f.color = color;
  }
  /** Vuelve a cargar en los campos del motor el jugador actual (tras cambiar su Pl desde fuera). */
  reload() { const c = this.cur; this.cur = undefined as unknown as Pl; this.use(c); }
  /** Avanza solo lo visual (partículas, textos, ondas): lo usa el invitado, que no simula la partida. */
  tickVisuals(dt: number) {
    if (this.banner.t > 0) this.banner.t -= dt;
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    this.updateFx(dt);
  }
  private updateFx(dt: number) {
    for (const p of this.particles.items) {
      if (p.life <= 0) continue;
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.92; p.vy *= 0.92;
    }
    for (const t of this.texts.items) if (t.life > 0) { t.life -= dt; t.y -= 28 * dt; }
    for (const f of this.fxs.items) if (f.life > 0) f.life -= dt;
  }

  private cleanup() {
    let w = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) this.enemyPool.push(e); else this.enemies[w++] = e;
    }
    this.enemies.length = w;
    w = 0;
    for (let i = 0; i < this.projs.length; i++) {
      const p = this.projs[i];
      if (p.dead) { p.target = null; this.projPool.push(p); } else this.projs[w++] = p;
    }
    this.projs.length = w;
    this.eprojs = this.eprojs.filter(b => !b.dead);
    if (this.shells.length) this.shells = this.shells.filter(s => !s.dead);
    this.gems = this.gems.filter(g => !g.dead);
    this.turrets = this.turrets.filter(t => !t.dead);
    this.strikes = this.strikes.filter(s => !s.dead);
  }

  /* ------------------------------------------------------------------ control de estado */
  pause() { if (this.state === 'playing') this.state = 'paused'; }
  resume() { if (this.state === 'paused') this.state = 'playing'; }
  togglePause() { if (this.state === 'playing') this.state = 'paused'; else if (this.state === 'paused') this.state = 'playing'; }

  /** Segundos entre jefes en modo infinito: se acortan con el tiempo y la dificultad. */
  private get endlessGap() { return Math.max(ENDLESS_BOSS_MIN, ENDLESS_BOSS_START - this.overtime / 12) * this.diff.bossEvery; }

  /** La partida solo termina al morir; cuenta como victoria si se derrotó al jefe final. */
  private end() {
    if (this.state === 'won' || this.state === 'lost') return;
    this.state = 'lost';
    this.use(this.me);
    this.sfx(this.finalKilled ? 'win' : 'lose', 0);
    this.ev.onEnd(this.resultFor(this.local));
  }
  /** Resultado de la partida para un jugador (en cooperativo, las bajas y el tiempo son del equipo). */
  resultFor(idx: number): RunResult {
    const win = this.finalKilled;
    const credits = Math.floor((this.kills * 0.4 + this.time / 8 + this.level * 6 + this.bossKills * 40 + (win ? 350 : 0)) * this.diff.credits);
    return {
      win, time: this.time, kills: this.kills, level: this.level, damage: Math.round(this.damageDealt),
      bossKills: this.bossKills, credits, agentId: (this.players[idx] ?? this.me).agent.id, mapId: this.map.id, difficulty: this.diff.id,
    };
  }
  /** Termina la partida desde fuera (p. ej. se pierde la conexión en cooperativo). */
  abort() { this.end(); }
  /** Un jugador abandona la partida cooperativa: cae y ya no vuelve. Si no queda nadie, termina. */
  leave(idx: number) {
    const pl = this.players[idx];
    if (!pl || pl.gone) return;
    pl.gone = true; pl.dead = true;
    // quien se va no puede bloquear la elección de mejoras del resto
    pl.pending = 0; pl.choices = [];
    if (this.state === 'levelup' && this.players.every(x => x.pending <= 0)) this.state = 'playing';
    if (this.players.every(x => x.dead)) this.end();
    else this.showBanner(`${(pl.name || 'Tu compañero').toUpperCase()} HA SALIDO DE LA PARTIDA`, '#ffb020', 3);
  }

  /** Solo para pruebas y depuración. */
  debugSkip(seconds: number) { this.time += seconds; }

  hud() {
    const p = this.player, s = this.stats;
    const boss = this.enemies.find(e => e.isBoss && !e.dead);
    return {
      state: this.state, hp: p.hp, maxHp: s.maxHp, shield: p.shield, maxShield: s.maxShield,
      xp: this.xp, need: this.need, level: this.level, time: this.time, kills: this.kills,
      alive: this.enemies.length, ult: this.ult, rerolls: this.rerolls,
      special: { cd: this.cds.special, max: this.abCd(this.agent.special) },
      secondary: this.agent.secondary ? { cd: this.cds.secondary, max: this.abCd(this.agent.secondary) } : null,
      weapons: this.weapons.map(w => ({ id: w.id, lvl: w.lvl })),
      boss: boss ? { name: boss.def.name, hp: boss.hp, max: boss.maxHp } : null,
      banner: this.banner.t > 0 ? { text: this.banner.text, color: this.banner.color } : null,
      finalAt: FINAL_TIME,
      finalSpawned: this.finalSpawned,
      endless: this.time >= FINAL_TIME,
      nextBoss: Math.max(0, this.endlessBossT - this.time),
      difficulty: this.diff,
      dead: this.me.dead,
      /** Compañeros en cooperativo (vacío en solitario). */
      mates: this.players.filter(p => p !== this.me).map(p => ({ name: p.name, hp: p.body.hp, maxHp: p.stats.maxHp, dead: p.dead, gone: !!p.gone, color: p.agent.color, agent: p.agent.name })),
    };
  }
}

// Marca de tiempo monótona para limitar efectos de sonido (funciona en navegador y en Node).
function performance_now() { return typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000; }
