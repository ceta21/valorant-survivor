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
| `supabase/market.sql` | Permite en el ranking los agentes exclusivos (`eclipse`, `vortice`, `quimera`) | Sí |
| `supabase/agents.sql` | Permite en el ranking los 14 agentes nuevos (Viper… Tejo) | Pendiente |
| `supabase/admin.sql` | Columna `is_admin` y convierte una cuenta en administrador con todo desbloqueado (cambiar `TU_USUARIO`) | Sí |

Configuración de Auth necesaria: **Authentication → Sign In / Providers → "Confirm email" desactivado**
(el juego no usa correos reales) y "Allow new users to sign up" activado.

## Tabla `public.scores` (ranking)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | bigint identity | clave primaria |
| `created_at` | timestamptz | `now()` |
| `name` | text | 1–16 caracteres |
| `agent` | text | uno de los 24 agentes + `eclipse`, `vortice`, `quimera` |
| `difficulty` | text | `facil`, `normal`, `dificil`, `pesadilla` |
| `map` | text | `ascent`, `bind`, `haven` |
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
