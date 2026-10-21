-- Stroke/Lyse decision corrected after the Untersuchung, separate from the clicked
-- stroke_status / lyse_status (which stay unchanged).
-- If the clicked status is "nicht entschieden", the decision was entered afterwards
-- ("nachgetragen"); otherwise a clicked decision was corrected ("korrigiert").

alter table public.erhebungen
  rename column stroke_nachgetragen to stroke_status_korrigiert;

alter table public.erhebungen
  rename column lyse_nachgetragen to lyse_status_korrigiert;
