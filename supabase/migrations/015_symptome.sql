alter table public.erhebungen
  add column if not exists symptom_schwindel boolean not null default false,
  add column if not exists symptom_schwindel_vor boolean not null default false,
  add column if not exists symptom_kopfschmerzen boolean not null default false,
  add column if not exists symptom_kopfschmerzen_vor boolean not null default false,
  add column if not exists symptom_asymptomatisch boolean not null default false,
  add column if not exists symptom_asymptomatisch_vor boolean not null default false;
