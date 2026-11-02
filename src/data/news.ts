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
      '29 logros con premio en créditos: por zona, por dificultad, por colección (héroes, equipo, mascotas) y por racha; los ves con su progreso en Estadísticas.',
      'Ranking del domingo: cada domingo hay una clasificación aparte con las partidas de ese día; el lunes, los 3 primeros ganan hasta ◈ 5.000 y una medalla.',
      'Colores más vivos en la partida, y en Configuración puedes ajustar la viveza del color a tu gusto.',
      'Los jefes se presentan: al aparecer, la cámara va hacia ellos un instante a cámara lenta y sale un cartel con su nombre y su título.',
      'Combates más vistosos: los enemigos se rompen en piezas, los jefes estallan con un instante de cámara lenta y los números de daño salen del color del elemento, con los críticos grandes y dorados.',
      'Cada zona tiene su ambiente: luciérnagas y hojas en el Reino, nieve en el Glaciar, ceniza y ascuas en el Infierno y lluvia en la Ciudad, con su propia luz.',
      'Poderes con efectos nuevos: el rayo deja un zigzag eléctrico, el agua es una burbuja que salpica, el hielo una esquirla con escarcha, la hoja gira, la roca rueda, la estrella destella y el alma ondula; cada uno con su impacto al golpear.',
      'Dibujos nuevos de los 20 héroes: más detalle y pasos de andar de verdad, de frente, de espaldas y de perfil.',
      'Héroes más nítidos en partida, con contorno, y animación de andar: el cuerpo sube y baja y las piernas se mueven a cada paso.',
      'Eventos del domingo: cada domingo hay uno distinto (Fiebre del oro, Lluvia de cajas, Caza de jefes, Gran horda o Semana del saber); entre semana el menú te dice cuál toca.',
      'Instálalo como app: desde el navegador, «Instalar» o «Añadir a pantalla de inicio»; se abre a pantalla completa con su icono, carga más rápido y se actualiza solo.',
      'Juega con mando (Xbox, PlayStation o compatible): stick para moverte, A/X/Y para las habilidades y la cruceta para los menús; y opción de calidad baja para móviles o PCs lentos.',
      'Juega en pareja, completa misiones diarias, mantén tu racha y compite en el ranking global.',
      'Personaliza a tus héroes con estilos y llévate una mascota con poderes de la Tienda o del Mercado de la Grieta.',
    ],
  },
];

export const LATEST_NEWS = NEWS[0]?.id ?? '';
