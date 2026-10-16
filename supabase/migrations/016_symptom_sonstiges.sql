alter table public.erhebungen
  add column if not exists symptom_sonstiges boolean not null default false,
  add column if not exists symptom_sonstiges_vor boolean not null default false,
  add column if not exists symptom_sonstiges_text text,
  add column if not exists symptom_sonstiges_text_vor text;
