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
        (erhebung[field.valueColumn] === null ||
          erhebung[field.valueColumn] === undefined ||
          erhebung[field.valueColumn] === ""),
    )
    .map((field) => field.label);
}

export function getDocumentationWarnings(erhebung: ErhebungRow): string[] {
  const warnings: string[] = [];

  if (
    erhebung.lyse_status !== "nicht entschieden" &&
    erhebung.stroke_status === "nicht entschieden"
  ) {
    warnings.push(
      "Lyse wurde dokumentiert, aber Stroke ist noch nicht entschieden.",
    );
  }

  if (erhebung.lyse_status === "Ja" && erhebung.stroke_status === "Kein Stroke") {
    warnings.push(
      "Lyse Ja wurde dokumentiert, während Stroke als Kein Stroke dokumentiert ist.",
    );
  }

  for (const label of getMissingSideWarnings(erhebung)) {
    warnings.push(`Abnormaler Befund ohne Seitenangabe: ${label}.`);
  }

  const ataxiaLimbCount = countAtaxiaLimbs(erhebung);
  if (erhebung.punkte_7 === 1 && ataxiaLimbCount > 1) {
    warnings.push(
      "Ataxie ist als in einer Extremität dokumentiert, es sind aber mehrere Extremitäten ausgewählt.",
    );
  }
  if (erhebung.punkte_7 === 2 && ataxiaLimbCount === 1) {
    warnings.push(
      "Ataxie ist als in zwei oder mehr Extremitäten dokumentiert, es ist aber nur eine Extremität ausgewählt.",
    );
  }

  return warnings;
}

function countAtaxiaLimbs(erhebung: ErhebungRow): number {
  const values = [
    ...parseStoredValues(erhebung.ataxie_rechts),
    ...parseStoredValues(erhebung.ataxie_links),
  ];

  return values.filter(
    (value) =>
      value !== "0 - keine Ataxie rechts" && value !== "0 - keine Ataxie links",
  ).length;
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
