import type { EreignisInsert, ErhebungRow } from "@/lib/supabase/database.types";
import type { NihssOption } from "@/lib/nihss/config";
import { appendTimelineLine, formatTimelineLine } from "@/lib/nihss/timeline";

export const FOLLOWUP_EREIGNIS_TYP = "followup";
export const SHORT_TEXT_MAX = 280;

export const JA_NEIN_OPTIONS: NihssOption[] = [
  { value: "Nein", label: "Nein", score: null, color: "lyse" },
  { value: "Ja", label: "Ja", score: null, color: "stroke" },
];

export type JaNein = "Ja" | "Nein";

export const SYMPTOM_KEYS = [
  "schwindel",
  "kopfschmerzen",
  "asymptomatisch",
  "sonstiges",
] as const;

export type SymptomKey = (typeof SYMPTOM_KEYS)[number];
export type SymptomFlagName = `symptom_${SymptomKey}`;
export type SymptomVorName = `symptom_${SymptomKey}_vor`;

export const SYMPTOME: {
  key: SymptomKey;
  flag: SymptomFlagName;
  selectedBefore: SymptomVorName;
  label: string;
  text?: "symptom_sonstiges_text";
  textBefore?: "symptom_sonstiges_text_vor";
}[] = [
  {
    key: "schwindel",
    flag: "symptom_schwindel",
    selectedBefore: "symptom_schwindel_vor",
    label: "Isolierter Schwindel",
  },
  {
    key: "kopfschmerzen",
    flag: "symptom_kopfschmerzen",
    selectedBefore: "symptom_kopfschmerzen_vor",
    label: "Isolierte Kopfschmerzen",
  },
  {
    key: "asymptomatisch",
    flag: "symptom_asymptomatisch",
    selectedBefore: "symptom_asymptomatisch_vor",
    label: "Pat. (wieder) asymptomatisch",
  },
  {
    key: "sonstiges",
    flag: "symptom_sonstiges",
    selectedBefore: "symptom_sonstiges_vor",
    text: "symptom_sonstiges_text",
    textBefore: "symptom_sonstiges_text_vor",
    label: "Sonstiges",
  },
];

export const UMSTAENDE_KEYS = [
  "hoerminderung",
  "kooperation",
  "sprachbarriere",
  "gestoerte_ablaeufe",
  "ablenkung",
  "technische_probleme",
  "sonstige",
] as const;

export type UmstandKey = (typeof UMSTAENDE_KEYS)[number];

export const KONTRAINDIKATION_OPTIONS = [
  { key: "oak", label: "OAK" },
  { key: "zeitfenster", label: "überschrittenes Zeitfenster" },
  { key: "blutung_cct", label: "Blutung im cCT" },
  { key: "op_trauma", label: "Große OP / Trauma in den letzten 3 Monaten" },
  {
    key: "reanimation",
    label:
      "<10 Tage nach Reanimation, Entbindung, nicht komprimierbare Punktion",
  },
  { key: "icb", label: "Intrakranielle Blutung in der Vorgeschichte" },
  {
    key: "blutungsneigung",
    label: "Bek. Blutungsneigung oder Neoplasie mit erhöhtem Blutungsrisiko",
  },
  { key: "schwere_blutung", label: "Manifeste oder kürzliche schwere Blutung" },
  {
    key: "endokarditis",
    label:
      "Bakterielle Endokarditis, Perikarditis, Pankreatitis, schwere Lebererkrankung",
  },
  { key: "sonstige", label: "Sonstige" },
] as const;

export type KontraindikationKey =
  (typeof KONTRAINDIKATION_OPTIONS)[number]["key"];

export type KiFlagName = `lyse_ki_${KontraindikationKey}`;
export type KiTextName = "lyse_ki_sonstige_text";

export function hasKi(values: FollowupValues): boolean {
  return kontraindikationFields().some((item) => Boolean(values[item.flag]));
}

export function hasUmstandOption(values: FollowupValues): boolean {
  return UMSTAENDE.some((item) => Boolean(values[item.flag]));
}

