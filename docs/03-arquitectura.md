# 03 · Arquitectura del código

## Visión rápida

```
App.tsx  ── estado global: guardado (SaveData), cuenta, preferencias (idioma/teclas), pantalla actual
   │
   ├─ pantallas (components/*) ── leen datos de src/data y llaman a funciones de App para cambiar el guardado
   │
   └─ GameScreen ── crea GameEngine + Renderer + Input; bucle requestAnimationFrame
         │   engine.update(dt) → renderer.render(engine) → HUD (React, cada 100 ms con engine.hud())
         └─ cooperativo: CoopLink (red) + netSync (fotos del estado)
```

Separación de responsabilidades:

- **`GameEngine`** (`src/game/GameEngine.ts`): toda la lógica y el estado de la partida. No dibuja.
- **`Renderer`** (`src/game/Renderer.ts`): solo dibuja el estado del motor en un canvas.
- **React** (`src/components`): menús, HUD y ventanas superpuestas. El HUD lee `engine.hud()`.
- **Datos** (`src/data`): definiciones del juego, sin lógica (salvo funciones pequeñas como `metaCost`).

## Motor

- Bucle de paso fijo (1/60 s). `update(dt)` acumula tiempo y ejecuta `step()`; solo avanza si `state === 'playing'`
  (los estados son `playing`, `paused`, `levelup`, `won`, `lost`).
- Orden de cada paso: rejilla espacial → por cada jugador (movimiento, poderes, drones/torretas, carga de
  definitiva) → proyectiles → enemigos → proyectiles enemigos → obuses → golpes de área y efectos →
  gemas → cajas (aparecer y quitar las lejanas) → generador de enemigos → partículas → limpieza.
- **Rejilla espacial** de 64×64 celdas de 64 unidades (toroidal) para buscar enemigos cercanos rápido.
- **Reservas** (pools) de enemigos y proyectiles para no crear objetos nuevos constantemente; partículas, textos
  y ondas en anillos de tamaño fijo (700 / 70 / 120).
- Eventos hacia fuera (`EngineEvents`): `onLevelUp(choices, idx)`, `onEnd(result)`, `sfx(nombre)`.

### Varios jugadores en el mismo motor

El estado de cada jugador vive en un objeto `Pl` (cuerpo, estadísticas, buffs, recargas, poderes, torretas,
mejoras pendientes, `dead`, `gone`…). El motor tiene campos "del jugador actual" (`player`, `stats`, `buffs`,
`weapons`, `turrets`, `ult`…) y **`use(pl)` carga un jugador en ellos** (guardando antes el anterior con
`sync()`). Así toda la lógica escrita para un jugador sirve para 1 o 2:

- En cada paso se recorre `players` y se procesa cada uno con `use(pl)`.
- Cada proyectil, golpe de área y efecto guarda su **dueño** (`owner`), para dar las bajas y la carga de
  definitiva a quien corresponde.
- Cada enemigo carga al **jugador vivo más cercano** antes de procesarse.
- Al terminar el paso se vuelve a cargar `me` (el jugador de esta pantalla, `local`).
- `withPlayer(pl, fn)` sirve para leer/dibujar a otro jugador temporalmente.

En solitario hay un único `Pl` y el comportamiento es idéntico al original.

## Mundo (`World.ts`, `MapArt.ts`, `WorldMap.ts`)

- Mundo **sin bordes**: 4 zonas (`MAPS` en `src/data/maps.ts`, cada una con su posición `zone` en una cuadrícula de
  2×2). Cada zona tiene un **corazón** de `ZN` = 8×8 chunks (`ZW` = 5.120 unidades; esquina en `zoneOrigin(z)`) con la
  plaza, los monumentos, los caminos y sus 3 portales, y ocupa el cuadrado de `ZSPACE` = 2.000 chunks (1,28 millones
  de unidades) centrado en él: su terreno se genera sin fin y el corazón se repite cada `TILE` = 10.240 unidades
  (`tileOff`; las copias no llevan los portales ni sus caminos). Solo más allá de las 4 zonas hay abismo (`k: 'v'`).
  No se separan más porque el canvas dibuja en precisión simple y con coordenadas enormes la imagen temblaría.
  `zoneAt(cx, cy)` dice la zona de un chunk.
