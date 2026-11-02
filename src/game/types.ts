export interface Vec { x: number; y: number }
/** k: b=edificio, w=muro, c=caja, p=pilar/torre, t=barril, a=árbol, o=roca, r=meseta de roca, v=abismo, h=mar.
 *  s: estilo (castillo, casa, cabaña, cúpula, rascacielos, volcán…). */
export interface Rect { x: number; y: number; w: number; h: number; k?: 'b' | 'w' | 'c' | 'p' | 't' | 'a' | 'o' | 'r' | 'v' | 'h'; s?: string }
export type Rarity = 0 | 1 | 2 | 3;
export const RARITY_NAMES = ['Común', 'Poco común', 'Épica', 'Legendaria'];
export const RARITY_COLORS = ['#b8c0cc', '#4ad66d', '#b05cff', '#ffb020'];

export type AbilityKind =
  | 'dash' | 'sprint' | 'nova' | 'strike' | 'heal'
  | 'turret' | 'seekers' | 'blink' | 'frenzy' | 'storm'
  /** Rayo recto hacia el enemigo más cercano (o hacia donde vas) que atraviesa a todos; count = nº de rayos en estrella. */
  | 'beam'
  /** Abanico delante de ti (aliento de fuego); spread = apertura en grados. */
  | 'cone'
  /** count bolas que giran alrededor del héroe a radius de distancia durante duration s y golpean al tocar. */
  | 'orbit'
  /** count bolas que saltan de enemigo en enemigo (bounces saltos cada una). */
  | 'bounce'
  /** Durante duration s lanza bolas en espiral alrededor (count brazos). */
  | 'spiral'
  /** count discos que van hasta radius y vuelven al héroe, atravesando todo a la ida y a la vuelta. */
  | 'boomerang'
  /** Durante duration s deja un rastro al moverse que daña (y frena con slow) a los enemigos que lo pisan. */
  | 'trail';

export type AbilityFx =
  | 'wind' | 'blades' | 'fire' | 'hothands' | 'heal' | 'ice' | 'holy' | 'soul' | 'grenade' | 'boom' | 'rocket'
  | 'arrow' | 'scan' | 'electric' | 'shadow' | 'paranoia' | 'turret' | 'orbital' | 'stim'
  | 'poison' | 'water' | 'gravity' | 'wire';

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
  /** Ancho del rayo (beam). */
  width?: number;
  /** Saltos de cada bola (bounce). */
  bounces?: number;
  /** Apertura del abanico en grados (cone). */
  spread?: number;
  /** Estilo visual del efecto (ver game/vfx.ts y Renderer). */
  fx?: AbilityFx;
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
  colors: { ground: string; ground2: string; wall: string; wallTop: string; accent: string; light: string };
  /** Posición de la zona en la cuadrícula 2×2 del mundo. */
  zone: [number, number];
}

/** Ataques de jefe. Los cinco últimos son propios de cada jefe (escudo, telaraña, tormenta, aliento y salto). */
export type BossPattern = 'ring' | 'spiral' | 'slam' | 'charge' | 'summon' | 'shield' | 'web' | 'storm' | 'flame' | 'blink';
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
  behavior: 'flee' | 'chase' | 'shooter' | 'mortar' | 'exploder' | 'elite' | 'boss' | 'healer';
  minTime: number;
  weight: number;
  patterns?: BossPattern[];
  /** Dibujo recortado de art/enemigos.png (public/enemies/<art>.png); si no, el robot dibujado por código. */
  art?: string;
  /** Tipo de bot y nivel (0 normal, 1 élite, 2 legendario). */
  kind?: string; tier?: number;
  /** Disparos por ráfaga (tiradores). */
  shots?: number;
  /** Fracción del daño que bloquea (escudos y tanques). */
  armor?: number;
  /** Jefe final: al derrotarlo se gana la partida. */
  final?: boolean;
}

/** Aspecto de un proyectil ('' = estela de luz del color del poder). */
export type ProjLook = '' | 'dagger' | 'arrow' | 'flame' | 'bolt' | 'leaf' | 'wisp' | 'ice' | 'water' | 'rock' | 'star'
  /** Disco giratorio del color del proyectil (bumerán). */
  | 'disc';

/** Poder básico: lo lanza el héroe solo, sin parar, al enemigo más cercano. Sube de nivel y evoluciona al 5. */
export interface PowerDef {
  id: string;
  name: string;
  desc: string;
  icon: string;     // emoji de la tarjeta y del HUD
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
  look: ProjLook;
  rare: Rarity;
  burn?: number;    // quemadura (daño por segundo, 3 s)
  chain?: boolean;  // salta a un enemigo cercano al impactar
  homing?: boolean; // persigue al objetivo
  explode?: number;
  /** Mejora de partida (id de UPGRADES) que hace falta, además del nivel 5, para evolucionar. */
  evoWith: string;
  evolved: { name: string; desc: string; count?: number; pierce?: number; dmgMul?: number; cdMul?: number; crit?: number; explode?: number };
}

export interface RunResult {
  win: boolean; time: number; kills: number; level: number; damage: number;
  bossKills: number; credits: number; agentId: string; mapId: string; difficulty: string;
  /** Objetos de equipo que soltaron los jefes en la partida. */
  loot?: { id: string; rarity: 0 | 1 | 2 | 3 }[];
  /** Desafío semanal jugado (id), si lo era. */
  challenge?: string;
}

export interface UpgradeChoice {
  id: string;
  kind: 'stat' | 'power-new' | 'power-up' | 'power-evo';
  name: string;
  desc: string;
  icon: string;
  rarity: Rarity;
  value: number;
  powerId?: string;
  /** Carta de mejora que, junto con un poder al nivel 5, permite evolucionarlo (id del poder). */
  evoFor?: string;
}
