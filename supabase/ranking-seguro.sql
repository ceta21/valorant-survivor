-- Ranking a prueba de trampas: el servidor rechaza marcas imposibles y envíos demasiado seguidos.
-- Pega esto en Supabase > SQL Editor > New query y pulsa "Run" (se puede volver a ejecutar sin problema).
-- No toca las marcas que ya existen (las comprobaciones son NOT VALID: solo se aplican a las nuevas).

-- 1) Marcas coherentes: mínimo 5 s de partida, y no más bajas, nivel ni jefes de los que caben en ese tiempo.
--    Límites muy holgados: en el modo infinito, con cientos de enemigos, una partida de una hora puede pasar de 20 bajas
--    por segundo de media, así que el límite es 80 (antes 20 rechazaba esas marcas).
alter table public.scores drop constraint if exists scores_plausible;
alter table public.scores add constraint scores_plausible check (
  time >= 5
  and kills <= 80 * time + 100
  and level <= 10 + time / 5
  and boss_kills <= 1 + time / 20
) not valid;

-- 2) Ritmo de envío: una partida de X segundos no puede publicarse si la marca anterior del mismo jugador (cuenta o,
--    para invitados, el mismo nombre) se envió hace menos de esos X segundos; y como mucho una marca cada 20 s.
create or replace function public.scores_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare last timestamptz;
begin
  select max(created_at) into last from public.scores
   where (new.user_id is not null and user_id = new.user_id)
      or (new.user_id is null and user_id is null and lower(name) = lower(new.name));
  if last is not null and now() - last < make_interval(secs => greatest(20, new.time * 0.8)) then
    raise exception 'Demasiado seguido: espera antes de enviar otra marca';
  end if;
  return new;
end $$;
drop trigger if exists scores_rate_limit on public.scores;
-- después de scores_fill_player (que pone user_id y el nombre de la cuenta): los triggers se ejecutan por orden alfabético
create trigger scores_rate_limit before insert on public.scores for each row execute function public.scores_rate_limit();