export function umstaendeAnswer(values: FollowupValues): JaNein | null {
  if (hasUmstandOption(values) || values.umstaende_erschwert === "Ja") {
    return "Ja";
  }
  if (values.umstaende_keine || values.umstaende_erschwert === "Nein") {
    return "Nein";
  }
  return null;
}

export function anmerkungenAnswer(values: FollowupValues): JaNein | null {
  if (
    Boolean(values.sonstige_anmerkungen) ||
    values.sonstige_anmerkungen_vorhanden === "Ja"
  ) {
    return "Ja";
  }
  if (
    values.sonstige_anmerkungen_keine ||
    values.sonstige_anmerkungen_vorhanden === "Nein"
  ) {
    return "Nein";
  }
  return null;
}

export function kiFlag(key: KontraindikationKey): KiFlagName {
  return `lyse_ki_${key}`;
}

export function kontraindikationFields() {
  return KONTRAINDIKATION_OPTIONS.map((item) => ({
    key: item.key,
    label: item.label,
    flag: kiFlag(item.key),
    text: item.key === "sonstige" ? ("lyse_ki_sonstige_text" as const) : null,
  }));
}

export const JA_NEIN_FOLLOWUP_FIELDS = [
  {
    key: "tempis_stroke_verdacht",
    label: "TEMPiS Stroke-Verdacht",
  },
  {
    key: "tempis_lyse_empfehlung",
    label: "TEMPiS Lyse-Empfehlung",
  },
  {
    key: "lyse_kontraindikation_vor_untersuchung",
    label: "Lyse-Kontraindikation vor Untersuchung",
  },
  {
    key: "lyse_kontraindikation_beeinflusst",
    label: "Kontraindikation beeinflusst Lyse",
  },
  {
    key: "umstaende_erschwert",
    label: "Umstände",
  },
  {
    key: "sonstige_anmerkungen_vorhanden",
    label: "Sonstige Anmerkungen",
  },
] as const;

export type FollowupValues = Pick<
  ErhebungRow,
  | "solo_patienten_id"
  | "tempis_stroke_verdacht"
  | "tempis_lyse_empfehlung"
  | "lyse_kontraindikation_vor_untersuchung"
  | "lyse_kontraindikation_beeinflusst"
  | "lyse_kontraindikation_beeinflusst_text"
  | KiFlagName
  | KiTextName
  | SymptomFlagName
  | SymptomVorName
  | "symptom_sonstiges_text"
  | "symptom_sonstiges_text_vor"
  | "umstaende_kooperation"
  | "umstaende_kooperation_text"
  | "umstaende_sprachbarriere"
  | "umstaende_sprachbarriere_text"
  | "umstaende_gestoerte_ablaeufe"
  | "umstaende_gestoerte_ablaeufe_text"
  | "umstaende_ablenkung"
  | "umstaende_ablenkung_text"
  | "umstaende_technische_probleme"
  | "umstaende_technische_probleme_text"
  | "umstaende_hoerminderung"
  | "umstaende_hoerminderung_text"
  | "umstaende_sonstige"
  | "umstaende_sonstige_text"
  | "umstaende_keine"
  | "umstaende_erschwert"
  | "sonstige_anmerkungen_keine"
  | "sonstige_anmerkungen_vorhanden"
  | "sonstige_anmerkungen"
>;

