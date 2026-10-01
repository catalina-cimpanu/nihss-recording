alter table public.erhebungen
  add column if not exists solo_patienten_id text,
  add column if not exists tempis_stroke_verdacht text
    check (tempis_stroke_verdacht is null or tempis_stroke_verdacht in ('Ja', 'Nein')),
  add column if not exists tempis_lyse_empfehlung text
    check (tempis_lyse_empfehlung is null or tempis_lyse_empfehlung in ('Ja', 'Nein')),
  add column if not exists lyse_kontraindikation_vor_untersuchung text
    check (
      lyse_kontraindikation_vor_untersuchung is null
      or lyse_kontraindikation_vor_untersuchung in ('Ja', 'Nein')
    ),
  add column if not exists lyse_kontraindikation_nach_untersuchung text
    check (
      lyse_kontraindikation_nach_untersuchung is null
      or lyse_kontraindikation_nach_untersuchung in ('Ja', 'Nein')
    ),
  add column if not exists lyse_kontraindikation_nach_welche text,
  add column if not exists lyse_kontraindikation_beeinflusst text
    check (
      lyse_kontraindikation_beeinflusst is null
      or lyse_kontraindikation_beeinflusst in ('Ja', 'Nein')
    ),
  add column if not exists lyse_kontraindikation_beeinflusst_text text,
  add column if not exists umstaende_kooperation boolean not null default false,
  add column if not exists umstaende_kooperation_text text,
  add column if not exists umstaende_sprachbarriere boolean not null default false,
  add column if not exists umstaende_sprachbarriere_text text,
  add column if not exists umstaende_gestoerte_ablaeufe boolean not null default false,
  add column if not exists umstaende_gestoerte_ablaeufe_text text,
  add column if not exists umstaende_sonstige boolean not null default false,
  add column if not exists umstaende_sonstige_text text,
  add column if not exists sonstige_anmerkungen_keine boolean not null default false,
  add column if not exists sonstige_anmerkungen text;