- Los chunks son de **640×640** y se generan de forma determinista a partir de una **semilla** (en cooperativo la
  comparte el anfitrión). La zona de inicio (siempre el Reino) no cambia el mundo: solo dónde apareces.
- Terreno **orgánico** por celdas de 32×32 (20×20 por chunk, `Cell`): suelo, camino, agua, lava, hielo, abismo,
  roca, mar, calle, arena, puente y hierba alta. `cellType` lo decide con ruido (`noise`/`fbm`): ríos y estanques/lagos/ríos de lava según la zona, mesetas de roca (que se encogen cerca de caminos y
  monumentos para no dejar trozos sueltos), praderas de hierba alta en el Reino; la Ciudad tiene avenidas, calles,
  parques, y playa y mar al sur de cada corazón (acotados: se pueden rodear). `terrainAt(x, y)` da el tipo de celda de un punto (lo usa el motor para agua y lava).
- Las celdas que bloquean (abismo `v`, roca `r`, mar `h`) se juntan en tiras de rectángulos para las colisiones.
- Cada zona tiene su plano (`layoutFor`): castillo con murallas, torres y torreón (Reino, Glaciar de hielo,
  Infierno demoníaco), aldea con molino y granja, cabañas, volcán, rascacielos y estadio…; zonas reservadas sin
  roca ni agua alrededor, y caminos serpenteantes (puentes sobre agua/lava) de la plaza a portales y monumentos.
  Las piezas de un monumento se incluyen enteras en cada chunk que tocan.
- Encima se reparten objetos sueltos según la zona y la densidad de bosque: árboles, rocas, cristales, pinchos,
  cajas, barriles y, en la Ciudad, edificios en las manzanas.
- Obstáculos: edificio `b`, muro `w`, caja `c`, pilar/torre `p`, barril `t`, árbol `a`, roca suelta `o`, y las tiras
  de celdas `v`/`r`/`h`; el campo `s` es el estilo de dibujo (`reino-keep`, `fence`, `windmill`, `volcano`…).
- **Portales** (`world.portals`): 12, tres por zona (uno hacia cada otra), a 1.280 de la plaza en dirección a la
  otra zona, con su zona reservada y camino. El motor los comprueba en `updatePlayer`. Cada uno se pinta con el
  arco de la zona a la que lleva (bosque → Reino, hielo → Glaciar, fuego → Infierno, tecnológico → Ciudad):
  `public/portals/<zona>.png`, recortados de `art/portales.webp` con `npx tsx scripts/cut-portals.ts` (`PICK` dice
  qué casilla de la hoja es cada zona) y cargados con `portalArt()` (`enemyArt.ts`). Encima, un resplandor que late
  y chispas que giran; mientras no carga el dibujo, el remolino hecho por código. Capturas:
  `npx tsx scripts/portal-shot.ts`.
- Colisiones con rectángulos (`hit`, `resolve`); solo se guardan en memoria los chunks cercanos (`prune`).
- `MapArt` dibuja cada chunk a 1 píxel = 4 unidades con el tema de su zona (`THEMES`): suelo continuo con
  textura, cada tipo de celda con su dibujo (orillas, lava brillante, mesetas de roca con cara frontal, hierba alta,
  acantilados), flores y detalles, monumentos y árboles propios de cada zona; el Renderer guarda en caché los 36 últimos. `WorldMap` dibuja una vez el mundo entero a
  1 píxel = 16 unidades para el minimapa y el mapa grande.

## Render pixel art (`Renderer.ts`)

- El canvas se dibuja a **baja resolución**: 1 píxel de juego = 2 unidades de mundo (`PX = 2`), y el navegador
  lo amplía un número entero de veces sin suavizado (`image-rendering: pixelated`). Por eso todo, incluidas las
  formas vectoriales, se ve pixelado.
- La cámara se alinea a la rejilla de píxeles para que el mundo no "tiemble".
- Orden de dibujo: chunks → portales → cajas → gemas y premios → golpes de área y obuses (con su aviso) → campos →
  avisos de jefes → torretas → enemigos → proyectiles → efectos de habilidad → jugadores (con drones) →
  efectos sobre el personaje → ondas y partículas → nombres en cooperativo → números de daño → viñeta.
