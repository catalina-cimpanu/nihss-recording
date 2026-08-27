export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;

export type Database = {
  public: {
    Tables: {
      erhebungen: {
        Row: ErhebungRow;
        Insert: ErhebungInsert;
        Update: ErhebungUpdate;
        Relationships: [];
      };
      ereignisse: {
        Row: EreignisRow;
        Insert: EreignisInsert;
        Update: EreignisUpdate;
        Relationships: [
          {
            foreignKeyName: "ereignisse_erhebung_id_fkey";
            columns: ["erhebung_id"];
            isOneToOne: false;
            referencedRelation: "erhebungen";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ErhebungRow = {
  id: string;
  created_at: Timestamp;
  erhebungs_id: string;
  untersuchungstyp: "Test" | "Echter Patient";
  status: "offen" | "abgeschlossen" | "geloescht";
  startzeit_untersuchung: Timestamp | null;
  endzeit_untersuchung: Timestamp | null;
  stroke_status: "nicht entschieden" | "Ja" | "Kein Stroke";
  stroke_initial_at: Timestamp | null;
  stroke_last_at: Timestamp | null;
  lyse_status: "nicht entschieden" | "Ja" | "Keine Lyse";
  lyse_initial_at: Timestamp | null;
  lyse_last_at: Timestamp | null;
  nihss: number;
  g_fast: number;
  timeline: string;
  nihss_5a_arm_re_motorik_label: string | null;
  punkte_5a: number | null;
  nihss_5a_arm_re_motorik_initial_at: Timestamp | null;
  nihss_5a_arm_re_motorik_last_at: Timestamp | null;
  nihss_5b_arm_li_motorik_label: string | null;
  punkte_5b: number | null;
  nihss_5b_arm_li_motorik_initial_at: Timestamp | null;
  nihss_5b_arm_li_motorik_last_at: Timestamp | null;
  nihss_9_aphasie_grob_label: string | null;
  punkte_9_grob: number | null;
  nihss_9_aphasie_grob_initial_at: Timestamp | null;
  nihss_9_aphasie_grob_last_at: Timestamp | null;
  nihss_10_dysarthrie_label: string | null;
  punkte_10: number | null;
  nihss_10_dysarthrie_initial_at: Timestamp | null;
  nihss_10_dysarthrie_last_at: Timestamp | null;
  nihss_4_faziale_parese_label: string | null;
  punkte_4: number | null;
  nihss_4_faziale_parese_initial_at: Timestamp | null;
  nihss_4_faziale_parese_last_at: Timestamp | null;
  seite_faziale_parese: "links" | "rechts" | null;
  seite_faziale_parese_initial_at: Timestamp | null;
  seite_faziale_parese_last_at: Timestamp | null;
  nihss_1a_vigilanz_label: string | null;
  punkte_1a: number | null;
  nihss_1a_vigilanz_initial_at: Timestamp | null;
  nihss_1a_vigilanz_last_at: Timestamp | null;
  nihss_2_blickdeviation_label: string | null;
  punkte_2: number | null;
  nihss_2_blickdeviation_initial_at: Timestamp | null;
  nihss_2_blickdeviation_last_at: Timestamp | null;
  seite_blickdeviation: "links" | "rechts" | null;
  seite_blickdeviation_initial_at: Timestamp | null;
  seite_blickdeviation_last_at: Timestamp | null;
  nihss_6a_bein_re_motorik_label: string | null;
  punkte_6a: number | null;
  nihss_6a_bein_re_motorik_initial_at: Timestamp | null;
  nihss_6a_bein_re_motorik_last_at: Timestamp | null;
  nihss_6b_bein_li_motorik_label: string | null;
  punkte_6b: number | null;
  nihss_6b_bein_li_motorik_initial_at: Timestamp | null;
  nihss_6b_bein_li_motorik_last_at: Timestamp | null;
  nihss_1c_aufforderungen_label: string | null;
  punkte_1c: number | null;
  nihss_1c_aufforderungen_initial_at: Timestamp | null;
  nihss_1c_aufforderungen_last_at: Timestamp | null;
  nihss_8_sensibilitaet_label: string | null;
  punkte_8: number | null;
  nihss_8_sensibilitaet_initial_at: Timestamp | null;
  nihss_8_sensibilitaet_last_at: Timestamp | null;
  seite_sensibilitaetsverlust: "links" | "rechts" | null;
  seite_sensibilitaetsverlust_initial_at: Timestamp | null;
  seite_sensibilitaetsverlust_last_at: Timestamp | null;
  nihss_3_gesichtsfeld_label: string | null;
  punkte_3: number | null;
  nihss_3_gesichtsfeld_initial_at: Timestamp | null;
  nihss_3_gesichtsfeld_last_at: Timestamp | null;
  seite_hemianopsie: "links" | "rechts" | "beidseits" | null;
  seite_hemianopsie_initial_at: Timestamp | null;
  seite_hemianopsie_last_at: Timestamp | null;
  nihss_11_neglect_label: string | null;
  punkte_11: number | null;
  nihss_11_neglect_initial_at: Timestamp | null;
  nihss_11_neglect_last_at: Timestamp | null;
  seite_neglect: "links" | "rechts" | null;
  seite_neglect_initial_at: Timestamp | null;
  seite_neglect_last_at: Timestamp | null;
  nihss_7_ataxie_label: string | null;
  punkte_7: number | null;
  nihss_7_ataxie_initial_at: Timestamp | null;
  nihss_7_ataxie_last_at: Timestamp | null;
  ataxie_rechts: string | null;
  ataxie_rechts_initial_at: Timestamp | null;
  ataxie_rechts_last_at: Timestamp | null;
  ataxie_links: string | null;
  ataxie_links_initial_at: Timestamp | null;
  ataxie_links_last_at: Timestamp | null;
  nihss_1b_orientierung_label: string | null;
  punkte_1b: number | null;
  nihss_1b_orientierung_initial_at: Timestamp | null;
  nihss_1b_orientierung_last_at: Timestamp | null;
  nihss_9_aphasie_detailliert_label: string | null;
  punkte_9_det: number | null;
  nihss_9_aphasie_detailliert_initial_at: Timestamp | null;
  nihss_9_aphasie_detailliert_last_at: Timestamp | null;
};

export type ErhebungInsert = {
  id?: string;
  created_at?: Timestamp;
  erhebungs_id: string;
  untersuchungstyp: ErhebungRow["untersuchungstyp"];
  status?: ErhebungRow["status"];
  startzeit_untersuchung?: Timestamp | null;
  endzeit_untersuchung?: Timestamp | null;
  stroke_status?: ErhebungRow["stroke_status"];
  stroke_initial_at?: Timestamp | null;
  stroke_last_at?: Timestamp | null;
  lyse_status?: ErhebungRow["lyse_status"];
  lyse_initial_at?: Timestamp | null;
  lyse_last_at?: Timestamp | null;
  nihss?: number;
  g_fast?: number;
  timeline?: string;
} & Partial<
  Omit<
    ErhebungRow,
    | "id"
    | "created_at"
    | "erhebungs_id"
    | "untersuchungstyp"
    | "status"
    | "startzeit_untersuchung"
    | "endzeit_untersuchung"
    | "stroke_status"
    | "stroke_initial_at"
    | "stroke_last_at"
    | "lyse_status"
    | "lyse_initial_at"
    | "lyse_last_at"
    | "nihss"
    | "g_fast"
    | "timeline"
  >
>;

export type ErhebungUpdate = Partial<ErhebungRow>;

export type EreignisRow = {
  id: string;
  erhebung_id: string;
  created_at: Timestamp;
  feld_key: string;
  feld_label: string;
  wert_label: string;
  wert_score: number | null;
  ereignis_typ: string;
};

export type EreignisInsert = {
  id?: string;
  erhebung_id: string;
  created_at?: Timestamp;
  feld_key: string;
  feld_label: string;
  wert_label: string;
  wert_score?: number | null;
  ereignis_typ?: string;
};

export type EreignisUpdate = Partial<EreignisRow>;
