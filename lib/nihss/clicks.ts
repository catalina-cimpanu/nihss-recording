import type {
  EreignisInsert,
  ErhebungRow,
  Pause,
  PauseGrund,
} from "@/lib/supabase/database.types";
import {
  MULTI_VALUE_SEPARATOR,
  getFieldByKey,
  parseStoredValues,
  type ClickableField,
  type NihssOption,
} from "@/lib/nihss/config";
import { calculateGfast, calculateNihss } from "@/lib/nihss/scoring";
import {
  appendTimelineLine,
  formatBerlinTime,
  formatTimelineLine,
} from "@/lib/nihss/timeline";
import { isLyseBeforeStroke, isPaused } from "@/lib/nihss/duration";
import { hasRealAtaxiaLimbFinding } from "@/lib/nihss/validation-exam";

function setColumn<K extends keyof ErhebungRow>(
  row: ErhebungRow,
  key: K,
  value: ErhebungRow[K],
) {
  row[key] = value;
}

function nextMultiValues(
  field: ClickableField,
  currentStored: unknown,
  option: NihssOption,
): string[] {
  const current = parseStoredValues(currentStored);
  const exclusiveValues = new Set(
    field.options.filter((item) => item.score === 0).map((item) => item.value),
  );
  const isExclusive = exclusiveValues.has(option.value);

  if (isExclusive) {
    return current.includes(option.value) ? [] : [option.value];
  }

  const withoutExclusive = current.filter((value) => !exclusiveValues.has(value));
  if (withoutExclusive.includes(option.value)) {
    return withoutExclusive.filter((value) => value !== option.value);
  }

  return [...withoutExclusive, option.value];
}

export function applyFieldClick(args: {
  erhebung: ErhebungRow;
  field: ClickableField;
  option: NihssOption;
  now: Date;
}): {
  erhebung: ErhebungRow;
  ereignis: EreignisInsert;
  ereignisse: EreignisInsert[];
} {
  const { field, option, now } = args;
  const startEvents: EreignisInsert[] = [];
  let source = args.erhebung;

  if (!source.startzeit_untersuchung && source.untersuchung_status !== "abgeschlossen") {
    const started = applyLifecycleEvent({
      erhebung: source,
      now,
      kind: "start",
    });
    source = started.erhebung;
    startEvents.push(started.ereignis);
  }

  const next: ErhebungRow = { ...source };
  const nowIso = now.toISOString();
  const wasSelected =
    field.selection === "multiple" &&
    parseStoredValues(next[field.valueColumn]).includes(option.value);

  if (field.selection === "multiple") {
    const values = nextMultiValues(field, next[field.valueColumn], option);
    setColumn(
      next,
      field.valueColumn,
      (values.length > 0
        ? values.join(MULTI_VALUE_SEPARATOR)
        : null) as ErhebungRow[typeof field.valueColumn],
    );
  } else {
    setColumn(
      next,
      field.valueColumn,
      option.value as ErhebungRow[typeof field.valueColumn],
    );
  }

  if (field.scoreColumn) {
    setColumn(
      next,
      field.scoreColumn,
      (option.special === "ignored" ? null : option.score) as ErhebungRow[typeof field.scoreColumn],
    );
  }

  if (!next[field.initialAtColumn]) {
    setColumn(
      next,
      field.initialAtColumn,
      nowIso as ErhebungRow[typeof field.initialAtColumn],
    );
  }

  setColumn(
    next,
    field.lastAtColumn,
    nowIso as ErhebungRow[typeof field.lastAtColumn],
  );

  next.nihss = calculateNihss(next);
  next.g_fast = calculateGfast(next);
  const timelineValue =
    field.selection === "multiple" && wasSelected
      ? `${option.label} (entfernt)`
      : option.label;
  next.timeline = appendTimelineLine(
    next.timeline,
    formatTimelineLine(now, field.label, timelineValue),
  );

  if (
    (field.key === "stroke" || field.key === "lyse") &&
    !isLyseBeforeStroke(next)
  ) {
    next.stroke_lyse_gleichzeitig = false;
  }

  const ereignis: EreignisInsert = {
    erhebung_id: next.id,
    feld_key: field.key,
    feld_label: field.label,
    wert_label: timelineValue,
    wert_score: option.score,
    ereignis_typ: "click",
  };

  return {
    erhebung: next,
    ereignis,
    ereignisse: [...startEvents, ereignis],
  };
}

