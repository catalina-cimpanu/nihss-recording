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
  const durationCounts = {
    under10: 0,
    from10to20: 0,
    from20to40: 0,
    from40to60: 0,
    over60: 0,
    missing: 0,
  };

  for (const row of rows) {
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
    total: rows.length,
    testCount: rows.filter((row) => row.untersuchungstyp === "Test").length,
    realCount: rows.filter((row) => row.untersuchungstyp === "Echter Patient")
      .length,
    averageNihss: average(rows.map((row) => row.nihss)),
    medianNihss: median(rows.map((row) => row.nihss)),
    averageGfast: average(rows.map((row) => row.g_fast)),
    averageExamDurationLabel: formatAverageElapsedClock(
      rows
        .map((row) => getDecisionDurations(row).dauer_untersuchung_ms)
        .filter((value): value is number => value != null),
    ),
    averageStartToStrokeLabel: formatAverageElapsedClock(
      rows
        .map((row) => getDecisionDurations(row).dauer_start_zu_stroke_ms)
        .filter((value): value is number => value != null),
    ),
    averageStrokeToLyseLabel: formatAverageElapsedClock(
      rows
        .map((row) => getDecisionDurations(row).dauer_stroke_zu_lyse_ms)
        .filter((value): value is number => value != null),
    ),
    strokeJa: rows.filter((row) => row.stroke_status === "Ja").length,
    strokeKein: rows.filter((row) => row.stroke_status === "Kein Stroke").length,
    strokeOffen: rows.filter((row) => row.stroke_status === "nicht entschieden")
      .length,
    lyseJa: rows.filter((row) => row.lyse_status === "Ja").length,
    lyseKeine: rows.filter((row) => row.lyse_status === "Keine Lyse").length,
    lyseOffen: rows.filter((row) => row.lyse_status === "nicht entschieden")
      .length,
    incompleteCount: rows.filter(
      (row) =>
        getMissingNihssFields(row).length > 0 ||
        hasInvalidAtaxiaLimbCount(row),
    ).length,
    abnormalFrequencies: NIHSS_FIELDS.filter(
      (field) => field.contributesToNihss && field.scoreColumn,
    ).map((field) => ({
      label: field.label,
      count: rows.filter((row) => {
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
