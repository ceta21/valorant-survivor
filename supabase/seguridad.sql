-- Seguridad del progreso de ENDLESS RIFT. GENERADO por scripts/security-sql.ts (npm run sql:seguridad): no editar a mano.
-- Pega esto en Supabase > SQL Editor > New query y pulsa "Run". Se puede ejecutar más de una vez.
-- Requisito previo: accounts.sql. Ejecútalo ANTES de subir el código que avisa de los guardados rechazados.
--
-- Qué hace: antes de cada cambio del progreso (profiles.save), el servidor calcula su «valor» (créditos + lo que
-- costó todo lo comprado: héroes, mejoras, estilos, mascotas, poderes de mascota y equipo) y comprueba que no suba
-- más de lo que se puede ganar jugando. Cada cuenta tiene una hucha que se llena sola (6 créditos por segundo,
-- hasta 30000); lo ganado se descuenta de ella. Tampoco acepta récords de tiempo o bajas imposibles para el tiempo
-- pasado desde el guardado anterior. Si un guardado no es válido, no se aplica (el juego lo detecta y recarga el
-- progreso bueno) y queda apuntado en public.save_rejections. Las cuentas de administrador no se comprueban.

-- 1) Columnas de la hucha (no se pueden tocar desde la web: solo save y updated_at) y registro de rechazos.
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists credit_budget numeric not null default 30000;
alter table public.profiles add column if not exists budget_at timestamptz not null default now();

create table if not exists public.save_rejections (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete cascade,
  username text,
  reason text not null,
  credits_old numeric,
  credits_new numeric,
  gain numeric,
  budget numeric
);
alter table public.save_rejections enable row level security;   -- sin políticas: nadie la lee ni escribe desde la web
revoke all on public.save_rejections from anon, authenticated;

-- 2) Valor del progreso: créditos + lo que costó todo lo que tiene.
create or replace function public.save_value(s jsonb)
returns numeric language sql immutable set search_path = public as $$
  with
    heroes(id, v) as (values
      ('jett', 0),
      ('phoenix', 0),
      ('sage', 0),
      ('reyna', 500),
      ('raze', 500),
      ('sova', 500),
      ('neon', 900),
      ('omen', 900),
      ('killjoy', 900),
      ('brimstone', 1000),
      ('viper', 1000),
      ('cypher', 900),
      ('fade', 1000),
      ('breach', 1000),
      ('skye', 900),
      ('yoru', 1100),
      ('astra', 1100),
      ('kayo', 1100),
      ('chamber', 1200),
      ('harbor', 1100),
      ('iso', 1200),
      ('deadlock', 1200),
      ('gekko', 1000),
      ('tejo', 1300),
      ('zephyr', 0),
      ('lyra', 0),
      ('kael', 0),
      ('vex', 900),
      ('sylvan', 900),
      ('ember', 1000),
      ('brutus', 1000),
      ('frost', 1000),
      ('seraph', 1100),
      ('nox', 1100),
      ('raven', 1100),
      ('talos', 1200),
      ('morgan', 1200),
      ('volt', 1200),
      ('grim', 1100),
      ('aqua', 1100),
      ('zahir', 900),
      ('draco', 1300),
      ('sora', 1000),
      ('tink', 1200)),
    shop(id, v) as (values
      ('ws_oro', 4000),
      ('ws_dragon', 5000),
      ('ws_glaciar', 3500),
      ('ws_toxico', 3500),
      ('ws_vacio', 4500),
      ('ws_selva', 3000),
      ('ares_inferno', 12000),
      ('marshal_vacio', 14000),
      ('bucky_tormenta', 10000),
      ('guardian_aurora', 11000),
      ('frenzy_cosmos', 9000),
      ('bulldog_draco', 13000),
      ('eclipse', 42000),
      ('vortice', 38000),
      ('quimera', 45000),
      ('as_oro', 12000),
      ('as_noche', 9000),
      ('as_carmesi', 9000),
      ('as_glaciar', 10000),
      ('as_neon', 11000),
      ('as_selva', 8000),
      ('pet_brasin', 15000),
      ('pet_ajolin', 14000),
      ('pet_voltio', 16000),
      ('pet_broti', 12000),
      ('pet_copito', 14000))
  select
    coalesce((s ->> 'credits')::numeric, 0)
    + coalesce((select sum(h.v) from jsonb_array_elements_text(coalesce(s -> 'unlocked', '[]'::jsonb)) u join heroes h on h.id = u), 0)
    + coalesce((select sum(sh.v) from jsonb_array_elements_text(coalesce(s -> 'shop' -> 'owned', '[]'::jsonb)) o join shop sh on sh.id = o), 0)
    -- mejoras permanentes: coste acumulado de cada nivel
    + coalesce((select sum((array[0, 80, 323, 787, 1522, 2573, 3979, 5779, 8008, 10699, 13884]::numeric[])[least(greatest(coalesce((m.value)::int, 0), 0), 10) + 1])
        from jsonb_each_text(coalesce(s -> 'meta', '{}'::jsonb)) m where m.value ~ '^[0-9]+$'), 0)
    -- poder de cada mascota
    + coalesce((select sum((array[0, 5000, 13000, 25000]::numeric[])[least(greatest(coalesce((p.value)::int, 0), 0), 3) + 1])
        from jsonb_each_text(coalesce(s -> 'shop' -> 'power', '{}'::jsonb)) p where p.value ~ '^[0-9]+$'), 0)
    -- equipo: lo que vale al desguazarlo a nivel 1 (120·(rareza+1)) más las mejoras pagadas (250·(rareza+1)·nivel)
    + coalesce((select sum(120 * (r + 1) + 250 * (r + 1) * (l - 1) * l / 2)
        from (select least(greatest(coalesce((it ->> 'rarity')::int, 0), 0), 3) as r,
                     least(greatest(coalesce((it ->> 'lvl')::int, 1), 1), 50) as l
              from jsonb_array_elements(coalesce(s -> 'gear' -> 'items', '[]'::jsonb)) it) g), 0)
