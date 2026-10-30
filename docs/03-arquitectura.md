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
  gemas → generador de enemigos → partículas → limpieza.
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

- Mundo grande y **cerrado**: 4 zonas (`MAPS` en `src/data/maps.ts`, cada una con su posición `zone` en una
  cuadrícula de 2×2) de `ZN` = 8×8 chunks, separadas por `GAP` = 1 chunk de abismo. Todo lo que queda fuera es
  abismo: un obstáculo (`k: 'v'`) que ocupa el chunk entero. `zoneAt(cx, cy)` dice la zona de un chunk.
- Los chunks son de **640×640** y se generan de forma determinista a partir de una **semilla** (en cooperativo la
  comparte el anfitrión). La zona de inicio no cambia el mundo: solo dónde apareces (chunk central de la zona).
- Terreno **orgánico** por celdas de 32×32 (20×20 por chunk, `Cell`): suelo, camino, agua, lava, hielo, abismo,
  roca, mar, calle, arena, puente y hierba alta. `cellType` lo decide con ruido (`noise`/`fbm`): borde irregular
  de la isla, ríos y estanques/lagos/ríos de lava según la zona, mesetas de roca (que se encogen cerca de caminos y
  monumentos para no dejar trozos sueltos), praderas de hierba alta en el Reino; la Ciudad tiene avenidas, calles,
  parques, playa y mar. `terrainAt(x, y)` da el tipo de celda de un punto (lo usa el motor para agua y lava).
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
  otra zona, con su zona reservada y camino. El motor los comprueba en `updatePlayer`.
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
- Orden de dibujo: chunks → portales → gemas → golpes de área y obuses (con su aviso) → campos →
  avisos de jefes → torretas → enemigos → proyectiles → efectos de habilidad → jugadores (con drones) →
  efectos sobre el personaje → ondas y partículas → nombres en cooperativo → números de daño → viñeta.
- Personajes: dos tipos (`sprites.ts`).
  - **Con imagen** (los 20 héroes): fotogramas recortados de la hoja de sprites que da Gabriel
    (`art/heroes.png`, una vista de lado, de frente y de espaldas por héroe) con `scripts/cut-agent.ts`. Se guardan con sus colores exactos en
    `public/agents/<id>.png` (una fila por vista —frente, espalda, lado— y una columna por paso) y sus medidas en
    `src/data/agentImages/<id>.json` (`px` = escala para que todos midan ~58 unidades). El juego las precarga
    al crear el `Renderer`; los retratos del menú usan la misma hoja.
  - **Dibujados por código** (los exclusivos Eclipse, Vórtice y Quimera): rejilla 22×30 con poses (reposo, andar, correr, lanzar).
  - El cuerpo mira hacia donde se mueve: de frente (bajando o quieto), de espaldas (subiendo) o de lado (la
    izquierda es el espejo de la derecha). No llevan arma: al lanzar el poder sale un destello de su color en la mano.
- Poderes: los datos están en `powers.ts` (`PowerDef`) y el motor los guarda en `weapons` (`WeaponInst`: id, nivel,
  recarga). Cada uno tiene un aspecto de proyectil (`look`: estrella, flecha, llama, rayo, hoja, cuchilla, alma,
  hielo, agua, roca) que el Renderer dibuja con los sprites de `vfx.ts` y su paleta, al doble de tamaño (`BIG`)
  y con un halo de su color; las bombas y cohetes de habilidad usan la misma escala, y las explosiones, anillos,
  haces, rayos y conos se dibujan algo más grandes que su área de daño.
- Mascotas: `petSprites.ts`, un mismo cuerpo de 16×15 con los colores de cada una y el detalle de su elemento;
  2 fotogramas (de pie y saltito). Sus disparos usan los aspectos `flame`, `bolt` y `leaf` de los proyectiles.
- Estilos de la tienda: el de agente se aplica al canvas del
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

## Audio (`utils/audio.ts`)

Todo sintetizado con WebAudio: efectos (disparo, golpe, explosión, nivel…) y música generativa cuya
intensidad sube con el tiempo de partida. Se desbloquea tras el primer clic o tecla.

## Idiomas (`src/i18n`)

`t('texto en español', {parámetros})` devuelve la traducción del idioma activo; el diccionario inglés está en
`en.ts` (la clave es el texto español). Los datos del juego se escriben en español y se traducen al mostrarse.
Más en [08 · Interfaz](08-interfaz.md#idiomas).

## Scripts de prueba

Ver [09 · Desarrollo](09-desarrollo-y-despliegue.md#pruebas). Usan el mismo motor y Renderer en Node con
`@napi-rs/canvas`, sin navegador.
