-- Ranking de MARGOUSH 3D. Pegar entero en Supabase > SQL Editor > Run.
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  nickname text not null check (char_length(nickname) between 1 and 16),
  hero text not null check (hero in ('douge', 'marine')),
  score integer not null check (score between 0 and 200000),
  created_at timestamptz not null default now()
);

alter table public.scores enable row level security;

drop policy if exists "leer ranking" on public.scores;
create policy "leer ranking" on public.scores for select to anon using (true);

drop policy if exists "guardar puntaje" on public.scores;
create policy "guardar puntaje" on public.scores for insert to anon with check (true);

-- El juego solo puede escribir apodo, héroe y puntaje: la fecha la pone la base (evita fijar puntajes "de esta semana" para siempre)
revoke insert on public.scores from anon;
grant insert (nickname, hero, score) on public.scores to anon;
grant select on public.scores to anon;

-- Sin políticas de update ni delete: nadie puede cambiar ni borrar puntajes desde el juego.
create index if not exists scores_score_idx on public.scores (score desc);
create index if not exists scores_created_idx on public.scores (created_at desc);
