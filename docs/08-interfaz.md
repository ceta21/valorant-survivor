# 08 · Interfaz

## Pantallas

`App.tsx` decide qué pantalla se ve (`screen`): `loading`, `auth`, `menu`, `agents`, `meta`, `stats`,
`settings`, `ranking`, `market`, `news`, `coop`, `support`, `daily`, `shop`, `pets`, `gear`, `privacy`, `game`.

| Pantalla | Componente | Qué hay |
|---|---|---|
| Acceso | `AuthScreen` | Logo grande (`Logo big`), iniciar sesión, registrarse (avisa de apuntar la contraseña: sin correo no se recupera), jugar como invitado |
| Menú principal | `MainMenu` + `MenuHub` | Cuenta, botones con emoticono (Jugar y Jugar en pareja a todo el ancho; el resto en dos columnas; Configuración comparte fila con **Descargar** (`InstallButton`), que instala el juego como app con un clic donde el navegador lo permite (`utils/install.ts`, evento `beforeinstallprompt`) y, si no (iPhone, Firefox, Safari en Mac), enseña los pasos; ya instalado, Descargar no sale; Apoyo a todo el ancho), panel central (evento del domingo, novedad, mercado, top 3 —solo con héroes que existen—, misiones diarias y racha), retrato y estadísticas. Pensado para caber **sin scroll**: por debajo de 1180 px de ancho se oculta el panel central; en móvil, el retrato; y en móviles muy bajos (≤ 700 px de alto), las estadísticas |
| Tienda | `ShopScreen` | Pestañas de estilos de héroes (con selector del héroe en el que verlos) y mascotas; solo comprar (con confirmación) |
| Mascotas | `PetsScreen` | Elegir la mascota que acompaña (o ninguna) y desbloquear/mejorar su poder; si no hay, enlace a la Tienda |
| Equipo | `GearScreen` | 3 huecos con lo puesto e inventario ordenado por rareza: equipar/quitar, mejorar con créditos y desmontar |
| Diario | `DailyScreen` | Misiones del día (cobrar), racha de conexión con su camino y premios por hitos (ver [05](05-cuentas-y-progreso.md#diario-misiones-diarias-y-racha-de-conexión)) |
| Héroes | `AgentSelection` | Elegir héroe (con su poder), zona, dificultad; desbloquear héroes (los no disponibles, con candado y "Próximamente"); estilo del héroe comprado en la Tienda |
| Jugar en pareja | `CoopScreen` | Crear/unirse a sala, elegir héroe, listo, empezar |
| Partida | `GameScreen` + `GameHUD` + `UpgradeSelection` (tarjetas de mejora que entran girando una tras otra; marco según rareza: común sencillo, poco común doble, épica que late con gemas en las esquinas, legendaria dorada con un destello que la recorre; las evoluciones, siempre doradas) | Canvas, HUD, mejoras, pausa/menú, resultado (con el botín de los jefes) y publicar marca |
| Mejoras | `MetaScreen` | Mejoras permanentes |
| Mercado de la Grieta | `MarketScreen` | Cartas del día |
| Ranking global | `RankingScreen` | Pestañas **Siempre** y **Domingo** (con los premios y medallas del top 3); tabla filtrable por héroe y dificultad |
| Novedades | `NewsScreen` | Historial de versiones (etiqueta "Nuevo" en el menú hasta verlas) |
| Estadísticas | `StatsScreen` | Resumen, récords por mapa, misiones (cobrar) y logros (conseguidos/total, premio y progreso de cada uno) |
| Configuración | `SettingsScreen` | Sonido y pantalla, **Idioma**, **Controles**, borrar progreso |
| Apoyo | `SupportScreen` | Creador del juego (Gabriel Vigo Rodríguez) y enlace a su LinkedIn |
| Privacidad y aviso legal | `PrivacyScreen` | Qué datos se guardan y dónde, para qué, cómo borrarlos (Configuración o pedirlo por correo a fnceta@gmail.com o LinkedIn) y aviso legal. Se abre con un enlace desde el acceso, Apoyo y Configuración, y vuelve a la pantalla de origen. **Revisarla si cambia qué datos se guardan** |

### Pantalla de final de partida

Arriba, el retrato del héroe con «¡Victoria!» (dorado) o «Derrota» (rojo) y el tiempo; los números (tiempo, bajas,
nivel, daño, jefes y créditos) entran en cascada y suben contando (`CountUp`); los créditos, al final y con brillo.
Después aparecen uno a uno, como tarjetas, el botín de los jefes (del color de su rareza) y los logros con su premio.
Con «reducir movimiento» del sistema sale todo directamente.

### HUD de la partida

Efectos (`useHudFx` en `GameHUD`, que recuerda los valores de la vez anterior porque el HUD se redibuja cada 100 ms):
la **vida** tiembla y destella en blanco al recibir daño y deja un rastro claro de lo perdido que baja despacio, y
late en rojo con menos del 30 %; la **experiencia** tiene un brillo que la recorre, destella al ganar y se llena de
blanco al subir de nivel; las **habilidades** en recarga iluminan con el color del héroe la parte ya recargada,
girando como un reloj, y destellan al volver a estar listas (la definitiva sigue con su relleno de abajo arriba).


Nivel, vida, escudo, vida del compañero (cooperativo), barra de XP, tiempo, aviso de jefe final o del siguiente
jefe en modo infinito, dificultad, bajas, enemigos vivos, botón de pausa, barra de jefe, avisos grandes, poderes (con su icono y nivel)
con su nivel y los 3 botones de habilidad (con la tecla asignada, recarga y carga de definitiva).

**Minimapa** (`Minimap.tsx`, arriba a la derecha bajo la pausa): recorte de 2.200 unidades alrededor del jugador
de la vista del mundo (`WorldMap.ts`), redibujado cada fotograma. Encima: los portales (del color de la zona a la
que llevan), tú (punto blanco en el centro), tu pareja (punto de su color, gris si está caída) y los jefes (rojo);
lo que queda fuera se pega al borde en su dirección (los jefes, parpadeando). Debajo, el nombre de la zona en la que
estás y la tecla del mapa. Pulsarlo abre el mapa grande. La barra del jefe deja libre su hueco (`--mm` en el CSS).

**Mapa grande** (`BigMap.tsx`, tecla `map` = M por defecto, o pulsando el minimapa): el mundo entero con el nombre
de cada zona, los portales con su destino, tú (parpadeando), tu pareja y los jefes. Se cierra con la misma tecla, Esc
o pulsando fuera. En solitario detiene la partida mientras está abierto; en cooperativo no.

**Primera partida guiada** (`Coach.tsx`, solo en solitario y mientras `settings.tutorialDone` sea falso): 5 consejos
de uno en uno que pasan al hacer lo que piden: moverse (140 unidades), el poder automático (5 s), recoger un cristal,
usar una habilidad (o 12 s) y, cuando hay una caja cerca, romper cajas (7 s). "Saltar" los quita. Al acabar se
guarda `tutorialDone`; quien ya había jugado antes lo tiene hecho, y en Configuración se pueden volver a activar. En
móvil el texto habla de arrastrar el dedo y tocar los botones. Usa un único temporizador (el HUD redibuja 10 veces/s).

## Fondo de las pantallas

- Detrás de todas las pantallas (menos la partida), una espiral de energía de la grieta gira despacio y late
  (`.bg .rift-swirl`, gradiente cónico con máscara redonda), por debajo de los rayos.
- Con «reducir movimiento» del sistema no se anima nada de esto.

## Transiciones entre pantallas

Al cambiar de pantalla (`App.tsx`), la nueva entra subiendo y apareciendo (0,3 s) y una franja violeta de la
grieta barre la pantalla de derecha a izquierda (`.scr-wipe`, 0,45 s). Al entrar en partida, en vez de la franja, un
negro que se abre en círculo desde el centro y la partida empieza muy iluminada y recupera su color (0,6 s). Sin
animaciones si el sistema pide movimiento reducido.

## Estilo pixel art

- Fuentes: **Press Start 2P** (logo, números, títulos sin tildes) y **Pixelify Sans** (resto; tiene tildes). Se sirven
  desde la propia web (`@fontsource/*`, importadas en `main.tsx`), sin pedir nada a Google al abrir el juego.
- Botones y paneles con esquinas en escalón (`--notch`), bordes de 4 px, sombras duras y sin degradados suaves;
  animaciones con `steps()`.
- Tema **ENDLESS RIFT**: noche violeta (`--ink`, `--panel`), morado de grieta como color de acción (`--red`,
  que conserva el nombre antiguo: botones principales, pestañas activas) y oro (`--gold`) en títulos y al pasar el
  ratón por los botones principales. Fondo de los menús: estrellas blancas, moradas y doradas, resplandor central
  y 3 grietas pixeladas (`public/ui/crack.svg`) que bajan y laten con `steps()`.
- Colores de botones especiales: Jugar en pareja (cian), Mercado de la Grieta (morado), Apoyo (verde).
- Todo el estilo está en `src/styles/index.css` (variables de color en `:root`).

## Adaptación a pantallas

- Pantallas bajas (`max-height: 500px`, móvil en horizontal): inicio de sesión y menú compactos (menú en 3 columnas)
  para que quepan sin desplazarse, y los consejos arriba para no tapar al héroe.

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
- Los datos (héroes, poderes, enemigos, novedades…) se escriben en español y se pasan por `t()` al mostrarse.
- Los avisos del motor llevan una clave y parámetros (`banner.key`, `banner.p`) para traducirse en cada
  pantalla, también en cooperativo.
- `npm run test:i18n` lista los textos sin traducir.

## Controles

- Acciones configurables: arriba, abajo, izquierda, derecha, habilidad principal, secundaria, definitiva, pausa y
  relanzar mejoras (por defecto WASD, Espacio, E, Q, P, R).
- Se cambian en **Configuración → Controles**: pulsar el botón de la acción y luego la tecla. Si ya estaba usada,
  se **intercambian**. Teclas reservadas: Esc, 1/2/3, flechas, Tab, F5, F11, F12.
- Siempre activas: flechas para mover y Esc para pausar. Botón "Restaurar controles".
- Las teclas elegidas se muestran en el HUD, la ficha del héroe, la ayuda del menú y el botón de relanzar.
- Móvil: arrastrar el dedo sobre el juego para moverse; tocar los botones de habilidad del HUD.
- **Mando** (`utils/gamepad.ts`, Xbox/PlayStation o compatibles; no se configura): en partida, stick izquierdo o
  cruceta para moverse, A/RB habilidad principal, X/LB secundaria, Y/RT definitiva, Start pausa y Select/Back mapa
  (lo lee `Input.poll()` cada fotograma). Fuera de la partida (menús, mejoras, pausa, resultado) la cruceta o el
  stick mueven el foco al botón más cercano en esa dirección, A lo pulsa y B vuelve (botón «Volver» o Escape); si
  hay una ventana encima (`role="dialog"`), solo se mueve por sus botones.
- **Viveza del color** (Configuración, se guarda en el dispositivo; por defecto 50 %): filtro CSS sobre el lienzo de la
  partida (`vividFilter`: saturación ×1 a ×1,6 y contraste ×1 a ×1,08). Aviva a la vez mapa, héroes, enemigos y
  efectos sin tocar los dibujos; 0 % deja los colores originales. También se aplica al personaje de los retratos
  (menú, elegir héroe, pareja) y a los dibujos de la tienda, con la variable CSS `--hero-vivid` que pone `App`; el
  resto de la interfaz no cambia.
- **Calidad baja** (Configuración, se guarda en el dispositivo): sin animaciones del mapa ni polvo ambiental y la
  mitad de chispas, para móviles o PCs lentos.
