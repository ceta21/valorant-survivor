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
**GitHub Pages**
1. Sube el proyecto a un repositorio de GitHub (rama `main`).
2. En *Settings → Pages* elige **Source: GitHub Actions**.
3. Cada push despliega con `.github/workflows/deploy.yml`. Tu URL: `https://TU_USUARIO.github.io/NOMBRE_REPO/`.

**Vercel**
1. Importa el repositorio en vercel.com (detecta Vite solo; `vercel.json` ya está incluido), o ejecuta `npx vercel`.

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
