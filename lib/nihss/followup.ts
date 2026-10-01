import type { EreignisInsert, ErhebungRow } from "@/lib/supabase/database.types";
import type { NihssOption } from "@/lib/nihss/config";
import { appendTimelineLine, formatTimelineLine } from "@/lib/nihss/timeline";

export const FOLLOWUP_EREIGNIS_TYP = "followup";
export const SHORT_TEXT_MAX = 280;

export const JA_NEIN_OPTIONS: NihssOption[] = [
  { value: "Ja", label: "Ja", score: null, color: "stroke" },
  { value: "Nein", label: "Nein", score: null, color: "lyse" },
];

export type JaNein = "Ja" | "Nein";

export const UMSTAENDE_KEYS = [
  "kooperation",
  "sprachbarriere",
  "gestoerte_ablaeufe",
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
    key: "lyse_kontraindikation_nach_untersuchung",
    label: "Lyse-Kontraindikation nach Untersuchung",
  },
  {
    key: "lyse_kontraindikation_beeinflusst",
    label: "Kontraindikation beeinflusst Lyse",
  },
] as const;

export type FollowupValues = Pick<
  ErhebungRow,
  | "solo_patienten_id"
  | "tempis_stroke_verdacht"
  | "tempis_lyse_empfehlung"
  | "lyse_kontraindikation_vor_untersuchung"
  | "lyse_kontraindikation_nach_untersuchung"
  | "lyse_kontraindikation_nach_welche"
  | "lyse_kontraindikation_beeinflusst"
  | "lyse_kontraindikation_beeinflusst_text"
  | KiFlagName
  | KiTextName
  | "umstaende_kooperation"
  | "umstaende_kooperation_text"
  | "umstaende_sprachbarriere"
  | "umstaende_sprachbarriere_text"
  | "umstaende_gestoerte_ablaeufe"
  | "umstaende_gestoerte_ablaeufe_text"
  | "umstaende_sonstige"
  | "umstaende_sonstige_text"
  | "sonstige_anmerkungen_keine"
  | "sonstige_anmerkungen"
>;

export function emptyFollowupValues(): FollowupValues {
  return {
    solo_patienten_id: null,
    tempis_stroke_verdacht: null,
    tempis_lyse_empfehlung: null,
    lyse_kontraindikation_vor_untersuchung: null,
    lyse_kontraindikation_nach_untersuchung: null,
    lyse_kontraindikation_nach_welche: null,
    lyse_kontraindikation_beeinflusst: null,
    lyse_kontraindikation_beeinflusst_text: null,
    ...emptyKiColumns(),
    umstaende_kooperation: false,
    umstaende_kooperation_text: null,
    umstaende_sprachbarriere: false,
    umstaende_sprachbarriere_text: null,
    umstaende_gestoerte_ablaeufe: false,
    umstaende_gestoerte_ablaeufe_text: null,
    umstaende_sonstige: false,
    umstaende_sonstige_text: null,
    sonstige_anmerkungen_keine: false,
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
    key: "gestoerte_ablaeufe",
    flag: "umstaende_gestoerte_ablaeufe",
    text: "umstaende_gestoerte_ablaeufe_text",
    label: "Gestörte Abläufe",
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

function clearKiReasons(next: ErhebungRow) {
  for (const item of KONTRAINDIKATION_OPTIONS) {
    Object.assign(next, { [kiFlag(item.key)]: false });
  }
  next.lyse_ki_sonstige_text = null;
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
    next.solo_patienten_id = digitsOnly(String(patch.solo_patienten_id)) || null;
  }

  if (
    "lyse_kontraindikation_vor_untersuchung" in patch &&
    next.lyse_kontraindikation_vor_untersuchung !== "Ja"
  ) {
    clearKiReasons(next);
  } else {
    clipKiSonstige(next);
  }

  if (typeof next.lyse_kontraindikation_nach_welche === "string") {
    next.lyse_kontraindikation_nach_welche =
      clipShortText(next.lyse_kontraindikation_nach_welche) || null;
  }
  if (typeof next.lyse_kontraindikation_beeinflusst_text === "string") {
    next.lyse_kontraindikation_beeinflusst_text =
      clipShortText(next.lyse_kontraindikation_beeinflusst_text) || null;
  }

  if (next.lyse_kontraindikation_nach_untersuchung !== "Ja") {
    next.lyse_kontraindikation_nach_welche = null;
    next.lyse_kontraindikation_beeinflusst = null;
    next.lyse_kontraindikation_beeinflusst_text = null;
  } else {
    if (next.lyse_kontraindikation_beeinflusst !== "Ja") {
      next.lyse_kontraindikation_beeinflusst_text = null;
    }
  }

  for (const item of UMSTAENDE) {
    if (!next[item.flag]) {
      Object.assign(next, { [item.text]: null });
    } else if (typeof next[item.text] === "string") {
      Object.assign(next, { [item.text]: clipShortText(String(next[item.text])) });
    }
  }

  if (patch.sonstige_anmerkungen != null && patch.sonstige_anmerkungen !== "") {
    next.sonstige_anmerkungen_keine = false;
    next.sonstige_anmerkungen = clipShortText(patch.sonstige_anmerkungen);
  } else if (patch.sonstige_anmerkungen_keine) {
    next.sonstige_anmerkungen_keine = true;
    next.sonstige_anmerkungen = null;
  } else if (next.sonstige_anmerkungen_keine) {
    next.sonstige_anmerkungen = null;
  } else if (typeof next.sonstige_anmerkungen === "string") {
    next.sonstige_anmerkungen = clipShortText(next.sonstige_anmerkungen) || null;
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
    if (!(field.key in patch)) {
      continue;
    }
    const value = next[field.key];
    if (value !== previous[field.key] && (value === "Ja" || value === "Nein")) {
      events.push(followupEreignis(next, field.key, field.label, value));
    }
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
    if (!(item.flag in patch) || next[item.flag] === previous[item.flag]) {
      continue;
    }
    events.push(
      followupEreignis(
        next,
        item.flag,
        item.label,
        next[item.flag] ? "Ja" : "Nein",
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

export function isSoloPatientenIdMissing(values: FollowupValues): boolean {
  return values.solo_patienten_id == null || values.solo_patienten_id === "";
}

export function isLyseKiVorMissing(values: FollowupValues): boolean {
  return values.lyse_kontraindikation_vor_untersuchung == null;
}

export function needsPreExamFollowup(erhebung: FollowupValues): boolean {
  return isSoloPatientenIdMissing(erhebung);
}

export function preExamFollowupPatch(
  values: FollowupValues,
): Partial<FollowupValues> {
  const patch: Partial<FollowupValues> = {
    solo_patienten_id: digitsOnly(values.solo_patienten_id ?? "") || null,
    lyse_kontraindikation_vor_untersuchung:
      values.lyse_kontraindikation_vor_untersuchung,
  };

  for (const item of kontraindikationFields()) {
    Object.assign(patch, { [item.flag]: Boolean(values[item.flag]) });
    if (item.text) {
      const text = values[item.text];
      Object.assign(patch, {
        [item.text]:
          values.lyse_kontraindikation_vor_untersuchung === "Ja" &&
          values[item.flag] &&
          typeof text === "string"
            ? clipShortText(text) || null
            : null,
      });
    }
  }

  return patch;
}
