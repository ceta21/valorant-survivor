import { PowerDef } from '../game/types';

// Poderes básicos: cada héroe lanza el suyo sin parar al enemigo más cercano (no hay armas). Al subir de nivel
// se mejoran (+22 % daño y −6 % recarga por nivel, evolución al nivel 5) o se aprenden otros, hasta 4 a la vez.
export const POWERS: Record<string, PowerDef> = {
  arcano: {
    id: 'arcano', name: 'Proyectil arcano', desc: 'Orbe de energía rápido y certero.', icon: '🔮',
    damage: 12, cooldown: 0.42, speed: 600, range: 400, count: 1, fan: 0.1, jitter: 0.03, pierce: 0,
    crit: 0.05, critMul: 0, size: 6.5, color: '#7a9cff', look: 'star', rare: 0,
    evolved: { name: 'Cometa arcano', desc: '+1 proyectil, +30% daño y atraviesa 1 enemigo', count: 1, dmgMul: 1.3, pierce: 1 },
  },
  flecha: {
    id: 'flecha', name: 'Flecha élfica', desc: 'Flechas de largo alcance que atraviesan enemigos.', icon: '🏹',
    damage: 20, cooldown: 0.75, speed: 820, range: 520, count: 1, fan: 0.1, jitter: 0.02, pierce: 2,
    crit: 0.1, critMul: 0.3, size: 5.5, color: '#9aff9a', look: 'arrow', rare: 1,
    evolved: { name: 'Flecha del bosque', desc: 'Dispara 3 flechas y atraviesan 2 enemigos más', count: 2, pierce: 2 },
  },
  fuego: {
    id: 'fuego', name: 'Bola de fuego', desc: 'Llamas que queman a los enemigos durante 3 s.', icon: '🔥',
    damage: 12, cooldown: 0.6, speed: 460, range: 380, count: 1, fan: 0.14, jitter: 0.05, pierce: 0,
    crit: 0, critMul: 0, size: 8.5, color: '#ff7a2e', look: 'flame', rare: 0, burn: 6,
    evolved: { name: 'Infierno', desc: '+1 bola, +25% daño y estallan al impactar', count: 1, dmgMul: 1.25, explode: 0.4 },
  },
  rayo: {
    id: 'rayo', name: 'Rayo', desc: 'Chispazos rápidos que saltan a otro enemigo cercano.', icon: '⚡',
    damage: 8, cooldown: 0.34, speed: 820, range: 380, count: 1, fan: 0.12, jitter: 0.06, pierce: 0,
    crit: 0.05, critMul: 0, size: 5.5, color: '#2fe6ff', look: 'bolt', rare: 1, chain: true,
    evolved: { name: 'Tormenta eléctrica', desc: 'Dispara 2 rayos y +30% daño', count: 1, dmgMul: 1.3 },
  },
  hoja: {
    id: 'hoja', name: 'Hojas afiladas', desc: 'Abanico de 3 hojas cortantes.', icon: '🍃',
    damage: 9, cooldown: 0.6, speed: 560, range: 340, count: 3, fan: 0.22, jitter: 0.04, pierce: 0,
    crit: 0, critMul: 0, size: 5.5, color: '#5dff9a', look: 'leaf', rare: 0,
    evolved: { name: 'Vendaval de hojas', desc: '+3 hojas por lanzamiento', count: 3 },
  },
  viento: {
    id: 'viento', name: 'Cuchilla de viento', desc: 'Cuchillas veloces de cadencia altísima.', icon: '🌪️',
    damage: 5, cooldown: 0.16, speed: 760, range: 340, count: 1, fan: 0.14, jitter: 0.12, pierce: 1,
    crit: 0.05, critMul: 0, size: 5, color: '#bfeaff', look: 'dagger', rare: 1,
    evolved: { name: 'Huracán', desc: 'Atraviesa 1 enemigo más y +40% daño', pierce: 1, dmgMul: 1.4 },
  },
  sombra: {
    id: 'sombra', name: 'Esfera sombría', desc: 'Almas que persiguen a su objetivo.', icon: '👻',
    damage: 18, cooldown: 0.65, speed: 380, range: 460, count: 1, fan: 0.3, jitter: 0.1, pierce: 0,
    crit: 0.1, critMul: 0.4, size: 7, color: '#d946ef', look: 'wisp', rare: 1, homing: true,
    evolved: { name: 'Legión de almas', desc: '+2 almas por lanzamiento y +20% crítico', count: 2, crit: 0.2 },
  },
  hielo: {
    id: 'hielo', name: 'Fragmento de hielo', desc: 'Carámbanos que atraviesan a los enemigos.', icon: '❄️',
    damage: 13, cooldown: 0.5, speed: 680, range: 420, count: 1, fan: 0.16, jitter: 0.03, pierce: 1,
    crit: 0.05, critMul: 0, size: 6.5, color: '#9ad8ff', look: 'ice', rare: 0,
    evolved: { name: 'Ventisca', desc: '+2 fragmentos y atraviesan 1 enemigo más', count: 2, pierce: 1 },
  },
  luz: {
    id: 'luz', name: 'Lanza de luz', desc: 'Haces sagrados que atraviesan todo y hacen críticos.', icon: '✨',
    damage: 26, cooldown: 0.95, speed: 1000, range: 600, count: 1, fan: 0.1, jitter: 0, pierce: 99,
    crit: 0.2, critMul: 0.6, size: 7, color: '#ffffff', look: 'arrow', rare: 2,
    evolved: { name: 'Juicio divino', desc: 'Recarga 30% más rápida y estalla al impactar', cdMul: 0.7, explode: 0.5 },
  },
  roca: {
    id: 'roca', name: 'Roca', desc: 'Pedruscos pesados que estallan al golpear.', icon: '🪨',
    damage: 24, cooldown: 1.0, speed: 420, range: 340, count: 1, fan: 0.2, jitter: 0.04, pierce: 0,
    crit: 0, critMul: 0, size: 10, color: '#c8a070', look: 'rock', rare: 1, explode: 0.35,
    evolved: { name: 'Alud', desc: '+2 rocas y explosiones mayores', count: 2, explode: 0.3 },
  },
  agua: {
    id: 'agua', name: 'Chorro de agua', desc: 'Ráfagas de agua que atraviesan a los enemigos.', icon: '💧',
    damage: 7, cooldown: 0.42, speed: 620, range: 380, count: 2, fan: 0.12, jitter: 0.05, pierce: 1,
    crit: 0, critMul: 0, size: 6.5, color: '#4ff0e0', look: 'water', rare: 0,
    evolved: { name: 'Maremoto', desc: '+2 chorros y +25% daño', count: 2, dmgMul: 1.25 },
  },
};
/** Poderes que se pueden aprender al subir de nivel. */
export const POWER_LIST = Object.values(POWERS);

/** Poder con el que empieza cada héroe. */
export const HERO_POWER: Record<string, string> = {
  zephyr: 'arcano', lyra: 'flecha', kael: 'luz', vex: 'viento', sylvan: 'hoja', ember: 'fuego', brutus: 'roca',
  frost: 'hielo', seraph: 'luz', nox: 'sombra', raven: 'fuego', talos: 'roca', morgan: 'sombra', volt: 'rayo',
  grim: 'roca', aqua: 'agua', zahir: 'viento', draco: 'fuego', sora: 'sombra', tink: 'rayo',
  eclipse: 'sombra', vortice: 'viento', quimera: 'hoja',
};
export const heroPower = (agentId: string) => POWERS[HERO_POWER[agentId]] ?? POWERS.arcano;
