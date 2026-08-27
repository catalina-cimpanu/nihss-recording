create extension if not exists pgcrypto;

create table if not exists public.erhebungen (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  erhebungs_id text not null unique,
  untersuchungstyp text not null check (untersuchungstyp in ('Test', 'Echter Patient')),
  status text not null default 'offen' check (status in ('offen', 'abgeschlossen', 'geloescht')),

  startzeit_untersuchung timestamptz,
  endzeit_untersuchung timestamptz,

  stroke_status text not null default 'nicht entschieden' check (stroke_status in ('nicht entschieden', 'Ja', 'Kein Stroke')),
  stroke_initial_at timestamptz,
  stroke_last_at timestamptz,

  lyse_status text not null default 'nicht entschieden' check (lyse_status in ('nicht entschieden', 'Ja', 'Keine Lyse')),
  lyse_initial_at timestamptz,
  lyse_last_at timestamptz,

  nihss integer not null default 0,
  g_fast integer not null default 0,
  timeline text not null default '',

  nihss_5a_arm_re_motorik_label text,
  punkte_5a integer,
  nihss_5a_arm_re_motorik_initial_at timestamptz,
  nihss_5a_arm_re_motorik_last_at timestamptz,

  nihss_5b_arm_li_motorik_label text,
  punkte_5b integer,
  nihss_5b_arm_li_motorik_initial_at timestamptz,
  nihss_5b_arm_li_motorik_last_at timestamptz,

  nihss_9_aphasie_grob_label text,
  punkte_9_grob integer,
  nihss_9_aphasie_grob_initial_at timestamptz,
  nihss_9_aphasie_grob_last_at timestamptz,

  nihss_10_dysarthrie_label text,
  punkte_10 integer,
  nihss_10_dysarthrie_initial_at timestamptz,
  nihss_10_dysarthrie_last_at timestamptz,

  nihss_4_faziale_parese_label text,
  punkte_4 integer,
  nihss_4_faziale_parese_initial_at timestamptz,
  nihss_4_faziale_parese_last_at timestamptz,

  seite_faziale_parese text check (seite_faziale_parese in ('links', 'rechts') or seite_faziale_parese is null),
  seite_faziale_parese_initial_at timestamptz,
  seite_faziale_parese_last_at timestamptz,

  nihss_1a_vigilanz_label text,
  punkte_1a integer,
  nihss_1a_vigilanz_initial_at timestamptz,
  nihss_1a_vigilanz_last_at timestamptz,

  nihss_2_blickdeviation_label text,
  punkte_2 integer,
  nihss_2_blickdeviation_initial_at timestamptz,
  nihss_2_blickdeviation_last_at timestamptz,

  seite_blickdeviation text check (seite_blickdeviation in ('links', 'rechts') or seite_blickdeviation is null),
  seite_blickdeviation_initial_at timestamptz,
  seite_blickdeviation_last_at timestamptz,

  nihss_6a_bein_re_motorik_label text,
  punkte_6a integer,
  nihss_6a_bein_re_motorik_initial_at timestamptz,
  nihss_6a_bein_re_motorik_last_at timestamptz,

  nihss_6b_bein_li_motorik_label text,
  punkte_6b integer,
  nihss_6b_bein_li_motorik_initial_at timestamptz,
  nihss_6b_bein_li_motorik_last_at timestamptz,

  nihss_1c_aufforderungen_label text,
  punkte_1c integer,
  nihss_1c_aufforderungen_initial_at timestamptz,
  nihss_1c_aufforderungen_last_at timestamptz,

  nihss_8_sensibilitaet_label text,
  punkte_8 integer,
  nihss_8_sensibilitaet_initial_at timestamptz,
  nihss_8_sensibilitaet_last_at timestamptz,

  seite_sensibilitaetsverlust text check (seite_sensibilitaetsverlust in ('links', 'rechts') or seite_sensibilitaetsverlust is null),
  seite_sensibilitaetsverlust_initial_at timestamptz,
  seite_sensibilitaetsverlust_last_at timestamptz,

  nihss_3_gesichtsfeld_label text,
  punkte_3 integer,
  nihss_3_gesichtsfeld_initial_at timestamptz,
  nihss_3_gesichtsfeld_last_at timestamptz,

  seite_hemianopsie text check (seite_hemianopsie in ('links', 'rechts', 'beidseits') or seite_hemianopsie is null),
  seite_hemianopsie_initial_at timestamptz,
  seite_hemianopsie_last_at timestamptz,

  nihss_11_neglect_label text,
  punkte_11 integer,
  nihss_11_neglect_initial_at timestamptz,
  nihss_11_neglect_last_at timestamptz,

  seite_neglect text check (seite_neglect in ('links', 'rechts') or seite_neglect is null),
  seite_neglect_initial_at timestamptz,
  seite_neglect_last_at timestamptz,

  nihss_7_ataxie_label text,
  punkte_7 integer,
  nihss_7_ataxie_initial_at timestamptz,
  nihss_7_ataxie_last_at timestamptz,

  ataxie_rechts text,
  ataxie_rechts_initial_at timestamptz,
  ataxie_rechts_last_at timestamptz,

  ataxie_links text,
  ataxie_links_initial_at timestamptz,
  ataxie_links_last_at timestamptz,

  nihss_1b_orientierung_label text,
  punkte_1b integer,
  nihss_1b_orientierung_initial_at timestamptz,
  nihss_1b_orientierung_last_at timestamptz,

  nihss_9_aphasie_detailliert_label text,
  punkte_9_det integer,
  nihss_9_aphasie_detailliert_initial_at timestamptz,
  nihss_9_aphasie_detailliert_last_at timestamptz
);

create table if not exists public.ereignisse (
  id uuid primary key default gen_random_uuid(),
  erhebung_id uuid not null references public.erhebungen(id) on delete cascade,
  created_at timestamptz not null default now(),
  feld_key text not null,
  feld_label text not null,
  wert_label text not null,
  wert_score integer,
  ereignis_typ text not null default 'click'
);

create index if not exists ereignisse_erhebung_id_created_at_idx
on public.ereignisse (erhebung_id, created_at desc);

create index if not exists erhebungen_status_created_at_idx
on public.erhebungen (status, created_at desc);

-- Prototype only: open access via the anon key. Replace with Auth + RLS
-- before any real clinical use.
alter table public.erhebungen enable row level security;
alter table public.ereignisse enable row level security;

create policy "erhebungen_mvp_all"
on public.erhebungen
for all
to anon, authenticated
using (true)
with check (true);

create policy "ereignisse_mvp_all"
on public.ereignisse
for all
to anon, authenticated
using (true)
with check (true);