export function getNormalOption(field: ClickableField): NihssOption | undefined {
  return field.options.find(
    (option) => option.score === 0 && option.special !== "UN",
  );
}

function isAlreadyNormal(field: ClickableField, erhebung: ErhebungRow): boolean {
  const option = getNormalOption(field);
  if (!option) {
    return false;
  }

  if (field.selection === "multiple") {
    const values = parseStoredValues(erhebung[field.valueColumn]);
    return values.length === 1 && values[0] === option.value;
  }

  return erhebung[field.valueColumn] === option.value;
}

function ataxiaFieldsToNormalize(erhebung: ErhebungRow): ClickableField[] {
  if (hasRealAtaxiaLimbFinding(erhebung)) {
    return [];
  }

  const fields: ClickableField[] = [];
  const item7 = getFieldByKey("nihss_7");
  const right = getFieldByKey("ataxie_rechts");
  const left = getFieldByKey("ataxie_links");

  if (item7 && erhebung.punkte_7 !== 0) {
    fields.push(item7);
  }
  if (right) {
    fields.push(right);
  }
  if (left) {
    fields.push(left);
  }

  return fields;
}

export function applyMissingFieldsAsNormal(args: {
  erhebung: ErhebungRow;
  missingFields: ClickableField[];
  now: Date;
}): { erhebung: ErhebungRow; ereignisse: EreignisInsert[] } {
  let current = args.erhebung;
  const ereignisse: EreignisInsert[] = [];
  const seen = new Set<string>();

  for (const field of [
    ...args.missingFields,
    ...ataxiaFieldsToNormalize(args.erhebung),
  ]) {
    if (seen.has(field.key) || isAlreadyNormal(field, current)) {
      continue;
    }
    seen.add(field.key);

    const option = getNormalOption(field);
    if (!option) {
      continue;
    }

    const result = applyFieldClick({
      erhebung: current,
      field,
      option,
      now: args.now,
    });
    current = result.erhebung;
    ereignisse.push(...result.ereignisse);
  }

  return { erhebung: current, ereignisse };
}

export const AFTER_COMPLETION_EREIGNIS_TYP = "click_after_completion";

export function applyAfterCompletionClick(args: {
  erhebung: ErhebungRow;
  field: ClickableField;
  option: NihssOption;
  now: Date;
}): {
  erhebung: ErhebungRow;
  ereignisse: EreignisInsert[];
} {
  const { field, option, now } = args;
  const kind =
    field.key === "stroke" || field.key === "stroke_after_completion"
      ? "stroke"
      : field.key === "lyse" || field.key === "lyse_after_completion"
        ? "lyse"
        : null;
  if (!kind) {
    throw new Error("Nach NIHSS sind nur Stroke- und Lyse-Klicks zulässig.");
  }
  if (option.value === "nicht entschieden") {
    throw new Error("Nach NIHSS ist „nicht entschieden“ nicht zulässig.");
  }

  const next: ErhebungRow = { ...args.erhebung };
  const nowIso = now.toISOString();

  if (kind === "stroke") {
    next.stroke_after_completion_status = option.value as ErhebungRow["stroke_after_completion_status"];
    next.stroke_after_completion_at = nowIso;
  } else {
    next.lyse_after_completion_status = option.value as ErhebungRow["lyse_after_completion_status"];
    next.lyse_after_completion_at = nowIso;
  }

  const feldKey = `${kind}_after_completion`;
  const feldLabel = `${kind === "stroke" ? "Stroke" : "Lyse"} nach NIHSS`;
  next.timeline = appendTimelineLine(
    next.timeline,
    formatTimelineLine(now, feldLabel, option.label),
  );

  return {
    erhebung: next,
    ereignisse: [
      {
        erhebung_id: next.id,
        feld_key: feldKey,
        feld_label: feldLabel,
        wert_label: option.label,
        wert_score: option.score,
        ereignis_typ: AFTER_COMPLETION_EREIGNIS_TYP,
      },
    ],
  };
}

