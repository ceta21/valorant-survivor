-- Convierte una cuenta YA REGISTRADA en administrador y le da todo lo del juego:
-- 9.999.999 créditos, los 20 héroes, todas las armas y agentes exclusivos del mercado nocturno,
-- todas las mejoras permanentes al máximo y todos los logros.
--
-- 1) Regístrate en el juego con el nombre que quieras para el admin.
-- 2) Cambia 'TU_USUARIO' (abajo) por ese nombre.
-- 3) Pega esto en Supabase > SQL Editor > New query y pulsa "Run".
-- Se puede volver a ejecutar cuando salgan cosas nuevas (no borra ajustes ni estadísticas).

alter table public.profiles add column if not exists is_admin boolean not null default false;

do $$
declare
  admin_name text := 'TU_USUARIO';   -- <-- cámbialo
  n int;
begin
  update public.profiles set
    is_admin = true,
    updated_at = now(),
    save = coalesce(save, '{}'::jsonb) || jsonb_build_object(
      'credits', 9999999,
      'unlocked', jsonb_build_array('zephyr','lyra','kael','vex','sylvan','ember','brutus','frost','seraph','nox','raven','talos','morgan','volt','grim','aqua','zahir','draco','sora','tink'),
      'exclusives', jsonb_build_array('ares_inferno','marshal_vacio','bucky_tormenta','guardian_aurora','frenzy_cosmos','bulldog_draco','eclipse','vortice','quimera'),
      'meta', jsonb_build_object('dmg', 10, 'hp', 10, 'speed', 10, 'xp', 10),
      'achievements', jsonb_build_array('a_first','a_kills_1000','a_kills_10000','a_time_600','a_level_25','a_win_3','a_boss_1','a_run_500'),
      -- habilidades por defecto de los agentes exclusivos (respeta las que ya hayas elegido)
      'kits', '{"eclipse":{"special":"shadowstep","secondary":"sloworb","ultimate":"orbitalstorm"},
                "vortice":{"special":"tailwind","secondary":"blastpack","ultimate":"bladestorm"},
                "quimera":{"special":"hunterdrone","secondary":"healorb","ultimate":"rematch"}}'::jsonb
              || coalesce(save -> 'kits', '{}'::jsonb)
    )
  where lower(username) = lower(admin_name);
  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'No existe ninguna cuenta llamada "%". Regístrala primero en el juego.', admin_name;
  end if;
  raise notice 'Cuenta "%" convertida en administrador.', admin_name;
end $$;
