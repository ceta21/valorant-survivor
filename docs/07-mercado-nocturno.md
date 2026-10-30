# 07 · Mercado nocturno

Código: `src/data/market.ts` (rotación y precios), `src/components/MarketScreen.tsx` (pantalla),
`src/data/agents.ts` (`EXCLUSIVE_AGENTS`, `withKit`).

## Rotación

- Cada jugador ve **3 cartas boca abajo** (una por agente exclusivo) que se descubren con un clic (animación de
  giro). Las descubiertas se guardan en `save.market` para la rotación actual.
- **Nueva rotación cada 24 h** (a medianoche UTC; periodo = `floor(ahora / 24 h)`).
- Las ofertas se calculan con un generador aleatorio con semilla `id de cuenta + periodo`: **recargar no cambia
  la tienda**. Los invitados usan una semilla por visita.
- Las cartas son los agentes exclusivos en orden al azar, cada uno con su descuento del día. (Antes también había
  armas exclusivas; ya no hay armas y las compradas se devolvieron en créditos.)

## Precios

- Precio base alto: agentes ◈ 38.000–45.000 (ver [10](10-datos-del-juego.md)).
- Cada carta tiene un **descuento aleatorio del 10 % al 35 %**; el precio final se redondea a múltiplos de 50.
- Una buena partida da unos ◈ 400–1.500 (más en dificultades altas): un agente cuesta ~30+ partidas.
- Comprar pide confirmación y descuenta los créditos. Lo comprado se marca "En tu colección".

## Agentes exclusivos

- Eclipse, Vórtice y Quimera: personajes originales con sprite, estadísticas y rasgo propios.
- **El jugador elige sus 3 habilidades** entre las de todos los agentes: Espacio y E entre las especiales y
  secundarias, Q entre las definitivas (selectores en la pantalla de agentes). Se guardan en `save.kits`.
- `withKit(agente, kit)` construye el agente con esas habilidades al empezar la partida (también en cooperativo).
- Aparecen en la selección de agentes con ★ solo si se han comprado.
- El ranking los acepta gracias a `supabase/market.sql`.
