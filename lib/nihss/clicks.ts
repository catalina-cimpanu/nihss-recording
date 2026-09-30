import type { EreignisInsert, ErhebungRow } from "@/lib/supabase/database.types";
import {
  MULTI_VALUE_SEPARATOR,
  getFieldByKey,
  parseStoredValues,
  type ClickableField,
  type NihssOption,
} from "@/lib/nihss/config";
import { calculateGfast, calculateNihss } from "@/lib/nihss/scoring";
import { appendTimelineLine, formatTimelineLine } from "@/lib/nihss/timeline";
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

  if (!source.startzeit_untersuchung && source.status !== "abgeschlossen") {
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