- Personajes: dos tipos (`sprites.ts`).
  - **Hojas nuevas** (los 20 héroes, noviembre de 2026): `art/heroes-nuevos/<id>.png|jpg`, generadas con la guía
    `art/heroes-nuevos/GUIA.md` y las referencias de `scripts/hero-references.ts`: 3 filas (frente, espalda, perfil
    a la derecha) × 5 columnas (reposo y 4 pasos). `npx tsx scripts/cut-heroes.ts [id…]` las recorta: endereza las
    hojas giradas, quita el fondo (tolerancia más baja en las JPG para no comerse el contorno), descarta motas,
    cambia casillas mal dibujadas por otras de la misma fila (`FIX`), reduce todo con la misma escala (reposo de
    frente = 150 px) y alinea por los pies y el torso. Guarda `public/agents/<id>.png` y su JSON con `idle: 1`; con
    eso (`hasWalk`) el juego usa el reposo quieto y los 4 pasos al andar, sin animar las piernas por código.
    Revisión: `shots/heroes-recortados.png` y `npx tsx scripts/hero-shot.ts`.
  - **Con imagen (antes)**: fotogramas recortados de la hoja de sprites que da Gabriel
    (`art/heroes.png`, una vista de lado, de frente y de espaldas por héroe) con `scripts/cut-agent.ts`. Se guardan con sus colores exactos en
    `public/agents/<id>.png` (una fila por vista —frente, espalda, lado— y una columna por paso) y sus medidas en
    `src/data/agentImages/<id>.json` (`px` = escala para que todos midan ~58 unidades). El juego las precarga
    al crear el `Renderer`; los retratos del menú usan la misma hoja.
    En partida no se dibujan tal cual: miden ~120 px y ocupan ~30 px del lienzo, y reducirlos saltando píxeles los
    llenaba de «ruido». `heroGameSprite()` (`sprites.ts`) los reduce mezclando colores (a mitades) y recupera el borde
    duro, algo de contraste y un contorno oscuro de 1 px; se guarda en caché por héroe, vista, estilo y tamaño.
    Como cada vista tiene un solo dibujo, el andar se anima por código en `drawPlayer`: el cuerpo sube y baja con el
    ciclo de pasos y el último 26 % (las piernas) se pinta en dos mitades que se levantan por turnos (de frente y de
    espaldas) o se adelantan y atrasan (de perfil). Héroes sin vista de espaldas de verdad (`NO_BACK`: Tink) usan la
    de perfil (ya ninguno). Capturas: `npx tsx scripts/hero-shot.ts` (`shots/heroes-andando.png`).
  - **Dibujados por código** (aspecto genérico `default`, solo si un héroe no tiene hoja de sprites): rejilla 22×30 con poses (reposo, andar, correr, lanzar).
  - El cuerpo mira hacia donde se mueve: de frente (bajando o quieto), de espaldas (subiendo) o de lado (la
    izquierda es el espejo de la derecha). No llevan arma: al lanzar el poder sale un destello de su color en la mano.
- Poderes: los datos están en `powers.ts` (`PowerDef`) y el motor los guarda en `weapons` (`WeaponInst`: id, nivel,
  recarga). Cada uno tiene un aspecto de proyectil (`look`: estrella, flecha, llama, rayo, hoja, cuchilla, alma,
  hielo, agua, roca) que el Renderer dibuja con los sprites de `vfx.ts` y su paleta, al doble de tamaño (`BIG`)
  y con un halo de su color; las bombas y cohetes de habilidad usan la misma escala, y las explosiones, anillos,
  haces, rayos y conos se dibujan algo más grandes que su área de daño.
- **Bots y jefes de la grieta** (`botSprites.ts`): dibujados por código siguiendo la estética de `art/enemigos.png`
  (chapa gris con volumen, visores y núcleos rojos; élite más oscuro con morado; legendario casi negro con grietas
  rojas; cada jefe con su paleta). Cada uno tiene vista de frente, de espaldas y de perfil (la izquierda es el espejo)
  y 4 fotogramas al andar; el Renderer elige la vista según hacia dónde va (`face`) y lo escala por su radio.
  Revisión: `npx tsx scripts/bot-sheet.ts <tipo>` → `shots/bots-<tipo>.png`.
