alter table public.erhebungen
  add column if not exists umstaende_ablenkung boolean not null default false,
  add column if not exists umstaende_ablenkung_text text,
  add column if not exists umstaende_technische_probleme boolean not null default false,
  add column if not exists umstaende_technische_probleme_text text,
  add column if not exists umstaende_hoerminderung boolean not null default false,
  add column if not exists umstaende_hoerminderung_text text;