export function emptyFollowupValues(): FollowupValues {
  return {
    solo_patienten_id: null,
    tempis_stroke_verdacht: null,
    tempis_lyse_empfehlung: null,
    lyse_kontraindikation_vor_untersuchung: null,
    lyse_kontraindikation_beeinflusst: null,
    lyse_kontraindikation_beeinflusst_text: null,
    ...emptyKiColumns(),
    symptom_schwindel: false,
    symptom_schwindel_vor: false,
    symptom_kopfschmerzen: false,
    symptom_kopfschmerzen_vor: false,
    symptom_asymptomatisch: false,
    symptom_asymptomatisch_vor: false,
    symptom_sonstiges: false,
    symptom_sonstiges_vor: false,
    symptom_sonstiges_text: null,
    symptom_sonstiges_text_vor: null,
    umstaende_kooperation: false,
    umstaende_kooperation_text: null,
    umstaende_sprachbarriere: false,
    umstaende_sprachbarriere_text: null,
    umstaende_gestoerte_ablaeufe: false,
    umstaende_gestoerte_ablaeufe_text: null,
    umstaende_ablenkung: false,
    umstaende_ablenkung_text: null,
    umstaende_technische_probleme: false,
    umstaende_technische_probleme_text: null,
    umstaende_hoerminderung: false,
    umstaende_hoerminderung_text: null,
    umstaende_sonstige: false,
    umstaende_sonstige_text: null,
    umstaende_keine: false,
    umstaende_erschwert: null,
    sonstige_anmerkungen_keine: false,
    sonstige_anmerkungen_vorhanden: null,
    sonstige_anmerkungen: null,
  };
}

export const UMSTAENDE: {
  key: UmstandKey;
  flag: keyof FollowupValues;
  text: keyof FollowupValues;
  label: string;
}[] = [
  {
    key: "kooperation",
    flag: "umstaende_kooperation",
    text: "umstaende_kooperation_text",
    label: "Eingeschränkte Kooperation",
  },
  {
    key: "sprachbarriere",
    flag: "umstaende_sprachbarriere",
    text: "umstaende_sprachbarriere_text",
    label: "Sprachbarriere",
  },
  {
    key: "hoerminderung",
    flag: "umstaende_hoerminderung",
    text: "umstaende_hoerminderung_text",
    label: "Hörminderung",
  },	
  {
    key: "gestoerte_ablaeufe",
    flag: "umstaende_gestoerte_ablaeufe",
    text: "umstaende_gestoerte_ablaeufe_text",
    label: "Gestörte Abläufe",
  },
  {
    key: "ablenkung",
    flag: "umstaende_ablenkung",
    text: "umstaende_ablenkung_text",
    label:
      "Ablenkung durch stressige Gesamtsituation (viele Konsile, viele Anrufe etc.)",
  },
  {
    key: "technische_probleme",
    flag: "umstaende_technische_probleme",
    text: "umstaende_technische_probleme_text",
    label: "Technische Probleme (Internetverbindung, Teladoc-Verbindung etc.)",
  },
  {
    key: "sonstige",
    flag: "umstaende_sonstige",
    text: "umstaende_sonstige_text",
    label: "Sonstige",
  },
];

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** The Solo-Besuch-ID (column solo_patienten_id) has exactly this many digits. */
export const SOLO_BESUCH_ID_LENGTH = 6;
export const SOLO_BESUCH_ID_ERROR = `Die Solo-Besuch-ID muss genau ${SOLO_BESUCH_ID_LENGTH} Ziffern haben.`;

/** Digits only, never more than SOLO_BESUCH_ID_LENGTH. */
export function soloBesuchIdDigits(value: string): string {
  return digitsOnly(value).slice(0, SOLO_BESUCH_ID_LENGTH);
}

export function soloBesuchIdState(
  value: string | null | undefined,
): "missing" | "incomplete" | "ok" {
  if (!value) {
    return "missing";
  }
  return value.length === SOLO_BESUCH_ID_LENGTH && /^\d+$/.test(value)
    ? "ok"
    : "incomplete";
}

export function clipShortText(value: string): string {
  return value.slice(0, SHORT_TEXT_MAX);
}

function emptyKiColumns(): Record<KiFlagName, boolean> &
  Record<KiTextName, string | null> {
  const next = {} as Record<KiFlagName, boolean> &
    Record<KiTextName, string | null>;
  for (const item of KONTRAINDIKATION_OPTIONS) {
    next[kiFlag(item.key)] = false;
  }
  next.lyse_ki_sonstige_text = null;
  return next;
}

function clipKiSonstige(next: ErhebungRow) {
  if (!next.lyse_ki_sonstige) {
    next.lyse_ki_sonstige_text = null;
    return;
  }
  if (typeof next.lyse_ki_sonstige_text === "string") {
    next.lyse_ki_sonstige_text = clipShortText(next.lyse_ki_sonstige_text) || null;
  }
}

