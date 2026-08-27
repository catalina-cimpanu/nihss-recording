import type { ErhebungRow } from "@/lib/supabase/database.types";

export const NIHSS_SCORE_KEYS = [
  "punkte_1a",
  "punkte_1b",
  "punkte_1c",
  "punkte_2",
  "punkte_3",
  "punkte_4",
  "punkte_5a",
  "punkte_5b",
  "punkte_6a",
  "punkte_6b",
  "punkte_7",
  "punkte_8",
  "punkte_9_grob",
  "punkte_10",
  "punkte_11",
] as const;

export const GFAST_SCORE_KEYS = [
  "punkte_5a",
  "punkte_5b",
  "punkte_9_grob",
  "punkte_10",
  "punkte_4",
] as const;

export type NihssScoreKey = (typeof NIHSS_SCORE_KEYS)[number];
export type GfastScoreKey = (typeof GFAST_SCORE_KEYS)[number];

export type ScoreColor =
  | "score0"
  | "score1"
  | "score2"
  | "score3"
  | "score4"
  | "scoreUN"
  | "stroke"
  | "lyse"
  | "side";

export type NihssOption = {
  value: string;
  label: string;
  score: number | null;
  special?: "UN" | "ignored";
  color: ScoreColor;
};

export type ClickableField = {
  key: string;
  label: string;
  prompt?: string;
  valueColumn: keyof ErhebungRow;
  scoreColumn?: keyof ErhebungRow;
  initialAtColumn: keyof ErhebungRow;
  lastAtColumn: keyof ErhebungRow;
  contributesToNihss: boolean;
  contributesToGfast: boolean;
  options: NihssOption[];
  selection?: "single" | "multiple";
  visibleWhen?: (row: ErhebungRow) => boolean;
};

export const MULTI_VALUE_SEPARATOR = " | ";

