# 04 · Base de datos (Supabase)

Proyecto Supabase: `vfmagtrfcnlxbgpwrjbr` (`https://vfmagtrfcnlxbgpwrjbr.supabase.co`).
El juego se conecta con la clave **publishable** (pública por diseño), definida en `.env.production`
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). La seguridad depende de las reglas (RLS) de abajo, no de
ocultar la clave. **Nunca** se debe poner en el proyecto la clave `service_role` / `sb_secret_…`.

Cliente: `src/utils/supabase.ts` (único `createClient`, sesión guardada en `localStorage` con la clave
`valorant-survivors-auth`). Si no hay variables de entorno, el juego funciona sin backend: solo invitado y
ranking local.

## Ficheros SQL (se ejecutan a mano en *SQL Editor*, en este orden)

| Fichero | Qué crea / cambia | ¿Se puede repetir? |
|---|---|---|
| `supabase/schema.sql` | Tabla `scores` (ranking) y sus políticas | Sí |
| `supabase/accounts.sql` | Tabla `profiles`, trigger de registro, función `username_available`, columnas `user_id`/`player_id` en `scores` y trigger que rellena el nombre | Sí |
| `supabase/market.sql` | Permitía en el ranking los héroes exclusivos (`eclipse`, `vortice`, `quimera`, ya retirados; sus marcas siguen siendo válidas) | Sí |
| `supabase/agents.sql` | (Antiguo) permitía los 14 agentes de la versión 1.13 | Sí |
| `supabase/heroes.sql` | Permite en el ranking los 20 héroes originales y las zonas (`reino`, `glaciar`, `infierno`, `ciudad`); mantiene los ids antiguos | Pendiente |
| `supabase/ranking-seguro.sql` | Ranking a prueba de trampas: rechaza marcas imposibles (mínimo 5 s; bajas ≤ 20·tiempo + 100; nivel ≤ 10 + tiempo/5; jefes ≤ 1 + tiempo/20) y envíos demasiado seguidos (la marca anterior del mismo jugador debe ser de hace más de máx(20 s, 0,8 × tiempo de la partida)). El juego muestra un aviso claro si el servidor la rechaza | Sí |
| `supabase/seguridad.sql` | **Generado** (`npm run sql:seguridad`, no editar a mano). El servidor rechaza guardados con progreso imposible (ver [Seguridad del progreso](#seguridad-del-progreso)). Volver a generarlo y ejecutarlo cada vez que cambien precios de héroes, tienda, mascotas o mejoras | Sí |
| `supabase/admin.sql` | Columna `is_admin` y convierte una cuenta en administrador con todo desbloqueado (cambiar `TU_USUARIO`) | Sí |

Configuración de Auth necesaria: **Authentication → Sign In / Providers → "Confirm email" desactivado**
(el juego no usa correos reales) y "Allow new users to sign up" activado.

## Tabla `public.scores` (ranking)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | bigint identity | clave primaria |
| `created_at` | timestamptz | `now()` |
| `name` | text | 1–16 caracteres |
| `agent` | text | uno de los 20 héroes, los ids de los agentes antiguos (marcas ya publicadas) y `eclipse`, `vortice`, `quimera` |
| `difficulty` | text | `facil`, `normal`, `dificil`, `pesadilla` |
| `map` | text | zona de inicio: `reino`, `glaciar`, `infierno`, `ciudad` (y los mapas antiguos `ascent`, `bind`, `haven`) |
| `time` | real | 0 – 86400 s |
| `kills` | integer | ≥ 0 |
| `level` | integer | 1 – 999 |
| `boss_kills` | integer | ≥ 0 |
| `user_id` | uuid → `auth.users` | `auth.uid()` por defecto; null para invitados |
| `player_id` | bigint | ID de jugador de la cuenta (lo pone el trigger) |

Índices: `time desc` y `(agent, difficulty, time desc)`.

Permisos (RLS activado):

- **Leer**: cualquiera (`anon`, `authenticated`).
- **Insertar**: cualquiera, con `user_id` nulo o igual a `auth.uid()`.
- **Editar / borrar**: nadie desde la web.

Trigger `scores_fill_player` (antes de insertar):

- Con sesión: fuerza `user_id = auth.uid()` y copia `name` y `player_id` del perfil (no se puede falsear el nombre).
- Sin sesión: `player_id = null`, y rechaza el nombre si pertenece a una cuenta registrada.

Lectura en el juego (`src/utils/leaderboard.ts`): pide las 500 mejores marcas con los filtros y se queda con la
**mejor de cada jugador** (por cuenta, o por nombre si es invitado), hasta 50.

## Seguridad del progreso

El progreso (`profiles.save`) lo envía el navegador, así que sin control cualquiera podría guardarse créditos o
desbloqueos desde la consola. `seguridad.sql` añade el trigger `profiles_check_save` (antes de cada cambio de `save`):

- **Valor del progreso** (`save_value`): créditos + lo que costó lo que tiene (héroes, estilos, mascotas y precios
  antiguos, coste acumulado de las mejoras permanentes y de los poderes de mascota, y el equipo: `120·(rareza+1)` más
  las mejoras pagadas). Comprar con créditos no cambia el valor; ganar créditos o recibir cosas lo sube.
- **Hucha** por cuenta (`credit_budget`, `budget_at`): se rellena a 6 créditos/s hasta 30.000; lo que sube el valor se
  descuenta. Si sube más de lo que hay en la hucha, se rechaza. Cubre de sobra lo que se gana jugando (incluidos logros,
  rachas y el premio de 25.000 del año), pero no deja crear créditos de la nada ni desbloquear sin pagar.
- **Récords**: el mejor tiempo no puede superar el tiempo pasado desde el guardado anterior + 2 min, ni las bajas
  sumar más de 40 por segundo.
- Créditos negativos o absurdos (> 50 millones), rechazados. Las cuentas con `is_admin` no se comprueban.
- **Rechazo**: el trigger devuelve `null` (el guardado no se aplica) y lo apunta en `public.save_rejections` (fecha,
  cuenta, motivo, créditos antes/después, subida y hucha; sin acceso desde la web: se mira en el *Table Editor*). El
  juego guarda con `.select('id')`: si vuelven 0 filas, avisa «Progreso no válido» y recarga el progreso del servidor
  (`onSaveRejected` en `account.ts`).
- Las columnas nuevas no se pueden modificar desde la web (solo `save` y `updated_at`).
- Prueba: `npm run test:security` ejecuta el SQL en un PostgreSQL en memoria (PGlite) con guardados normales y tramposos.

Límites: el juego corre en el navegador, así que se puede mirar el código y trucar la partida en curso (por ejemplo,
la vida); lo que se controla es lo que se guarda. El ranking tiene sus propias comprobaciones (`ranking-seguro.sql`).

## Tabla `public.profiles` (cuentas y progreso)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | uuid | = `auth.users.id`, se borra en cascada |
| `username` | text | `^[A-Za-z0-9_]{3,16}$`, único sin distinguir mayúsculas |
| `player_id` | bigint identity | empieza en 10000, único (el "ID de jugador") |
| `save` | jsonb | todo el progreso del jugador (ver [05](05-cuentas-y-progreso.md#qué-se-guarda)) |
| `is_admin` | boolean | lo pone `admin.sql` |
| `created_at`, `updated_at` | timestamptz | |

Permisos:

- Cada usuario solo puede **leer su propio perfil**.
- Desde la web solo se pueden **modificar `save` y `updated_at`** de la propia fila (nombre, ID y admin no).

Trigger `on_auth_user_created` (en `auth.users`, tras insertar): crea el perfil con el `username` de los metadatos
del registro.

Función `username_available(name)` (security definer, accesible sin sesión): `true` si el nombre está libre.

## Supabase Realtime (cooperativo)

No usa tablas. Cada sala es un canal `vs-coop-<CÓDIGO>` con:

- **presence**: quién está en la sala (`{ name, role }`).
- **broadcast** `sig`: señalización WebRTC (oferta, respuesta, candidatos ICE).
- **broadcast** `m`: mensajes del juego cuando no hay conexión directa (modo "por servidor").

Ver [06 · Cooperativo](06-cooperativo.md).

## Límites del plan gratuito a tener en cuenta

- Pausa del proyecto tras **7 días sin uso** (reactivar con *Restore project*).
- 500 MB de base de datos; Realtime con límites de mensajes y conexiones simultáneas (suficiente para un
  juego entre amigos; el cooperativo usa P2P para no gastar mensajes).

## Estadísticas de uso (`events`, `supabase/estadisticas.sql`)

Eventos anónimos que manda el juego (`src/utils/analytics.ts`) para saber dónde se atascan o abandonan los jugadores.
Sin datos personales: cada visita lleva un identificador al azar que solo vive en memoria mientras la página está
abierta (no se guarda en el navegador), sin cuenta, nombre ni IP. Se desactiva en Configuración
(`settings.analytics`).

| Columna | Contenido |
|---|---|
| `session` | Identificador al azar de la visita |
| `kind` | `open` (abre el juego), `tutorial` (salta un consejo o lo acaba), `run_start`, `run_end` |
| `data` | `open`: dispositivo (`pc`/`tablet`/`movil`), idioma, si es nuevo (0 partidas) y si tiene cuenta. `tutorial`: consejo (`move`, `power`, `gems`, `abilities`, `crates` o `fin`) y si se saltó. Partidas: héroe, zona, dificultad, pareja, evento, si es nuevo y, al acabar, segundos, nivel, bajas, jefes, victoria y si se abandonó (`quit`) |

- Permisos: cualquiera puede **insertar**; nadie puede leer, cambiar ni borrar desde la web (RLS y sin `select`).
  Máximo 60 eventos por visita y minuto (trigger `events_rate_limit`).
- Se miran desde el SQL Editor con las vistas del esquema `stats` (la web no puede leerlo): `resumen_diario`,
  `tutorial`, `duracion` (por minuto, nuevos y abandonadas), `heroes`, `zonas`, `dispositivos`.
- El SQL trae comentada una línea para borrar los eventos de más de 6 meses.
- Solo envía quien simula la partida (en solitario o el anfitrión en pareja). Los envíos se agrupan cada 3 s y al
  ocultar la página; si fallan, se ignoran.
