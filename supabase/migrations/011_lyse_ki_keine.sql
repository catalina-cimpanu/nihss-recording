alter table public.erhebungen
  add column if not exists lyse_ki_keine boolean not null default false;
