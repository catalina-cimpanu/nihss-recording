alter table public.erhebungen
  add column if not exists stroke_lyse_gleichzeitig boolean not null default false;
