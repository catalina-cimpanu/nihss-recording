alter table public.erhebungen
  add column if not exists stroke_after_completion_status text
    check (
      stroke_after_completion_status is null
      or stroke_after_completion_status in ('Ja', 'Kein Stroke')
    ),
  add column if not exists stroke_after_completion_at timestamptz,
  add column if not exists lyse_after_completion_status text
    check (
      lyse_after_completion_status is null
      or lyse_after_completion_status in ('Ja', 'Keine Lyse')
    ),
  add column if not exists lyse_after_completion_at timestamptz;