- Respaldo: si el enemigo tiene `art` y no hay dibujo por código, se pinta el recorte (`enemyArt.ts`: se carga de
  `/enemies/<art>.png`; fuera del navegador se da con `setEnemyArt`), escalado por su radio, mirando a su objetivo,
  con balanceo al andar, silueta blanca al recibir golpe (`enemyFlash`) y en gris aturdido. Mientras carga, el robot
  dibujado por código.
- **Mapa vivo** (`drawLiveChunk()` en el Renderer, cada fotograma encima de los chunks visibles, en píxeles de arte
  de `U` unidades): reflejos que avanzan por el agua, lava que late con burbujas que revientan, ondas en las fuentes,
  fuegos de hogueras/braseros/farolas que parpadean con chispas, aspas del molino que giran y árboles que se mecen
  (3 fotogramas de copa, `treeSprite()` + `paintTree()` de MapArt, en caché). Los árboles y las aspas ya no se pintan
  en el chunk (solo su sombra).
- **Oclusión ambiental** en `MapArt`: antes de pintar objetos, el suelo se oscurece en 3 capas escalonadas
  (`AO`, rgba(12,6,24,0.1)) alrededor de edificios, muros, torres, cajas, árboles, rocas y monumentos de suelo, junto a
  las mesetas de roca, y el agua junto a la orilla. Héroes y enemigos llevan sombra de contacto en dos capas (halo
  suave y núcleo oscuro).
- Las habilidades de órbita, rebote y espiral lanzan proyectiles de su elemento (`elemLook(fx)`: fuego → llama,
  agua → gota, veneno → hoja, hielo → cristal, sombra/alma → alma, `stim` → roca, el resto → estrella) con la paleta
  de su `fx` (`pal`). Todos los proyectiles con aspecto llevan una estela de cometa (`drawComet()`: halo y 6 cuadros
  que se estrechan y tiemblan) y sueltan chispas de su color al impactar; las bolas de la órbita dejan la estela en
  curva. Los discos del bumerán (`disc`) se tiñen con el color de la habilidad (`tinted()` + `shade()`) y dejan
  copias que se desvanecen. Los charcos del rastro se dibujan como campos (`field`) con la paleta de la habilidad.
- Mascotas: `petSprites.ts`, un mismo cuerpo de 16×15 con los colores de cada una y el detalle de su elemento;
  2 fotogramas (de pie y saltito). Sus disparos usan los aspectos `flame`, `bolt` y `leaf` de los proyectiles.
- Estilos de la tienda: el de héroe se aplica al canvas del
  sprite (`spriteCanvas(..., skin)`) pasando la ropa a la gama del estilo según su brillo.
- Robots enemigos: `enemySprites.ts` dibuja cada tipo con rectángulos y contorno automático, 2 fotogramas de
  animación y variantes "golpe" (blanco) y "aturdido" (gris). Cada jefe tiene un detalle propio.
- Efectos de habilidad: `vfx.ts` (sprites de dagas, flechas, llamas, granadas, cohetes, torretas, ojo, cruces…
  y efectos procedurales: explosiones por bloques, haces de luz, rayos, campos de cristales). Cada habilidad
  elige su estilo con el campo `fx` de sus datos.

## Entrada (`Input.ts`, `controls.ts`)

- Teclado con teclas configurables (`KeyMap`, guardado en preferencias). Las flechas mueven y Esc pausa siempre.
- Móvil: joystick virtual arrastrando el dedo sobre el canvas; habilidades con los botones del HUD.
- En cooperativo, el invitado no lanza habilidades en su motor: las envía al anfitrión (`castFn`).

## Efectos de combate

- **Golpe a un enemigo**: mientras dura su destello (`flash`, 0,09 s) el dibujo se aplasta desde los pies (hasta ×1,24
  de ancho y ×0,8 de alto, la mitad en los jefes), y el empujón del golpe es ×1,3 (los jefes no se mueven).
- **Enemigos que se rompen**: al morir, cada enemigo suelta piezas de su color y de metal (`engine.debris`, solo
  dibujo; 7 por bot y 34 por jefe, la mitad en calidad baja, máximo 320) que saltan, caen con gravedad, rebotan una
  vez contra el suelo y se desvanecen. Se pintan antes de los enemigos, con su sombra.
- **Jefe derrotado**: además del destello y el temblor, una gran explosión y una onda (`addVfx`), y `slowT` = 0,7 s de
  cámara lenta (el tiempo de juego va al 30 % en `update`).
