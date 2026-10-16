alter table public.erhebungen
  add column if not exists umstaende_erschwert text
    check (
      umstaende_erschwert is null
      or umstaende_erschwert in ('Ja', 'Nein')
    ),
  add column if not exists sonstige_anmerkungen_vorhanden text
    check (
      sonstige_anmerkungen_vorhanden is null
      or sonstige_anmerkungen_vorhanden in ('Ja', 'Nein')
    );

update public.erhebungen
set umstaende_erschwert = 'Nein'
where umstaende_keine
  and umstaende_erschwert is null;

update public.erhebungen
set umstaende_erschwert = 'Ja'
where umstaende_erschwert is null
  and (
    umstaende_kooperation
    or umstaende_sprachbarriere
    or umstaende_gestoerte_ablaeufe
    or umstaende_sonstige
  );

update public.erhebungen
set sonstige_anmerkungen_vorhanden = 'Nein'
where sonstige_anmerkungen_keine
  and sonstige_anmerkungen_vorhanden is null;

update public.erhebungen
set sonstige_anmerkungen_vorhanden = 'Ja'
where sonstige_anmerkungen_vorhanden is null
  and sonstige_anmerkungen is not null
  and sonstige_anmerkungen <> '';
