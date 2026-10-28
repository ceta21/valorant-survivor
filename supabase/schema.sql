-- Ranking global de VALORANT SURVIVORS.
-- Pega esto en Supabase > SQL Editor > New query y pulsa "Run".

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 16),
  agent text not null check (agent in ('jett','phoenix','sage','reyna','raze','sova','neon','omen','killjoy','brimstone','eclipse','vortice','quimera')),
  difficulty text not null check (difficulty in ('facil','normal','dificil','pesadilla')),
  map text not null check (map in ('ascent','bind','haven')),
  time real not null check (time >= 0 and time <= 86400),
  kills integer not null check (kills >= 0),
  level integer not null check (level between 1 and 999),
  boss_kills integer not null default 0 check (boss_kills >= 0)
);

create index if not exists scores_time_idx on public.scores (time desc);
create index if not exists scores_filter_idx on public.scores (agent, difficulty, time desc);

-- Cualquiera puede leer el ranking y añadir marcas; nadie puede editarlas ni borrarlas desde la web.
alter table public.scores enable row level security;
drop policy if exists "leer ranking" on public.scores;
create policy "leer ranking" on public.scores for select to anon, authenticated using (true);
drop policy if exists "enviar marca" on public.scores;
create policy "enviar marca" on public.scores for insert to anon, authenticated with check (true);
