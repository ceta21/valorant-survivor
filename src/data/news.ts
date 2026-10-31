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
      'Un mundo con 4 zonas (Reino, Glaciar, Infierno y Ciudad) unidas por portales; el agua frena y la lava quema.',
      'Sube de nivel, aprende poderes nuevos y hazlos evolucionar; rompe cajas para conseguir premios.',
      'Juega en pareja, completa misiones diarias, mantén tu racha y compite en el ranking global.',
      'Personaliza a tus héroes con estilos y llévate una mascota con poderes de la Tienda o del Mercado de la Grieta.',
    ],
  },
];

export const LATEST_NEWS = NEWS[0]?.id ?? '';
