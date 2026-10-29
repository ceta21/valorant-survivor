-- Agentes nuevos (Viper, Cypher, Fade, Breach, Skye, Yoru, Astra, KAY/O, Chamber, Harbor, Iso, Deadlock,
-- Gekko y Tejo): permite publicar en el ranking con ellos.
-- Pega esto en Supabase > SQL Editor > New query y pulsa "Run" ANTES de subir el código que los añade.
alter table public.scores drop constraint if exists scores_agent_check;
alter table public.scores add constraint scores_agent_check check (agent in (
  'jett','phoenix','sage','reyna','raze','sova','neon','omen','killjoy','brimstone',
  'viper','cypher','fade','breach','skye','yoru','astra','kayo','chamber','harbor','iso','deadlock','gekko','tejo',
  'eclipse','vortice','quimera'
));
