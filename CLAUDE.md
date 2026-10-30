# Instrucciones del proyecto ENDLESS RIFT (antes VALORANT SURVIVORS)

## Documentación (obligatorio)

La carpeta `docs/` es la memoria del proyecto (índice en `docs/README.md`). **Cada cambio del juego debe ir
acompañado de su actualización en `docs/`**, en el mismo commit:

- Reglas, fórmulas, pantallas o funcionamiento → editar el documento del tema (`02`–`08`).
- Datos del juego (agentes, armas, enemigos, mejoras, precios, novedades…) → `npm run docs:data`
  (regenera `docs/10-datos-del-juego.md`; no editarlo a mano).
- Base de datos → `docs/04-base-de-datos.md` + el SQL en `supabase/` (Gabriel lo ejecuta a mano antes de subir).
- Comandos o pruebas nuevas → `docs/09-desarrollo-y-despliegue.md`.

## Otras reglas

- Cada novedad jugable lleva entrada al principio de `src/data/news.ts` y su traducción en `src/i18n/en.ts`
  (`npm run test:i18n`). Todo texto de interfaz pasa por `t('…')`.
- Enemigos nuevos al **final** de `ENEMIES` (el cooperativo usa el orden).
- Antes de subir: `npm run build`, `npm run test:sim`, `npm run test:coop`, `npm run test:i18n`.
- Confirmar con Gabriel antes de hacer commit/push a `main`; después comprobar que Vercel sirve la nueva versión.
- Responder en español.
