-- Kontraindikationen are asked once, after the Untersuchung:
-- "Waren vor der Untersuchung Lyse-Kontraindikationen bereits bekannt?"
-- lyse_kontraindikation_vor_untersuchung holds the answer, lyse_ki_* the reasons.
-- KIs that only became known during/after the Untersuchung are dropped.

update public.erhebungen set
  lyse_kontraindikation_vor_untersuchung = case
    when (lyse_ki_oak and lyse_ki_oak_timing is distinct from 'nach Untersuchung')
      or (lyse_ki_zeitfenster and lyse_ki_zeitfenster_timing is distinct from 'nach Untersuchung')
      or (lyse_ki_blutung_cct and lyse_ki_blutung_cct_timing is distinct from 'nach Untersuchung')
      or (lyse_ki_op_trauma and lyse_ki_op_trauma_timing is distinct from 'nach Untersuchung')
      or (lyse_ki_reanimation and lyse_ki_reanimation_timing is distinct from 'nach Untersuchung')
      or (lyse_ki_icb and lyse_ki_icb_timing is distinct from 'nach Untersuchung')
      or (lyse_ki_blutungsneigung and lyse_ki_blutungsneigung_timing is distinct from 'nach Untersuchung')
      or (lyse_ki_schwere_blutung and lyse_ki_schwere_blutung_timing is distinct from 'nach Untersuchung')
      or (lyse_ki_endokarditis and lyse_ki_endokarditis_timing is distinct from 'nach Untersuchung')
      or (lyse_ki_sonstige and lyse_ki_sonstige_timing is distinct from 'nach Untersuchung')
      then 'Ja'
    -- KIs were ticked, but all were retracted or only known after the Untersuchung.
    when coalesce(
      lyse_ki_oak_timing,
      lyse_ki_zeitfenster_timing,
      lyse_ki_blutung_cct_timing,
      lyse_ki_op_trauma_timing,
      lyse_ki_reanimation_timing,
      lyse_ki_icb_timing,
      lyse_ki_blutungsneigung_timing,
      lyse_ki_schwere_blutung_timing,
      lyse_ki_endokarditis_timing,
      lyse_ki_sonstige_timing
    ) is not null
      then 'Nein'
    else lyse_kontraindikation_vor_untersuchung
  end,
  lyse_ki_oak = lyse_ki_oak and lyse_ki_oak_timing is distinct from 'nach Untersuchung',
  lyse_ki_zeitfenster = lyse_ki_zeitfenster and lyse_ki_zeitfenster_timing is distinct from 'nach Untersuchung',
  lyse_ki_blutung_cct = lyse_ki_blutung_cct and lyse_ki_blutung_cct_timing is distinct from 'nach Untersuchung',
  lyse_ki_op_trauma = lyse_ki_op_trauma and lyse_ki_op_trauma_timing is distinct from 'nach Untersuchung',
  lyse_ki_reanimation = lyse_ki_reanimation and lyse_ki_reanimation_timing is distinct from 'nach Untersuchung',
  lyse_ki_icb = lyse_ki_icb and lyse_ki_icb_timing is distinct from 'nach Untersuchung',
  lyse_ki_blutungsneigung = lyse_ki_blutungsneigung and lyse_ki_blutungsneigung_timing is distinct from 'nach Untersuchung',
  lyse_ki_schwere_blutung = lyse_ki_schwere_blutung and lyse_ki_schwere_blutung_timing is distinct from 'nach Untersuchung',
  lyse_ki_endokarditis = lyse_ki_endokarditis and lyse_ki_endokarditis_timing is distinct from 'nach Untersuchung',
  lyse_ki_sonstige = lyse_ki_sonstige and lyse_ki_sonstige_timing is distinct from 'nach Untersuchung',
  lyse_ki_sonstige_text = case
    when lyse_ki_sonstige and lyse_ki_sonstige_timing is distinct from 'nach Untersuchung'
      then lyse_ki_sonstige_text
  end;

-- Same rules as the app: no KI → no "beeinflusst" answer.
update public.erhebungen set
  lyse_kontraindikation_beeinflusst = null,
  lyse_kontraindikation_beeinflusst_text = null
where not (
  lyse_ki_oak or lyse_ki_zeitfenster or lyse_ki_blutung_cct or lyse_ki_op_trauma
  or lyse_ki_reanimation or lyse_ki_icb or lyse_ki_blutungsneigung
  or lyse_ki_schwere_blutung or lyse_ki_endokarditis or lyse_ki_sonstige
);

alter table public.erhebungen
  drop column if exists lyse_kontraindikation_nach_untersuchung,
  drop column if exists lyse_kontraindikation_nach_welche,
  drop column if exists lyse_ki_keine,
  drop column if exists lyse_ki_oak_timing,
  drop column if exists lyse_ki_zeitfenster_timing,
  drop column if exists lyse_ki_blutung_cct_timing,
  drop column if exists lyse_ki_op_trauma_timing,
  drop column if exists lyse_ki_reanimation_timing,
  drop column if exists lyse_ki_icb_timing,
  drop column if exists lyse_ki_blutungsneigung_timing,
  drop column if exists lyse_ki_schwere_blutung_timing,
  drop column if exists lyse_ki_endokarditis_timing,
  drop column if exists lyse_ki_sonstige_timing,
  drop column if exists lyse_ki_oak_vor,
  drop column if exists lyse_ki_zeitfenster_vor,
  drop column if exists lyse_ki_blutung_cct_vor,
  drop column if exists lyse_ki_op_trauma_vor,
  drop column if exists lyse_ki_reanimation_vor,
  drop column if exists lyse_ki_icb_vor,
  drop column if exists lyse_ki_blutungsneigung_vor,
  drop column if exists lyse_ki_schwere_blutung_vor,
  drop column if exists lyse_ki_endokarditis_vor,
  drop column if exists lyse_ki_sonstige_vor;
