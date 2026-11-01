-- Estadísticas de uso ANÓNIMAS: qué pasa en las partidas para saber dónde se atascan o abandonan los jugadores.
-- No se guarda ningún dato personal: ni cuenta, ni nombre, ni IP. Cada visita lleva un identificador al azar que
-- solo vive mientras la página está abierta (no se guarda en el navegador), así que no se puede seguir a nadie
-- entre visitas. Los jugadores pueden desactivarlo en Configuración.
--
-- Cómo instalarlo: pega todo esto en Supabase > SQL Editor > New query y pulsa "Run" ANTES de subir el código que
-- lo usa. Se puede volver a ejecutar sin perder datos.
-- Cómo mirarlo: en el SQL Editor, por ejemplo `select * from stats.resumen_diario;` (ver las vistas al final).

create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session text not null check (char_length(session) between 8 and 40),
  kind text not null check (kind in ('open', 'tutorial', 'run_start', 'run_end')),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 2000)
);
create index if not exists events_created_idx on public.events (created_at);
create index if not exists events_session_idx on public.events (session, created_at);

-- Cualquiera puede AÑADIR eventos desde el juego, pero nadie puede leerlos, cambiarlos ni borrarlos desde fuera:
-- solo tú desde el panel de Supabase.
alter table public.events enable row level security;
drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert to anon, authenticated with check (true);
revoke all on public.events from anon, authenticated;
grant insert on public.events to anon, authenticated;
do $$ begin execute format('grant usage on sequence %s to anon, authenticated', pg_get_serial_sequence('public.events', 'id')); end $$;

-- Freno contra abusos: como mucho 60 eventos por visita y minuto.
create or replace function public.events_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.events where session = new.session and created_at > now() - interval '1 minute') >= 60 then
    raise exception 'demasiados eventos';
  end if;
  return new;
end $$;
drop trigger if exists events_rate_limit on public.events;
create trigger events_rate_limit before insert on public.events for each row execute function public.events_rate_limit();

-- ------------------------------------------------------------------ vistas para mirar los datos
-- Están en el esquema "stats", que la web no puede leer (solo se ven desde el panel de Supabase).
create schema if not exists stats;
revoke all on schema stats from anon, authenticated;

-- Cada día: visitas, partidas empezadas y acabadas, cuántas visitas juegan alguna partida y tiempo medio.
create or replace view stats.resumen_diario as
select date_trunc('day', created_at)::date as dia,
  count(*) filter (where kind = 'open') as visitas,
  count(*) filter (where kind = 'open' and (data->>'nuevo')::boolean) as visitas_nuevas,
  count(*) filter (where kind = 'run_start') as partidas,
  count(*) filter (where kind = 'run_end') as partidas_acabadas,
  count(distinct session) filter (where kind = 'run_start') as visitas_que_juegan,
  round(avg((data->>'time')::numeric) filter (where kind = 'run_end')) as segundos_medios,
  count(*) filter (where kind = 'run_end' and (data->>'win')::boolean) as victorias
from public.events group by 1 order by 1 desc;

-- Tutorial de la primera partida: en qué consejo lo saltan o hasta dónde llegan.
create or replace view stats.tutorial as
select data->>'step' as consejo, (data->>'skipped')::boolean as saltado, count(*) as veces
from public.events where kind = 'tutorial' group by 1, 2 order by 1, 2;

-- Cuánto duran las partidas (por minutos): dónde muere o lo deja la gente. "primera" = jugadores nuevos.
create or replace view stats.duracion as
select least(floor((data->>'time')::numeric / 60), 10)::int as minuto,
  count(*) as partidas,
  count(*) filter (where (data->>'nuevo')::boolean) as de_jugadores_nuevos,
  count(*) filter (where (data->>'quit')::boolean) as abandonadas
from public.events where kind = 'run_end' group by 1 order by 1;

-- Héroes: cuánto se eligen, cuánto duran y cuántas veces ganan.
create or replace view stats.heroes as
select data->>'hero' as heroe, count(*) as partidas,
  round(avg((data->>'time')::numeric)) as segundos_medios,
  round(avg((data->>'level')::numeric), 1) as nivel_medio,
  count(*) filter (where (data->>'win')::boolean) as victorias
from public.events where kind = 'run_end' group by 1 order by 2 desc;

-- Zonas y dificultades más jugadas.
create or replace view stats.zonas as
select data->>'map' as zona, data->>'diff' as dificultad, count(*) as partidas,
  round(avg((data->>'time')::numeric)) as segundos_medios
from public.events where kind = 'run_end' group by 1, 2 order by 3 desc;

-- Desde qué se juega y en qué idioma.
create or replace view stats.dispositivos as
select data->>'device' as dispositivo, data->>'lang' as idioma, count(*) as visitas
from public.events where kind = 'open' group by 1, 2 order by 3 desc;

revoke all on all tables in schema stats from anon, authenticated;

-- Para no guardar datos de más: borra los eventos de hace más de 6 meses (ejecútalo de vez en cuando).
-- delete from public.events where created_at < now() - interval '6 months';
