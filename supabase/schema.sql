-- Pensieve schema (current). Paste this into Supabase SQL editor for a fresh install.
-- For an existing project, apply migrations in supabase/migrations/*.sql instead.

create table if not exists public.entries (
  id              text        primary key,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null,
  updated_at      timestamptz not null,
  prompt          text,
  body            text        not null,
  -- FSRS card state (see ts-fsrs Card type)
  due_at          timestamptz not null,
  stability       numeric     not null default 0,
  difficulty      numeric     not null default 0,
  scheduled_days  integer     not null default 0,
  elapsed_days    integer     not null default 0,
  learning_steps  integer     not null default 0,
  state           smallint    not null default 0,  -- 0 New, 1 Learning, 2 Review, 3 Relearning
  reps            integer     not null default 0,
  lapses          integer     not null default 0,
  last_reviewed_at timestamptz
);

alter table public.entries enable row level security;

drop policy if exists "entries_owner_all" on public.entries;
create policy "entries_owner_all" on public.entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists entries_user_created_idx on public.entries (user_id, created_at desc);
create index if not exists entries_user_due_idx     on public.entries (user_id, due_at);

create table if not exists public.prompts (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  items       text[]      not null default '{}'::text[],
  updated_at  timestamptz not null default now()
);

alter table public.prompts enable row level security;

drop policy if exists "prompts_owner_all" on public.prompts;
create policy "prompts_owner_all" on public.prompts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
