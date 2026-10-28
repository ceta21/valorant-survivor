export interface Vec { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }
export type Rarity = 0 | 1 | 2 | 3;
export const RARITY_NAMES = ['Común', 'Poco común', 'Épica', 'Legendaria'];
export const RARITY_COLORS = ['#b8c0cc', '#4ad66d', '#b05cff', '#ffb020'];

export type AbilityKind =
  | 'dash' | 'sprint' | 'nova' | 'strike' | 'heal'
  | 'turret' | 'seekers' | 'blink' | 'frenzy' | 'storm';

export interface AbilityDef {
  id: string;
  name: string;
  desc: string;
  kind: AbilityKind;
  cd: number;          // segundos (para la definitiva se ignora: usa carga)
  power: number;       // multiplicador de daño (x10 de daño base)
  radius?: number;     // área / distancia
  count?: number;
  duration?: number;
  delay?: number;
  heal?: number;       // fracción de vida máxima
  shield?: number;
  invuln?: number;
  stun?: number;
  burn?: number;
  slow?: number;
  mark?: number;
  color: string;
}

export interface Stats {
  maxHp: number; speed: number; dmg: number; aspd: number;
  crit: number; critMul: number; extraProj: number; pierce: number;
  range: number; area: number; cdr: number; heal: number; xp: number;
  chain: number; drones: number; maxShield: number; killExplode: number;
  regen: number; magnet: number; burn: number; ult: number; lifeOnKill: number;
}

export interface AgentDef {
  id: string;
  name: string;
  role: string;
  desc: string;
  color: string;
  accent: string;
  hp: number;
  speed: number;
  damage: number;      // 10 = base
  special: AbilityDef;
  secondary?: AbilityDef;
  ultimate: AbilityDef;
  trait: { label: string; desc: string; mods: Partial<Stats> };
  cost: number;
  emblem: string;      // path SVG (viewBox 24)
}

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  width: number;
  height: number;
  colors: { ground: string; ground2: string; wall: string; wallTop: string; accent: string; light: string };
  obstacles: Rect[];
  zones?: { x: number; y: number; r: number; label: string }[];
  portals?: [Vec, Vec][];
}

export type BossPattern = 'ring' | 'spiral' | 'slam' | 'charge' | 'summon';
export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  dmg: number;
  r: number;
  xp: number;
  color: string;
  shape: 'circle' | 'tri' | 'square' | 'diamond' | 'spike' | 'hex' | 'boss';
  behavior: 'chase' | 'shooter' | 'exploder' | 'elite' | 'boss';
  minTime: number;
  weight: number;
  patterns?: BossPattern[];
}

export interface WeaponDef {
  id: string;
  name: string;
  desc: string;
  damage: number;
  cooldown: number;
  speed: number;
  range: number;
  count: number;
  fan: number;      // ángulo entre proyectiles
  jitter: number;   // dispersión aleatoria
  pierce: number;
  crit: number;
  critMul: number;
  size: number;
  color: string;
  heavy: boolean;
  rare: Rarity;
  explode?: number;
  evolved: { name: string; desc: string; count?: number; pierce?: number; dmgMul?: number; cdMul?: number; crit?: number; explode?: number };
}

export interface RunResult {
  win: boolean; time: number; kills: number; level: number; damage: number;
  bossKills: number; credits: number; agentId: string; mapId: string;
}

export interface UpgradeChoice {
  id: string;
  kind: 'stat' | 'weapon-new' | 'weapon-up';
  name: string;
  desc: string;
  icon: string;
  rarity: Rarity;
  value: number;
  weaponId?: string;
}
