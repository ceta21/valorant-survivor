# 07 · Mercado de la Grieta

Código: `src/data/market.ts` (rotación y precios), `src/components/MarketScreen.tsx` (pantalla),
`src/data/shop.ts` (estilos de héroe y mascotas que se ofrecen).

## Rotación

- Cada jugador ve **4 cartas boca abajo** que se descubren con un clic (animación de giro). Las descubiertas se
  guardan en `save.market` para la rotación actual.
- **Nueva rotación cada 24 h** (a medianoche UTC; periodo = `floor(ahora / 24 h)`).
- Las ofertas se calculan con un generador aleatorio con semilla `id de cuenta + periodo`: **recargar no cambia
  la tienda**. Los invitados usan una semilla por visita.
- Cada día salen **2 estilos de héroe y 2 mascotas** distintos de la Tienda, en orden al azar.

## Precios y compra

- Precio base = el de la Tienda; cada carta tiene un **descuento aleatorio del 15 % al 40 %** y el precio final se
  redondea a múltiplos de 50.
- Comprar pide confirmación y descuenta los créditos. Lo comprado va a `save.shop.owned`, igual que si se hubiera
  comprado en la Tienda: el estilo se pone en la ficha de cada héroe y la mascota en **Mascotas** (el botón de la carta
  lleva allí). Si ya lo tienes, la carta lo indica.

## Historia

- Antes se vendían armas exclusivas y los héroes exclusivos Eclipse, Vórtice y Quimera (con habilidades a elegir).
  Ya no existen: a quien los compró se le devuelve su precio base al cargar la partida (`LEGACY_PRICES`).
