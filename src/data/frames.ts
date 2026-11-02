// Marcos de retrato: se desbloquean al conseguir logros y se eligen en Estadísticas. Se ven en el retrato del héroe
// del menú y en la pantalla de final de partida.
import { ACHIEVEMENTS } from './goals';
import type { SaveData } from '../utils/storage';

export interface PortraitFrame { id: string; name: string; /** Logros necesarios. */ need: number }

export const FRAMES: PortraitFrame[] = [
  { id: 'none', name: 'Sin marco', need: 0 },
  { id: 'bronce', name: 'Bronce', need: 3 },
  { id: 'plata', name: 'Plata', need: 8 },
  { id: 'oro', name: 'Oro', need: 15 },
  { id: 'grieta', name: 'Grieta', need: 22 },
  { id: 'leyenda', name: 'Leyenda', need: ACHIEVEMENTS.length },
];

/** Logros conseguidos (solo los que siguen existiendo). */
// en local (npm run dev) todos los marcos están desbloqueados y, si no eliges otro, llevas el de Leyenda (no toca el guardado)
const DEV = !!(import.meta as any).env?.DEV;
export const achCount = (s: SaveData) => DEV ? ACHIEVEMENTS.length : s.achievements.filter(id => ACHIEVEMENTS.some(a => a.id === id)).length;
/** Marco que se ve: el elegido si sigue desbloqueado; si no, ninguno. */
export const frameOf = (s: SaveData) => { const f = FRAMES.find(x => x.id === (s.frame ?? (DEV ? 'leyenda' : undefined))); return f && achCount(s) >= f.need ? f.id : 'none'; };
