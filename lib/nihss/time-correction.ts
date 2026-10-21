import type { EreignisInsert, ErhebungRow } from "@/lib/supabase/database.types";
import { examTimes, getDecisionDurations } from "@/lib/nihss/duration";
import {
  normalizePauseGrund,
  pauseGrundLabel,
  type PauseGrundAngabe,
} from "@/lib/nihss/clicks";
import { appendTimelineLine, formatTimelineLine } from "@/lib/nihss/timeline";
import {
  berlinTimeOfDay,
  nearestBerlinTime,
  normalizeTimeOfDay,
} from "@/lib/time/berlin";

export const KORREKTUR_EREIGNIS_TYP = "korrektur";

/** Corrections are entered and shown to the minute ("HH:MM"). */
export function minuteOfDay(iso: string): string {
  return berlinTimeOfDay(iso).slice(0, 5);
}

export type TimeKey = "start" | "end" | "stroke" | "lyse";

type CorrectionColumn =
  | "startzeit_korrigiert"
  | "endzeit_korrigiert"
  | "stroke_korrigiert_at"
  | "lyse_korrigiert_at";

export type TimeCorrectionPatch = Pick<
  ErhebungRow,
  CorrectionColumn | "stroke_status_korrigiert" | "lyse_status_korrigiert"
>;

export type TimeCorrectionDraft = {
  times: Record<TimeKey, string>;
  stroke: ErhebungRow["stroke_status_korrigiert"];
  lyse: ErhebungRow["lyse_status_korrigiert"];
};

export const TIME_ROWS: {
  key: TimeKey;
  label: string;
  column: CorrectionColumn;
  clickedAt: (row: ErhebungRow) => string | null;
}[] = [
  {
    key: "start",
    label: "Start Untersuchung",
    column: "startzeit_korrigiert",
    clickedAt: (row) => row.startzeit_untersuchung,
  },
  {
    key: "end",
    label: "Ende Untersuchung",
    column: "endzeit_korrigiert",
    clickedAt: (row) => row.endzeit_untersuchung,
  },
  {
    key: "stroke",
    label: "Stroke-Entscheidung",
    column: "stroke_korrigiert_at",
    clickedAt: (row) =>
      row.stroke_status === "nicht entschieden"
        ? null
        : (row.stroke_last_at ?? row.stroke_initial_at),
  },
  {
    key: "lyse",
    label: "Lyse-Entscheidung",
    column: "lyse_korrigiert_at",
    clickedAt: (row) =>
      row.lyse_status === "nicht entschieden"
        ? null
        : (row.lyse_last_at ?? row.lyse_initial_at),
  },
];

export type DecisionKey = "stroke" | "lyse";

/** The decision clicked during the Untersuchung, null if "nicht entschieden". */
export function clickedDecision(row: ErhebungRow, key: DecisionKey): string | null {
  const status = key === "stroke" ? row.stroke_status : row.lyse_status;
  return status === "nicht entschieden" ? null : status;
}

export function initialTimeCorrectionDraft(row: ErhebungRow): TimeCorrectionDraft {
  const times = {} as Record<TimeKey, string>;
  for (const item of TIME_ROWS) {
    const at = row[item.column] ?? item.clickedAt(row);
    times[item.key] = at ? minuteOfDay(at) : "";
  }
  return {
    times,
    stroke:
      row.stroke_status_korrigiert ??
      (row.stroke_status === "nicht entschieden" ? null : row.stroke_status),
    lyse:
      row.lyse_status_korrigiert ??
      (row.lyse_status === "nicht entschieden" ? null : row.lyse_status),
  };
}

/** Turns the draft into correction columns (null = the clicked value stands). */
export function timeCorrectionPatch(
  row: ErhebungRow,
  draft: TimeCorrectionDraft,
): TimeCorrectionPatch | { error: string } {
  const patch: TimeCorrectionPatch = {
    startzeit_korrigiert: null,
    endzeit_korrigiert: null,
    stroke_korrigiert_at: null,
    lyse_korrigiert_at: null,
    stroke_status_korrigiert:
      draft.stroke === clickedDecision(row, "stroke") ? null : draft.stroke,
    lyse_status_korrigiert:
      draft.lyse === clickedDecision(row, "lyse") ? null : draft.lyse,
  };

  for (const item of TIME_ROWS) {
    const clicked = item.clickedAt(row);
    const decided =
      (item.key === "stroke" && draft.stroke) || (item.key === "lyse" && draft.lyse);
    if (!clicked && !decided) {
      continue;
    }
    const raw = draft.times[item.key];
    if (!raw.trim()) {
      if (!clicked) {
        return { error: `Bitte für die nachgetragene ${item.label} eine Uhrzeit angeben.` };
      }
      continue;
    }
    const time = normalizeTimeOfDay(raw)?.slice(0, 5);
    if (!time) {
      return { error: `Ungültige Uhrzeit bei ${item.label}.` };
    }
    // Same minute as the click: keep the exact clicked time.
    if (clicked && minuteOfDay(clicked) === time) {
      continue;
    }
    const reference = clicked ?? examTimes(row).startAt;
    if (!reference) {
      return { error: "Die Untersuchung hat keine Startzeit." };
    }
    patch[item.column] = nearestBerlinTime(reference, time);
  }

  // Entered times have no seconds: one in the same minute as a later start or
  // decision is moved onto it, so seconds alone can't put it out of order.
  const { startAt } = examTimes({ ...row, ...patch });
  patch.stroke_korrigiert_at = liftWithinMinute(patch.stroke_korrigiert_at, [startAt]);
  patch.lyse_korrigiert_at = liftWithinMinute(patch.lyse_korrigiert_at, [startAt]);
  const { strokeAt, lyseAt } = getDecisionDurations({ ...row, ...patch });
  patch.endzeit_korrigiert = liftWithinMinute(patch.endzeit_korrigiert, [
    startAt,
    strokeAt,
    lyseAt,
  ]);

  for (const item of TIME_ROWS) {
    const existing = row[item.column];
    const corrected = patch[item.column];
    // Keep the stored string for the same instant so no change is logged.
    if (existing && corrected && Date.parse(existing) === Date.parse(corrected)) {
      patch[item.column] = existing;
    }
  }

  return patch;
}

