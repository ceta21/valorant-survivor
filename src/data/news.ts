// Novedades del juego: solo cambios que el jugador nota dentro del juego (nada técnico).
// Para publicar una actualización, añade una entrada AL PRINCIPIO de la lista.
export interface NewsEntry {
  id: string;            // versión, única
  date: string;          // AAAA-MM-DD
  title: string;
  tag: 'Nuevo' | 'Mejora' | 'Evento';
  color: string;
  items: string[];
}

export const NEWS: NewsEntry[] = [
  {
    id: '1.6', date: '2026-10-28', title: 'Mercado nocturno', tag: 'Nuevo', color: '#b05cff',
    items: [
      'Nueva tienda: cada día descubres 4 cartas con ofertas exclusivas y descuentos de hasta el 35 %.',
      '6 armas exclusivas: Ares Infernal, Marshal del Vacío, Bucky Tormenta, Guardian Aurora, Frenzy Cósmico y Bulldog Dracónico.',
      '3 agentes exclusivos (Eclipse, Vórtice y Quimera) cuyas habilidades eliges tú entre las de todos los agentes.',
      'Elige tu arma inicial en la pantalla de agentes.',
    ],
  },
  {
    id: '1.5', date: '2026-10-28', title: 'Cuentas de jugador', tag: 'Nuevo', color: '#4fd0ff',
    items: [
      'Crea tu cuenta con nombre de usuario y contraseña y recibe tu ID de jugador.',
      'Tus créditos, agentes, mejoras, estadísticas y logros se guardan en tu cuenta.',
      'Modo invitado para jugar sin registrarte (el progreso se pierde al cerrar).',
      'Con cuenta, tus marcas se publican solas en el ranking con tu nombre e ID.',
    ],
  },
  {
    id: '1.4', date: '2026-10-28', title: 'Habilidades con nuevos efectos', tag: 'Mejora', color: '#ff7a3d',
    items: [
      'Todas las habilidades tienen efectos propios en pixel art: fuego de Phoenix, dagas de Jett, flechas de Sova…',
      'Granadas y cohetes de Raze vuelan hasta su objetivo antes de explotar.',
      'Ataques orbitales de Brimstone con retícula de aviso y haz de luz.',
      'Nuevas torretas de Killjoy, rayos de Neon, humo de Omen y ojo de Reyna.',
    ],
  },
  {
    id: '1.3', date: '2026-10-28', title: 'Dificultades, modo infinito y ranking', tag: 'Nuevo', color: '#ff4655',
    items: [
      'Cuatro dificultades: Fácil, Normal, Difícil y Pesadilla (más créditos cuanto más difícil).',
      'Modo infinito: tras el jefe final la partida sigue y los jefes no paran de llegar.',
      'Ranking global: compite por aguantar más tiempo, con filtros por agente y dificultad.',
    ],
  },
  {
    id: '1.2', date: '2026-10-28', title: 'Nuevo estilo pixel art', tag: 'Mejora', color: '#5dff9a',
    items: [
      'Todo el juego y los menús tienen ahora estilo pixel art 2D.',
      'Nuevas fuentes, botones y barras de vida pixeladas.',
    ],
  },
  {
    id: '1.1', date: '2026-10-28', title: 'Mapas infinitos', tag: 'Mejora', color: '#ffd24a',
    items: [
      'Ascent, Bind y Haven ahora son mundos infinitos con calles, edificios y sitios.',
      'Teletransportadores en Bind.',
    ],
  },
];

export const LATEST_NEWS = NEWS[0]?.id ?? '';
