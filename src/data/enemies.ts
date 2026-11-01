import { EnemyDef } from '../game/types';

export const ENEMIES: Record<string, EnemyDef> = {
  grunt:   { id: 'grunt', name: 'Recluta', hp: 14, speed: 64, dmg: 6, r: 11, xp: 1, color: '#c9d1d9', shape: 'circle', behavior: 'chase', minTime: 0, weight: 10 },
  runner:  { id: 'runner', name: 'Corredor', hp: 9, speed: 118, dmg: 7, r: 9, xp: 1.4, color: '#ffb347', shape: 'tri', behavior: 'chase', minTime: 55, weight: 5 },
  tank:    { id: 'tank', name: 'Tanque', hp: 95, speed: 44, dmg: 14, r: 19, xp: 6, color: '#6f7d92', shape: 'square', behavior: 'chase', minTime: 110, weight: 2.5 },
  shooter: { id: 'shooter', name: 'Tirador', hp: 16, speed: 56, dmg: 7, r: 11, xp: 2.2, color: '#4dc3ff', shape: 'diamond', behavior: 'shooter', minTime: 85, weight: 3.5 },
  exploder:{ id: 'exploder', name: 'Explosivo', hp: 12, speed: 92, dmg: 26, r: 11, xp: 2, color: '#ff5a36', shape: 'spike', behavior: 'exploder', minTime: 140, weight: 3 },
  elite:   { id: 'elite', name: 'Élite', hp: 260, speed: 62, dmg: 20, r: 17, xp: 22, color: '#ff4655', shape: 'hex', behavior: 'elite', minTime: 200, weight: 0 },
  boss1: {
    id: 'boss1', name: 'Centinela', hp: 1500, speed: 52, dmg: 24, r: 34, xp: 120, color: '#ff4655', shape: 'boss',
    behavior: 'boss', minTime: 150, weight: 0, patterns: ['slam', 'ring'],
  },
  boss2: {
    id: 'boss2', name: 'Cazador', hp: 3600, speed: 58, dmg: 28, r: 38, xp: 220, color: '#ff9f3d', shape: 'boss',
    behavior: 'boss', minTime: 300, weight: 0, patterns: ['charge', 'ring', 'summon', 'slam'],
  },
  boss3: {
    id: 'boss3', name: 'Titán', hp: 7000, speed: 54, dmg: 32, r: 44, xp: 360, color: '#b05cff', shape: 'boss',
    behavior: 'boss', minTime: 450, weight: 0, patterns: ['spiral', 'slam', 'charge', 'summon'],
  },
  final: {
    id: 'final', name: 'Cabecilla del Protocolo', hp: 13000, speed: 60, dmg: 36, r: 52, xp: 1000, color: '#ffffff', shape: 'boss',
    behavior: 'boss', minTime: 540, weight: 0, patterns: ['ring', 'spiral', 'slam', 'charge', 'summon'],
  },
  mortar: { id: 'mortar', name: 'Artillero', hp: 26, speed: 48, dmg: 16, r: 12, xp: 2.8, color: '#ffd24a', shape: 'diamond', behavior: 'mortar', minTime: 120, weight: 2.4 },
};

/* ------------------------------------------------------------------ bots de la grieta (art/enemigos.png) */
/** 8 tipos de bot en 3 niveles: normal (n), élite (e) y legendario (l). El nivel depende de la zona y del tiempo. */
export const BOT_KINDS = ['soldado', 'arana', 'flotante', 'torreta', 'escudo', 'asesino', 'volador', 'sanador'];
export const TIERS = ['n', 'e', 'l'];
const TIER_NAME = ['', ' élite', ' legendario'];
const TIER_MUL = { hp: [1, 1.8, 3], dmg: [1, 1.3, 1.6], xp: [1, 1.8, 3], speed: [1, 1.05, 1.1], r: [0, 2, 4] };
type Base = Omit<EnemyDef, 'id' | 'name' | 'shape' | 'kind' | 'tier' | 'art'> & { name: string[] };
const BOTS: Record<string, Base> = {
  soldado:  { name: ['Dron soldado', 'Soldado élite', 'Soldado legendario'], hp: 16, speed: 56, dmg: 7, r: 11, xp: 2, color: '#ff4655', behavior: 'shooter', minTime: 30, weight: 4 },
  arana:    { name: ['Dron araña', 'Araña élite', 'Araña legendaria'], hp: 14, speed: 70, dmg: 6, r: 11, xp: 1, color: '#ff4655', behavior: 'chase', minTime: 0, weight: 10 },
  flotante: { name: ['Dron flotante', 'Flotante élite', 'Flotante legendario'], hp: 12, speed: 60, dmg: 6, r: 10, xp: 2, color: '#c070ff', behavior: 'shooter', shots: 3, minTime: 70, weight: 3 },
  torreta:  { name: ['Torreta', 'Lanzacohetes', 'Lanzacohetes legendario'], hp: 30, speed: 40, dmg: 15, r: 13, xp: 3, color: '#ffd24a', behavior: 'mortar', minTime: 110, weight: 2.2 },
  escudo:   { name: ['Escudo', 'Tanque', 'Tanque legendario'], hp: 90, speed: 42, dmg: 13, r: 16, xp: 5, color: '#9aa4b4', behavior: 'chase', armor: 0.3, minTime: 100, weight: 2.5 },
  asesino:  { name: ['Asesino', 'Asesino élite', 'Asesino legendario'], hp: 10, speed: 120, dmg: 8, r: 10, xp: 1.5, color: '#b05cff', behavior: 'chase', minTime: 50, weight: 5 },
  volador:  { name: ['Dron volador', 'Dron volador élite', 'Dron volador legendario'], hp: 12, speed: 95, dmg: 6, r: 10, xp: 2, color: '#ff3d81', behavior: 'shooter', minTime: 90, weight: 3 },
  sanador:  { name: ['Sanador', 'Sanador élite', 'Sanador legendario'], hp: 22, speed: 55, dmg: 4, r: 11, xp: 3, color: '#4fd0ff', behavior: 'healer', minTime: 130, weight: 1.6 },
};
for (const k of BOT_KINDS) TIERS.forEach((tc, tier) => {
  const b = BOTS[k], id = `${k}_${tc}`;
  ENEMIES[id] = {
    ...b, id, name: b.name[tier], shape: 'circle', kind: k, tier, art: id,
    hp: Math.round(b.hp * TIER_MUL.hp[tier]), dmg: Math.round(b.dmg * TIER_MUL.dmg[tier]), xp: +(b.xp * TIER_MUL.xp[tier]).toFixed(1),
    speed: Math.round(b.speed * TIER_MUL.speed[tier]), r: b.r + TIER_MUL.r[tier], armor: b.armor ? Math.min(0.6, b.armor + tier * 0.1) : undefined,
  };
});
/** Nivel de los bots con el que empieza cada zona; con el tiempo suben uno (ver tierFor en el motor). */
export const ZONE_TIER: Record<string, number> = { reino: 0, glaciar: 1, ciudad: 1, infierno: 2 };

