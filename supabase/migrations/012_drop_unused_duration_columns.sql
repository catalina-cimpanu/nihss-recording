-- Durations are computed in lib/nihss/duration.ts from start/end and
-- stroke/lyse timestamps. These columns from 002_decision_durations.sql
-- were never written by the app after that change.

alter table public.erhebungen
  drop column if exists stroke_entscheidung_at,
  drop column if exists lyse_entscheidung_at,
  drop column if exists dauer_untersuchung_ms,
  drop column if exists dauer_start_zu_stroke_ms,
  drop column if exists dauer_stroke_zu_lyse_ms;
