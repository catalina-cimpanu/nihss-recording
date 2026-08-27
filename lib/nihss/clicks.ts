import type { EreignisInsert, ErhebungRow } from "@/lib/supabase/database.types";
import {
  MULTI_VALUE_SEPARATOR,
  parseStoredValues,
  type ClickableField,
  type NihssOption,
} from "@/lib/nihss/config";
import { calculateGfast, calculateNihss } from "@/lib/nihss/scoring";
import { appendTimelineLine, formatTimelineLine } from "@/lib/nihss/timeline";

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
}): { erhebung: ErhebungRow; ereignis: EreignisInsert } {
  const { field, option, now } = args;
  const next: ErhebungRow = { ...args.erhebung };
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

  return {
    erhebung: next,
    ereignis: {
      erhebung_id: next.id,
      feld_key: field.key,
      feld_label: field.label,
      wert_label: timelineValue,
      wert_score: option.score,
      ereignis_typ: "click",
    },
  };
}

export function getNormalOption(field: ClickableField): NihssOption | undefined {
  return field.options.find(
    (option) => option.score === 0 && option.special !== "UN",
  );
}

export function applyMissingFieldsAsNormal(args: {
  erhebung: ErhebungRow;
  missingFields: ClickableField[];
  now: Date;
}): { erhebung: ErhebungRow; ereignisse: EreignisInsert[] } {
  let current = args.erhebung;
  const ereignisse: EreignisInsert[] = [];

  for (const field of args.missingFields) {
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
    ereignisse.push(result.ereignis);
  }

  return { erhebung: current, ereignisse };
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
    next.status = "abgeschlossen";
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
