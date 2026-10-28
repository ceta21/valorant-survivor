# VALORANT SURVIVORS

Juego web de supervivencia por oleadas (estilo PokéSurvivor / Vampire Survivors) con temática VALORANT.
React + TypeScript + Vite + HTML5 Canvas. Todo el arte y el audio son originales y se generan por código (sin archivos externos).

## Ejecutar en local
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/ (comprueba tipos + compila)
npm run preview    # sirve dist/ para probar la build
```

## Controles
| Tecla | Acción |
|---|---|
| WASD / flechas | Moverse (8 direcciones) |
| Espacio | Habilidad especial |
| E | Habilidad secundaria (si el agente la tiene) |
| Q | Definitiva (se carga con bajas y tiempo) |
| Esc / P | Pausa |
| 1 / 2 / 3, R | Elegir mejora / relanzar |

Los disparos son automáticos. En móvil: arrastra con el dedo para moverte y toca las habilidades del HUD.

## Publicar en Internet
**Vercel (actual: funciona con el repositorio privado)**
1. Importa el repositorio en vercel.com (detecta Vite solo; `vercel.json` ya está incluido), o ejecuta `npx vercel`.
2. Cada push a `main` publica una versión nueva automáticamente.

**GitHub Pages (solo si el repositorio es público en el plan gratuito)**
1. En *Settings → Pages* elige **Source: GitHub Actions**.
2. Lanza el workflow a mano en *Actions → Deploy a GitHub Pages → Run workflow*
   (el despliegue automático en cada push está desactivado en `.github/workflows/deploy.yml`).

`vite.config.ts` usa `base: './'`, por lo que funciona tanto en subcarpeta (Pages) como en raíz (Vercel).

## Pruebas incluidas (sin navegador)
```bash
npm run typecheck
npm run test:sim     # un bot juega partidas completas con cada agente
npm run test:shot    # genera capturas PNG en shots/ con un canvas de Node
```

## Estructura
```
src/game/        GameEngine (lógica pura), Renderer (canvas), Input
src/data/        agents, weapons, enemies, upgrades, maps, meta, goals
src/components/  menús, selección, HUD, mejoras, pausa y resultados
src/utils/       audio (WebAudio sintetizado), storage (LocalStorage)
```

## Mapas infinitos (pixel-art)

Los tres mapas (Ascent, Bind, Haven) son **infinitos y procedurales**: el mundo se genera por chunks de 640×640 con semilla
determinista (`src/game/World.ts`) y se dibuja en estilo pixel-art (`src/game/MapArt.ts`). Hay calles, edificios, cajas, pilares,
barriles, plazas con fuente, sitios A/B/C y, en Bind, teletransportadores. Son diseños originales *inspirados* en VALORANT, sin assets oficiales.

Pruebas automáticas (sin navegador): `npx tsx scripts/world-test.ts`, `scripts/stuck-test.ts`, `scripts/infinite-test.ts`, `npm run test:sim`.

## Ranking global (Supabase)

El proyecto de Supabase está configurado en [`.env.production`](.env.production) (URL y clave
*publishable*, que son públicas por diseño). La seguridad la dan las reglas de
[`supabase/schema.sql`](supabase/schema.sql): cualquiera puede leer y añadir marcas válidas,
nadie puede editarlas ni borrarlas desde la web.

Sin esas variables (por ejemplo en `npm run dev` sin `.env.local`), el ranking funciona en modo
local (solo este navegador). Para usar el global también en desarrollo, copia `.env.production`
como `.env.local`.

Para usar otro proyecto de Supabase: créalo en [supabase.com](https://supabase.com), ejecuta
`supabase/schema.sql` en su **SQL Editor** y cambia los dos valores de `.env.production`.
