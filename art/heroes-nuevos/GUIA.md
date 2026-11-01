# Hojas nuevas de los héroes

Objetivo: sustituir los dibujos actuales (unos 120 px y una sola postura por vista) por hojas con **más detalle y
pasos de andar reales**. Se hace héroe a héroe; no hace falta tenerlos todos para empezar.

## Cómo generarlas

1. Abre tu herramienta de imágenes y **sube la referencia del héroe**: `referencias/<id>.png` (sus 3 vistas
   actuales). Así mantiene el diseño, los colores y el arma.
2. Pega el **texto común** de abajo, sustituyendo `{DESCRIPCIÓN}` por la línea del héroe de la tabla.
3. Pide formato **horizontal 3:2** (por ejemplo 1536×1024) o más grande si la herramienta lo permite.
4. Revisa el resultado (ver «Qué comprobar») y repite si hace falta.
5. Guárdala como `art/heroes-nuevos/<id>.png` y dímelo: la recorto, la ajusto y la meto en el juego.

Consejo: empieza por **un solo héroe** (por ejemplo Ember). Con esa primera hoja ajusto el recorte y luego el resto
va rápido.

## Texto común (en inglés: estas herramientas lo entienden mejor)

```
Pixel art character sprite sheet of the SAME character shown in the reference image: {DESCRIPCIÓN}.
Keep exactly the same design, outfit, colors, hair and weapon as the reference.

Layout: a grid of 3 rows and 5 columns, all cells the same size, evenly spaced.
- Row 1: front view (facing the viewer).
- Row 2: back view (seen from behind).
- Row 3: side view facing RIGHT.
- Column 1: idle standing pose. Columns 2 to 5: walking cycle in 4 frames
  (right foot forward, legs together, left foot forward, legs together).
The character is centered in every cell, the same size in every cell, with the feet on the same baseline.
Full body visible, nothing cut off.

Style: crisp 16-bit JRPG pixel art, high detail, clean dark 1px outline, vivid colors, character about
200 pixels tall in each cell.
Background: plain flat solid color #1A1424 everywhere. No ground, no shadows, no text, no labels,
no numbers, no borders, no grid lines, no frames, no extra characters or objects.
```

## Descripción de cada héroe

| Héroe | `{DESCRIPCIÓN}` |
|---|---|
| zephyr | Zephyr, a young arcane mage with a tall dark blue wizard hat, dark blue robes with gold trim and a staff with a glowing blue orb |
| lyra | Lyra, an elf archer with long white hair in a ponytail, green leather armor and a wooden bow |
| kael | Kael, a knight in heavy dark steel armor with golden horns on the helmet, a red cape and a sword |
| vex | Vex, a hooded shadow assassin in dark purple with a face mask and glowing purple daggers |
| sylvan | Sylvan, a forest druid with green hair, deer antlers, leaf clothes and a wooden staff with a green gem |
| ember | Ember, a fire sorceress with long flowing orange-red hair in a ponytail, dark red and gold armored dress, holding a fireball in one hand |
| brutus | Brutus, a savage berserker wearing a grey wolf pelt with the wolf head as a hood, fur, and a big axe |
| frost | Frost, an ice sorceress with long light blue hair, a light blue dress and a snowflake of ice magic in her hand |
| seraph | Seraph, a celestial cleric with blond hair, a golden halo, small white wings, white and gold robes and a golden staff |
| nox | Nox, a void sorcerer in a dark purple hooded cloak with glowing purple eyes and a floating dark orb |
| raven | Raven, a western gunslinger with a brown cowboy hat, red bandana, long brown coat and a revolver |
| talos | Talos, a stone golem guardian made of mossy rocks with glowing green eyes |
| morgan | Morgan, a necromancer with a white skull face, dark purple robes and a staff topped with a purple skull |
| volt | Volt, a thunder templar with spiky white hair, dark blue armor and crackling blue lightning around him |
| grim | Grim, a mountain barbarian with a big red beard and hair, fur shoulder pads and a large axe |
| aqua | Aqua, a tide priestess with long flowing blue hair, a blue dress and a golden trident |
| zahir | Zahir, a desert explorer in a sand-colored hooded cloak with a face scarf and a curved dagger |
| draco | Draco, a young red dragon standing upright, with wings, horns and a fiery breath |
| sora | Sora, an illusionist with long dark purple hair, a purple dress and a glowing violet magic orb |
| tink | Tink, a young engineer with goggles on her head, a blue jumpsuit, a big brass backpack with tanks and a small blue robot helper (the BACK view must show her from behind with the backpack, not the robot) |

## Qué comprobar antes de pasármela

- **3 filas × 5 columnas**, todas las casillas del mismo tamaño y sin texto, números ni rejilla dibujada.
- **Mismo personaje** que la referencia: colores, pelo, ropa y arma.
- La fila 2 es **de espaldas de verdad** (sin cara), y la fila 3 mira a la **derecha**.
- En las columnas 2 a 5 **las piernas cambian** (si las 4 son iguales, no sirve para andar).
- **Mismo tamaño y pies a la misma altura** en todas las casillas (si no, al andar «bota»).
- Fondo **liso** de un solo color (si sale con degradado o suelo, pídela otra vez).

No pasa nada si alguna casilla sale un poco mal: puedo descartar fotogramas sueltos y aprovechar el resto.
