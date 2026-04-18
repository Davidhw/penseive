-- Migration: switch entries SRS columns from SM-2-lite to FSRS.
-- Apply once in Supabase SQL Editor after deploying the ts-fsrs code.
-- Existing test rows: defaults put them in State.New so they'll re-enter the
-- learning pipeline on next review. No data preserved from interval_days/ease.

alter table public.entries
  drop column if exists ease,
  drop column if exists interval_days,
  add column if not exists stability      numeric  not null default 0,
  add column if not exists difficulty     numeric  not null default 0,
  add column if not exists scheduled_days integer  not null default 0,
  add column if not exists elapsed_days   integer  not null default 0,
  add column if not exists learning_steps integer  not null default 0,
  add column if not exists state          smallint not null default 0;