export function applyFollowupPatch(
  erhebung: ErhebungRow,
  patch: Partial<ErhebungRow>,
): ErhebungRow {
  const next: ErhebungRow = { ...erhebung, ...patch };

  if (patch.solo_patienten_id != null) {
    next.solo_patienten_id = soloBesuchIdDigits(String(patch.solo_patienten_id)) || null;
  }

  if (next.lyse_kontraindikation_vor_untersuchung !== "Ja") {
    Object.assign(next, emptyKiColumns());
  }
  clipKiSonstige(next);
  if (!hasKi(next)) {
    next.lyse_kontraindikation_beeinflusst = null;
  }
  if (next.lyse_kontraindikation_beeinflusst !== "Ja") {
    next.lyse_kontraindikation_beeinflusst_text = null;
  } else if (typeof next.lyse_kontraindikation_beeinflusst_text === "string") {
    next.lyse_kontraindikation_beeinflusst_text =
      clipShortText(next.lyse_kontraindikation_beeinflusst_text) || null;
  }

  if (patch.umstaende_erschwert === "Nein" || patch.umstaende_keine === true) {
    next.umstaende_keine = true;
    next.umstaende_erschwert = "Nein";
    for (const item of UMSTAENDE) {
      Object.assign(next, { [item.flag]: false, [item.text]: null });
    }
  }
  if (patch.umstaende_erschwert === "Ja") {
    next.umstaende_keine = false;
    next.umstaende_erschwert = "Ja";
  }

  for (const item of UMSTAENDE) {
    if (next[item.flag]) {
      next.umstaende_keine = false;
      if (item.flag in patch) {
        next.umstaende_erschwert = "Ja";
      }
    }
    if (!next[item.flag]) {
      Object.assign(next, { [item.text]: null });
    } else if (typeof next[item.text] === "string") {
      Object.assign(next, { [item.text]: clipShortText(String(next[item.text])) });
    }
  }

  if (
    patch.sonstige_anmerkungen_vorhanden === "Nein" ||
    patch.sonstige_anmerkungen_keine === true
  ) {
    next.sonstige_anmerkungen_keine = true;
    next.sonstige_anmerkungen_vorhanden = "Nein";
    next.sonstige_anmerkungen = null;
  } else if (patch.sonstige_anmerkungen_vorhanden === "Ja") {
    next.sonstige_anmerkungen_keine = false;
    next.sonstige_anmerkungen_vorhanden = "Ja";
  } else if (patch.sonstige_anmerkungen != null && patch.sonstige_anmerkungen !== "") {
    next.sonstige_anmerkungen_keine = false;
    next.sonstige_anmerkungen_vorhanden = "Ja";
    next.sonstige_anmerkungen = clipShortText(patch.sonstige_anmerkungen);
  } else if (next.sonstige_anmerkungen_keine) {
    next.sonstige_anmerkungen = null;
  } else if (typeof next.sonstige_anmerkungen === "string") {
    next.sonstige_anmerkungen = clipShortText(next.sonstige_anmerkungen) || null;
  }

  for (const item of SYMPTOME) {
    if (item.selectedBefore in patch) {
      Object.assign(next, {
        [item.selectedBefore]:
          Boolean(erhebung[item.selectedBefore]) || Boolean(patch[item.selectedBefore]),
      });
    }
    if (!item.text || !item.textBefore) {
      continue;
    }
    if (!next[item.flag]) {
      next[item.text] = null;
    } else {
      const text = next[item.text];
      if (typeof text === "string") {
        next[item.text] = clipShortText(text) || null;
      }
    }
    if (item.textBefore in patch) {
      const previousText = erhebung[item.textBefore];
      const incomingText = patch[item.textBefore];
      const incoming =
        typeof incomingText === "string"
          ? clipShortText(incomingText) || null
          : null;
      next[item.textBefore] = previousText || incoming;
    }
  }

  return next;
}