function liftWithinMinute(
  at: string | null,
  later: (string | null)[],
): string | null {
  if (!at) {
    return at;
  }
  let result = at;
  for (const other of later) {
    if (
      other &&
      Date.parse(other) > Date.parse(result) &&
      minuteOfDay(other) === minuteOfDay(at)
    ) {
      result = other;
    }
  }
  return result;
}

export function timeCorrectionError(row: ErhebungRow): string | null {
  const { startAt, endAt } = examTimes(row);
  const { strokeAt, lyseAt } = getDecisionDurations(row);
  const ms = (value: string | null) => (value ? new Date(value).getTime() : null);
  const start = ms(startAt);
  const end = ms(endAt);

  if (start != null && end != null && end < start) {
    return "Das Ende der Untersuchung muss nach dem Start liegen.";
  }
  for (const [label, at] of [
    ["Stroke-Entscheidung", ms(strokeAt)],
    ["Lyse-Entscheidung", ms(lyseAt)],
  ] as const) {
    if (at != null && ((start != null && at < start) || (end != null && at > end))) {
      return `Die ${label} muss zwischen Start und Ende der Untersuchung liegen.`;
    }
  }
  return null;
}

function eventValue(
  row: ErhebungRow,
  column: keyof TimeCorrectionPatch,
): string {
  const value = row[column];
  if (!value) {
    return "Korrektur entfernt";
  }
  return column === "stroke_status_korrigiert" || column === "lyse_status_korrigiert"
    ? value
    : minuteOfDay(value);
}

const EVENT_LABELS: Record<keyof TimeCorrectionPatch, string> = {
  startzeit_korrigiert: "Start Untersuchung (korrigiert)",
  endzeit_korrigiert: "Ende Untersuchung (korrigiert)",
  stroke_korrigiert_at: "Stroke-Zeit (korrigiert)",
  lyse_korrigiert_at: "Lyse-Zeit (korrigiert)",
  stroke_status_korrigiert: "Stroke (korrigiert)",
  lyse_status_korrigiert: "Lyse (korrigiert)",
};

function eventLabel(row: ErhebungRow, column: keyof TimeCorrectionPatch): string {
  if (column === "stroke_status_korrigiert" && !clickedDecision(row, "stroke")) {
    return "Stroke (nachgetragen)";
  }
  if (column === "lyse_status_korrigiert" && !clickedDecision(row, "lyse")) {
    return "Lyse (nachgetragen)";
  }
  return EVENT_LABELS[column];
}

export function applyTimeCorrection(args: {
  erhebung: ErhebungRow;
  patch: TimeCorrectionPatch;
  now: Date;
}):
  | { erhebung: ErhebungRow; ereignisse: EreignisInsert[]; error: null }
  | { error: string } {
  const previous = args.erhebung;
  if (previous.untersuchung_status !== "abgeschlossen") {
    return {
      error: "Die Zeiten können erst nach Ende der Untersuchung korrigiert werden.",
    };
  }

  const next: ErhebungRow = { ...previous, ...args.patch };
  const error = timeCorrectionError(next);
  if (error) {
    return { error };
  }

  const ereignisse: EreignisInsert[] = [];
  for (const column of Object.keys(EVENT_LABELS) as (keyof TimeCorrectionPatch)[]) {
    if (next[column] === previous[column]) {
      continue;
    }
    const feldLabel = eventLabel(next, column);
    const wertLabel = eventValue(next, column);
    next.timeline = appendTimelineLine(
      next.timeline,
      formatTimelineLine(args.now, feldLabel, wertLabel),
    );
    ereignisse.push({
      erhebung_id: next.id,
      feld_key: column,
      feld_label: feldLabel,
      wert_label: wertLabel,
      wert_score: null,
      ereignis_typ: KORREKTUR_EREIGNIS_TYP,
    });
  }

  return { erhebung: next, ereignisse, error: null };
}

