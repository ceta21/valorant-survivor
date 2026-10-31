# 09 · Desarrollo y despliegue

## Comandos

```bash
npm install
npm run dev          # servidor local en http://localhost:5173 (usa .env.local si existe)
npm run build        # comprueba tipos (tsc) y genera dist/
npm run preview      # sirve dist/
npm run docs:data    # regenera docs/10-datos-del-juego.md a partir del código
```

Para usar el ranking/cuentas reales en local, copia `.env.production` como `.env.local`.

## Pruebas

Scripts en `scripts/` (se ejecutan con `npx tsx`, sin navegador; las capturas van a `shots/`, que no se sube):

| Comando | Qué comprueba |
|---|---|
| `npm run test:sim` | Simula partidas de todos los agentes en solitario |
| `npm run test:coop` | Motor con 2 jugadores: caídas, vuelta en la oleada, mejoras, abandono, mismo mundo con la misma semilla |
| `npm run test:turrets` | Torretas de Tink: cuántas salen y si los robots las destruyen |
| `npm run test:daily` | Diario: racha de conexión, misiones del día y su progreso |
| `npm run test:pets` | Mascotas: te siguen, caen, vuelven al minuto y atacan con su poder (captura en `shots/pets.png`) |
| `npm run test:i18n` | Que todos los textos tengan traducción al inglés |
| `npm run test:shot` | Capturas de partidas en los 3 mapas |
| `npm run test:abilities` | Hoja con cada agente usando cada habilidad (`shots/abilities.png`) |
| `npm run test:enemies` | Hoja con todos los robots (`shots/enemies.png`) |
| `npm run test:world` | Mundo: zonas y abismos, determinismo, terreno de cada zona y castillos, que el agua frene y la lava queme, que todo el suelo esté conectado y que cada portal lleve a su pareja |
| `npx tsx scripts/maps-overview.ts` | Capturas del monumento principal de cada zona en `shots/overview_<zona>.png` |
| `npx tsx scripts/ui-smoke.tsx` | Renderiza cada pantalla de React en Node para detectar errores |

## Publicar

1. Commit y push a `main` (Gabriel confirma antes de cada subida).
2. Vercel publica solo en ~1 minuto en https://endless-rift.vercel.app/.
3. Comprobar que la versión publicada incluye el cambio (por ejemplo, buscando un texto nuevo en el JS servido).
4. Si un cambio necesita SQL nuevo, **ejecutarlo en Supabase antes de subir** el código que lo usa.

Notas:

- El repo es privado y GitHub Pages está desactivado (workflow solo manual).
- En Vercel (plan Hobby) los commits deben ser de un autor que GitHub asocie a la cuenta dueña del proyecto; si
  no, el despliegue sale "Blocked".
- En cooperativo, los dos jugadores deben tener la misma versión (recargar con Ctrl+F5 tras publicar).

## Cómo añadir contenido

**Agente**: añadirlo en `src/data/agents.ts` (estadísticas, rasgo, 2–3 habilidades con su `fx`), su aspecto en
`LOOKS` de `src/game/sprites.ts`, añadir su id al `check` de `scores.agent` (SQL nuevo) y traducir sus textos en
`en.ts`.

**Aspecto de un agente a partir de su hoja de sprites**:
1. Guardar la imagen en `art/<id>.png` (fondo liso). Si varios personajes salen de la misma hoja (como
   `art/heroes.png`), poner `"src": "heroes"` en su entrada de `art/frames.json`.
2. `npx tsx scripts/cut-agent.ts <id> --find` lista dónde está cada fotograma.
3. Apuntar en `art/frames.json` el centro de los fotogramas elegidos: `front`, `back` y `side` (de lado
   mirando a la **derecha**). Opcional: `tol` (tolerancia del fondo si tiene textura, p. ej. 30) y `erase`
   (rectángulos por fotograma para quitar un arma dibujada: `"c"` la borra y reperfila, `"f"`/`"F"` rellena
   con la ropa de alrededor), `cell` ([medio ancho, medio alto] de la celda de cada dibujo, por defecto [24, 31];
   los héroes usan [44, 66]). `npx tsx scripts/agent-grid.ts <id> <fila> salida.png` ayuda a situarlos.
4. `npx tsx scripts/cut-agent.ts <id>` genera `public/agents/<id>.png` y `src/data/agentImages/`. Informa de
   los píxeles de dibujo perdidos (debe ser 0).

**Habilidad**: definirla con un `kind` existente (o añadir el caso en `perform()` del motor) y un `fx`
(estilo visual en `abilityFx()` del motor y en `Renderer`/`vfx.ts`).

**Poder**: añadirlo en `POWERS` de `src/data/powers.ts` (con su `look`; uno nuevo necesita su sprite en `vfx.ts`
y su entrada en `LOOK` del Renderer y en `LOOKS` de `netSync.ts`) y, si es el inicial de algún héroe, en
`HERO_POWER`.

**Enemigo**: añadirlo **al final** de `ENEMIES` en `src/data/enemies.ts` (el cooperativo usa el orden), a
`SPAWNABLE` si aparece solo, su lógica si tiene un comportamiento nuevo, su sprite en `src/game/enemySprites.ts`
y su nombre en `en.ts`.

**Texto de interfaz**: escribirlo con `t('…')` y añadir la traducción en `en.ts` (`npm run test:i18n`).

**Campo del guardado**: añadirlo a `SaveData`, `defaultSave()` y `normalizeSave()`.

**Novedad**: añadir una entrada **al principio** de `src/data/news.ts` (versión siguiente) y traducir sus textos.

## Mantener esta documentación

Esta carpeta es la memoria del proyecto. **Cada cambio del juego debe actualizarla**:

1. Cambios de reglas, fórmulas o funcionamiento → editar el documento del tema (02–08).
2. Cambios de datos (agentes, poderes, enemigos, mejoras, precios, novedades…) → `npm run docs:data`.
3. Cambios de base de datos → `04-base-de-datos.md` y el SQL correspondiente en `supabase/`.
4. Nuevos comandos o pruebas → este documento.
5. Añadir la novedad en `src/data/news.ts` (aparece también en la tabla de versiones de `10-datos-del-juego.md`).

### Lista de comprobación antes de subir

- [ ] `npm run build` sin errores
- [ ] `npm run test:sim`, `npm run test:coop`, `npm run test:i18n`, `npm run test:daily` y `npm run test:pets` pasan
- [ ] Probado en el navegador lo que cambia
- [ ] Novedad añadida y traducida
- [ ] `docs/` actualizado y `npm run docs:data` ejecutado
- [ ] SQL nuevo ejecutado en Supabase (si lo hay)