export function shouldPromptLyseWithoutStroke(
  row: Pick<ErhebungRow, "stroke_status" | "lyse_status">,
): boolean {
  return (
    row.lyse_status === "Ja" &&
    (row.stroke_status === "nicht entschieden" || row.stroke_status === "Kein Stroke")
  );
}

export function applyStrokeLyseSimultaneous(args: {
  erhebung: ErhebungRow;
  now: Date;
}): { erhebung: ErhebungRow; ereignisse: EreignisInsert[] } {
  if (!isLyseBeforeStroke(args.erhebung) || args.erhebung.stroke_lyse_gleichzeitig) {
    return { erhebung: args.erhebung, ereignisse: [] };
  }

  const next: ErhebungRow = {
    ...args.erhebung,
    stroke_lyse_gleichzeitig: true,
  };
  const wertLabel = "gleichzeitig (0 Sek.)";
  next.timeline = appendTimelineLine(
    next.timeline,
    formatTimelineLine(args.now, "Stroke → Lyse", wertLabel),
  );

  return {
    erhebung: next,
    ereignisse: [
      {
        erhebung_id: next.id,
        feld_key: "stroke_lyse_gleichzeitig",
        feld_label: "Stroke → Lyse",
        wert_label: wertLabel,
        wert_score: null,
        ereignis_typ: "click",
      },
    ],
  };
}

export function applyLyseReset(args: {
  erhebung: ErhebungRow;
  now: Date;
}): { erhebung: ErhebungRow; ereignisse: EreignisInsert[] } {
  if (args.erhebung.lyse_status === "nicht entschieden") {
    return { erhebung: args.erhebung, ereignisse: [] };
  }

  const next: ErhebungRow = {
    ...args.erhebung,
    lyse_status: "nicht entschieden",
    lyse_initial_at: null,
    lyse_last_at: null,
    stroke_lyse_gleichzeitig: false,
  };
  const wertLabel = "nicht entschieden (Korrektur)";
  next.timeline = appendTimelineLine(
    next.timeline,
    formatTimelineLine(args.now, "Lyse", wertLabel),
  );

  return {
    erhebung: next,
    ereignisse: [
      {
        erhebung_id: next.id,
        feld_key: "lyse",
        feld_label: "Lyse",
        wert_label: wertLabel,
        wert_score: null,
        ereignis_typ: "click",
      },
    ],
  };
}

export function applyLifecycleEvent(args: {
  erhebung: ErhebungRow;
  now: Date;
  kind: "start" | "stop";
}): { erhebung: ErhebungRow; ereignis: EreignisInsert } {
  const next: ErhebungRow = { ...args.erhebung };
  const nowIso = args.now.toISOString();
  const label =
    args.kind === "start" ? "Untersuchung gestartet" : "Untersuchung beendet";

  if (args.kind === "start" && !next.startzeit_untersuchung) {
    next.startzeit_untersuchung = nowIso;
  }

  if (args.kind === "stop") {
    next.endzeit_untersuchung = nowIso;
    next.untersuchung_status = "abgeschlossen";
    if (isPaused(next)) {
      next.pausen = closeOpenPause(next.pausen, nowIso);
    }
  }

  next.timeline = appendTimelineLine(
    next.timeline,
    formatTimelineLine(args.now, "Untersuchung", label),
  );

  return {
    erhebung: next,
    ereignis: {
      erhebung_id: next.id,
      feld_key: args.kind === "start" ? "start" : "stop",
      feld_label: "Untersuchung",
      wert_label: label,
      wert_score: null,
      ereignis_typ: "lifecycle",
    },
  };
}