/* ------------------------------------------------------------------ jefes de la grieta */
Object.assign(ENEMIES, {
  coloso: { id: 'coloso', name: 'Coloso mecánico', hp: 1500, speed: 50, dmg: 24, r: 36, xp: 120, color: '#ff4655', shape: 'boss', behavior: 'boss', minTime: 150, weight: 0, patterns: ['ring', 'slam', 'shield'], art: 'coloso' },
  reina: { id: 'reina', name: 'Reina araña', hp: 1500, speed: 60, dmg: 22, r: 36, xp: 120, color: '#ff4a3a', shape: 'boss', behavior: 'boss', minTime: 150, weight: 0, patterns: ['summon', 'web', 'charge', 'web'], art: 'reina' },
  elemental: { id: 'elemental', name: 'Elemental de energía', hp: 1700, speed: 48, dmg: 24, r: 38, xp: 120, color: '#2fe6ff', shape: 'boss', behavior: 'boss', minTime: 150, weight: 0, patterns: ['spiral', 'ring', 'storm', 'storm'], art: 'elemental' },
  dragon: { id: 'dragon', name: 'Dragón cibernético', hp: 1600, speed: 56, dmg: 26, r: 40, xp: 120, color: '#d946ef', shape: 'boss', behavior: 'boss', minTime: 150, weight: 0, patterns: ['flame', 'charge', 'summon', 'flame'], art: 'dragon' },
  sabio: { id: 'sabio', name: 'Sabio oscuro', hp: 3600, speed: 58, dmg: 28, r: 38, xp: 220, color: '#9b5cff', shape: 'boss', behavior: 'boss', minTime: 300, weight: 0, patterns: ['ring', 'summon', 'blink', 'spiral', 'blink'], art: 'sabio' },
  dragon_final: { id: 'dragon_final', name: 'Dragón cibernético', hp: 13000, speed: 60, dmg: 36, r: 54, xp: 1000, color: '#ff3dd0', shape: 'boss', behavior: 'boss', minTime: 540, weight: 0, patterns: ['spiral', 'charge', 'summon', 'flame', 'storm', 'flame'], art: 'dragon', final: true },
} as Record<string, EnemyDef>);
/** Jefe propio de cada zona (sale al 2:30 y, más fuerte, al 7:30). */
export const ZONE_BOSS: Record<string, string> = { reino: 'coloso', ciudad: 'reina', glaciar: 'elemental', infierno: 'dragon' };

/** Tipos que salen en el flujo normal (los antiguos robots ya no salen; siguen en ENEMIES por el cooperativo). */
export const SPAWNABLE = BOT_KINDS;
/** Jefes: 'zona' = el jefe de la zona donde estás (hp × hpMul); al final, el Dragón cibernético. */
export const BOSS_SCHEDULE: { time: number; id: string; hpMul?: number }[] = [
  { time: 150, id: 'zona' }, { time: 300, id: 'sabio' }, { time: 450, id: 'zona', hpMul: 4.5 }, { time: 540, id: 'dragon_final' },
];
export const WAVE_TIMES = [100, 190, 260, 345, 420, 490];
/** Momento en que aparece el jefe final; a partir de ahí empieza el modo infinito. */
export const FINAL_TIME = 540;
/** Modo infinito: segundos entre jefes al empezar y como mínimo (antes de aplicar la dificultad). */
export const ENDLESS_BOSS_START = 45;
export const ENDLESS_BOSS_MIN = 14;
export const ENDLESS_BOSSES = ['zona', 'sabio', 'zona', 'dragon_final'];
export const ENDLESS_MAX_BOSSES = 6;
