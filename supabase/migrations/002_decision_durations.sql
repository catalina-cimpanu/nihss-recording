alter table public.erhebungen
  add column if not exists stroke_entscheidung_at timestamptz,
  add column if not exists lyse_entscheidung_at timestamptz,
  add column if not exists dauer_untersuchung_ms integer,
  add column if not exists dauer_start_zu_stroke_ms integer,
  add column if not exists dauer_stroke_zu_lyse_ms integer;

update public.erhebungen
set
  stroke_entscheidung_at = case
    when stroke_status in ('Ja', 'Kein Stroke')
      then coalesce(stroke_initial_at, stroke_last_at)
    else null
  end,
  lyse_entscheidung_at = case
    when lyse_status in ('Ja', 'Keine Lyse')
      then coalesce(lyse_initial_at, lyse_last_at)
    else null
  end;

update public.erhebungen
set
  dauer_untersuchung_ms = case
    when startzeit_untersuchung is not null
      and endzeit_untersuchung is not null
      and endzeit_untersuchung >= startzeit_untersuchung
      then (extract(epoch from (endzeit_untersuchung - startzeit_untersuchung)) * 1000)::integer
    else null
  end,
  dauer_start_zu_stroke_ms = case
    when startzeit_untersuchung is not null
      and stroke_entscheidung_at is not null
      and stroke_entscheidung_at >= startzeit_untersuchung
      then (extract(epoch from (stroke_entscheidung_at - startzeit_untersuchung)) * 1000)::integer
    else null
  end,
  dauer_stroke_zu_lyse_ms = case
    when stroke_entscheidung_at is not null
      and lyse_entscheidung_at is not null
      and lyse_entscheidung_at >= stroke_entscheidung_at
      then (extract(epoch from (lyse_entscheidung_at - stroke_entscheidung_at)) * 1000)::integer
    else null
  end;
