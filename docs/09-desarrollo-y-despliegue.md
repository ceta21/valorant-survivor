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
| `npm run test:turrets` | Torretas de Killjoy: cuántas salen y si los robots las destruyen |
| `npm run test:i18n` | Que todos los textos tengan traducción al inglés |
| `npm run test:shot` | Capturas de partidas en los 3 mapas |
| `npm run test:abilities` | Hoja con cada agente usando cada habilidad (`shots/abilities.png`) |
| `npm run test:enemies` | Hoja con todos los robots (`shots/enemies.png`) |
| `npm run test:world` | Generación del mundo infinito |
| `npx tsx scripts/ui-smoke.tsx` | Renderiza cada pantalla de React en Node para detectar errores |

## Publicar

1. Commit y push a `main` (Gabriel confirma antes de cada subida).
2. Vercel publica solo en ~1 minuto en https://valorant-survivor.vercel.app/.
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

**Habilidad**: definirla con un `kind` existente (o añadir el caso en `perform()` del motor) y un `fx`
(estilo visual en `abilityFx()` del motor y en `Renderer`/`vfx.ts`).

**Arma**: añadirla en `src/data/weapons.ts` y su silueta en `PARTS` de `src/game/weaponSprites.ts` (o
`sprite` + `skin` si es exclusiva).

**Enemigo**: añadirlo **al final** de `ENEMIES` en `src/data/enemies.ts` (el cooperativo usa el orden), a
`SPAWNABLE` si aparece solo, su lógica si tiene un comportamiento nuevo, su sprite en `src/game/enemySprites.ts`
y su nombre en `en.ts`.

**Texto de interfaz**: escribirlo con `t('…')` y añadir la traducción en `en.ts` (`npm run test:i18n`).

**Campo del guardado**: añadirlo a `SaveData`, `defaultSave()` y `normalizeSave()`.

**Novedad**: añadir una entrada **al principio** de `src/data/news.ts` (versión siguiente) y traducir sus textos.

## Mantener esta documentación

Esta carpeta es la memoria del proyecto. **Cada cambio del juego debe actualizarla**:

1. Cambios de reglas, fórmulas o funcionamiento → editar el documento del tema (02–08).
2. Cambios de datos (agentes, armas, enemigos, mejoras, precios, novedades…) → `npm run docs:data`.
3. Cambios de base de datos → `04-base-de-datos.md` y el SQL correspondiente en `supabase/`.
4. Nuevos comandos o pruebas → este documento.
5. Añadir la novedad en `src/data/news.ts` (aparece también en la tabla de versiones de `10-datos-del-juego.md`).

### Lista de comprobación antes de subir

- [ ] `npm run build` sin errores
- [ ] `npm run test:sim`, `npm run test:coop` y `npm run test:i18n` pasan
- [ ] Probado en el navegador lo que cambia
- [ ] Novedad añadida y traducida
- [ ] `docs/` actualizado y `npm run docs:data` ejecutado
- [ ] SQL nuevo ejecutado en Supabase (si lo hay)
