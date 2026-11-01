// Evento del domingo: solo los domingos (todo el día, según la hora del jugador) hay un evento que cambia algo de las
// partidas; cada domingo toca uno distinto, por turnos. Se calcula con la fecha, sin servidor.

export interface WeeklyEvent {
  id: string; name: string; icon: string; color: string; desc: string;
  /** Multiplicadores de la partida (1 = sin cambio). */
  credits?: number; xp?: number; spawn?: number;
  /** Cajas: cada cuántos segundos aparece una y cuántas puede haber a la vez. */
  crateEvery?: number; crateMax?: number;
  /** Jefes: objetos de equipo que suelta cada uno y multiplicador de su vida. */
  bossLoot?: number; bossHp?: number;
}

export const EVENTS: WeeklyEvent[] = [
  { id: 'oro', name: 'Fiebre del oro', icon: '💰', color: '#ffd24a', desc: '+50 % de créditos al acabar cada partida.', credits: 1.5 },
  { id: 'cajas', name: 'Lluvia de cajas', icon: '📦', color: '#ff9f3d', desc: 'Aparecen el doble de cajas, y caben más a la vez.', crateEvery: 3.5, crateMax: 10 },
  { id: 'jefes', name: 'Caza de jefes', icon: '👑', color: '#ff4655', desc: 'Los jefes tienen +50 % de vida, pero sueltan 2 objetos de equipo.', bossLoot: 2, bossHp: 1.5 },
  { id: 'horda', name: 'Gran horda', icon: '🧟', color: '#5dff9a', desc: '+35 % de enemigos y +35 % de experiencia.', spawn: 1.35, xp: 1.35 },
  { id: 'saber', name: 'Semana del saber', icon: '📘', color: '#4fd0ff', desc: '+50 % de experiencia: subes de nivel mucho antes.', xp: 1.5 },
];
export const EVENT_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e])) as Record<string, WeeklyEvent>;

const DAY = 86400000;
/** Número de día según la hora local del jugador (0 = 1-1-1970, que fue jueves). */
const dayNum = (now: number) => Math.floor((now - new Date(now).getTimezoneOffset() * 60000) / DAY);
/** Medianoche local de un día. */
const midnight = (day: number) => { const d = new Date(day * DAY); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime(); };
/** ¿Es domingo (hora local)? */
export const isSunday = (now = Date.now()) => new Date(now).getDay() === 0;
/** Días que faltan para el domingo (0 si hoy lo es). */
const daysToSunday = (now: number) => (7 - new Date(now).getDay()) % 7;
/** Evento de este domingo o, entre semana, del próximo. */
export const sundayEvent = (now = Date.now()): WeeklyEvent => {
  const week = Math.floor((dayNum(now) + daysToSunday(now)) / 7);
  return EVENTS[((week % EVENTS.length) + EVENTS.length) % EVENTS.length];
};
export const NO_EVENT: WeeklyEvent = { id: 'none', name: 'Sin evento', icon: '', color: '#ffffff', desc: '' };
/** Evento activo ahora: el del domingo, solo los domingos. Las pruebas pueden fijarlo con globalThis.RIFT_EVENT = 'id' (o 'none'). */
export const currentEvent = (now = Date.now()): WeeklyEvent => {
  const pin = (globalThis as any).RIFT_EVENT as string | undefined;
  if (pin) return EVENT_BY_ID[pin] ?? NO_EVENT;
  return isSunday(now) ? sundayEvent(now) : NO_EVENT;
};
/** Milisegundos hasta que cambia: el domingo, hasta que acaba; entre semana, hasta que empieza. */
export const msToEventChange = (now = Date.now()) => midnight(dayNum(now) + (isSunday(now) ? 1 : daysToSunday(now))) - now;