export const PAUSE_GRUENDE: readonly PauseGrund[] = [
  "Lyse-Verabreichung",
  "Telefonat",
  "Technisches Problem",
  "Sonstige",
];

export type PauseGrundAngabe = Required<Pick<Pause, "gruende" | "sonstige_text">>;

function closeOpenPause(
  pausen: ErhebungRow["pausen"],
  nowIso: string,
  grund?: PauseGrundAngabe,
) {
  return pausen.map((pause, index) =>
    index === pausen.length - 1 && !pause.bis
      ? { ...pause, ...grund, bis: nowIso }
      : pause,
  );
}

export function normalizePauseGrund(grund: PauseGrundAngabe): PauseGrundAngabe {
  return {
    gruende: grund.gruende,
    sonstige_text: grund.gruende.includes("Sonstige")
      ? grund.sonstige_text?.trim() || null
      : null,
  };
}

export function pauseGrundLabel(grund: Partial<PauseGrundAngabe>): string {
  if (!grund.gruende?.length) {
    return "nicht angegeben";
  }
  return grund.gruende
    .map((item) =>
      item === "Sonstige" && grund.sonstige_text
        ? `Sonstige (${grund.sonstige_text})`
        : item,
    )
    .join(", ");
}

export function applyPauseToggle(args: {
  erhebung: ErhebungRow;
  now: Date;
  /** Reasons for the pause, given when continuing. */
  grund?: PauseGrundAngabe;
}): { erhebung: ErhebungRow; ereignis: EreignisInsert } {
  const paused = isPaused(args.erhebung);
  const nowIso = args.now.toISOString();
  const pausen = args.erhebung.pausen ?? [];
  const grund = args.grund && normalizePauseGrund(args.grund);
  const label = !paused
    ? "Untersuchung pausiert"
    : grund && grund.gruende.length > 0
      ? `Untersuchung fortgesetzt (Grund: ${pauseGrundLabel(grund)})`
      : "Untersuchung fortgesetzt";
  const next: ErhebungRow = {
    ...args.erhebung,
    pausen: paused
      ? closeOpenPause(pausen, nowIso, grund)
      : [...pausen, { von: nowIso, bis: null }],
    timeline: appendTimelineLine(
      args.erhebung.timeline,
      formatTimelineLine(args.now, "Untersuchung", label),
    ),
  };

  return {
    erhebung: next,
    ereignis: {
      erhebung_id: next.id,
      feld_key: paused ? "resume" : "pause",
      feld_label: "Untersuchung",
      wert_label: label,
      wert_score: null,
      ereignis_typ: "lifecycle",
    },
  };
}

/**
 * Removes a running pause that was started by mistake, so its time counts as
 * normal Untersuchung time again.
 */
export function applyPauseDiscard(args: {
  erhebung: ErhebungRow;
  now: Date;
}): { erhebung: ErhebungRow; ereignisse: EreignisInsert[] } {
  if (!isPaused(args.erhebung)) {
    return { erhebung: args.erhebung, ereignisse: [] };
  }

  const label = "Pause verworfen (verklickt)";
  const next: ErhebungRow = {
    ...args.erhebung,
    pausen: args.erhebung.pausen.slice(0, -1),
    timeline: appendTimelineLine(
      args.erhebung.timeline,
      formatTimelineLine(args.now, "Untersuchung", label),
    ),
  };

  return {
    erhebung: next,
    ereignisse: [
      {
        erhebung_id: next.id,
        feld_key: "pause_discard",
        feld_label: "Untersuchung",
        wert_label: label,
        wert_score: null,
        ereignis_typ: "lifecycle",
      },
    ],
  };
}

