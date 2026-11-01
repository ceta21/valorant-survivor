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
    id: '2.0', date: '2026-10-31', title: '¡Lanzamiento de ENDLESS RIFT!', tag: 'Nuevo', color: '#9b5cff',
    items: [
      '¡Bienvenido a ENDLESS RIFT! Grietas infinitas de las que emergen hordas de enemigos: ¿cuánto aguantarás?',
      'Tu primera partida te guía con consejos cortos, y el juego se adapta al móvil en horizontal.',
      '20 héroes, cada uno con su poder que dispara solo y 3 habilidades propias.',
      'Portales nuevos: cada uno tiene el aspecto de la zona a la que lleva (bosque al Reino, hielo al Glaciar, fuego al Infierno y tecnológico a la Ciudad).',
      'Un mundo con 4 zonas (Reino, Glaciar, Infierno y Ciudad) unidas por portales; el agua frena y la lava quema.',
      'Sube de nivel, aprende poderes nuevos y hazlos evolucionar; rompe cajas para conseguir premios.',
      'Bots de la grieta: 8 tipos (soldados, arañas, flotantes, torretas, escudos, asesinos, drones voladores y sanadores) en 3 niveles, más duros cuanto más peligrosa la zona y cuanto más aguantas.',
      'Cada zona tiene su jefe: Coloso mecánico, Reina araña, Elemental de energía y Dragón cibernético; y cuidado con el Sabio oscuro.',
      'Cada jefe tiene su ataque propio: el Coloso se cubre con un escudo, la Reina araña lanza telarañas que frenan, el Elemental invoca una tormenta de rayos, el Dragón escupe fuego y el Sabio oscuro salta a tu lado.',
      'Sonido nuevo: cada habilidad suena a su elemento (el rayo cruje y truena, el fuego sopla y chisporrotea, el hielo tintinea…) y cada zona tiene su música ambiental, con pájaros en el Reino, viento en el Glaciar, lluvia en la Ciudad y fuego en el Infierno; con un jefe, la música se acelera.',
      'Los bots y los jefes se mueven de verdad: andan, se giran y se ven de frente, de espaldas y de perfil.',
      'Evoluciones combinadas: lleva un poder al nivel 5 y consigue su mejora pareja para desbloquear su versión legendaria.',
      'Equipo entre partidas: los jefes sueltan objetos (común, raro, épico y legendario); lleva hasta 3 puestos, mejóralos con créditos o desmóntalos.',
      'Eventos del domingo: cada domingo hay uno distinto (Fiebre del oro, Lluvia de cajas, Caza de jefes, Gran horda o Semana del saber); entre semana el menú te dice cuál toca.',
      'Instálalo como app: desde el navegador, «Instalar» o «Añadir a pantalla de inicio»; se abre a pantalla completa con su icono, carga más rápido y se actualiza solo.',
      'Juega en pareja, completa misiones diarias, mantén tu racha y compite en el ranking global.',
      'Personaliza a tus héroes con estilos y llévate una mascota con poderes de la Tienda o del Mercado de la Grieta.',
    ],
  },
];

export const LATEST_NEWS = NEWS[0]?.id ?? '';
