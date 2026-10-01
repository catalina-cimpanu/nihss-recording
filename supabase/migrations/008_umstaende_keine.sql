alter table public.erhebungen
  add column if not exists umstaende_keine boolean not null default false;