export function pauseLabel(pause: Pause, index: number): string {
  const bis = pause.bis ? formatBerlinTime(new Date(pause.bis)) : "läuft";
  return `Pause ${index + 1} (${formatBerlinTime(new Date(pause.von))}–${bis})`;
}

/** Changes the reasons of a finished pause after the Untersuchung. */
export function applyPauseGrundCorrection(args: {
  erhebung: ErhebungRow;
  index: number;
  grund: PauseGrundAngabe;
  now: Date;
}): { erhebung: ErhebungRow; ereignisse: EreignisInsert[] } {
  const current = args.erhebung;
  const pause = current.pausen?.[args.index];
  const grund = normalizePauseGrund(args.grund);
  if (
    current.untersuchung_status !== "abgeschlossen" ||
    !pause?.bis ||
    grund.gruende.length === 0 ||
    (JSON.stringify(pause.gruende ?? []) === JSON.stringify(grund.gruende) &&
      (pause.sonstige_text ?? null) === grund.sonstige_text)
  ) {
    return { erhebung: current, ereignisse: [] };
  }

  const feldLabel = "Pausengrund (korrigiert)";
  const wertLabel = `${pauseLabel(pause, args.index)}: ${pauseGrundLabel(grund)}`;
  const next: ErhebungRow = {
    ...current,
    pausen: current.pausen.map((item, index) =>
      index === args.index ? { ...item, ...grund } : item,
    ),
    timeline: appendTimelineLine(
      current.timeline,
      formatTimelineLine(args.now, feldLabel, wertLabel),
    ),
  };

  return {
    erhebung: next,
    ereignisse: [
      {
        erhebung_id: next.id,
        feld_key: "pause_grund",
        feld_label: feldLabel,
        wert_label: wertLabel,
        wert_score: null,
        ereignis_typ: "korrektur",
      },
    ],
  };
}

export function applyErhebungClose(args: {
  erhebung: ErhebungRow;
  now: Date;
}): { erhebung: ErhebungRow; ereignisse: EreignisInsert[] } {
  const current = args.erhebung;
  if (
    current.untersuchung_status !== "abgeschlossen" ||
    current.followup_status === "abgeschlossen"
  ) {
    return { erhebung: current, ereignisse: [] };
  }

  const nowIso = args.now.toISOString();
  const next: ErhebungRow = {
    ...current,
    followup_status: "abgeschlossen",
    followup_abgeschlossen_at: nowIso,
    timeline: appendTimelineLine(
      current.timeline,
      formatTimelineLine(args.now, "Erhebung", "Erhebung abgeschlossen"),
    ),
  };

  return {
    erhebung: next,
    ereignisse: [
      {
        erhebung_id: next.id,
        feld_key: "erhebung_close",
        feld_label: "Erhebung",
        wert_label: "Erhebung abgeschlossen",
        wert_score: null,
        ereignis_typ: "lifecycle",
      },
    ],
  };
}

export function applyKonsilCorrection(args: {
  erhebung: ErhebungRow;
  now: Date;
}): { erhebung: ErhebungRow; ereignisse: EreignisInsert[] } {
  const current = args.erhebung;
  if (
    current.untersuchung_status !== "abgeschlossen" ||
    current.followup_status !== "abgeschlossen"
  ) {
    return { erhebung: current, ereignisse: [] };
  }

  const label = "Angaben zum Konsil zur Korrektur geöffnet";
  const next: ErhebungRow = {
    ...current,
    followup_status: "offen",
    followup_abgeschlossen_at: null,
    timeline: appendTimelineLine(
      current.timeline,
      formatTimelineLine(args.now, "Erhebung", label),
    ),
  };

  return {
    erhebung: next,
    ereignisse: [
      {
        erhebung_id: next.id,
        feld_key: "konsil_korrektur",
        feld_label: "Erhebung",
        wert_label: label,
        wert_score: null,
        ereignis_typ: "lifecycle",
      },
    ],
  };
}