export function parseStoredValues(value: unknown): string[] {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }

  return value
    .split(MULTI_VALUE_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function isOptionSelected(
  stored: unknown,
  optionValue: string,
  selection: ClickableField["selection"] = "single",
): boolean {
  if (selection === "multiple") {
    return parseStoredValues(stored).includes(optionValue);
  }

  return stored === optionValue;
}

export function isAbnormalField(
  field: ClickableField,
  erhebung: ErhebungRow,
): boolean {
  if (field.scoreColumn) {
    const score = erhebung[field.scoreColumn];
    return typeof score === "number" && score > 0;
  }

  if (field.selection === "multiple") {
    return parseStoredValues(erhebung[field.valueColumn]).some(
      (value) => value.startsWith("1 -") || value.startsWith("1 –"),
    );
  }

  const value = erhebung[field.valueColumn];
  return typeof value === "string" && value.length > 0;
}

export type FormSection = {
  title: string;
  prompt?: string;
  fieldKeys: string[];
};

function option(
  label: string,
  score: number | null,
  color: ScoreColor,
  special?: "UN" | "ignored",
): NihssOption {
  return { value: label, label, score, color, special };
}

function sideOption(value: string): NihssOption {
  return { value, label: value, score: null, color: "side" };
}

function abnormal(scoreColumn: keyof ErhebungRow) {
  return (row: ErhebungRow) => {
    const score = row[scoreColumn];
    return typeof score === "number" && score > 0;
  };
}

const ARM_OPTIONS: NihssOption[] = [
  option("0 – Kein Absinken (hält 10 Sek.)", 0, "score0"),
  option("1 – Absinken vor 10 Sek.; berührt Bett nicht", 1, "score1"),
  option("2 – Anheben gegen Schwerkraft möglich", 2, "score2"),
  option("3 – Kein Anheben gegen Schwerkraft", 3, "score3"),
  option("4 – Keine Bewegung", 4, "score4"),
  option("UN – Amputation / Gelenkversteifung", 0, "scoreUN", "UN"),
];

const LEG_OPTIONS: NihssOption[] = [
  option("0 – Kein Absinken (hält 5 Sek.)", 0, "score0"),
  option("1 – Absinken; berührt Unterlage nicht", 1, "score1"),
  option("2 – Aktive Bewegung gegen Schwerkraft", 2, "score2"),
  option("3 – Kein Anheben gegen Schwerkraft", 3, "score3"),
  option("4 – Keine Bewegung", 4, "score4"),
  option("UN – Amputation / Gelenkversteifung", 0, "scoreUN", "UN"),
];

const APHASIE_OPTIONS: NihssOption[] = [
  option("0 – Keine Aphasie; normal", 0, "score0"),
  option("1 – Leichte bis mittelschwere Aphasie", 1, "score1"),
  option("2 – Schwere Aphasie; Kommunikation fragmentiert", 2, "score2"),
  option("3 – Stumm; globale Aphasie", 3, "score3"),
];

export const NIHSS_FIELDS: ClickableField[] = [
  {
    key: "nihss_5a",
    label: "5a Arm re. Motorik",
    prompt: "„Heben Sie bitte beide Arme“",
    valueColumn: "nihss_5a_arm_re_motorik_label",
    scoreColumn: "punkte_5a",
    initialAtColumn: "nihss_5a_arm_re_motorik_initial_at",
    lastAtColumn: "nihss_5a_arm_re_motorik_last_at",
    contributesToNihss: true,
    contributesToGfast: true,
    options: ARM_OPTIONS,
  },
  {
    key: "nihss_5b",
    label: "5b Arm li. Motorik",
    prompt: "„Heben Sie bitte beide Arme“",
    valueColumn: "nihss_5b_arm_li_motorik_label",
    scoreColumn: "punkte_5b",
    initialAtColumn: "nihss_5b_arm_li_motorik_initial_at",
    lastAtColumn: "nihss_5b_arm_li_motorik_last_at",
    contributesToNihss: true,
    contributesToGfast: true,
    options: ARM_OPTIONS,
  },
  {
    key: "nihss_9_grob",
    label: "9 Aphasie grob",
    prompt: "„Was ist heute passiert?“",
    valueColumn: "nihss_9_aphasie_grob_label",
    scoreColumn: "punkte_9_grob",
    initialAtColumn: "nihss_9_aphasie_grob_initial_at",
    lastAtColumn: "nihss_9_aphasie_grob_last_at",
    contributesToNihss: true,
    contributesToGfast: true,
    options: APHASIE_OPTIONS,
  },
  {
    key: "nihss_10",
    label: "10 Dysarthrie",
    valueColumn: "nihss_10_dysarthrie_label",
    scoreColumn: "punkte_10",
    initialAtColumn: "nihss_10_dysarthrie_initial_at",
    lastAtColumn: "nihss_10_dysarthrie_last_at",
    contributesToNihss: true,
    contributesToGfast: true,
    options: [
      option("0 – Normal", 0, "score0"),
      option("1 – Leicht bis mittelschwer; noch verständlich", 1, "score1"),
      option("2 – Schwer; unverständlich / stumm", 2, "score2"),
      option(
        "UN – Intubation / mechanische Behinderung",
        0,
        "scoreUN",
        "UN",
      ),
    ],
  },
  {
    key: "nihss_4",
    label: "4 Faziale Parese",
    prompt: "„Bitte lächeln Sie / kneifen Sie die Augen zu“",
    valueColumn: "nihss_4_faziale_parese_label",
    scoreColumn: "punkte_4",
    initialAtColumn: "nihss_4_faziale_parese_initial_at",
    lastAtColumn: "nihss_4_faziale_parese_last_at",
    contributesToNihss: true,
    contributesToGfast: true,
    options: [
      option("0 – Normale symmetrische Bewegungen", 0, "score0"),
      option("1 – Geringe Parese (abgeflachte NLF; Asymmetrie)", 1, "score1"),
      option("2 – Partielle Parese (unteres Gesicht)", 2, "score2"),
      option("3 – Vollständige Parese (oberes + unteres Gesicht)", 3, "score3"),
    ],
  },
  {
    key: "seite_faziale_parese",
    label: "Seite der fazialen Parese",
    valueColumn: "seite_faziale_parese",
    initialAtColumn: "seite_faziale_parese_initial_at",
    lastAtColumn: "seite_faziale_parese_last_at",
    contributesToNihss: false,
    contributesToGfast: false,
    options: [sideOption("links"), sideOption("rechts")],
    visibleWhen: abnormal("punkte_4"),
  },
  {
    key: "nihss_1a",
    label: "1a Vigilanz",
    prompt: "Vigilanz? (ergibt sich aus 1.-4.)",
    valueColumn: "nihss_1a_vigilanz_label",
    scoreColumn: "punkte_1a",
    initialAtColumn: "nihss_1a_vigilanz_initial_at",
    lastAtColumn: "nihss_1a_vigilanz_last_at",
    contributesToNihss: true,
    contributesToGfast: false,
    options: [
      option("0 – Wach; unmittelbar antwortend", 0, "score0"),
      option("1 – Benommen; durch geringe Stimulation zu bewegen", 1, "score1"),
      option("2 – Soporös; starke/schmerzhafte Stimulation nötig", 2, "score2"),
      option("3 – Koma; nur motorische/vegetative Reflexe", 3, "score3"),
    ],
  },
  {
    key: "nihss_2",
    label: "2 Blickdeviation",
    prompt: "„Bitte schauen Sie nach links/rechts / Folgen Sie dem Finger“",
    valueColumn: "nihss_2_blickdeviation_label",
    scoreColumn: "punkte_2",
    initialAtColumn: "nihss_2_blickdeviation_initial_at",
    lastAtColumn: "nihss_2_blickdeviation_last_at",
    contributesToNihss: true,
    contributesToGfast: false,
    options: [
      option("0 – Normal", 0, "score0"),
      option("1 – Partielle Blickparese", 1, "score1"),
      option("2 – Forcierte Blickdeviation / komplette Blickparese", 2, "score2"),
    ],
  },
  {
    key: "seite_blickdeviation",
    label: "Seite der Blickdeviation",
    valueColumn: "seite_blickdeviation",
    initialAtColumn: "seite_blickdeviation_initial_at",
    lastAtColumn: "seite_blickdeviation_last_at",
    contributesToNihss: false,
    contributesToGfast: false,
    options: [sideOption("links"), sideOption("rechts")],
    visibleWhen: abnormal("punkte_2"),
  },
  {
    key: "nihss_6a",
    label: "6a Bein re. Motorik",
    prompt: "„Bitte heben Sie das rechte / linke Bein“",
    valueColumn: "nihss_6a_bein_re_motorik_label",
    scoreColumn: "punkte_6a",
    initialAtColumn: "nihss_6a_bein_re_motorik_initial_at",
    lastAtColumn: "nihss_6a_bein_re_motorik_last_at",
    contributesToNihss: true,
    contributesToGfast: false,
    options: LEG_OPTIONS,
  },
  {
    key: "nihss_6b",
    label: "6b Bein li. Motorik",
    prompt: "„Bitte heben Sie das rechte / linke Bein“",
    valueColumn: "nihss_6b_bein_li_motorik_label",
    scoreColumn: "punkte_6b",
    initialAtColumn: "nihss_6b_bein_li_motorik_initial_at",
    lastAtColumn: "nihss_6b_bein_li_motorik_last_at",
    contributesToNihss: true,
    contributesToGfast: false,
    options: LEG_OPTIONS,
  },
  {
    key: "nihss_1c",
    label: "1c Befolgen von Aufforderungen",
    prompt: "Befehle befolgt? (ergibt sich aus 1.-6.)",
    valueColumn: "nihss_1c_aufforderungen_label",
    scoreColumn: "punkte_1c",
    initialAtColumn: "nihss_1c_aufforderungen_initial_at",
    lastAtColumn: "nihss_1c_aufforderungen_last_at",
    contributesToNihss: true,
    contributesToGfast: false,
    options: [
      option("0 – Beide Aufgaben richtig", 0, "score0"),
      option("1 – Eine Aufgabe richtig", 1, "score1"),
      option("2 – Keine Aufgabe richtig", 2, "score2"),
    ],
  },
  {
    key: "nihss_8",
    label: "8 Sensibilität",
    prompt: "„Bitte prüfen Sie die Sensibilität“",
    valueColumn: "nihss_8_sensibilitaet_label",
    scoreColumn: "punkte_8",
    initialAtColumn: "nihss_8_sensibilitaet_initial_at",
    lastAtColumn: "nihss_8_sensibilitaet_last_at",
    contributesToNihss: true,
    contributesToGfast: false,
    options: [
      option("0 – Normal; kein Sensibilitätsverlust", 0, "score0"),
      option("1 – Leichter bis mittelschwerer Verlust", 1, "score1"),
      option("2 – Schwerer bis vollständiger Verlust", 2, "score2"),
    ],
  },
  {
    key: "seite_sensibilitaetsverlust",
    label: "Seite des Sensibilitätsverlusts",
    valueColumn: "seite_sensibilitaetsverlust",
    initialAtColumn: "seite_sensibilitaetsverlust_initial_at",
    lastAtColumn: "seite_sensibilitaetsverlust_last_at",
    contributesToNihss: false,
    contributesToGfast: false,
    options: [sideOption("links"), sideOption("rechts")],
    visibleWhen: abnormal("punkte_8"),
  },
  {
    key: "nihss_3",
    label: "3 Gesichtsfeld",
    prompt: "„Bitte prüfen Sie das Gesichtsfeld“",
    valueColumn: "nihss_3_gesichtsfeld_label",
    scoreColumn: "punkte_3",
    initialAtColumn: "nihss_3_gesichtsfeld_initial_at",
    lastAtColumn: "nihss_3_gesichtsfeld_last_at",
    contributesToNihss: true,
    contributesToGfast: false,
    options: [
      option("0 – Kein homonymer Gesichtsfeldausfall", 0, "score0"),
      option("1 – Partielle homonyme Hemianopsie", 1, "score1"),
      option("2 – Komplette homonyme Hemianopsie", 2, "score2"),
      option("3 – Bilaterale Hemianopsie / Blindheit", 3, "score3"),
    ],
  },
  {
    key: "seite_hemianopsie",
    label: "Seite der Hemianopsie",
    valueColumn: "seite_hemianopsie",
    initialAtColumn: "seite_hemianopsie_initial_at",
    lastAtColumn: "seite_hemianopsie_last_at",
    contributesToNihss: false,
    contributesToGfast: false,
    options: [
      sideOption("links"),
      sideOption("rechts"),
      sideOption("beidseits"),
    ],
    visibleWhen: abnormal("punkte_3"),
  },
  {
    key: "nihss_11",
    label: "11 Neglect",
    prompt: "Neglect / Extinktion? (ergibt sich aus 10.-11.)",
    valueColumn: "nihss_11_neglect_label",
    scoreColumn: "punkte_11",
    initialAtColumn: "nihss_11_neglect_initial_at",
    lastAtColumn: "nihss_11_neglect_last_at",
    contributesToNihss: true,
    contributesToGfast: false,
    options: [
      option("0 – Keine Abnormalität", 0, "score0"),
      option("1 – Unaufmerksamkeit in ≥1 Modalität", 1, "score1"),
      option(
        "2 – Schwere halbseitige Unaufmerksamkeit in ≥2 Modalitäten",
        2,
        "score2",
      ),
    ],
  },
  {
    key: "seite_neglect",
    label: "Seite des Neglects",
    valueColumn: "seite_neglect",
    initialAtColumn: "seite_neglect_initial_at",
    lastAtColumn: "seite_neglect_last_at",
    contributesToNihss: false,
    contributesToGfast: false,
    options: [sideOption("links"), sideOption("rechts")],
    visibleWhen: abnormal("punkte_11"),
  },
  {
    key: "nihss_7",
    label: "7 Extremitätenataxie",
    prompt:
      "„Tippen Sie mit dem Finger auf die Nase / mit der Ferse auf das Knie“",
    valueColumn: "nihss_7_ataxie_label",
    scoreColumn: "punkte_7",
    initialAtColumn: "nihss_7_ataxie_initial_at",
    lastAtColumn: "nihss_7_ataxie_last_at",
    contributesToNihss: true,
    contributesToGfast: false,
    options: [
      option("0 – Fehlend", 0, "score0"),
      option("1 – In einer Extremität vorhanden", 1, "score1"),
      option("2 – In zwei oder mehr Extremitäten vorhanden", 2, "score2"),
    ],
  },
  {
    key: "ataxie_rechts",
    label: "Ataxie rechts",
    valueColumn: "ataxie_rechts",
    initialAtColumn: "ataxie_rechts_initial_at",
    lastAtColumn: "ataxie_rechts_last_at",
    contributesToNihss: false,
    contributesToGfast: false,
    selection: "multiple",
    options: [
      option("0 - keine Ataxie rechts", 0, "score0"),
      option("1 - Ataxie rechtes Bein", 1, "score1"),
      option("1 - Ataxie rechter Arm", 1, "score1"),
    ],
    visibleWhen: abnormal("punkte_7"),
  },
  {
    key: "ataxie_links",
    label: "Ataxie links",
    valueColumn: "ataxie_links",
    initialAtColumn: "ataxie_links_initial_at",
    lastAtColumn: "ataxie_links_last_at",
    contributesToNihss: false,
    contributesToGfast: false,
    selection: "multiple",
    options: [
      option("0 - keine Ataxie links", 0, "score0"),
      option("1 - Ataxie linkes Bein", 1, "score1"),
      option("1 - Ataxie linker Arm", 1, "score1"),
    ],
    visibleWhen: abnormal("punkte_7"),
  },
  {
    key: "nihss_1b",
    label: "1b Orientierung",
    prompt: "„Wie alt sind Sie? Welchen Monat haben wir?“",
    valueColumn: "nihss_1b_orientierung_label",
    scoreColumn: "punkte_1b",
    initialAtColumn: "nihss_1b_orientierung_initial_at",
    lastAtColumn: "nihss_1b_orientierung_last_at",
    contributesToNihss: true,
    contributesToGfast: false,
    options: [
      option("0 – Beide Fragen richtig", 0, "score0"),
      option("1 – Eine Frage richtig", 1, "score1"),
      option("2 – Keine Frage richtig", 2, "score2"),
    ],
  },
  {
    key: "nihss_9_det",
    label: "9 Aphasie detailliert",
    prompt: "Optional: Ausführlichere Aphasie-Testung",
    valueColumn: "nihss_9_aphasie_detailliert_label",
    scoreColumn: "punkte_9_det",
    initialAtColumn: "nihss_9_aphasie_detailliert_initial_at",
    lastAtColumn: "nihss_9_aphasie_detailliert_last_at",
    contributesToNihss: false,
    contributesToGfast: false,
    options: [
      ...APHASIE_OPTIONS,
      option("Keine detaillierte Testung", null, "scoreUN", "ignored"),
    ],
  },
];

export const STROKE_FIELD: ClickableField = {
  key: "stroke",
  label: "Stroke",
  valueColumn: "stroke_status",
  initialAtColumn: "stroke_initial_at",
  lastAtColumn: "stroke_last_at",
  contributesToNihss: false,
  contributesToGfast: false,
  options: [
    { value: "nicht entschieden", label: "nicht entschieden", score: null, color: "stroke" },
    { value: "Ja", label: "Stroke Ja", score: null, color: "stroke" },
    { value: "Kein Stroke", label: "Kein Stroke", score: null, color: "stroke" },
  ],
};

export const LYSE_FIELD: ClickableField = {
  key: "lyse",
  label: "Lyse",
  valueColumn: "lyse_status",
  initialAtColumn: "lyse_initial_at",
  lastAtColumn: "lyse_last_at",
  contributesToNihss: false,
  contributesToGfast: false,
  options: [
    { value: "nicht entschieden", label: "nicht entschieden", score: null, color: "lyse" },
    { value: "Ja", label: "Lyse Ja", score: null, color: "lyse" },
    { value: "Keine Lyse", label: "Keine Lyse", score: null, color: "lyse" },
  ],
};

export const FORM_SECTIONS: FormSection[] = [
  {
    title: "Motorik Arme",
    prompt: "„Heben Sie bitte beide Arme“",
    fieldKeys: ["nihss_5a", "nihss_5b"],
  },
  {
    title: "Aphasie grob und Dysarthrie",
    prompt: "„Was ist heute passiert?“",
    fieldKeys: ["nihss_9_grob", "nihss_10"],
  },
  {
    title: "Faziale Parese",
    prompt: "„Bitte lächeln Sie / kneifen Sie die Augen zu“",
    fieldKeys: ["nihss_4", "seite_faziale_parese"],
  },
  {
    title: "Vigilanz",
    prompt: "Vigilanz? (ergibt sich aus 1.-4.)",
    fieldKeys: ["nihss_1a"],
  },
  {
    title: "Blickdeviation",
    prompt: "„Bitte schauen Sie nach links/rechts / Folgen Sie dem Finger“",
    fieldKeys: ["nihss_2", "seite_blickdeviation"],
  },
  {
    title: "Motorik Beine",
    prompt: "„Bitte heben Sie das rechte / linke Bein“",
    fieldKeys: ["nihss_6a", "nihss_6b"],
  },
  {
    title: "Befolgen von Aufforderungen",
    prompt: "Befehle befolgt? (ergibt sich aus 1.-6.)",
    fieldKeys: ["nihss_1c"],
  },
  {
    title: "Sensibilität",
    prompt: "„Bitte prüfen Sie die Sensibilität“",
    fieldKeys: ["nihss_8", "seite_sensibilitaetsverlust"],
  },
  {
    title: "Gesichtsfeld",
    prompt: "„Bitte prüfen Sie das Gesichtsfeld“",
    fieldKeys: ["nihss_3", "seite_hemianopsie"],
  },
  {
    title: "Neglect",
    prompt: "Neglect / Extinktion? (ergibt sich aus 10.-11.)",
    fieldKeys: ["nihss_11", "seite_neglect"],
  },
  {
    title: "Extremitätenataxie",
    prompt:
      "„Tippen Sie mit dem Finger auf die Nase / mit der Ferse auf das Knie“",
    fieldKeys: ["nihss_7", "ataxie_rechts", "ataxie_links"],
  },
  {
    title: "Orientierung",
    prompt: "„Wie alt sind Sie? Welchen Monat haben wir?“",
    fieldKeys: ["nihss_1b"],
  },
  {
    title: "Aphasie detailliert",
    prompt: "Optional: Ausführlichere Aphasie-Testung",
    fieldKeys: ["nihss_9_det"],
  },
];

const FIELD_BY_KEY = new Map(
  [...NIHSS_FIELDS, STROKE_FIELD, LYSE_FIELD].map((field) => [field.key, field]),
);

export function getFieldByKey(key: string): ClickableField | undefined {
  return FIELD_BY_KEY.get(key);
}
