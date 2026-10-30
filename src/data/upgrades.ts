import { Stats } from '../game/types';

export interface UpgradeCtx { healPct(frac: number): void; stats: Stats }
export interface UpgradeDef {
  id: string; name: string; icon: string;
  v: [number, number, number, number];   // valor por rareza (0 = no disponible)
  weight: number;
  max?: number;
  text: (v: number) => string;
  apply: (ctx: UpgradeCtx, v: number) => void;
}
const pct = (v: number) => `${Math.round(v * 100)}%`;

export const UPGRADES: UpgradeDef[] = [
  { id: 'dmg', name: 'Poder concentrado', icon: '✦', v: [0.12, 0.18, 0.27, 0.4], weight: 10, text: v => `+${pct(v)} de daño`, apply: (c, v) => { c.stats.dmg += v; } },
  { id: 'aspd', name: 'Lanzamiento veloz', icon: '≫', v: [0.1, 0.15, 0.22, 0.32], weight: 10, text: v => `+${pct(v)} de velocidad de ataque`, apply: (c, v) => { c.stats.aspd += v; } },
  { id: 'move', name: 'Botas de sprint', icon: '➤', v: [0.08, 0.12, 0.18, 0.26], weight: 7, max: 6, text: v => `+${pct(v)} de velocidad de movimiento`, apply: (c, v) => { c.stats.speed *= 1 + v; } },
  { id: 'range', name: 'Visión lejana', icon: '◎', v: [0.15, 0.22, 0.32, 0.5], weight: 6, max: 6, text: v => `+${pct(v)} de alcance de proyectiles`, apply: (c, v) => { c.stats.range += v; } },
  { id: 'proj', name: 'Poder duplicado', icon: '⁞', v: [0, 1, 1, 2], weight: 5, max: 5, text: v => `+${v} proyectil${v > 1 ? 'es' : ''} adicional${v > 1 ? 'es' : ''} en todos tus poderes`, apply: (c, v) => { c.stats.extraProj += v; } },
  { id: 'crit', name: 'Ojo de halcón', icon: '✜', v: [0.06, 0.1, 0.15, 0.25], weight: 7, text: v => `+${pct(v)} de probabilidad de crítico`, apply: (c, v) => { c.stats.crit += v; } },
  { id: 'area', name: 'Carga expansiva', icon: '◉', v: [0.12, 0.2, 0.3, 0.45], weight: 6, text: v => `+${pct(v)} de radio de explosión y habilidades`, apply: (c, v) => { c.stats.area += v; } },
  { id: 'healing', name: 'Matriz de curación', icon: '✚', v: [0.15, 0.25, 0.4, 0.6], weight: 5, max: 5, text: v => `+${pct(v)} de eficacia de curación`, apply: (c, v) => { c.stats.heal += v; } },
  { id: 'cdr', name: 'Circuitos de recarga', icon: '⟳', v: [0.06, 0.1, 0.15, 0.22], weight: 7, max: 6, text: v => `-${pct(v)} de tiempo de recarga de habilidades`, apply: (c, v) => { c.stats.cdr = Math.min(0.6, c.stats.cdr + v); } },
  { id: 'healnow', name: 'Kit de reparación', icon: '♥', v: [0.15, 0.25, 0.4, 0.7], weight: 5, text: v => `Recuperas ${pct(v)} de tu vida máxima`, apply: (c, v) => { c.healPct(v); } },
  { id: 'maxhp', name: 'Blindaje reforzado', icon: '▣', v: [10, 18, 30, 50], weight: 7, text: v => `+${v} de vida máxima`, apply: (c, v) => { c.stats.maxHp += v; c.healPct(v / c.stats.maxHp); } },
  { id: 'xp', name: 'Datos tácticos', icon: '★', v: [0.1, 0.16, 0.25, 0.4], weight: 6, max: 6, text: v => `+${pct(v)} de experiencia obtenida`, apply: (c, v) => { c.stats.xp += v; } },
  { id: 'chain', name: 'Arco eléctrico', icon: 'ϟ', v: [0, 1, 1, 2], weight: 4, max: 5, text: v => `Los impactos saltan a ${v} enemigo${v > 1 ? 's' : ''} más (daño en cadena)`, apply: (c, v) => { c.stats.chain += v; } },
  { id: 'pierce', name: 'Poder perforante', icon: '↠', v: [1, 1, 2, 3], weight: 6, max: 6, text: v => `Tus poderes atraviesan ${v} enemigo${v > 1 ? 's' : ''} más`, apply: (c, v) => { c.stats.pierce += v; } },
  { id: 'drone', name: 'Dron auxiliar', icon: '✶', v: [0, 0, 1, 2], weight: 3, max: 5, text: v => `+${v} dron${v > 1 ? 'es' : ''} que orbita y dispara`, apply: (c, v) => { c.stats.drones += v; } },
  { id: 'shield', name: 'Escudo regenerativo', icon: '⬡', v: [10, 18, 30, 50], weight: 5, text: v => `+${v} de escudo que se regenera fuera de combate`, apply: (c, v) => { c.stats.maxShield += v; } },
  { id: 'killexp', name: 'Eliminación explosiva', icon: '✹', v: [0.4, 0.6, 1.0, 1.6], weight: 5, text: v => `Los enemigos explotan al morir (+${Math.round(v * 12)} de daño en área)`, apply: (c, v) => { c.stats.killExplode += v; } },
  { id: 'regen', name: 'Nanobots', icon: '⚕', v: [0.4, 0.8, 1.4, 2.2], weight: 5, text: v => `+${v} de vida por segundo`, apply: (c, v) => { c.stats.regen += v; } },
  { id: 'magnet', name: 'Imán de orbes', icon: '⊕', v: [0.25, 0.4, 0.6, 1.0], weight: 4, max: 4, text: v => `+${pct(v)} de radio de recogida`, apply: (c, v) => { c.stats.magnet += v; } },
  { id: 'burn', name: 'Toque ígneo', icon: '♨', v: [0, 3, 6, 12], weight: 4, max: 4, text: v => `Tus poderes incendian al enemigo (${v} de daño/s)`, apply: (c, v) => { c.stats.burn += v; } },
  { id: 'ult', name: 'Carga rápida de definitiva', icon: 'Ⓠ', v: [0.15, 0.25, 0.4, 0.6], weight: 4, max: 4, text: v => `+${pct(v)} de carga de la definitiva`, apply: (c, v) => { c.stats.ult += v; } },
  { id: 'vamp', name: 'Succión vital', icon: '☠', v: [0.2, 0.4, 0.7, 1.2], weight: 4, max: 5, text: v => `Recuperas ${v} de vida por eliminación`, apply: (c, v) => { c.stats.lifeOnKill += v; } },
];
export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(UPGRADES.map(u => [u.id, u]));
