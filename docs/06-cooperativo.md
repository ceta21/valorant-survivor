# 06 · Modo cooperativo

Partida para **2 jugadores** contra las mismas oleadas. Código: `src/net/coopLink.ts` (conexión),
`src/game/netSync.ts` (sincronización), `src/components/CoopScreen.tsx` (sala) y `src/components/GameScreen.tsx`.

## Sala

1. Un jugador pulsa **Crear sala** → se genera un código de 4 caracteres (sin letras confusas como O/0, I/1)
   y se comprueba que no esté en uso.
2. El otro pulsa **Unirse** y escribe el código. Si no hay anfitrión → "No existe ninguna sala con ese código";
   si ya hay invitado → "Esa sala ya está llena".
3. Cada uno elige agente (de los que tiene, incluidos exclusivos y su kit). El **anfitrión** elige mapa y
   dificultad. El invitado pulsa "Estoy listo" y el anfitrión "Empezar partida".
4. El anfitrión envía `start` con: mapa, dificultad, **semilla del mundo** y la configuración de cada jugador
   (agente, kit, mejoras permanentes, nombre).

Arriba a la derecha se ve el estado: **Conexión directa** (P2P), **Conexión por servidor** (respaldo) o
"Conectando…".

## Conexión

- **Sala y señalización** por Supabase Realtime (canal `vs-coop-<CÓDIGO>`, ver [04](04-base-de-datos.md#supabase-realtime-cooperativo)).
- **Partida por WebRTC** (STUN de Google): dos DataChannels:
  - `rel` (ordenado y fiable): órdenes, elecciones de mejora, fin de partida.
  - `fast` (sin reintentos): fotos del estado y movimiento.
- Si en 8 s no hay conexión directa, o se cae, los mensajes van **por Supabase** (modo "por servidor") con menos
  fotos por segundo (6 en lugar de 15).

## Quién simula

- El **anfitrión** ejecuta el motor completo con los 2 jugadores.
- El **invitado no simula**: recibe "fotos" del estado (`makeSnapshot` / `applySnapshot`) unas 15 veces por
  segundo (3–5 KB cada una) y entre fotos suaviza el movimiento de enemigos, gemas y del compañero, mueve los
  proyectiles en línea recta y **predice su propio movimiento** para que responda al instante (si se separa
  más de 90 unidades de lo que dice el anfitrión, se corrige de golpe; si no, poco a poco).
- La foto incluye: tiempo, nivel, XP, bajas, aviso grande (con su clave traducible), jugadores (posición, vida,
  buffs, recargas, poderes, torretas con su vida, mascota, mejoras pendientes), enemigos, proyectiles, gemas, golpes de
  área, obuses y efectos; más los eventos visuales sueltos (chispas, números de daño, ondas, sonidos).
- Mensajes del invitado al anfitrión: `in` (dirección de movimiento, ~20/s), `cast` (habilidad), `pick`
  (mejora elegida), `reroll`.
- Si la pestaña del anfitrión queda en segundo plano, un **Worker** mantiene el ritmo de la simulación para que
  la partida no se congele al compañero.

## Reglas de la partida en pareja

- **Experiencia compartida**; al subir de nivel **cada uno elige su mejora** y la partida espera a los dos
  ("Esperando a que tu compañero elija su mejora…").
- Los enemigos persiguen al jugador vivo más cercano. Cada uno ve su personaje centrado; el compañero lleva su
  nombre encima y una flecha en el borde si está fuera de pantalla. Su vida aparece bajo la tuya en el HUD.
- **Si un jugador cae**, queda como fantasma y **vuelve al empezar la siguiente oleada** junto a su compañero,
  con media vida y 2,5 s de invulnerabilidad. La partida termina cuando **caen los dos**.
- No hay pausa: el menú se abre pero la partida sigue.
- Si uno se va o pierde la conexión: el anfitrión sigue jugando solo (el que se fue no vuelve y no bloquea las
  mejoras); el invitado ve "Se perdió la conexión con el anfitrión" y recibe sus créditos.
- Los dos ganan créditos y se guarda su progreso. **No cuenta para el ranking.**

## Limitaciones conocidas

- Si el anfitrión tiene mala conexión, el invitado lo nota (más retraso).
- En redes muy cerradas la conexión directa puede fallar; entonces va por servidor (más retraso).
- Los textos que genera el motor del anfitrión (avisos) se traducen en cada pantalla gracias a su clave.
