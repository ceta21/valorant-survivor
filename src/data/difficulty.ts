// Niveles de dificultad: multiplican la vida y el daño de los enemigos, el ritmo de aparición,
// la cadencia de jefes del modo infinito y los créditos ganados.
export interface DifficultyDef {
  id: string; name: string; desc: string; color: string;
  hp: number; dmg: number; spawn: number; bossEvery: number; credits: number;
}

export const DIFFICULTIES: DifficultyDef[] = [
  { id: 'facil', name: 'Fácil', desc: 'Enemigos más débiles y menos numerosos.', color: '#5dff9a', hp: 0.7, dmg: 0.6, spawn: 0.8, bossEvery: 1.3, credits: 0.7 },
  { id: 'normal', name: 'Normal', desc: 'La experiencia equilibrada.', color: '#4fd0ff', hp: 1, dmg: 1, spawn: 1, bossEvery: 1, credits: 1 },
  { id: 'dificil', name: 'Difícil', desc: 'Más vida, más daño y jefes más frecuentes.', color: '#ffb020', hp: 1.4, dmg: 1.35, spawn: 1.2, bossEvery: 0.8, credits: 1.5 },
  { id: 'pesadilla', name: 'Pesadilla', desc: 'Solo para los mejores. Cada golpe duele.', color: '#ff4655', hp: 1.9, dmg: 1.8, spawn: 1.4, bossEvery: 0.6, credits: 2.2 },
];
export const DIFFICULTY_BY_ID: Record<string, DifficultyDef> = Object.fromEntries(DIFFICULTIES.map(d => [d.id, d]));
