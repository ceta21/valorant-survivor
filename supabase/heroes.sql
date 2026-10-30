-- Héroes originales (Zephyr, Lyra, Kael…) y zonas del mundo (Reino, Glaciar, Infierno, Ciudad):
-- permite publicar en el ranking con ellos.
-- Pega esto en Supabase > SQL Editor > New query y pulsa "Run" ANTES de subir el código que los añade.
-- Se mantienen los ids antiguos para que las marcas ya publicadas sigan siendo válidas.
alter table public.scores drop constraint if exists scores_agent_check;
alter table public.scores add constraint scores_agent_check check (agent in (
  'zephyr','lyra','kael','vex','sylvan','ember','brutus','frost','seraph','nox',
  'raven','talos','morgan','volt','grim','aqua','zahir','draco','sora','tink',
  'jett','phoenix','sage','reyna','raze','sova','neon','omen','killjoy','brimstone',
  'viper','cypher','fade','breach','skye','yoru','astra','kayo','chamber','harbor','iso','deadlock','gekko','tejo',
  'eclipse','vortice','quimera'
));
alter table public.scores drop constraint if exists scores_map_check;
alter table public.scores add constraint scores_map_check check (map in ('reino','glaciar','infierno','ciudad','ascent','bind','haven'));
