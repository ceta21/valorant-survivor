# 02 · Jugabilidad

Los valores exactos (vida de cada héroe, daño de cada poder, etc.) están en
[10 · Datos del juego](10-datos-del-juego.md). Aquí se explican las reglas y las fórmulas.
Código principal: `src/game/GameEngine.ts`.

## Flujo de una partida

1. En **Jugar** se elige héroe, zona de inicio y dificultad.
   Se puede jugar con los 20 héroes (`AVAILABLE_AGENTS` en `src/data/agents.ts`);
   si algún héroe se saca de esa lista, sale con candado y el rótulo **Próximamente** y no se puede comprar ni
   elegir (tampoco en cooperativo).
2. La partida empieza con el aviso "¡SOBREVIVE!" y el **poder** del héroe a nivel 1 (`HERO_POWER` en
   `src/data/powers.ts`). No hay armas.
3. Los poderes se lanzan solos, sin parar, al enemigo más cercano dentro de su alcance.
4. Los enemigos muertos sueltan **gemas de experiencia**; al recogerlas se llena la barra de XP.
5. Al subir de nivel la partida se detiene y se elige **1 de 3 mejoras** (se puede relanzar 2 veces por partida).
6. Oleadas, élites y jefes llegan según el [calendario](10-datos-del-juego.md#calendario-de-la-partida).
7. A los 9:00 aparece el jefe final; después la partida **sigue sin límite** (modo infinito).
8. La partida termina cuando el jugador muere (en cooperativo, cuando caen los dos). Se ganan
   créditos y, con cuenta, la marca se publica sola en el ranking.

El motor avanza en pasos fijos de 1/60 s (máx. 6 pasos por fotograma, con `dt` limitado a 0,1 s).

## Jugador

- Estadísticas iniciales: vida y velocidad del héroe, daño = `daño del héroe / 10`, crítico 5 %,
  multiplicador crítico ×1,6, regeneración 0,5 vida/s, más el rasgo del héroe y las mejoras permanentes.
- Al recibir daño: 0,55 s de invulnerabilidad (parpadeo). El escudo absorbe el daño antes que la vida y
  se regenera a 4/s tras 5 s sin recibir golpes (hasta su máximo).
- Movimiento en 8 direcciones por un mundo grande y cerrado de 4 zonas (Reino, Glaciar, Infierno, Ciudad) separadas
  por abismos que no se pueden pisar. Se elige la zona de inicio y se cambia de zona pisando un **portal**: cada zona
  tiene 3, uno hacia cada otra zona (rótulo con el destino y color de esa zona); te deja junto a su pareja y no se
  puede volver a usar hasta pasados 1,5 s. Con **M** (configurable) se abre el mapa del mundo; en solitario la
  partida se detiene mientras está abierto.
- **Terreno**: el **agua** frena a ×0,6 (jugador y enemigos); la **lava** quema: al jugador le quita un 5 % de su
  vida máxima en cada golpe (uno cada 0,55 s, con la invulnerabilidad normal; el dash la cruza sin daño) y a los
  enemigos que no son jefe los hace arder (12 % de su vida/s, mínimo 6). Hielo, puentes, caminos y hierba se pisan
  sin efecto; la roca y el abismo no se pueden pisar.
- **Poderes** (11 elementales: arcano, flecha, fuego, rayo, hojas, viento, sombra, hielo, luz, roca y agua). Hasta
  **4 a la vez**: al subir de nivel pueden ofrecerse poderes nuevos ("Nuevo poder") o subir de nivel los que se
  tienen. Algunos tienen efecto propio: el fuego quema 3 s, el rayo salta a otro enemigo, la sombra persigue, la
  roca y la evolución de otros estallan.
- Por nivel: **+22 % daño y −6 % de recarga**, hasta el **nivel 5**. **Evolución combinada**: con el poder al nivel 5 y
  su mejora de partida (`evoWith`, ver [10](10-datos-del-juego.md#poderes)), sale siempre la carta dorada de **EVOLUCIÓN**
  (nivel 6, efecto especial propio). Mientras no la tengas, la carta de esa mejora sale el doble y avisa con
  "★ Evoluciona …"; en el HUD el poder pone MÁX y su ayuda dice qué mejora le falta.
- Las mejoras de partida también son sobre los poderes (daño, velocidad de lanzamiento, proyectiles extra,
  perforación, quemadura, alcance…).
- Daño de un lanzamiento: `daño base × (1 + 0,22 × (nivel − 1)) × mult. evolución × daño del jugador`.

## Habilidades

Cada héroe tiene una habilidad **especial** (Espacio), opcionalmente una **secundaria** (E) y una
**definitiva** (Q). Las dos primeras tienen recarga (reducible con "Circuitos de recarga", máx. −60 %).
La definitiva se carga de 0 a 100: empieza en 25, sube 0,6/s × carga, 1,1 por baja normal × carga y
20 por jefe.

Tipos de habilidad (`kind`):

| Tipo | Qué hace |
|---|---|
| `dash` | Impulso rápido e invulnerable que daña a lo que atraviesa (Kael, Brutus, Zahir). |
| `sprint` | Velocidad ×1,6 y un aura que daña cada 0,15 s (Volt). |
| `nova` | Explosión alrededor: daño + aturdir / quemar / ralentizar / marcar según la habilidad. |
| `strike` | Golpes de área con retardo sobre enemigos cercanos (granadas, cohetes, bombardeos). |
| `turret` | Torretas que disparan solas durante un tiempo (Tink). Tienen vida y los robots pueden destruirlas. |
| `seekers` | Proyectiles teledirigidos que marcan (Lyra: flechas; Morgan: espíritus). |
| `blink` | Teletransporte en la dirección de movimiento + explosión al reaparecer (Vex, Grim, Draco, Sora). |
| `frenzy` | Cadencia aumentada y robo de vida por baja durante unos segundos (Brutus, Raven, Sora). |
| `storm` | Lluvia de dagas al enemigo más cercano cada 0,07 s (Vex). |
| `heal` | Curación y escudo (Seraph, Sylvan, Aqua…). |
| `beam` | **Rayo** recto hacia el enemigo más cercano (o hacia donde vas) que atraviesa a todos los que toca: largo `radius` × √alcance, ancho `width` × área; aplica aturdir / quemar / frenar / marcar. `count` > 1 = rayos en estrella (Zephyr, Lyra, Volt). Se dibuja con `pixelRay()`. |
| `cone` | **Abanico** delante de ti de apertura `spread` (grados) y alcance `radius` (aliento de Draco, llamarada de Ember). Se dibuja con `pixelCone()`. |
| `orbit` | **Órbita**: `count` proyectiles del elemento (con estela en curva) giran alrededor del héroe a `radius` × área durante `duration` s; golpean (y empujan) a cada enemigo como mucho una vez cada 0,45 s y rompen cajas (Aqua burbujas, Talos rocas, Brutus hachas, Draco fuego). Las de delante se pintan encima del héroe. |
| `bounce` | **Rebote**: `count` proyectiles del elemento hacia el enemigo más cercano que, al golpear, saltan al enemigo más cercano aún no tocado (`bounces` saltos, hasta 320 de distancia) (Zephyr, Seraph, Morgan). |
| `spiral` | **Espiral**: durante `duration` s lanza cada 0,08 s un proyectil del elemento por brazo (`count` brazos) girando 0,42 rad cada vez (Ember fuego, Nox morada, Sora rosa). |
| `boomerang` | **Bumerán**: `count` discos que llegan a `radius` × √alcance, vuelven al héroe y desaparecen al llegar; atraviesan todo a la ida y otra vez a la vuelta y no los paran los obstáculos (Vex, Grim). |
| `trail` | **Rastro**: durante `duration` s, al moverte deja cada 0,16 s un charco de radio 46 × área que dura 2,6 s y daña cada 0,4 s (y frena con `slow`) a quien lo pisa (Sylvan espinas, Frost hielo, Zahir arena). |

Efectos de estado: **quemadura** (daño por segundo), **ralentización**, **aturdimiento** (los jefes no se
aturden) y **marca** (+30 % de daño recibido).

### Torretas (Tink)

- Torreta: 1 torreta; Bloqueo: 3 torretas más resistentes. Duran 14 s, disparan cada 0,3 s al enemigo más cercano (alcance 340).
- Vida: `75 × escala de daño enemigo` (Torreta) o `110 × escala` (Bloqueo), para que aguanten igual en toda la partida.
- Los robots cuerpo a cuerpo (comportamiento `chase`, `exploder`, `elite`) **van a por la torreta si está más
  cerca que el jugador** y la golpean cada 0,6 s. Los disparos enemigos, obuses del Artillero, explosiones y
  golpes de jefe también las dañan. Al llegar a 0 explotan.

### Mascotas

Se compran en la Tienda (ver más abajo); en el apartado **Mascotas** (`PetsScreen`, debajo de Héroes en el menú)
se elige cuál llevar o ninguna (`save.shop.pet`) y se desbloquea o mejora su poder. Código: `updatePet()` y
`petAttack()` en `GameEngine`, dibujo en `src/game/petSprites.ts`.

- Va a un lado del jugador, un poco por detrás; si se queda a más de 220 de distancia o lleva 0,8 s atascada contra un muro, aparece junto a él.
- Vida `70 × escala de daño enemigo`. Los robots la atacan igual que a las torretas (cuenta en `allTurrets()`,
  que devuelve torretas y mascotas): cuerpo a cuerpo si está más cerca que el jugador, disparos y explosiones.
- Si la derriban vuelve a los **60 s** (`PET_RESPAWN`) con toda la vida. El HUD muestra su vida o el tiempo que falta.
- Sin poder solo acompaña. Con poder (niveles 1–3) ataca al enemigo más cercano (alcance 320) cada 1,6 / 1,25 /
  0,95 s con daño `(6 + 5 × nivel) × daño del jugador`:
  - Fuego (Brasín): bola de fuego que quema. Agua (Ajolín): chorro que estalla y ralentiza.
  - Rayo (Voltio): rayo que salta entre enemigos. Planta (Brotín): dos hojas y cura un 0,4 % por nivel.
  - Hielo (Copito): fragmentos que aturden 0,4–0,6 s.

## Experiencia y nivel

- XP necesaria para el siguiente nivel: `round(5 + 5·nivel + 0,55·nivel²)`.
- La XP de cada gema se multiplica por la estadística de experiencia del jugador.
- Gemas: cristales pixel art con halo de luz que late y destellos; azul (<1,5), verde (1,5–4), dorada (4–10) o morada
  (>10, más grande) según su valor; la de curación es una cruz verde. Se atraen al acercarse (radio 120 × imán)
  o solas tras 8 s. Si hay más de 320 gemas, las nuevas se suman a una existente.
- Orbes de curación (cruz verde): los sueltan los élites, los jefes (3) y el 0,8 % de los enemigos normales.
- **Cajas rompibles**: aparece una cada 7 s a 380–760 de un jugador (máximo 6 a la vez; nunca en obstáculos, agua,
  lava ni abismo; desaparecen si todos se alejan más de 1.800). No bloquean el paso. Tienen 30 de vida × (1 + minuto/10)
  y se rompen con los proyectiles (gastan perforación) y las explosiones. Al romperse sueltan experiencia y un premio:
  curación 25 % (35 %), monedas de 15–30 créditos que se suman al final (35 %), imán que atrae todas las gemas de
  experiencia (20 %) o bomba que mata a los enemigos normales a 620 y quita un 8 % de vida a los jefes (10 %).
  El poder dispara a lo que tenga más cerca: el enemigo más cercano o la caja más cercana. El premio sale despedido
  de la caja, rebota al caer y se queda en el suelo: no vuela hacia ti ni lo atrae el imán; se recoge pasándole por
  encima (a menos de 18 + radio del héroe). Las cajas salen en el minimapa como puntos dorados.
- Rareza de las mejoras: pesos `[máx(20, 60 − 0,8·N), 28 + 0,6·N, 10 + 0,5·N, 2 + 0,15·N]` (N = nivel), así
  que a más nivel, más mejoras épicas y legendarias.

## Enemigos

**Bots de la grieta** (dibujados por código a partir de `art/enemigos.png`, con vistas de frente, espaldas y perfil y
animación al andar; ver [03](03-arquitectura.md)):
8 tipos en 3 niveles — normal, élite (vida ×1,8, daño ×1,3, XP ×1,8) y legendario (vida ×3, daño ×1,6, XP ×3), algo más
rápidos y grandes cuanto más nivel.

| Tipo | Comportamiento | Qué hace |
|---|---|---|
| Soldado | `shooter` | Mantiene distancia y dispara. |
| Araña | `chase` | Persigue y daña por contacto (la más común al principio). |
| Flotante | `shooter` (3 balas) | Ráfagas de 3 balas en abanico. |
| Torreta / Lanzacohetes | `mortar` | Lanza obuses en parábola a donde vas. |
| Escudo / Tanque | `chase` + blindaje | Lento; bloquea el 30 % del daño (40 % élite, 50 % legendario). |
| Asesino | `chase` | Muy rápido y frágil. |
| Dron volador | `shooter` | Rápido, dispara desde lejos. |
| Sanador | `healer` | Se queda atrás y cada 3,5 s cura un 15–25 % de la vida a los enemigos a 170. |

**Nivel según la zona y el tiempo** (`tierFor`): cada zona marca el nivel con el que empiezan (`ZONE_TIER`: Reino normal,
Glaciar y Ciudad élite, Infierno legendario) y desde el 2:30 es cada vez más probable que salgan un nivel por encima
(siempre a partir del 7:30). Los élites periódicos (desde el 3:20) salen un nivel más. Un bot de prueba aguanta de
media unos 170 s en el Reino, 155 s en el Glaciar y 130–135 s en la Ciudad y el Infierno.

**Jefes** (`BOSS_SCHEDULE`): al 2:30, el jefe de la zona en la que estás (`ZONE_BOSS`: Reino → Coloso mecánico,
Ciudad → Reina araña, Glaciar → Elemental de energía, Infierno → Dragón cibernético); al 5:00, el Sabio oscuro; al
7:30, otra vez el jefe de la zona con ×4,5 de vida; y al 9:00 el jefe final, el Dragón cibernético enorme. Al invocar,
la Reina saca crías de araña y el Sabio y el Dragón, drones voladores. En modo infinito salen al azar entre ellos.

Los robots antiguos (Recluta, Corredor, Tanque, Tirador, Explosivo, Artillero, Élite y sus jefes) siguen definidos
(el cooperativo usa el orden de `ENEMIES`) pero ya no aparecen; su tabla queda como referencia:

| Comportamiento | Enemigos | Qué hace |
|---|---|---|
| `chase` | Recluta, Corredor, Tanque | Persigue y daña por contacto. |
| `shooter` | Tirador | Mantiene distancia (200–280) y dispara 1 bala tras un aviso de 0,3 s. |
| `mortar` | Artillero | Se queda a 240–380 y lanza obuses en parábola a donde vas (con anticipación); zona marcada en rojo, estalla a los 1,15 s (radio 62). |
| `exploder` | Explosivo | Se acerca, enciende la mecha a <52 y explota (radio 78). |
| `elite` | Élite | Persigue y dispara 3 balas en abanico. Tiene barra de vida. |
| `boss` | Jefes | Patrones: anillo de balas, espiral, golpe en área marcado, carga y convocar robots. Fase 2 por debajo del 50 % de vida. |

- Los enemigos persiguen al **jugador vivo más cercano** (o a una torreta, ver arriba).
- Separación entre enemigos, sistema anti-atascos (rodear obstáculos y retroceder) y recolocación si se
  alejan más de 1100 (1500 los jefes).
- Máximo 230 enemigos en el flujo normal (las oleadas y convocatorias pueden superar algo ese número).

### Escalado con el tiempo

Con `m = minutos`, `extra = segundos desde el minuto 9`:

- Vida de enemigos normales: `(1 + 0,24·m + 0,02·m²) × vida de dificultad × (1 + extra/300)`.
- Vida de jefes: `(1 + segundos/900) × vida de dificultad × (1 + extra/300)`.
- Daño enemigo: `(1 + 0,07·m) × daño de dificultad × (1 + extra/400)`.
- Velocidad de enemigos normales: hasta +25 % (a los 25 min).
- Enemigos deseados en pantalla: `mín(230, (9 + 0,3·segundos) × aparición)`; reducido al 55 % mientras hay
  un jefe antes del minuto 9.

### Oleadas, élites y jefes

- Oleadas intensas a los 100, 190, 260, 345, 420 y 490 s: anillo de `22 + 6·i` enemigos. En modo infinito, una
  oleada cada 55 s de `40 + 4·(extra/30)` enemigos.
- Élites desde el segundo 200, cada 42 s; cada vez `1 + (segundos − 200)/130` élites.
- Jefes (`BOSS_SCHEDULE`): el de la zona en la que estés a las 2:30 (`ZONE_BOSS`: Reino → Coloso mecánico,
  Ciudad → Reina araña, Glaciar → Elemental de energía, Infierno → Dragón cibernético), Sabio oscuro (5:00), otra
  vez el de la zona con ×4,5 de vida (7:30) y el Dragón cibernético final (9:00).
- Ataques de jefe (`patterns`, `bossLogic()`): comunes — anillo de disparos, espiral, golpe en área, embestida e
  invocar bots — y uno propio de cada jefe, siempre con aviso en el suelo:
  - **Escudo** (Coloso): durante 4 s (5,5 s en la 2.ª fase) recibe solo el 25 % del daño; se ve una burbuja azul.
  - **Telarañas** (Reina): 3 (4 en la 2.ª fase) donde estás y alrededor, de radio 70, durante 6 s; dentro se anda
    al 45 % (`WEB_SLOW`). Son `hazards` del motor y se envían al invitado.
  - **Tormenta** (Elemental): 5 (7) rayos seguidos sobre el jugador más cercano, cada uno avisa 0,9 s y daña en
    radio 58.
  - **Aliento** (Dragón y Dragón final): 0,7 s de aviso y 1,7 s de fuego en un cono de 270 de largo que gira
    despacio hacia ti.
  - **Salto** (Sabio): se desvanece, reaparece a 170 del jugador y suelta un anillo de disparos.
- Modo infinito: jefes al azar cada vez más seguidos (de 45 s a 14 s, × dificultad), uno más a la vez cada
  5 minutos, máximo 6 vivos.

## Dificultad

Multiplica la vida y el daño enemigos, el ritmo de aparición, el intervalo de jefes en modo infinito y los
créditos ganados. Ver la [tabla](10-datos-del-juego.md#dificultades).

## Fin de partida y recompensas

- Créditos: `floor((bajas·0,4 + segundos/8 + nivel·6 + jefes·40 + (350 si mató al jefe final)) × créditos de dificultad)`.
- Cuenta como **victoria** si se derrotó al Dragón cibernético final antes de morir.
- Se actualizan estadísticas, récords por mapa y logros (los logros se calculan a partir de las estadísticas).
- Las misiones se cobran a mano en Estadísticas.
- En solitario se puede publicar la marca en el ranking (sola con cuenta, con nombre como invitado). Las
  partidas en pareja **no** cuentan para el ranking.

## Progresión fuera de la partida

- **Créditos (◈)**: se ganan jugando y cobrando misiones.
- **Héroes**: 20 héroes originales; Zephyr, Lyra y Kael gratis y el resto se desbloquean con créditos. Los
  héroes de versiones anteriores ya no existen: al cargar un guardado se quitan y se devuelve lo que costaron
  (`LEGACY_AGENT_COSTS`); sus marcas del ranking salen como "Héroe retirado".
- **Mejoras permanentes**: daño, vida, velocidad y experiencia, 10 niveles cada una (ver coste en [10](10-datos-del-juego.md#mejoras-permanentes)).
- **Equipo** (`src/data/gear.ts`, `GearScreen`): cada jefe derrotado suelta un objeto (se ve al acabar la partida
  y pasa al inventario). 12 objetos, cada uno sube una estadística (daño, vida, velocidad, recarga, recogida,
  crítico, área, regeneración, experiencia, velocidad de ataque, escudo, vida por baja), en 4 rarezas.
  - Rareza según la zona del jefe (`ZONE_TIER`): Reino 60/30/9/1 %, Glaciar y Ciudad 40/38/18/4 %, Infierno
    25/40/27/8 % (común/raro/épico/legendario); el jefe final da épico (70 %) o legendario (30 %).
  - Se llevan hasta **3** a la vez, uno de cada tipo. Su ventaja se suma a las estadísticas del héroe al empezar
    (`gearBonus()`; la velocidad como porcentaje), también en pareja.
  - Mejorar: hasta nivel 5, +15 % del valor por nivel, cuesta ◈ 250 × (rareza+1) × nivel. Desmontar devuelve
    ◈ 120 × (rareza+1) × nivel. Las cuentas empiezan con un Amuleto de fuerza común puesto.
- **Mercado de la Grieta**: ver [07](07-mercado-nocturno.md).
- **Tienda** (`src/data/shop.ts`, `ShopScreen`): **solo compra** (con confirmación). Lo comprado se pone en otro sitio:
  estilos de héroe en la ficha de cada héroe (**Héroes**); mascotas y su poder en **Mascotas**.
  - Estilos de héroes (◈ 8.000–12.000): recolorean ropa y armadura del héroe al que se pongan, respetando piel y
    contorno (`applySkin()` en `sprites.ts`). Cada héroe lleva el suyo. Solo estéticos.
  - Ya no hay armas ni héroes exclusivos (Eclipse, Vórtice y Quimera): al cargar un guardado, las armas exclusivas,
    los estilos de arma y esos héroes comprados antes se quitan y se devuelve su precio base (`LEGACY_PRICES`).
  - Mascotas (◈ 12.000–16.000). Su poder se compra en Mascotas: ◈ 5.000 / 8.000 / 12.000 por nivel.
  - Lo comprado y lo equipado va en `save.shop` y se lleva a la partida como `Looks` (también en cooperativo).