export function followupEreignisseFromPatch(
  next: ErhebungRow,
  previous: ErhebungRow,
  patch: Partial<ErhebungRow>,
): EreignisInsert[] {
  const events: EreignisInsert[] = [];

  for (const field of JA_NEIN_FOLLOWUP_FIELDS) {
    const derivedJaNein = field.key === "umstaende_erschwert";
    if (!derivedJaNein && !(field.key in patch)) {
      continue;
    }
    const value = next[field.key];
    if (value !== previous[field.key] && (value === "Ja" || value === "Nein")) {
      events.push(followupEreignis(next, field.key, field.label, value));
    }
  }

  for (const item of SYMPTOME) {
    if (!(item.flag in patch) || next[item.flag] === previous[item.flag]) {
      continue;
    }
    events.push(
      followupEreignis(next, item.flag, item.label, next[item.flag] ? "Ja" : "Nein"),
    );
  }

  for (const item of UMSTAENDE) {
    if (!(item.flag in patch) || next[item.flag] === previous[item.flag]) {
      continue;
    }
    events.push(
      followupEreignis(
        next,
        String(item.flag),
        item.label,
        next[item.flag] ? "Ja" : "Nein",
      ),
    );
  }

  for (const item of kontraindikationFields()) {
    if (item.flag in patch && next[item.flag] !== previous[item.flag]) {
      events.push(
        followupEreignis(
          next,
          item.flag,
          item.label,
          next[item.flag] ? "Ja" : "Nein",
        ),
      );
    }
  }

  if (
    "umstaende_keine" in patch &&
    next.umstaende_keine !== previous.umstaende_keine
  ) {
    events.push(
      followupEreignis(
        next,
        "umstaende_keine",
        "Umstände",
        next.umstaende_keine ? "Keine" : "Nein",
      ),
    );
  }

  if (
    "sonstige_anmerkungen_keine" in patch &&
    next.sonstige_anmerkungen_keine !== previous.sonstige_anmerkungen_keine
  ) {
    events.push(
      followupEreignis(
        next,
        "sonstige_anmerkungen_keine",
        "Sonstige Anmerkungen",
        next.sonstige_anmerkungen_keine ? "Keine" : "Nein",
      ),
    );
  }

  return events;
}

export function applyFollowupChange(
  erhebung: ErhebungRow,
  patch: Partial<ErhebungRow>,
  now: Date = new Date(),
): { erhebung: ErhebungRow; ereignisse: EreignisInsert[] } {
  if (erhebung.followup_status === "abgeschlossen") {
    return { erhebung, ereignisse: [] };
  }
  const next = applyFollowupPatch(erhebung, patch);
  const ereignisse = followupEreignisseFromPatch(next, erhebung, patch);

  let timeline = next.timeline;
  for (const event of ereignisse) {
    timeline = appendTimelineLine(
      timeline,
      formatTimelineLine(now, event.feld_label, event.wert_label),
    );
  }

  return { erhebung: { ...next, timeline }, ereignisse };
}

export function followupEreignis(
  erhebung: ErhebungRow,
  feldKey: string,
  feldLabel: string,
  wertLabel: string,
): EreignisInsert {
  return {
    erhebung_id: erhebung.id,
    feld_key: feldKey,
    feld_label: feldLabel,
    wert_label: wertLabel,
    wert_score: null,
    ereignis_typ: FOLLOWUP_EREIGNIS_TYP,
  };
}

export function preExamFollowupPatch(
  values: FollowupValues,
): Partial<FollowupValues> {
  const patch: Partial<FollowupValues> = {
    solo_patienten_id: soloBesuchIdDigits(values.solo_patienten_id ?? "") || null,
  };

  for (const item of SYMPTOME) {
    const selected = Boolean(values[item.flag]);
    Object.assign(patch, {
      [item.flag]: selected,
      [item.selectedBefore]: selected,
    });
    if (!item.text || !item.textBefore) {
      continue;
    }
    const text = values[item.text];
    const clipped =
      selected && typeof text === "string" ? clipShortText(text) || null : null;
    Object.assign(patch, {
      [item.text]: clipped,
      [item.textBefore]: clipped,
    });
  }

  return patch;
}