$$;

-- 3) Comprobación antes de cada guardado.
create or replace function public.check_save()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  elapsed numeric := greatest(0, extract(epoch from now() - old.budget_at));
  budget numeric := least(30000, old.credit_budget + elapsed * 6);
  gain numeric;
  reason text;
  oc numeric; nc numeric;
begin
  if new.save is not distinct from old.save then return new; end if;
  if old.is_admin then return new; end if;
  nc := (new.save ->> 'credits')::numeric;
  oc := coalesce((old.save ->> 'credits')::numeric, 0);
  if nc is null or nc < 0 or nc > 50000000 then
    reason := 'créditos no válidos';
  else
    gain := public.save_value(new.save) - public.save_value(old.save);
    if gain > budget + 1 then
      reason := 'más créditos o compras de los que se pueden ganar';
    elsif old.save ? 'stats' and coalesce((new.save -> 'stats' ->> 'bestTime')::numeric, 0)
          > greatest(coalesce((old.save -> 'stats' ->> 'bestTime')::numeric, 0), elapsed + 120) then
      reason := 'récord de tiempo imposible';
    elsif old.save ? 'stats' and coalesce((new.save -> 'stats' ->> 'kills')::numeric, 0)
          - coalesce((old.save -> 'stats' ->> 'kills')::numeric, 0) > (elapsed + 120) * 40 then
      reason := 'bajas imposibles';
    end if;
  end if;
  if reason is not null then
    insert into public.save_rejections (user_id, username, reason, credits_old, credits_new, gain, budget)
    values (old.id, old.username, reason, oc, nc, gain, budget);
    return null;   -- no se aplica: el juego ve 0 filas guardadas y recarga el progreso bueno
  end if;
  new.credit_budget := budget - greatest(gain, 0);
  new.budget_at := now();
  return new;
end $$;

drop trigger if exists profiles_check_save on public.profiles;
create trigger profiles_check_save before update of save on public.profiles
  for each row execute function public.check_save();