- **Números de daño**: el Renderer usa el tamaño que pide el motor; los críticos salen dorados, más grandes y con «!»,
  y todos hacen un pequeño rebote al aparecer. El daño de los poderes sale del color de su elemento, aclarado para
  leerse sobre cualquier fondo (`damageEnemy(…, { color })`).
- **Presentación de jefes** (solo en solitario; en pareja, el aviso de siempre porque el invitado no la recibe): al
  aparecer un jefe (`announceBoss`), 1,2 s de cámara lenta, la cámara se desplaza hacia él (0,35 s), se queda y vuelve
  al héroe (hasta 1,7 s de juego), y el HUD enseña un cartel que entra de lado con «Jefe», su nombre en su color y su
  título (`BOSS_TITLES` en `enemies.ts`), durante 2,6 s.
- Captura: `npx tsx scripts/combat-shot.ts` (`shots/combate.png`).

## Ambiente de cada zona (`game/weather.ts`)

Encima del mundo y antes de los números flotantes, el Renderer pinta el ambiente de la zona en la que está el jugador:
partículas en pantalla (deterministas, calculadas con el tiempo y su índice; con algo de paralaje respecto a la
cámara) y un tinte de luz suave que cambia poco a poco al cruzar de zona (`blendTint`).

| Zona | Partículas | Tinte |
|---|---|---|
| Reino | Luciérnagas que laten y hojas que caen meciéndose | Cálido de tarde |
| Glaciar | Nieve de dos tamaños, con sombra azulada para verse sobre la nieve | Frío azulado |
| Infierno | Ceniza que cae y ascuas que suben parpadeando | Brillo de lava |
| Ciudad | Lluvia en diagonal y salpicaduras en el suelo | Noche lluviosa (más oscuro) |

En el Reino y el Glaciar pasan además sombras de nubes, pegadas al mundo y movidas por el viento (no en calidad baja).

El suelo de cada chunk (`MapArt.renderChunk`) lleva dos capas de detalles sueltos: la primera con matas, flores,
nieve, calaveras y grietas, y la segunda, más variada (38 intentos por chunk, solo donde hay suelo alrededor): setas,
piedrecitas con brillo, tréboles, hojas caídas y charcos con reflejo (Reino); charcos helados, grietas en el hielo y
piedras nevadas (Glaciar); fumarolas con brasa, esquirlas de obsidiana y huesos (Infierno); charcos de lluvia,
rejillas y papeles (Ciudad).

En calidad baja hay un tercio de partículas y sin halos. Capturas: `npx tsx scripts/weather-shot.ts`
(`shots/ambiente-zonas.png`).

## Proyectiles de los poderes (`game/fancyProj.ts`)

Los proyectiles de los poderes automáticos (rayo, agua, hielo, hoja, roca, estrella, daga, flecha y alma) se pintan a
píxeles por código, con un núcleo, halo de su color (mezcla aditiva) y un movimiento propio: zigzag con ramas en el
rayo, gota que se estira y suelta gotitas en el agua, esquirla con escarcha en el hielo, hoja que gira, roca que rueda
con polvo, estrella que palpita con destellos, daga con líneas de velocidad, flecha con plumas y estela, y alma con
cola ondulante. Al golpear, cada uno deja su impacto (`engine.impacts`, solo dibujo, 0,35 s): chispazo, salpicadura,
esquirlas, hojas, polvo y cascotes, brillos, corte en X…

- El **fuego** se dejó con su dibujo de antes, a gusto de Gabriel (su versión nueva está en el código, desactivada:
  basta añadir `'flame'` a `FANCY_LOOKS` y en `GameEngine` donde se apuntan los impactos).
- Las habilidades que reutilizan estos aspectos con otra paleta (`pal`, p. ej. los orbes de Zephyr) siguen con la
  estela de cometa.
- En calidad baja no hay halos y hay menos partículas. Capturas: `npx tsx scripts/power-shot.ts`
  (`shots/poderes-antes-despues.png`).

## App instalable (PWA)

