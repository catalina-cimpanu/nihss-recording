alter table public.erhebungen
  add column if not exists lyse_ki_oak_timing text
    check (
      lyse_ki_oak_timing is null
      or lyse_ki_oak_timing in ('vor Untersuchung', 'nach Untersuchung')
    ),
  add column if not exists lyse_ki_zeitfenster_timing text
    check (
      lyse_ki_zeitfenster_timing is null
      or lyse_ki_zeitfenster_timing in ('vor Untersuchung', 'nach Untersuchung')
    ),
  add column if not exists lyse_ki_blutung_cct_timing text
    check (
      lyse_ki_blutung_cct_timing is null
      or lyse_ki_blutung_cct_timing in ('vor Untersuchung', 'nach Untersuchung')
    ),
  add column if not exists lyse_ki_op_trauma_timing text
    check (
      lyse_ki_op_trauma_timing is null
      or lyse_ki_op_trauma_timing in ('vor Untersuchung', 'nach Untersuchung')
    ),
  add column if not exists lyse_ki_reanimation_timing text
    check (
      lyse_ki_reanimation_timing is null
      or lyse_ki_reanimation_timing in ('vor Untersuchung', 'nach Untersuchung')
    ),
  add column if not exists lyse_ki_icb_timing text
    check (
      lyse_ki_icb_timing is null
      or lyse_ki_icb_timing in ('vor Untersuchung', 'nach Untersuchung')
    ),
  add column if not exists lyse_ki_blutungsneigung_timing text
    check (
      lyse_ki_blutungsneigung_timing is null
      or lyse_ki_blutungsneigung_timing in ('vor Untersuchung', 'nach Untersuchung')
    ),
  add column if not exists lyse_ki_schwere_blutung_timing text
    check (
      lyse_ki_schwere_blutung_timing is null
      or lyse_ki_schwere_blutung_timing in ('vor Untersuchung', 'nach Untersuchung')
    ),
  add column if not exists lyse_ki_endokarditis_timing text
    check (
      lyse_ki_endokarditis_timing is null
      or lyse_ki_endokarditis_timing in ('vor Untersuchung', 'nach Untersuchung')
    ),
  add column if not exists lyse_ki_sonstige_timing text
    check (
      lyse_ki_sonstige_timing is null
      or lyse_ki_sonstige_timing in ('vor Untersuchung', 'nach Untersuchung')
    );

update public.erhebungen set
  lyse_ki_oak_timing = case when lyse_ki_oak then coalesce(lyse_ki_oak_timing, 'vor Untersuchung') else null end,
  lyse_ki_zeitfenster_timing = case when lyse_ki_zeitfenster then coalesce(lyse_ki_zeitfenster_timing, 'vor Untersuchung') else null end,
  lyse_ki_blutung_cct_timing = case when lyse_ki_blutung_cct then coalesce(lyse_ki_blutung_cct_timing, 'vor Untersuchung') else null end,
  lyse_ki_op_trauma_timing = case when lyse_ki_op_trauma then coalesce(lyse_ki_op_trauma_timing, 'vor Untersuchung') else null end,
  lyse_ki_reanimation_timing = case when lyse_ki_reanimation then coalesce(lyse_ki_reanimation_timing, 'vor Untersuchung') else null end,
  lyse_ki_icb_timing = case when lyse_ki_icb then coalesce(lyse_ki_icb_timing, 'vor Untersuchung') else null end,
  lyse_ki_blutungsneigung_timing = case when lyse_ki_blutungsneigung then coalesce(lyse_ki_blutungsneigung_timing, 'vor Untersuchung') else null end,
  lyse_ki_schwere_blutung_timing = case when lyse_ki_schwere_blutung then coalesce(lyse_ki_schwere_blutung_timing, 'vor Untersuchung') else null end,
  lyse_ki_endokarditis_timing = case when lyse_ki_endokarditis then coalesce(lyse_ki_endokarditis_timing, 'vor Untersuchung') else null end,
  lyse_ki_sonstige_timing = case when lyse_ki_sonstige then coalesce(lyse_ki_sonstige_timing, 'vor Untersuchung') else null end;
