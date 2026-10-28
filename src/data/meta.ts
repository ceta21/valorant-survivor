import { MetaLevels } from '../utils/storage';

export interface MetaDef {
  id: keyof MetaLevels; name: string; icon: string; desc: string; per: number; max: number; unit: string;
}
// Mejoras permanentes: pequeñas a propósito para que el juego no se vuelva trivial pronto.
export const META: MetaDef[] = [
  { id: 'dmg', name: 'Daño', icon: '✦', desc: 'Daño de todas tus armas y habilidades', per: 0.03, max: 10, unit: '%' },
  { id: 'hp', name: 'Vida', icon: '♥', desc: 'Vida máxima inicial', per: 0.05, max: 10, unit: '%' },
  { id: 'speed', name: 'Velocidad', icon: '➤', desc: 'Velocidad de movimiento', per: 0.02, max: 10, unit: '%' },
  { id: 'xp', name: 'Experiencia', icon: '★', desc: 'Experiencia obtenida', per: 0.04, max: 10, unit: '%' },
];
export const metaCost = (level: number) => Math.round(80 * Math.pow(level + 1, 1.6));
