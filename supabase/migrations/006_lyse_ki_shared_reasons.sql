alter table public.erhebungen
  add column if not exists lyse_ki_oak boolean not null default false,
  add column if not exists lyse_ki_zeitfenster boolean not null default false,
  add column if not exists lyse_ki_blutung_cct boolean not null default false,
  add column if not exists lyse_ki_op_trauma boolean not null default false,
  add column if not exists lyse_ki_reanimation boolean not null default false,
  add column if not exists lyse_ki_icb boolean not null default false,
  add column if not exists lyse_ki_blutungsneigung boolean not null default false,
  add column if not exists lyse_ki_schwere_blutung boolean not null default false,
  add column if not exists lyse_ki_endokarditis boolean not null default false,
  add column if not exists lyse_ki_sonstige boolean not null default false,
  add column if not exists lyse_ki_sonstige_text text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'erhebungen'
      and column_name = 'lyse_ki_vor_oak'
  ) then
    update public.erhebungen set
      lyse_ki_oak = coalesce(lyse_ki_vor_oak, false) or coalesce(lyse_ki_nach_oak, false),
      lyse_ki_zeitfenster = coalesce(lyse_ki_vor_zeitfenster, false) or coalesce(lyse_ki_nach_zeitfenster, false),
      lyse_ki_blutung_cct = coalesce(lyse_ki_vor_blutung_cct, false) or coalesce(lyse_ki_nach_blutung_cct, false),
      lyse_ki_op_trauma = coalesce(lyse_ki_vor_op_trauma, false) or coalesce(lyse_ki_nach_op_trauma, false),
      lyse_ki_reanimation = coalesce(lyse_ki_vor_reanimation, false) or coalesce(lyse_ki_nach_reanimation, false),
      lyse_ki_icb = coalesce(lyse_ki_vor_icb, false) or coalesce(lyse_ki_nach_icb, false),
      lyse_ki_blutungsneigung = coalesce(lyse_ki_vor_blutungsneigung, false) or coalesce(lyse_ki_nach_blutungsneigung, false),
      lyse_ki_schwere_blutung = coalesce(lyse_ki_vor_schwere_blutung, false) or coalesce(lyse_ki_nach_schwere_blutung, false),
      lyse_ki_endokarditis = coalesce(lyse_ki_vor_endokarditis, false) or coalesce(lyse_ki_nach_endokarditis, false),
      lyse_ki_sonstige = coalesce(lyse_ki_vor_sonstige, false) or coalesce(lyse_ki_nach_sonstige, false),
      lyse_ki_sonstige_text = coalesce(
        nullif(lyse_ki_nach_sonstige_text, ''),
        nullif(lyse_ki_vor_sonstige_text, '')
      );
  end if;
end $$;

alter table public.erhebungen
  drop column if exists lyse_ki_vor_oak,
  drop column if exists lyse_ki_vor_zeitfenster,
  drop column if exists lyse_ki_vor_blutung_cct,
  drop column if exists lyse_ki_vor_op_trauma,
  drop column if exists lyse_ki_vor_reanimation,
  drop column if exists lyse_ki_vor_icb,
  drop column if exists lyse_ki_vor_blutungsneigung,
  drop column if exists lyse_ki_vor_schwere_blutung,
  drop column if exists lyse_ki_vor_endokarditis,
  drop column if exists lyse_ki_vor_sonstige,
  drop column if exists lyse_ki_vor_sonstige_text,
  drop column if exists lyse_ki_nach_oak,
  drop column if exists lyse_ki_nach_zeitfenster,
  drop column if exists lyse_ki_nach_blutung_cct,
  drop column if exists lyse_ki_nach_op_trauma,
  drop column if exists lyse_ki_nach_reanimation,
  drop column if exists lyse_ki_nach_icb,
  drop column if exists lyse_ki_nach_blutungsneigung,
  drop column if exists lyse_ki_nach_schwere_blutung,
  drop column if exists lyse_ki_nach_endokarditis,
  drop column if exists lyse_ki_nach_sonstige,
  drop column if exists lyse_ki_nach_sonstige_text;
