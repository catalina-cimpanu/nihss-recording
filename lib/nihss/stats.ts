import type { ErhebungRow } from "@/lib/supabase/database.types";
import { NIHSS_FIELDS } from "@/lib/nihss/config";
import { formatAverageElapsedClock, getDecisionDurations } from "@/lib/nihss/duration";
import { getMissingNihssFields, hasInvalidAtaxiaLimbCount } from "@/lib/nihss/validation-exam";

export type DurationBucket = {
  label: string;
  count: number;
};

export type AbnormalFrequency = {
  label: string;
  count: number;
};

export type DashboardStats = {
  total: number;
  testCount: number;
  realCount: number;
  averageNihss: number | null;
  medianNihss: number | null;
  averageGfast: number | null;
  averageExamDurationLabel: string;
  averageStartToStrokeLabel: string;
  averageStrokeToLyseLabel: string;
  strokeJa: number;
  strokeKein: number;
  strokeOffen: number;
  lyseJa: number;
  lyseKeine: number;
  lyseOffen: number;
  incompleteCount: number;
  strokeConcordancePercent: number | null;
  lyseConcordancePercent: number | null;
  averageStrokeToAfterCompletionLabel: string;
  averageLyseToAfterCompletionLabel: string;
  abnormalFrequencies: AbnormalFrequency[];
  durationBuckets: DurationBucket[];
};

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function positiveDiffMs(from: string | null, to: string | null): number | null {
  const start = parseTimestamp(from);
  const end = parseTimestamp(to);
  if (start == null || end == null || end < start) {
    return null;
  }

  return end - start;
}

function lastDecisionAt(
  lastAt: string | null,
  initialAt: string | null,
): string | null {
  return lastAt ?? initialAt;
}

function isAfterCompletionStroke(
  value: ErhebungRow["stroke_after_completion_status"],
): value is "Ja" | "Kein Stroke" {
  return value === "Ja" || value === "Kein Stroke";
}

function isAfterCompletionLyse(
  value: ErhebungRow["lyse_after_completion_status"],
): value is "Ja" | "Keine Lyse" {
  return value === "Ja" || value === "Keine Lyse";
}

function concordancePercent(
  rows: ErhebungRow[],
  matches: (row: ErhebungRow) => boolean | null,
): number | null {
  const comparable = rows
    .map(matches)
    .filter((value): value is boolean => value !== null);
  if (comparable.length === 0) {
    return null;
  }

  return (
    (comparable.filter(Boolean).length / comparable.length) * 100
  );
}

function durationMinutes(row: ErhebungRow): number | null {
  if (!row.startzeit_untersuchung || !row.endzeit_untersuchung) {
    return null;
  }

  const start = new Date(row.startzeit_untersuchung).getTime();
  const end = new Date(row.endzeit_untersuchung).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return (end - start) / 60000;
}

export function buildDashboardStats(rows: ErhebungRow[]): DashboardStats {
  const testCount = rows.filter((row) => row.untersuchungstyp === "Test").length;
  const realRows = rows.filter((row) => row.untersuchungstyp === "Echter Patient");

  const durationCounts = {
    under10: 0,
    from10to20: 0,
    from20to40: 0,
    from40to60: 0,
    over60: 0,
    missing: 0,
  };

  for (const row of realRows) {
    const minutes = durationMinutes(row);
    if (minutes === null) {
      durationCounts.missing += 1;
    } else if (minutes < 10) {
      durationCounts.under10 += 1;
    } else if (minutes < 20) {
      durationCounts.from10to20 += 1;
    } else if (minutes < 40) {
      durationCounts.from20to40 += 1;
    } else if (minutes <= 60) {
      durationCounts.from40to60 += 1;
    } else {
      durationCounts.over60 += 1;
    }
  }

  return {
    total: realRows.length,
    testCount,
    realCount: realRows.length,
    averageNihss: average(realRows.map((row) => row.nihss)),
    medianNihss: median(realRows.map((row) => row.nihss)),
    averageGfast: average(realRows.map((row) => row.g_fast)),
    averageExamDurationLabel: formatAverageElapsedClock(
      realRows
        .map((row) => getDecisionDurations(row).dauer_untersuchung_ms)
        .filter((value): value is number => value != null),
    ),
    averageStartToStrokeLabel: formatAverageElapsedClock(
      realRows
        .map((row) => getDecisionDurations(row).dauer_start_zu_stroke_ms)
        .filter((value): value is number => value != null),
    ),
    averageStrokeToLyseLabel: formatAverageElapsedClock(
      realRows
        .map((row) => getDecisionDurations(row).dauer_stroke_zu_lyse_ms)
        .filter((value): value is number => value != null),
    ),
    strokeJa: realRows.filter((row) => row.stroke_status === "Ja").length,
    strokeKein: realRows.filter((row) => row.stroke_status === "Kein Stroke")
      .length,
    strokeOffen: realRows.filter((row) => row.stroke_status === "nicht entschieden")
      .length,
    lyseJa: realRows.filter((row) => row.lyse_status === "Ja").length,
    lyseKeine: realRows.filter((row) => row.lyse_status === "Keine Lyse").length,
    lyseOffen: realRows.filter((row) => row.lyse_status === "nicht entschieden")
      .length,
    incompleteCount: realRows.filter(
      (row) =>
        getMissingNihssFields(row).length > 0 ||
        hasInvalidAtaxiaLimbCount(row),
    ).length,
    strokeConcordancePercent: concordancePercent(realRows, (row) =>
      isAfterCompletionStroke(row.stroke_after_completion_status)
        ? row.stroke_status === row.stroke_after_completion_status
        : null,
    ),
    lyseConcordancePercent: concordancePercent(realRows, (row) =>
      isAfterCompletionLyse(row.lyse_after_completion_status)
        ? row.lyse_status === row.lyse_after_completion_status
        : null,
    ),
    averageStrokeToAfterCompletionLabel: formatAverageElapsedClock(
      realRows
        .map((row) =>
          positiveDiffMs(
            lastDecisionAt(row.stroke_last_at, row.stroke_initial_at),
            row.stroke_after_completion_at,
          ),
        )
        .filter((value): value is number => value != null),
    ),
    averageLyseToAfterCompletionLabel: formatAverageElapsedClock(
      realRows
        .map((row) =>
          positiveDiffMs(
            lastDecisionAt(row.lyse_last_at, row.lyse_initial_at),
            row.lyse_after_completion_at,
          ),
        )
        .filter((value): value is number => value != null),
    ),
    abnormalFrequencies: NIHSS_FIELDS.filter(
      (field) => field.contributesToNihss && field.scoreColumn,
    ).map((field) => ({
      label: field.label,
      count: realRows.filter((row) => {
        const score = row[field.scoreColumn!];
        return typeof score === "number" && score > 0;
      }).length,
    })),
    durationBuckets: [
      { label: "Unter 10 Minuten", count: durationCounts.under10 },
      { label: "10–20 Minuten", count: durationCounts.from10to20 },
      { label: "20–40 Minuten", count: durationCounts.from20to40 },
      { label: "40–60 Minuten", count: durationCounts.from40to60 },
      { label: "Über 60 Minuten", count: durationCounts.over60 },
      { label: "Ohne Start- und Endzeit", count: durationCounts.missing },
    ],
  };
}

export function formatStatNumber(value: number | null, digits = 1): string {
  if (value === null) {
    return "–";
  }

  return value.toLocaleString("de-DE", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : digits,
    maximumFractionDigits: digits,
  });
}
