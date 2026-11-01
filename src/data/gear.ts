// Equipo entre partidas: objetos que sueltan los jefes y se guardan en la cuenta. Se llevan hasta GEAR_SLOTS a la
// vez y dan ventajas pequeñas al héroe al empezar cada partida. Se suben de nivel con créditos o se desmontan.
import { Stats } from '../game/types';

export type GearRarity = 0 | 1 | 2 | 3;
export const GEAR_RARITY_NAMES = ['Común', 'Raro', 'Épico', 'Legendario'];
export const GEAR_RARITY_COLORS = ['#b4bacb', '#4fd0ff', '#c070ff', '#ffd24a'];
export const GEAR_SLOTS = 3, GEAR_MAX_LVL = 5;

export interface GearDef {
  id: string; name: string; icon: string;
  /** Estadística que mejora. speed se multiplica (+%); el resto se suma. */
  stat: keyof Stats;
  /** Valor por rareza (común, raro, épico, legendario) a nivel 1. */
  v: [number, number, number, number];
  /** Cómo se escribe el valor (pct = porcentaje). */
  pct: boolean;
  label: string;
}
export const GEAR: GearDef[] = [
  { id: 'amuleto_fuerza', name: 'Amuleto de fuerza', icon: '🔶', stat: 'dmg', v: [0.04, 0.07, 0.11, 0.16], pct: true, label: 'daño' },
  { id: 'placa_titanio', name: 'Placa de titanio', icon: '🛡️', stat: 'maxHp', v: [8, 14, 22, 32], pct: false, label: 'vida máxima' },
  { id: 'botas_grieta', name: 'Botas de la grieta', icon: '👢', stat: 'speed', v: [0.03, 0.05, 0.08, 0.12], pct: true, label: 'velocidad' },
  { id: 'nucleo_frio', name: 'Núcleo frío', icon: '❄️', stat: 'cdr', v: [0.03, 0.05, 0.08, 0.12], pct: true, label: 'recarga de habilidades' },
  { id: 'iman_cristal', name: 'Imán de cristal', icon: '🧲', stat: 'magnet', v: [0.1, 0.18, 0.28, 0.4], pct: true, label: 'radio de recogida' },
  { id: 'ojo_rubi', name: 'Ojo de rubí', icon: '🔴', stat: 'crit', v: [0.02, 0.04, 0.06, 0.09], pct: true, label: 'crítico' },
  { id: 'anillo_eco', name: 'Anillo del eco', icon: '💍', stat: 'area', v: [0.04, 0.07, 0.11, 0.16], pct: true, label: 'área' },
  { id: 'musgo_vital', name: 'Musgo vital', icon: '🌿', stat: 'regen', v: [0.2, 0.4, 0.7, 1], pct: false, label: 'vida por segundo' },
  { id: 'tomo_saber', name: 'Tomo del saber', icon: '📘', stat: 'xp', v: [0.04, 0.07, 0.11, 0.16], pct: true, label: 'experiencia' },
  { id: 'gatillo_vacio', name: 'Gatillo del vacío', icon: '⚡', stat: 'aspd', v: [0.03, 0.05, 0.08, 0.12], pct: true, label: 'velocidad de ataque' },
  { id: 'escudo_runico', name: 'Escudo rúnico', icon: '🔷', stat: 'maxShield', v: [6, 10, 16, 24], pct: false, label: 'escudo' },
  { id: 'colmillo', name: 'Colmillo de la grieta', icon: '🦷', stat: 'lifeOnKill', v: [0.2, 0.4, 0.6, 1], pct: false, label: 'vida por baja' },
];
export const GEAR_BY_ID = Object.fromEntries(GEAR.map(g => [g.id, g])) as Record<string, GearDef>;

export interface GearItem { uid: string; id: string; rarity: GearRarity; lvl: number }
export interface GearSave { items: GearItem[]; equipped: string[] }
/** Al empezar se regala un amuleto común para que se vea cómo funciona. */
export const emptyGear = (): GearSave => ({ items: [{ uid: 'inicio', id: 'amuleto_fuerza', rarity: 0, lvl: 1 }], equipped: ['inicio'] });

/** Valor de un objeto según su rareza y nivel (+15 % por nivel). */
export const gearValue = (it: GearItem) => (GEAR_BY_ID[it.id]?.v[it.rarity] ?? 0) * (1 + 0.15 * (it.lvl - 1));
export const gearText = (it: GearItem) => {
  const d = GEAR_BY_ID[it.id], v = gearValue(it);
  return d ? `+${d.pct ? Math.round(v * 100) + '%' : Math.round(v * 10) / 10} ${d.label}` : '';
};
/** Precio de subir un nivel y créditos por desmontarlo. */
export const gearUpgradeCost = (it: GearItem) => 250 * (it.rarity + 1) * it.lvl;
export const gearScrapValue = (it: GearItem) => 120 * (it.rarity + 1) * it.lvl;

/** Ventajas de los objetos equipados (speed como fracción que multiplica; el resto se suma a la estadística). */
export function gearBonus(g: GearSave): Partial<Stats> {
  const out: Partial<Stats> = {};
  for (const uid of g.equipped.slice(0, GEAR_SLOTS)) {
    const it = g.items.find(x => x.uid === uid), d = it && GEAR_BY_ID[it.id];
    if (it && d) out[d.stat] = (out[d.stat] ?? 0) + gearValue(it);
  }
  return out;
}

/** Botín de un jefe: rareza según lo duro de la zona (0-2) y si es el jefe final (asegura épico o legendario). */
export function rollLoot(zoneTier: number, final: boolean): { id: string; rarity: GearRarity } {
  const w = final ? [0, 0, 70, 30] : [[60, 30, 9, 1], [40, 38, 18, 4], [25, 40, 27, 8]][Math.max(0, Math.min(2, zoneTier))];
  let r = Math.random() * w.reduce((a, b) => a + b, 0), rarity = 0;
  for (; rarity < 3; rarity++) { r -= w[rarity]; if (r <= 0) break; }
  return { id: GEAR[(Math.random() * GEAR.length) | 0].id, rarity: rarity as GearRarity };
}