`vite-plugin-pwa` (en `vite.config.ts`) genera el manifiesto (`manifest.webmanifest`: nombre, iconos, pantalla
completa en horizontal, colores) y un service worker (`sw.js`, Workbox) que guarda en el dispositivo todo el juego
(JS, CSS, HTML, imágenes y fuentes) para que cargue rápido y abra sin conexión. Las llamadas a Supabase no se
guardan: siempre van a la red.

- Actualizaciones (`registerType: 'prompt'`): al subir una versión, el service worker nuevo se descarga solo. Si la
  app está cerrada, la siguiente vez que se abre ya es la nueva; si está abierta, `UpdateToast` avisa «Hay una
  versión nueva» con un botón para recargar (no sale durante la partida). Con la app abierta se comprueba cada 30
  min. Las cachés viejas se borran solas.
- Iconos en `public/icons/`, generados desde `art/LOGO.png` con `npx tsx scripts/make-icons.ts` (512, 192,
  "maskable" con margen para móviles que recortan en círculo, 180 para iPhone y favicons de 32 y 64).
- En desarrollo (`npm run dev`) no hay service worker; para probarlo: `npm run build` y `npm run preview`.

## Audio (`utils/audio.ts`)

**Sonidos del menú** (en `App.tsx`, salvo las cartas): `hover` al pasar el ratón por cualquier botón (una vez al
entrar; solo con ratón y fuera de la partida), `whoosh` al cambiar de pantalla, `buy` cuando bajan los créditos
(comprar) y `coin` cuando suben (cobrar misiones, rachas, logros…), `ach` al salir el aviso de logro y `card` al pasar
por una carta de mejora (`UpgradeSelection`). `click` sigue en cada botón.

Todo sintetizado con WebAudio, sin archivos. Se desbloquea tras el primer clic o tecla. Hay una reverberación
generada (sala de ruido que se apaga) para efectos y otra para música, un eco para la música y un compresor
suave a la salida.

- **Efectos por elemento**: el motor pide `ab_<fx>` / `ult_<fx>` al usar una habilidad (según su `fx`) y
  `shot_<look>` en cada disparo del poder (según cómo es el proyectil). Familias: rayo (`electric`: chasquido,
  zumbido y trueno), fuego (`fire`, `hothands`: soplido, rugido y chisporroteo), explosiones (`boom`, `grenade`,
  `rocket`, `orbital`), hielo (campanillas y cristales), agua/curación (burbujas y salpicón), viento/cuchillas,
  luz (`holy`: acorde brillante), sombra (`soul`, `shadow`, `paranoia`, `gravity`), veneno y mecánicos
  (`arrow`, `scan`, `turret`, `stim`, `wire`). La definitiva suena más grande y con retumbo. Los ataques de jefe
  tienen los suyos: `thunder`, `fire_breath`, `web`, `shield`, `blink`.
- **Música ambiental** (`SONGS`): `menu`, uno por zona y `boss`. Cada tema es un bucle de 4 acordes (un compás de
  16 pasos cada uno): un colchón con el acorde que entra y sale despacio, notas sueltas con eco (`lead`), a veces
  bajo y percusión suave, y un fondo propio (`bg`): pájaros (Reino), viento (Glaciar), lluvia (Ciudad), fuego que
  chisporrotea (Infierno) y zumbido grave (menú y jefe). Patrones como texto: `0-7` nota del acorde (4-7 una
  octava más), `x` golpe, `o` octava del bajo, `5` quinta, `.` silencio.
- En partida, `GameScreen` pide cada 100 ms `audio.setSong(engine.musicTheme())`: el tema del jefe si hay uno vivo
  y, si no, el de la zona del jugador (cambia al cruzar un portal). Al salir vuelve `menu`. El cambio espera al
  final del compás y baja y sube el volumen (`fade()`). La intensidad (tiempo de partida / 9 min) acelera un
  poco el tempo (`push`) y añade notas y charles.

## Idiomas (`src/i18n`)

`t('texto en español', {parámetros})` devuelve la traducción del idioma activo; el diccionario inglés está en
`en.ts` (la clave es el texto español). Los datos del juego se escriben en español y se traducen al mostrarse.
Más en [08 · Interfaz](08-interfaz.md#idiomas).

## Scripts de prueba

Ver [09 · Desarrollo](09-desarrollo-y-despliegue.md#pruebas). Usan el mismo motor y Renderer en Node con
`@napi-rs/canvas`, sin navegador.
