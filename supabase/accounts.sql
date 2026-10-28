-- Cuentas de jugador y progreso guardado de VALORANT SURVIVORS.
-- Requisito previo: haber ejecutado schema.sql (tabla del ranking).
-- Pega esto en Supabase > SQL Editor > New query y pulsa "Run". Se puede ejecutar más de una vez.

-- 1) Perfil de cada jugador: nombre único, ID de jugador automático y progreso (JSON).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,16}$'),
  player_id bigint generated always as identity (start with 10000) unique,
  save jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;
drop policy if exists "ver mi perfil" on public.profiles;
create policy "ver mi perfil" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "guardar mi progreso" on public.profiles;
create policy "guardar mi progreso" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Solo se puede modificar el progreso desde la web (no el nombre ni el ID).
revoke update on public.profiles from anon, authenticated;
grant update (save, updated_at) on public.profiles to authenticated;
grant select on public.profiles to authenticated;

-- 2) Al registrarse, se crea el perfil con el nombre elegido.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, save)
  values (new.id, new.raw_user_meta_data ->> 'username', '{}'::jsonb);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 3) Comprobar si un nombre está libre antes de registrarse (sin exponer la tabla).
create or replace function public.username_available(name text)
returns boolean language sql security definer stable set search_path = public as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(name));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- 4) El ranking enlaza cada marca con la cuenta que la publicó (los invitados quedan sin cuenta).
alter table public.scores add column if not exists user_id uuid references auth.users (id) on delete set null default auth.uid();
alter table public.scores add column if not exists player_id bigint;
drop policy if exists "enviar marca" on public.scores;
create policy "enviar marca" on public.scores for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- Con sesión iniciada, el nombre y el ID salen del perfil (no se pueden falsear).
-- Un invitado no puede publicar con el nombre de una cuenta registrada.
create or replace function public.scores_fill_player()
returns trigger language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  new.user_id := auth.uid();
  if new.user_id is not null then
    select * into p from public.profiles where id = new.user_id;
    if found then new.name := p.username; new.player_id := p.player_id; end if;
  else
    new.player_id := null;
    if exists (select 1 from public.profiles where lower(username) = lower(new.name)) then
      raise exception 'Ese nombre pertenece a una cuenta registrada' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists scores_fill_player on public.scores;
create trigger scores_fill_player before insert on public.scores for each row execute function public.scores_fill_player();
