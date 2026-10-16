-- Frozen "selected before the Untersuchung" flag per Kontraindikation.
-- The live lyse_ki_* flag and lyse_ki_*_timing stay the current answer
-- (including a later change to 'nach Untersuchung').

alter table public.erhebungen
  add column if not exists lyse_ki_oak_vor boolean not null default false,
  add column if not exists lyse_ki_zeitfenster_vor boolean not null default false,
  add column if not exists lyse_ki_blutung_cct_vor boolean not null default false,
  add column if not exists lyse_ki_op_trauma_vor boolean not null default false,
  add column if not exists lyse_ki_reanimation_vor boolean not null default false,
  add column if not exists lyse_ki_icb_vor boolean not null default false,
  add column if not exists lyse_ki_blutungsneigung_vor boolean not null default false,
  add column if not exists lyse_ki_schwere_blutung_vor boolean not null default false,
  add column if not exists lyse_ki_endokarditis_vor boolean not null default false,
  add column if not exists lyse_ki_sonstige_vor boolean not null default false;

update public.erhebungen set
  lyse_ki_oak_vor = lyse_ki_oak_timing is not distinct from 'vor Untersuchung',
  lyse_ki_zeitfenster_vor = lyse_ki_zeitfenster_timing is not distinct from 'vor Untersuchung',
  lyse_ki_blutung_cct_vor = lyse_ki_blutung_cct_timing is not distinct from 'vor Untersuchung',
  lyse_ki_op_trauma_vor = lyse_ki_op_trauma_timing is not distinct from 'vor Untersuchung',
  lyse_ki_reanimation_vor = lyse_ki_reanimation_timing is not distinct from 'vor Untersuchung',
  lyse_ki_icb_vor = lyse_ki_icb_timing is not distinct from 'vor Untersuchung',
  lyse_ki_blutungsneigung_vor = lyse_ki_blutungsneigung_timing is not distinct from 'vor Untersuchung',
  lyse_ki_schwere_blutung_vor = lyse_ki_schwere_blutung_timing is not distinct from 'vor Untersuchung',
  lyse_ki_endokarditis_vor = lyse_ki_endokarditis_timing is not distinct from 'vor Untersuchung',
  lyse_ki_sonstige_vor = lyse_ki_sonstige_timing is not distinct from 'vor Untersuchung';
