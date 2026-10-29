# 02 · Jugabilidad

Los valores exactos (vida de cada agente, daño de cada arma, etc.) están en
[10 · Datos del juego](10-datos-del-juego.md). Aquí se explican las reglas y las fórmulas.
Código principal: `src/game/GameEngine.ts`.

## Flujo de una partida

1. En **Jugar** se elige agente, mapa, dificultad y (si se tiene alguna exclusiva) arma inicial.
   De momento solo se pueden jugar Jett, Phoenix, Reyna, Sage, Killjoy y los exclusivos del mercado
   (`AVAILABLE_AGENTS` en `src/data/agents.ts`); el resto sale con candado y el rótulo **Próximamente**, y
   no se puede comprar ni elegir (tampoco en cooperativo).
2. La partida empieza con el aviso "¡SOBREVIVE!" y el arma inicial (Classic por defecto) a nivel 1.
3. Las armas disparan solas al enemigo más cercano dentro de su alcance.
4. Los enemigos muertos sueltan **gemas de experiencia**; al recogerlas se llena la barra de XP.
5. Al subir de nivel la partida se detiene y se elige **1 de 3 mejoras** (se puede relanzar 2 veces por partida).
6. Oleadas, élites y jefes llegan según el [calendario](10-datos-del-juego.md#calendario-de-la-partida).
7. A los 9:00 aparece el jefe final; después la partida **sigue sin límite** (modo infinito).
8. La partida termina cuando el jugador muere (en cooperativo, cuando caen los dos). Se ganan
   créditos y, con cuenta, la marca se publica sola en el ranking.

El motor avanza en pasos fijos de 1/60 s (máx. 6 pasos por fotograma, con `dt` limitado a 0,1 s).

## Jugador

- Estadísticas iniciales: vida y velocidad del agente, daño = `daño del agente / 10`, crítico 5 %,
  multiplicador crítico ×1,6, regeneración 0,5 vida/s, más el rasgo del agente y las mejoras permanentes.
- Al recibir daño: 0,55 s de invulnerabilidad (parpadeo). El escudo absorbe el daño antes que la vida y
  se regenera a 4/s tras 5 s sin recibir golpes (hasta su máximo).
- Movimiento en 8 direcciones; el mundo no tiene bordes. En Bind, pisar un teletransportador lleva a su pareja
  (1,5 s de espera entre usos).

## Armas

- Hasta **4 armas** a la vez. Al subir de nivel pueden ofrecerse armas nuevas o subir de nivel las que se tienen.
- Por nivel: **+22 % daño y −6 % de recarga**. Al **nivel 5 el arma evoluciona** (efecto especial propio).
- Daño de un disparo: `daño base × (1 + 0,22 × (nivel − 1)) × mult. evolución × daño del jugador`.
- Las armas exclusivas del mercado no salen al subir de nivel: solo se usan como arma inicial.

## Habilidades

Cada agente tiene una habilidad **especial** (Espacio), opcionalmente una **secundaria** (E) y una
**definitiva** (Q). Las dos primeras tienen recarga (reducible con "Circuitos de recarga", máx. −60 %).
La definitiva se carga de 0 a 100: empieza en 25, sube 0,6/s × carga, 1,1 por baja normal × carga y
20 por jefe.

Tipos de habilidad (`kind`):

| Tipo | Qué hace |
|---|---|
| `dash` | Impulso rápido e invulnerable que daña a lo que atraviesa (Jett). |
| `sprint` | Velocidad ×1,6 y un aura que daña cada 0,15 s (Neon). |
| `nova` | Explosión alrededor: daño + aturdir / quemar / ralentizar / marcar según la habilidad. |
| `strike` | Golpes de área con retardo sobre enemigos cercanos (granadas, cohetes, bombardeos). |
| `turret` | Torretas que disparan solas durante un tiempo (Killjoy). Tienen vida y los robots pueden destruirlas. |
| `seekers` | Proyectiles teledirigidos que marcan (Sova). |
| `blink` | Teletransporte en la dirección de movimiento + explosión al reaparecer (Omen). |
| `frenzy` | Cadencia aumentada y robo de vida por baja durante unos segundos (Reyna, Brimstone). |
| `storm` | Lluvia de cuchillas al enemigo más cercano cada 0,07 s (Jett). |
| `heal` | Curación y escudo (Sage, Phoenix). |

Efectos de estado: **quemadura** (daño por segundo), **ralentización**, **aturdimiento** (los jefes no se
aturden) y **marca** (+30 % de daño recibido).

### Torretas (Killjoy)

- Torreta: 1 torreta; Bloqueo: 3 torretas más resistentes. Duran 14 s, disparan cada 0,3 s al enemigo más cercano (alcance 340).
- Vida: `75 × escala de daño enemigo` (Torreta) o `110 × escala` (Bloqueo), para que aguanten igual en toda la partida.
- Los robots cuerpo a cuerpo (comportamiento `chase`, `exploder`, `elite`) **van a por la torreta si está más
  cerca que el jugador** y la golpean cada 0,6 s. Los disparos enemigos, obuses del Artillero, explosiones y
  golpes de jefe también las dañan. Al llegar a 0 explotan.

## Experiencia y nivel

- XP necesaria para el siguiente nivel: `round(5 + 5·nivel + 0,55·nivel²)`.
- La XP de cada gema se multiplica por la estadística de experiencia del jugador.
- Gemas: azul (<1,5), verde (1,5–4) o dorada (>4) según su valor. Se atraen al acercarse (radio 120 × imán)
  o solas tras 8 s. Si hay más de 320 gemas, las nuevas se suman a una existente.
- Orbes de curación (cruz verde): los sueltan los élites, los jefes (3) y el 0,8 % de los enemigos normales.
- Rareza de las mejoras: pesos `[máx(20, 60 − 0,8·N), 28 + 0,6·N, 10 + 0,5·N, 2 + 0,15·N]` (N = nivel), así
  que a más nivel, más mejoras épicas y legendarias.

## Enemigos

Todos los enemigos son **robots** de entrenamiento (sprites pixel art propios, ver [03](03-arquitectura.md)).

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
- Jefes: Centinela (2:30), Cazador (5:00), Titán (7:30) y Cabecilla del Protocolo (9:00).
- Modo infinito: jefes al azar cada vez más seguidos (de 45 s a 14 s, × dificultad), uno más a la vez cada
  5 minutos, máximo 6 vivos.

## Dificultad

Multiplica la vida y el daño enemigos, el ritmo de aparición, el intervalo de jefes en modo infinito y los
créditos ganados. Ver la [tabla](10-datos-del-juego.md#dificultades).

## Fin de partida y recompensas

- Créditos: `floor((bajas·0,4 + segundos/8 + nivel·6 + jefes·40 + (350 si mató al jefe final)) × créditos de dificultad)`.
- Cuenta como **victoria** si se derrotó al Cabecilla del Protocolo antes de morir.
- Se actualizan estadísticas, récords por mapa y logros (los logros se calculan a partir de las estadísticas).
- Las misiones se cobran a mano en Estadísticas.
- En solitario se puede publicar la marca en el ranking (sola con cuenta, con nombre como invitado). Las
  partidas en pareja **no** cuentan para el ranking.

## Progresión fuera de la partida

- **Créditos (◈)**: se ganan jugando y cobrando misiones.
- **Agentes**: Jett, Phoenix y Sage gratis; el resto se desbloquean con créditos.
- **Mejoras permanentes**: daño, vida, velocidad y experiencia, 10 niveles cada una (ver coste en [10](10-datos-del-juego.md#mejoras-permanentes)).
- **Mercado nocturno**: ver [07](07-mercado-nocturno.md).
