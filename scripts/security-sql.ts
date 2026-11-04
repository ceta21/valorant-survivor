// Genera supabase/seguridad.sql: el servidor rechaza guardados con progreso imposible (créditos o compras que no
// salen de jugar, récords falsos). Los precios salen de los datos del juego, así que tras cambiar un precio basta con
// volver a ejecutar esto (npm run sql:seguridad) y pegar el SQL en Supabase.
// Uso: npm run sql:seguridad
import { writeFileSync } from 'node:fs';
import { AGENTS, LEGACY_AGENT_COSTS } from '../src/data/agents';
import { AGENT_SKINS, PETS, LEGACY_PRICES, PET_POWER_PRICES } from '../src/data/shop';
import { META, metaCost } from '../src/data/meta';

/** Créditos que se recargan por segundo y máximo acumulable (ver docs/04). */
export const BUDGET_RATE = 6, BUDGET_CAP = 30000;

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const rows = (m: Record<string, number>) => Object.entries(m).map(([k, v]) => `(${q(k)}, ${v})`).join(',\n      ');
const heroes: Record<string, number> = { ...LEGACY_AGENT_COSTS };
for (const a of AGENTS) heroes[a.id] = a.cost;
const shop: Record<string, number> = { ...LEGACY_PRICES };
for (const s of AGENT_SKINS) shop[s.id] = s.price;
for (const p of PETS) shop[p.id] = p.price;
// coste acumulado de cada nivel de mejora permanente y de poder de mascota
const metaCum: number[] = [0];
for (let l = 0; l < Math.max(...META.map(m => m.max)); l++) metaCum.push(metaCum[l] + metaCost(l));
const petCum: number[] = [0];
for (const p of PET_POWER_PRICES) petCum.push(petCum[petCum.length - 1] + p);
const arr = (a: number[]) => `array[${a.join(', ')}]::numeric[]`;

const sql = `-- Seguridad del progreso de ENDLESS RIFT. GENERADO por scripts/security-sql.ts (npm run sql:seguridad): no editar a mano.
-- Pega esto en Supabase > SQL Editor > New query y pulsa "Run". Se puede ejecutar más de una vez.
-- Requisito previo: accounts.sql. Ejecútalo ANTES de subir el código que avisa de los guardados rechazados.
--
-- Qué hace: antes de cada cambio del progreso (profiles.save), el servidor calcula su «valor» (créditos + lo que
-- costó todo lo comprado: héroes, mejoras, estilos, mascotas, poderes de mascota y equipo) y comprueba que no suba
-- más de lo que se puede ganar jugando. Cada cuenta tiene una hucha que se llena sola (${BUDGET_RATE} créditos por segundo,
-- hasta ${BUDGET_CAP}); lo ganado se descuenta de ella. Tampoco acepta récords de tiempo o bajas imposibles para el tiempo
-- pasado desde el guardado anterior. Si un guardado no es válido, no se aplica (el juego lo detecta y recarga el
-- progreso bueno) y queda apuntado en public.save_rejections. Las cuentas de administrador no se comprueban.

-- 1) Columnas de la hucha (no se pueden tocar desde la web: solo save y updated_at) y registro de rechazos.
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists credit_budget numeric not null default ${BUDGET_CAP};
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
      ${rows(heroes)}),
    shop(id, v) as (values
      ${rows(shop)})
  select
    coalesce((s ->> 'credits')::numeric, 0)
    + coalesce((select sum(h.v) from jsonb_array_elements_text(coalesce(s -> 'unlocked', '[]'::jsonb)) u join heroes h on h.id = u), 0)
    + coalesce((select sum(sh.v) from jsonb_array_elements_text(coalesce(s -> 'shop' -> 'owned', '[]'::jsonb)) o join shop sh on sh.id = o), 0)
    -- mejoras permanentes: coste acumulado de cada nivel
    + coalesce((select sum((${arr(metaCum)})[least(greatest(coalesce((m.value)::int, 0), 0), ${metaCum.length - 1}) + 1])
        from jsonb_each_text(coalesce(s -> 'meta', '{}'::jsonb)) m where m.value ~ '^[0-9]+$'), 0)
    -- poder de cada mascota
    + coalesce((select sum((${arr(petCum)})[least(greatest(coalesce((p.value)::int, 0), 0), ${petCum.length - 1}) + 1])
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
  budget numeric := least(${BUDGET_CAP}, old.credit_budget + elapsed * ${BUDGET_RATE});
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
`;
writeFileSync('supabase/seguridad.sql', sql.replace(/\n/g, '\r\n'));
console.log('supabase/seguridad.sql generado:', Object.keys(heroes).length, 'héroes,', Object.keys(shop).length, 'objetos de tienda');
