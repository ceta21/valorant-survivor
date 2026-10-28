-- Mercado nocturno: permite publicar en el ranking con los agentes exclusivos.
-- Pega esto en Supabase > SQL Editor > New query y pulsa "Run".
alter table public.scores drop constraint if exists scores_agent_check;
alter table public.scores add constraint scores_agent_check check (agent in (
  'jett','phoenix','sage','reyna','raze','sova','neon','omen','killjoy','brimstone',
  'eclipse','vortice','quimera'
));
