import type { ErhebungRow } from "@/lib/supabase/database.types";
import {
  NIHSS_FIELDS,
  parseStoredValues,
  type ClickableField,
} from "@/lib/nihss/config";

export function getMissingNihssFields(erhebung: ErhebungRow): ClickableField[] {
  return NIHSS_FIELDS.filter(
    (field) =>
      field.contributesToNihss &&
      (erhebung[field.valueColumn] === null ||
        erhebung[field.valueColumn] === undefined ||
        erhebung[field.valueColumn] === ""),
  );
}

export function getMissingSideWarnings(erhebung: ErhebungRow): string[] {
  return NIHSS_FIELDS.filter((field) => field.visibleWhen?.(erhebung))
    .filter(
      (field) =>
        !field.contributesToNihss &&
        field.key !== "ataxie_rechts" &&
        field.key !== "ataxie_links" &&
        (erhebung[field.valueColumn] === null ||
          erhebung[field.valueColumn] === undefined ||
          erhebung[field.valueColumn] === ""),
    )
    .map((field) => field.label);
}

export const RAPID_CLICK_WINDOW_MS = 2000;

export function isRapidRepeatClick(
  previous: { fieldKey: string; at: number } | null,
  fieldKey: string,
  at: number,
  windowMs = RAPID_CLICK_WINDOW_MS,
): boolean {
  return Boolean(
    previous && previous.fieldKey === fieldKey && at - previous.at < windowMs,
  );
}

export function getDocumentationWarnings(
  erhebung: ErhebungRow,
  now = new Date(),
): string[] {
  const warnings: string[] = [];

  if (
    erhebung.endzeit_untersuchung &&
    erhebung.startzeit_untersuchung &&
    new Date(erhebung.endzeit_untersuchung).getTime() <
      new Date(erhebung.startzeit_untersuchung).getTime()
  ) {
    warnings.push("Die Endzeit liegt vor der Startzeit.");
  }

  if (isExamLongerThan60Minutes(erhebung, now)) {
    warnings.push("Die Untersuchungsdauer beträgt mehr als 60 Minuten.");
  }

  if (
    erhebung.lyse_status === "Ja" &&
    erhebung.stroke_status === "nicht entschieden"
  ) {
    warnings.push(
      "Lyse wurde dokumentiert, aber Stroke ist noch nicht entschieden.",
    );
  }

  if (erhebung.lyse_status === "Ja" && erhebung.stroke_status === "Kein Stroke") {
    warnings.push("Kein Stroke und Lyse Ja gehören nicht zusammen.");
  }

  for (const label of getMissingSideWarnings(erhebung)) {
    warnings.push(`Abnormaler Befund ohne Seitenangabe: ${label}.`);
  }

  const ataxiaWarning = getAtaxiaLimbRequirementWarning(erhebung);
  if (ataxiaWarning) {
    warnings.push(ataxiaWarning);
  }

  return warnings;
}

function isRealAtaxiaLimbValue(value: string): boolean {
  return value.startsWith("1 -") || value.startsWith("1 –");
}

function ataxiaLimbValues(erhebung: ErhebungRow): string[] {
  return [
    ...parseStoredValues(erhebung.ataxie_rechts),
    ...parseStoredValues(erhebung.ataxie_links),
  ];
}

export function countAtaxiaLimbs(erhebung: ErhebungRow): number {
  return ataxiaLimbValues(erhebung).filter(isRealAtaxiaLimbValue).length;
}

export function hasRealAtaxiaLimbFinding(erhebung: ErhebungRow): boolean {
  return countAtaxiaLimbs(erhebung) > 0;
}

export function hasAtaxiaScoreWithoutLimbFinding(erhebung: ErhebungRow): boolean {
  return (
    (erhebung.punkte_7 === 1 || erhebung.punkte_7 === 2) &&
    !hasRealAtaxiaLimbFinding(erhebung)
  );
}

export function hasInvalidAtaxiaLimbCount(erhebung: ErhebungRow): boolean {
  const count = countAtaxiaLimbs(erhebung);
  if (erhebung.punkte_7 === 1) {
    return count !== 1;
  }
  if (erhebung.punkte_7 === 2) {
    return count < 2;
  }
  return false;
}

export function getAtaxiaIncompleteLabel(erhebung: ErhebungRow): string | null {
  if (!hasInvalidAtaxiaLimbCount(erhebung)) {
    return null;
  }
  if (erhebung.punkte_7 === 1) {
    return "7 Extremitätenataxie (genau 1 Extremität mit Ataxie)";
  }
  if (erhebung.punkte_7 === 2) {
    return "7 Extremitätenataxie (mindestens 2 Extremitäten mit Ataxie)";
  }
  return null;
}

function getAtaxiaLimbRequirementWarning(erhebung: ErhebungRow): string | null {
  if (!hasInvalidAtaxiaLimbCount(erhebung)) {
    return null;
  }
  const actual = countAtaxiaLimbs(erhebung);
  if (erhebung.punkte_7 === 1) {
    if (actual === 0) {
      return "Bei 7 Extremitätenataxie 1 muss genau eine Extremität mit Ataxie gewählt sein: rechtes Bein, rechter Arm, linkes Bein oder linker Arm.";
    }
    return "Bei 7 Extremitätenataxie 1 darf nur genau eine Extremität mit Ataxie gewählt sein.";
  }
  if (erhebung.punkte_7 === 2) {
    return "Bei 7 Extremitätenataxie 2 müssen mindestens zwei Extremitäten mit Ataxie gewählt sein.";
  }
  return null;
}

export function hasLyseJaWithKeinStroke(erhebung: ErhebungRow): boolean {
  return erhebung.lyse_status === "Ja" && erhebung.stroke_status === "Kein Stroke";
}

export function getUndecidedStrokeLyseLabels(erhebung: ErhebungRow): string[] {
  const labels: string[] = [];
  if (erhebung.stroke_status === "nicht entschieden") {
    labels.push("Stroke");
  }
  if (erhebung.lyse_status === "nicht entschieden") {
    labels.push("Lyse");
  }
  return labels;
}

export function isExamLongerThan60Minutes(erhebung: ErhebungRow, now = new Date()): boolean {
  if (!erhebung.startzeit_untersuchung) {
    return false;
  }

  const start = new Date(erhebung.startzeit_untersuchung).getTime();
  const end = erhebung.endzeit_untersuchung
    ? new Date(erhebung.endzeit_untersuchung).getTime()
    : now.getTime();

  return end - start > 60 * 60 * 1000;
}