function pauseRange(pause: { von: string; bis: string | null }): string {
  return `${minuteOfDay(pause.von)}–${pause.bis ? minuteOfDay(pause.bis) : "läuft"}`;
}

/** Adds a pause after the Untersuchung (times "HH:MM", Berlin), marked "nachgetragen". */
export function applyPauseAdd(args: {
  erhebung: ErhebungRow;
  von: string;
  bis: string;
  grund: PauseGrundAngabe;
  now: Date;
}):
  | { erhebung: ErhebungRow; ereignisse: EreignisInsert[]; error: null }
  | { error: string } {
  const row = args.erhebung;
  if (row.untersuchung_status !== "abgeschlossen") {
    return {
      error:
        "Pausen / Unterbrechungen können erst nach Ende der Untersuchung nachgetragen werden.",
    };
  }
  const { startAt, endAt } = examTimes(row);
  if (!startAt || !endAt) {
    return { error: "Die Untersuchung hat keine Start- oder Endzeit." };
  }
  const vonTime = normalizeTimeOfDay(args.von)?.slice(0, 5);
  const bisTime = normalizeTimeOfDay(args.bis)?.slice(0, 5);
  if (!vonTime || !bisTime) {
    return { error: "Bitte Beginn und Ende der Pause / Unterbrechung angeben." };
  }
  const grund = normalizePauseGrund(args.grund);
  if (grund.gruende.length === 0) {
    return { error: "Bitte den Grund der Pause / Unterbrechung wählen." };
  }

  let von = nearestBerlinTime(startAt, vonTime)!;
  let bis = nearestBerlinTime(von, bisTime)!;
  // Minute precision: a time in the same minute as start/end is moved onto it.
  if (Date.parse(von) < Date.parse(startAt) && minuteOfDay(startAt) === vonTime) {
    von = startAt;
  }
  if (Date.parse(bis) > Date.parse(endAt) && minuteOfDay(endAt) === bisTime) {
    bis = endAt;
  }
  if (Date.parse(bis) <= Date.parse(von)) {
    return { error: "Das Ende der Pause / Unterbrechung muss nach dem Beginn liegen." };
  }
  if (Date.parse(von) < Date.parse(startAt) || Date.parse(bis) > Date.parse(endAt)) {
    return {
      error: "Die Pause / Unterbrechung muss zwischen Start und Ende der Untersuchung liegen.",
    };
  }
  const pausen = row.pausen ?? [];
  const overlap = pausen.findIndex(
    (pause) =>
      Date.parse(von) < Date.parse(pause.bis ?? endAt) &&
      Date.parse(bis) > Date.parse(pause.von),
  );
  if (overlap >= 0) {
    return {
      error: `Die Pause / Unterbrechung überschneidet sich mit Pause / Unterbrechung ${overlap + 1}.`,
    };
  }

  const added = { von, bis, ...grund, nachgetragen: true };
  const feldLabel = "Pause (nachgetragen)";
  const wertLabel = `${pauseRange(added)} (Grund: ${pauseGrundLabel(grund)})`;
  const next: ErhebungRow = {
    ...row,
    pausen: [...pausen, added].sort((a, b) => Date.parse(a.von) - Date.parse(b.von)),
    timeline: appendTimelineLine(
      row.timeline,
      formatTimelineLine(args.now, feldLabel, wertLabel),
    ),
  };

  return {
    erhebung: next,
    ereignisse: [
      {
        erhebung_id: next.id,
        feld_key: "pause_add",
        feld_label: feldLabel,
        wert_label: wertLabel,
        wert_score: null,
        ereignis_typ: KORREKTUR_EREIGNIS_TYP,
      },
    ],
    error: null,
  };
}

/** Removes a pause that was added afterwards; recorded pauses stay. */
export function applyPauseRemove(args: {
  erhebung: ErhebungRow;
  index: number;
  now: Date;
}): { erhebung: ErhebungRow; ereignisse: EreignisInsert[] } {
  const row = args.erhebung;
  const pause = row.pausen?.[args.index];
  if (row.untersuchung_status !== "abgeschlossen" || !pause?.nachgetragen) {
    return { erhebung: row, ereignisse: [] };
  }

  const feldLabel = "Pause (nachgetragen)";
  const wertLabel = `${pauseRange(pause)} entfernt`;
  const next: ErhebungRow = {
    ...row,
    pausen: row.pausen.filter((_, index) => index !== args.index),
    timeline: appendTimelineLine(
      row.timeline,
      formatTimelineLine(args.now, feldLabel, wertLabel),
    ),
  };

  return {
    erhebung: next,
    ereignisse: [
      {
        erhebung_id: next.id,
        feld_key: "pause_remove",
        feld_label: feldLabel,
        wert_label: wertLabel,
        wert_score: null,
        ereignis_typ: KORREKTUR_EREIGNIS_TYP,
      },
    ],
  };
}
