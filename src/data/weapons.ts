import { WeaponDef } from '../game/types';

export const WEAPONS: Record<string, WeaponDef> = {
  classic: {
    id: 'classic', name: 'Classic', desc: 'Pistola equilibrada. Siempre fiable.',
    damage: 10, cooldown: 0.42, speed: 560, range: 380, count: 1, fan: 0.1, jitter: 0.03, pierce: 0,
    crit: 0, critMul: 0, size: 4, color: '#ffe9a8', heavy: false, rare: 0,
    evolved: { name: 'Classic Élite', desc: '+1 bala, +30% daño, atraviesa 1 enemigo', count: 1, dmgMul: 1.3, pierce: 1 },
  },
  vandal: {
    id: 'vandal', name: 'Vandal', desc: 'Disparos de gran daño y buen alcance.',
    damage: 24, cooldown: 0.8, speed: 720, range: 440, count: 1, fan: 0.1, jitter: 0.02, pierce: 0,
    crit: 0.05, critMul: 0, size: 5, color: '#ff8a5c', heavy: true, rare: 1,
    evolved: { name: 'Vandal Tiranía', desc: 'Atraviesa 2 enemigos más, +25% daño', pierce: 2, dmgMul: 1.25 },
  },
  phantom: {
    id: 'phantom', name: 'Phantom', desc: 'Ráfagas rápidas y precisas.',
    damage: 8, cooldown: 0.27, speed: 640, range: 400, count: 1, fan: 0.12, jitter: 0.05, pierce: 0,
    crit: 0, critMul: 0, size: 3.5, color: '#9ad7ff', heavy: false, rare: 1,
    evolved: { name: 'Phantom Espectral', desc: 'Dispara 2 balas por ráfaga', count: 1, cdMul: 0.9 },
  },
  spectre: {
    id: 'spectre', name: 'Spectre', desc: 'Altísima cadencia, poco daño por bala.',
    damage: 5, cooldown: 0.14, speed: 600, range: 330, count: 1, fan: 0.14, jitter: 0.14, pierce: 0,
    crit: 0, critMul: 0, size: 3, color: '#7dffcf', heavy: false, rare: 1,
    evolved: { name: 'Spectre Enjambre', desc: 'Proyectiles adicionales', count: 1, cdMul: 0.9 },
  },
  operator: {
    id: 'operator', name: 'Operator', desc: 'Disparo lento y devastador que atraviesa todo.',
    damage: 70, cooldown: 1.7, speed: 1050, range: 640, count: 1, fan: 0.1, jitter: 0, pierce: 99,
    crit: 0.1, critMul: 0, size: 6, color: '#d6a8ff', heavy: true, rare: 2,
    evolved: { name: 'Operator Ejecutor', desc: 'Recarga 30% más rápida y explota al impactar', cdMul: 0.7, explode: 0.6 },
  },
  sheriff: {
    id: 'sheriff', name: 'Sheriff', desc: 'Potente, con mucha probabilidad de crítico.',
    damage: 24, cooldown: 0.85, speed: 700, range: 420, count: 1, fan: 0.12, jitter: 0.02, pierce: 0,
    crit: 0.3, critMul: 1.0, size: 5, color: '#ffd24a', heavy: true, rare: 1,
    evolved: { name: 'Sheriff Dorado', desc: '+25% crítico y dispara 2 balas', crit: 0.25, count: 1 },
  },
  judge: {
    id: 'judge', name: 'Judge', desc: 'Escopeta: muchos perdigones a corta distancia.',
    damage: 6, cooldown: 1.0, speed: 560, range: 230, count: 6, fan: 0.1, jitter: 0.1, pierce: 0,
    crit: 0, critMul: 0, size: 3.5, color: '#ff6b7a', heavy: true, rare: 1,
    evolved: { name: 'Judge Aniquilador', desc: '+3 perdigones por disparo', count: 3 },
  },
  odin: {
    id: 'odin', name: 'Odin', desc: 'Ametralladora pesada de cadencia enorme.',
    damage: 5, cooldown: 0.09, speed: 620, range: 360, count: 1, fan: 0.2, jitter: 0.2, pierce: 0,
    crit: 0, critMul: 0, size: 3.5, color: '#ff9f3d', heavy: false, rare: 2,
    evolved: { name: 'Odin Furia', desc: 'Atraviesa 1 enemigo y +40% daño', pierce: 1, dmgMul: 1.4 },
  },
};
// Armas exclusivas del mercado nocturno (se fusionan en WEAPONS para que el motor las encuentre).
export const EXCLUSIVE_WEAPONS: WeaponDef[] = [
  {
    id: 'ares_inferno', name: 'Ares Infernal', desc: 'Ametralladora forjada en lava: lluvia de balas incandescentes.', exclusive: true, sprite: 'odin', price: 12000,
    skin: { M: '#c9301c', D: '#3a0e08', L: '#ffb02e', W: '#5a1a10' },
    damage: 7, cooldown: 0.07, speed: 660, range: 380, count: 1, fan: 0.16, jitter: 0.16, pierce: 0,
    crit: 0.05, critMul: 0.2, size: 3.5, color: '#ff5a2a', heavy: false, rare: 3,
    evolved: { name: 'Ares Volcánico', desc: 'Atraviesa 1 enemigo, +50% daño y balas explosivas', pierce: 1, dmgMul: 1.5, explode: 0.25 },
  },
  {
    id: 'marshal_vacio', name: 'Marshal del Vacío', desc: 'Francotirador que perfora la realidad. Críticos devastadores.', exclusive: true, sprite: 'operator', price: 14000,
    skin: { M: '#5a2a9a', D: '#120a24', L: '#d6a8ff', W: '#2a1240' },
    damage: 58, cooldown: 0.95, speed: 1250, range: 720, count: 1, fan: 0.1, jitter: 0, pierce: 99,
    crit: 0.35, critMul: 1.2, size: 6, color: '#b05cff', heavy: true, rare: 3,
    evolved: { name: 'Marshal Singularidad', desc: 'Recarga 25% más rápida y estalla al impactar', cdMul: 0.75, explode: 0.8 },
  },
  {
    id: 'bucky_tormenta', name: 'Bucky Tormenta', desc: 'Escopeta eléctrica: perdigones que atraviesan enemigos.', exclusive: true, sprite: 'judge', price: 10000,
    skin: { M: '#1f8fb0', D: '#0a2a3a', L: '#c4faff', W: '#2a3f66' },
    damage: 9, cooldown: 0.75, speed: 620, range: 260, count: 8, fan: 0.11, jitter: 0.08, pierce: 1,
    crit: 0.05, critMul: 0, size: 3.5, color: '#2fe6ff', heavy: true, rare: 3,
    evolved: { name: 'Bucky Huracán', desc: '+4 perdigones con descarga explosiva', count: 4, explode: 0.25 },
  },
  {
    id: 'guardian_aurora', name: 'Guardian Aurora', desc: 'Rifle de precisión con munición que estalla en luz.', exclusive: true, sprite: 'vandal', price: 11000,
    skin: { M: '#2fb88a', D: '#0f2a22', L: '#d6ffe6', W: '#24413a' },
    damage: 30, cooldown: 0.55, speed: 900, range: 520, count: 1, fan: 0.1, jitter: 0.01, pierce: 2,
    crit: 0.15, critMul: 0.4, size: 5, color: '#5dff9a', heavy: true, rare: 3,
    evolved: { name: 'Guardian Boreal', desc: '+40% daño y atraviesa 2 enemigos más', dmgMul: 1.4, pierce: 2 },
  },
  {
    id: 'frenzy_cosmos', name: 'Frenzy Cósmico', desc: 'Pistola automática que dispara pares de estrellas.', exclusive: true, sprite: 'classic', price: 9000,
    skin: { M: '#d946ef', D: '#2a0a36', L: '#ffd6ff', W: '#7a2a9a' },
    damage: 7, cooldown: 0.12, speed: 640, range: 360, count: 2, fan: 0.18, jitter: 0.08, pierce: 0,
    crit: 0.1, critMul: 0.3, size: 3.5, color: '#ff9cff', heavy: false, rare: 3,
    evolved: { name: 'Frenzy Supernova', desc: '+2 balas por disparo y +20% crítico', count: 2, crit: 0.2 },
  },
  {
    id: 'bulldog_draco', name: 'Bulldog Dracónico', desc: 'Fusil de asalto con balas de fuego de dragón que explotan.', exclusive: true, sprite: 'phantom', price: 13000,
    skin: { M: '#d8b04a', D: '#3a2a10', L: '#fff0b0', W: '#8a5a1a' },
    damage: 14, cooldown: 0.22, speed: 720, range: 440, count: 1, fan: 0.12, jitter: 0.04, pierce: 1,
    crit: 0.1, critMul: 0.3, size: 4, color: '#ffd24a', heavy: false, rare: 3, explode: 0.2,
    evolved: { name: 'Bulldog Ancestral', desc: '+1 bala, +30% daño y explosiones mayores', count: 1, dmgMul: 1.3, explode: 0.4 },
  },
];
for (const w of EXCLUSIVE_WEAPONS) WEAPONS[w.id] = w;
/** Armas que pueden salir al subir de nivel (las exclusivas no). */
export const WEAPON_LIST = Object.values(WEAPONS).filter(w => !w.exclusive);
