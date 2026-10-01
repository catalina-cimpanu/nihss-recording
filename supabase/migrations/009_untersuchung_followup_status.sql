do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'erhebungen'
      and column_name = 'status'
  )
  and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'erhebungen'
      and column_name = 'untersuchung_status'
  ) then
    alter table public.erhebungen rename column status to untersuchung_status;
  end if;
end $$;

alter table public.erhebungen
  add column if not exists followup_status text not null default 'offen'
    check (followup_status in ('offen', 'abgeschlossen')),
  add column if not exists followup_abgeschlossen_at timestamptz;
