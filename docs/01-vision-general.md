# 01 · Visión general

## Qué es

ENDLESS RIFT (antes VALORANT SURVIVORS) es un juego web de supervivencia por oleadas (género "survivors", como Vampire
Survivors). El jugador elige un héroe, se mueve por un mundo de 4 zonas y su
poder se lanza solo, sin parar (no hay armas); las habilidades se lanzan con teclas. Gana experiencia, sube de nivel, elige
mejoras y aguanta todo lo posible: la partida solo acaba al morir. Todo el arte (personajes, robots,
mapas, efectos) y el audio son **originales y generados por código**; no hay imágenes ni sonidos
externos.

Modos y funciones principales:

- **Solitario** con 4 dificultades y modo infinito tras el jefe final.
- **Cooperativo para 2 jugadores** con código de sala.
- **Cuentas** (usuario + contraseña, ID de jugador) o **modo invitado**.
- **Ranking global** filtrable por agente y dificultad.
- **Mercado nocturno** diario con los agentes exclusivos.
- Mejoras permanentes, misiones, logros, estadísticas, novedades.
- **Español e inglés**, controles reasignables, adaptado a móvil y escritorio.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Interfaz | React 19 + TypeScript |
| Compilación | Vite 8 (`npm run build` = comprobación de tipos + build) |
| Juego | HTML5 Canvas 2D, dibujado a baja resolución y ampliado sin suavizado (pixel art) |
| Audio | WebAudio sintetizado (`src/utils/audio.ts`) |
| Backend | Supabase: Postgres + Auth + Realtime (`@supabase/supabase-js` 2.117.3) |
| Cooperativo | WebRTC DataChannels (P2P) con señalización por Supabase Realtime |
| Publicación | Vercel (cada push a `main` se publica solo) |
| Pruebas | Scripts con `tsx` y `@napi-rs/canvas` (capturas sin navegador) |

## Estructura de carpetas

```
valorant-survivors/
├─ index.html              fuentes de Google (Press Start 2P, Pixelify Sans) y raíz de React
├─ src/
│  ├─ main.tsx, App.tsx    arranque y navegación entre pantallas, estado global (guardado, cuenta, preferencias)
│  ├─ components/          pantallas y piezas de interfaz (menú, agentes, partida, HUD, mercado, sala…)
│  ├─ game/                motor y render: GameEngine, Renderer, World, MapArt, sprites, vfx, netSync, Input…
│  ├─ data/                datos del juego: agentes, poderes, enemigos, mejoras, mapas, dificultad, mercado, novedades
│  ├─ net/coopLink.ts      conexión del cooperativo (sala + WebRTC)
│  ├─ utils/               supabase, cuentas, ranking, guardado/preferencias, audio
│  ├─ i18n/                idiomas: t() y diccionario inglés (en.ts)
│  └─ styles/index.css     todo el estilo (pixel art, responsive)
├─ supabase/               SQL para crear/actualizar la base de datos (se ejecutan a mano)
├─ scripts/                pruebas y utilidades (simulaciones, capturas, comprobación de traducciones, docs)
├─ docs/                   esta documentación
├─ .env.production         URL y clave pública de Supabase (públicas por diseño)
└─ vercel.json             configuración de Vercel (framework vite, salida dist)
```

## Dónde está publicado

- **Web**: https://endless-rift.vercel.app/ (Vercel, plan gratuito). Cada push a `main`
  despliega una versión nueva en ~1 minuto.
- **Base de datos**: proyecto Supabase `vfmagtrfcnlxbgpwrjbr`. El plan gratuito **pausa el
  proyecto tras 7 días sin uso**; se reactiva desde el panel con *Restore project*.
- **Repositorio**: privado en GitHub (`ceta21/valorant-survivor`). GitHub Pages está desactivado
  (no funciona con repos privados en el plan gratuito); el workflow solo se lanza a mano.

## Historia del proyecto (resumen)

La lista completa de versiones está en [Novedades](10-datos-del-juego.md#historial-de-versiones-novedades)
(`src/data/news.ts`). Orden en que se construyó:

1. Juego base (agentes, armas, enemigos, mapas infinitos).
2. Estilo pixel art 2D en todo el juego.
3. Dificultades, modo infinito y ranking global.
4. Efectos de habilidades en pixel art.
5. Cuentas de jugador y guardado en la nube.
6. Mercado nocturno.
7. Novedades, cuenta de administrador.
8. Cooperativo para 2 jugadores.
9. Panel del menú, robots enemigos, Artillero, sección Apoyo, adaptación a pantallas.
10. Idiomas y controles; torretas de Killjoy destruibles.
11. Diario, Tienda, Mascotas, minimapa y 20 héroes originales que sustituyen a los agentes de VALORANT.
12. Mundo nuevo de 4 zonas (Reino, Glaciar, Infierno, Ciudad) con portales y mapa grande.
13. Poderes en lugar de armas y nuevo nombre: **ENDLESS RIFT**, grietas infinitas de las que emergen hordas de
    enemigos (logo pixelado en `Logo.tsx`; las claves de guardado y el dominio de las cuentas siguen siendo los
    antiguos para no perder partidas ni sesiones).
