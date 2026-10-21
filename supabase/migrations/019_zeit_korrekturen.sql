-- Manual time corrections after the Untersuchung.
-- The clicked times stay unchanged; durations use the corrected time when set.
-- *_nachgetragen: Stroke/Lyse decision entered afterwards because nothing was
-- chosen during the Untersuchung (stroke_status / lyse_status stay "nicht entschieden").

alter table public.erhebungen
  add column if not exists startzeit_korrigiert timestamptz,
  add column if not exists endzeit_korrigiert timestamptz,
  add column if not exists stroke_korrigiert_at timestamptz,
  add column if not exists lyse_korrigiert_at timestamptz,
  add column if not exists stroke_nachgetragen text
    check (
      stroke_nachgetragen is null
      or stroke_nachgetragen in ('Ja', 'Kein Stroke')
    ),
  add column if not exists lyse_nachgetragen text
    check (
      lyse_nachgetragen is null
      or lyse_nachgetragen in ('Ja', 'Keine Lyse')
    );
