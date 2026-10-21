-- Pauses during the Untersuchung: [{"von": timestamp, "bis": timestamp | null}].
-- An open pause has "bis": null. Durations and running clocks leave paused time out;
-- the clicked times themselves stay real clock times.

alter table public.erhebungen
  add column if not exists pausen jsonb not null default '[]'::jsonb;
