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
export const WEAPON_LIST = Object.values(WEAPONS);
