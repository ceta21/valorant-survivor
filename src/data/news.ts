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
    id: '1.16', date: '2026-10-29', title: 'Tienda: estilos y mascotas', tag: 'Nuevo', color: '#ffd24a',
    items: [
      'Nueva Tienda en el menú con estilos de armas, estilos de agentes y mascotas.',
      'Los estilos solo cambian el aspecto: colores de tus armas y ropa o armadura de tu agente.',
      '5 mascotas (fuego, agua, rayo, planta y hielo) te acompañan en la partida; si las derriban, vuelven en 1 minuto.',
      'Desbloquea y mejora el poder de tu mascota (3 niveles) para que ataque con su elemento.',
      'La Tienda solo vende; los estilos se ponen en la ficha de cada agente (Agentes) y las mascotas en el nuevo apartado Mascotas.',
      'En Mascotas eliges cuál te acompaña (o ninguna) y desbloqueas o mejoras su poder.',
    ],
  },
  {
    id: '1.15', date: '2026-10-29', title: 'Misiones diarias y racha', tag: 'Nuevo', color: '#5dff9a',
    items: [
      'Nuevo apartado Diario en el menú con 3 misiones que cambian cada día: fácil (◈ 60), media (◈ 120) y difícil (◈ 200).',
      'Racha de conexión: cada día que entras cobras ◈ 50 y vas avanzando por el camino.',
      'Premios grandes a los 7 y 14 días, al mes, a los 2 meses… y hasta un año seguido.',
      'Si un día no entras, la racha vuelve a empezar desde el día 1.',
    ],
  },
  {
    id: '1.14', date: '2026-10-29', title: 'Agentes disponibles', tag: 'Mejora', color: '#ff4655',
    items: [
      'De momento solo se puede jugar con Jett, Phoenix, Reyna, Sage, Killjoy, Raze y los agentes exclusivos del mercado nocturno.',
      'El resto de agentes aparecen con candado: estarán disponibles próximamente.',
    ],
  },
  {
    id: '1.13', date: '2026-10-29', title: '14 agentes nuevos y nuevo aspecto', tag: 'Nuevo', color: '#ff4655',
    items: [
      'Llegan Viper, Cypher, Fade, Breach, Skye, Yoru, Astra, KAY/O, Chamber, Harbor, Iso, Deadlock, Gekko y Tejo, con habilidades inspiradas en las suyas.',
      'Nuevo aspecto para Jett, Phoenix, Sage, Reyna, Raze, Omen, Killjoy y Neon.',
      'Los personajes se giran según hacia dónde caminan: de frente, de espaldas o de lado.',
      'Las torretas de Killjoy tienen menos vida: los robots las destruyen antes.',
    ],
  },
  {
    id: '1.12', date: '2026-10-29', title: 'Corrección del modo en pareja', tag: 'Mejora', color: '#2fe6ff',
    items: [
      'En las partidas en pareja los dos jugadores ven ahora exactamente el mismo mapa.',
    ],
  },
  {
    id: '1.11', date: '2026-10-29', title: 'Torretas de Killjoy', tag: 'Mejora', color: '#ffe14a',
    items: [
      'Torreta ahora despliega 1 torreta y Bloqueo despliega 3, más resistentes.',
      'Los robots cuerpo a cuerpo atacan la torreta si la tienen más cerca que a ti y pueden destruirla.',
      'Los disparos, obuses y explosiones enemigas también dañan las torretas.',
      'Una barra amarilla muestra la vida que le queda a cada torreta.',
    ],
  },
  {
    id: '1.10', date: '2026-10-28', title: 'Idiomas y controles', tag: 'Nuevo', color: '#4fd0ff',
    items: [
      'El juego ya está disponible en español e inglés: cámbialo en Configuración > Idioma.',
      'Nuevo apartado de Controles: cambia la tecla de moverte, de cada habilidad, de la pausa y de relanzar mejoras.',
      'Las flechas siguen sirviendo para moverte y Esc siempre pausa.',
      'El idioma y los controles se recuerdan en este dispositivo.',
    ],
  },
  {
    id: '1.9', date: '2026-10-28', title: 'Nuevo enemigo: Artillero', tag: 'Nuevo', color: '#ffd24a',
    items: [
      'El Artillero es un robot de orugas que lanza obuses de mortero en parábola.',
      'Un círculo rojo marca dónde caerá el obús: muévete antes de que explote.',
      'Apunta hacia donde te diriges, así que cambiar de dirección te salvará.',
      'Aparece a partir del minuto 2.',
    ],
  },
  {
    id: '1.8', date: '2026-10-28', title: 'Nuevos robots enemigos', tag: 'Mejora', color: '#c9d1d9',
    items: [
      'Los enemigos ahora son robots de entrenamiento en pixel art: bots con visor, drones de ruedas con un gran ojo, bots-cápsula con pantalla y dron-bombas.',
      'Los tanques son bots blindados y los élites, robots morados más altos.',
      'Cada jefe es un gran mecha con su propio detalle: antena, cañones, pinchos o corona.',
      'Los robots se iluminan al recibir daño y se vuelven grises cuando están aturdidos.',
    ],
  },
  {
    id: '1.7', date: '2026-10-28', title: 'Jugar en pareja', tag: 'Nuevo', color: '#2fe6ff',
    items: [
      'Nuevo modo cooperativo: crea una sala, pásale el código a un amigo y sobrevivid juntos.',
      'Cada uno elige su agente y sus propias mejoras al subir de nivel.',
      'Si caes, vuelves junto a tu compañero al empezar la siguiente oleada. La partida acaba si caéis los dos.',
      'Los créditos y el progreso se guardan para los dos jugadores.',
      'El modo en solitario sigue igual que siempre.',
    ],
  },
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
