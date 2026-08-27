import type { ErhebungRow } from "@/lib/supabase/database.types";

export type DurationInput = Pick<
  ErhebungRow,
  | "startzeit_untersuchung"
  | "endzeit_untersuchung"
  | "stroke_status"
  | "stroke_initial_at"
  | "stroke_last_at"
  | "lyse_status"
  | "lyse_initial_at"
  | "lyse_last_at"
>;

export type DecisionDurations = {
  strokeAt: string | null;
  lyseAt: string | null;
  dauer_untersuchung_ms: number | null;
  dauer_start_zu_stroke_ms: number | null;
  dauer_stroke_zu_lyse_ms: number | null;
};

export function formatElapsedClock(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatAverageElapsedClock(valuesMs: number[]): string {
  if (valuesMs.length === 0) {
    return "–";
  }

  const average =
    valuesMs.reduce((sum, value) => sum + value, 0) / valuesMs.length;
  return formatElapsedClock(Math.round(average));
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function positiveDiffMs(from: number | null, to: number | null): number | null {
  if (from == null || to == null || to < from) {
    return null;
  }

  return to - from;
}

function isStrokeDecided(status: ErhebungRow["stroke_status"]): boolean {
  return status === "Ja" || status === "Kein Stroke";
}

function isLyseDecided(status: ErhebungRow["lyse_status"]): boolean {
  return status === "Ja" || status === "Keine Lyse";
}

export function getDecisionDurations(row: DurationInput): DecisionDurations {
  const strokeAt = isStrokeDecided(row.stroke_status)
    ? row.stroke_last_at ?? row.stroke_initial_at
    : null;
  const lyseAt = isLyseDecided(row.lyse_status)
    ? row.lyse_last_at ?? row.lyse_initial_at
    : null;

  const startMs = parseTimestamp(row.startzeit_untersuchung);
  const endMs = parseTimestamp(row.endzeit_untersuchung);
  const strokeMs = parseTimestamp(strokeAt);
  const lyseMs = parseTimestamp(lyseAt);

  return {
    strokeAt,
    lyseAt,
    dauer_untersuchung_ms: positiveDiffMs(startMs, endMs),
    dauer_start_zu_stroke_ms: positiveDiffMs(startMs, strokeMs),
    dauer_stroke_zu_lyse_ms: positiveDiffMs(strokeMs, lyseMs),
  };
}
