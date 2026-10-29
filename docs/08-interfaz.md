# 08 · Interfaz

## Pantallas

`App.tsx` decide qué pantalla se ve (`screen`): `loading`, `auth`, `menu`, `agents`, `meta`, `stats`,
`settings`, `ranking`, `market`, `news`, `coop`, `support`, `game`.

| Pantalla | Componente | Qué hay |
|---|---|---|
| Acceso | `AuthScreen` | Iniciar sesión, registrarse, jugar como invitado |
| Menú principal | `MainMenu` + `MenuHub` | Cuenta, botones con emoticono (Jugar, Jugar en pareja y Apoyo a todo el ancho; el resto en dos columnas), panel central (novedad, mercado, top 3, misiones diarias y racha), retrato y estadísticas. Pensado para caber **sin scroll**: por debajo de 1180 px de ancho se oculta el panel central; en móvil, el retrato; y en móviles muy bajos (≤ 700 px de alto), las estadísticas |
| Tienda | `ShopScreen` | Pestañas de estilos de armas, estilos de agentes (con selector del agente en el que verlos) y mascotas; solo comprar (con confirmación) |
| Mascotas | `PetsScreen` | Elegir la mascota que acompaña (o ninguna) y desbloquear/mejorar su poder; si no hay, enlace a la Tienda |
| Diario | `DailyScreen` | Misiones del día (cobrar), racha de conexión con su camino y premios por hitos (ver [05](05-cuentas-y-progreso.md#diario-misiones-diarias-y-racha-de-conexión)) |
| Agentes | `AgentSelection` | Elegir agente, kit (exclusivos), mapa, arma inicial, dificultad; desbloquear agentes (los no disponibles, con candado y "Próximamente"); estilo del agente y de arma comprados en la Tienda |
| Jugar en pareja | `CoopScreen` | Crear/unirse a sala, elegir agente, listo, empezar |
| Partida | `GameScreen` + `GameHUD` + `UpgradeSelection` | Canvas, HUD, mejoras, pausa/menú, resultado y publicar marca |
| Mejoras | `MetaScreen` | Mejoras permanentes |
| Mercado nocturno | `MarketScreen` | Cartas del día |
| Ranking global | `RankingScreen` | Tabla filtrable por agente y dificultad |
| Novedades | `NewsScreen` | Historial de versiones (etiqueta "Nuevo" en el menú hasta verlas) |
| Estadísticas | `StatsScreen` | Resumen, récords por mapa, misiones (cobrar) y logros |
| Configuración | `SettingsScreen` | Sonido y pantalla, **Idioma**, **Controles**, borrar progreso |
| Apoyo | `SupportScreen` | Creador del juego (Gabriel Vigo Rodríguez) y enlace a su LinkedIn |

### HUD de la partida

Nivel, vida, escudo, vida del compañero (cooperativo), barra de XP, tiempo, aviso de jefe final o del siguiente
jefe en modo infinito, dificultad, bajas, enemigos vivos, botón de pausa, barra de jefe, avisos grandes, armas
con su nivel y los 3 botones de habilidad (con la tecla asignada, recarga y carga de definitiva).

## Estilo pixel art

- Fuentes: **Press Start 2P** (logo, números, títulos sin tildes) y **Pixelify Sans** (resto; tiene tildes).
- Botones y paneles con esquinas en escalón (`--notch`), bordes de 4 px, sombras duras y sin degradados suaves;
  animaciones con `steps()`.
- Colores de botones especiales: Jugar en pareja (cian), Mercado nocturno (morado), Apoyo (verde).
- Todo el estilo está en `src/styles/index.css` (variables de color en `:root`).

## Adaptación a pantallas

- Si el contenido no cabe en alto, **se hace scroll en vez de cortarse** (centrado "seguro" con márgenes automáticos).
- Pantallas bajas (≤ 820 px de alto): menú compacto para caber sin scroll en 1366×768 y 1280×720.
- ≤ 1180 px de ancho: se oculta el panel central del menú.
- ≤ 860 px: menú en una columna, retrato debajo.
- ≤ 600 px (móvil): HUD compacto, botones de habilidad ajustados al ancho, cartas del mercado en una columna.
- Comprobado sin cortes en 390×844, 768×1024, 1024×600, 1280×640, 1366×768, 1900×900 y 2560×1440.
- El canvas del juego elige un factor entero de ampliación según el tamaño y la densidad de píxeles de la pantalla.

## Idiomas

- Español (por defecto) e inglés. Se cambia en **Configuración → Idioma** y se aplica al momento.
- `t('texto')` en `src/i18n/index.ts`; el inglés en `src/i18n/en.ts` (clave = texto en español, con `{parámetros}`).
  Las descripciones de mejoras de partida tienen funciones propias (`EN_UPGRADE`).
- Los datos (agentes, armas, enemigos, novedades…) se escriben en español y se pasan por `t()` al mostrarse.
- Los avisos del motor llevan una clave y parámetros (`banner.key`, `banner.p`) para traducirse en cada
  pantalla, también en cooperativo.
- `npm run test:i18n` lista los textos sin traducir.

## Controles

- Acciones configurables: arriba, abajo, izquierda, derecha, habilidad principal, secundaria, definitiva, pausa y
  relanzar mejoras (por defecto WASD, Espacio, E, Q, P, R).
- Se cambian en **Configuración → Controles**: pulsar el botón de la acción y luego la tecla. Si ya estaba usada,
  se **intercambian**. Teclas reservadas: Esc, 1/2/3, flechas, Tab, F5, F11, F12.
- Siempre activas: flechas para mover y Esc para pausar. Botón "Restaurar controles".
- Las teclas elegidas se muestran en el HUD, la ficha del agente, la ayuda del menú y el botón de relanzar.
- Móvil: arrastrar el dedo sobre el juego para moverse; tocar los botones de habilidad del HUD.
