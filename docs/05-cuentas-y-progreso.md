# 05 · Cuentas y progreso

Código: `src/utils/account.ts`, `src/utils/storage.ts`, `src/components/AuthScreen.tsx`, `src/App.tsx`.

## Acceso

Al abrir el juego:

1. Si hay una sesión guardada en el navegador, se entra directamente con esa cuenta.
2. Si no, sale la pantalla de acceso con tres opciones: **Iniciar sesión**, **Registrarse** y **Jugar como invitado**.

### Registro

- Pide nombre de usuario (3–16 letras, números o `_`), contraseña (mín. 6) y repetirla.
- Internamente se usa Supabase Auth con un **correo derivado del nombre**:
  `<usuario en minúsculas>@players.valorant-survivor.vercel.app` (no se envían correos; "Confirm email" está
  desactivado).
- Antes de registrar se comprueba con `username_available`. El trigger crea el perfil y asigna un
  **ID de jugador** automático (`#10000`, `#10001`…).
- Si se viene de jugar como invitado, ese progreso pasa a la cuenta nueva.

### Invitado

- Puede jugar a todo, pero **su progreso solo vive mientras la página está abierta**.
- Al registrarse más tarde, su progreso de la sesión se guarda en la cuenta.
- (Compatibilidad: si existe el guardado antiguo de antes de las cuentas, `valorant-survivors-save-v1`, se usa
  como punto de partida del invitado y se borra al crear una cuenta.)

### Cerrar sesión

Envía lo pendiente, cierra la sesión de Supabase y vuelve a la pantalla de acceso con un progreso vacío.

## Qué se guarda

Todo el progreso es un objeto `SaveData` (`src/utils/storage.ts`) que, con cuenta, se guarda en
`profiles.save`:

| Campo | Contenido |
|---|---|
| `credits` | Créditos ◈ |
| `unlocked` | Agentes base desbloqueados |
| `meta` | Niveles de mejoras permanentes (`dmg`, `hp`, `speed`, `xp`) |
| `stats` | Partidas, victorias, bajas, jefes, daño, tiempo total, mejores marcas |
| `records` | Mejor tiempo / nivel / victorias por mapa |
| `claimed`, `achievements` | Misiones cobradas y logros conseguidos |
| `settings` | Volumen de música y efectos, silencios, sacudida de pantalla, pausa automática |
| `lastAgent`, `lastMap`, `lastDifficulty` | Última selección |
| `playerName` | Nombre usado como invitado en el ranking |
| `exclusives` | Armas y agentes exclusivos comprados |
| `kits` | Habilidades elegidas para cada agente exclusivo |
| `loadout` | Arma inicial |
| `market` | Rotación del mercado y cartas ya descubiertas |
| `newsSeen` | Última versión de Novedades vista (para la etiqueta "Nuevo") |

- `normalizeSave()` completa cualquier guardado con los valores por defecto, así que añadir campos nuevos no
  rompe las cuentas existentes (añadir el campo en `SaveData`, `defaultSave()` y, si es un objeto/lista,
  validarlo en `normalizeSave()`).
- Guardado en la nube: cada cambio llama a `saveProgress()`, que agrupa cambios seguidos y envía como mucho
  cada 1,5 s; al ocultar la pestaña se envía lo pendiente (`flushProgress()`).
- El progreso se guarda desde el navegador, así que un jugador avanzado podría modificar el suyo. Es aceptable
  para un juego entre amigos; el ranking sí está protegido (nombre e ID los pone el servidor).

## Preferencias del dispositivo

No dependen de la cuenta; se guardan en `localStorage` (`valorant-survivors-prefs-v1`):

- `lang`: `es` o `en` (por defecto, inglés si el navegador está en inglés; si no, español).
- `keys`: teclas de cada acción (ver [08](08-interfaz.md#controles)).

## Claves de `localStorage` que usa el juego

| Clave | Para qué |
|---|---|
| `valorant-survivors-auth` | Sesión de Supabase |
| `valorant-survivors-prefs-v1` | Idioma y teclas |
| `valorant-survivors-scores-v1` | Ranking local (solo si no hay Supabase) |
| `valorant-survivors-save-v1` | Guardado antiguo (solo lectura, migración) |

## Cuenta de administrador

`supabase/admin.sql` convierte una cuenta ya registrada en administradora: `is_admin = true`,
◈ 9.999.999, todos los agentes, todo el mercado (con kits por defecto), mejoras al máximo y todos los logros.
Respeta ajustes y estadísticas. En el menú se muestra la etiqueta **ADMIN**. No da permisos especiales dentro
del juego. Ejecutarlo con el juego cerrado para que una pestaña abierta no sobrescriba el progreso.
