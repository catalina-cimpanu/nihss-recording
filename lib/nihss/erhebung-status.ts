import type { ErhebungRow } from "@/lib/supabase/database.types";
import {
  UMSTAENDE,
  hasNachKi,
  isLyseKiVorMissing,
  isSoloPatientenIdMissing,
  type FollowupValues,
} from "@/lib/nihss/followup";

export type ErhebungStatusParts = {
  untersuchung: "offen" | "abgeschlossen";
  fragen: "offen" | "abgeschlossen";
};

export function erhebungStatusParts(
  row: Pick<ErhebungRow, "untersuchung_status" | "followup_status">,
): ErhebungStatusParts {
  return {
    untersuchung:
      row.untersuchung_status === "abgeschlossen" ? "abgeschlossen" : "offen",
    fragen: row.followup_status === "abgeschlossen" ? "abgeschlossen" : "offen",
  };
}

export function formatErhebungStatus(
  row: Pick<ErhebungRow, "untersuchung_status" | "followup_status">,
): string {
  const parts = erhebungStatusParts(row);
  if (parts.untersuchung === "abgeschlossen" && parts.fragen === "abgeschlossen") {
    return "abgeschlossen";
  }
  return `Untersuchung ${parts.untersuchung}\nFragen ${parts.fragen}`;
}

export function missingFollowupLabels(values: FollowupValues): string[] {
  const missing: string[] = [];
  if (isSoloPatientenIdMissing(values)) {
    missing.push("Solo-Patienten-ID");
  }
  if (isLyseKiVorMissing(values)) {
    missing.push("Lyse-Kontraindikation vor Untersuchung");
  }
  if (values.tempis_stroke_verdacht == null) {
    missing.push("TEMPiS Stroke-Verdacht");
  }
  if (values.tempis_lyse_empfehlung == null) {
    missing.push("TEMPiS Lyse-Empfehlung");
  }
  if (hasNachKi(values) && values.lyse_kontraindikation_beeinflusst == null) {
    missing.push("Kontraindikation beeinflusst Lyse");
  }
  if (
    values.lyse_kontraindikation_beeinflusst === "Ja" &&
    (values.lyse_kontraindikation_beeinflusst_text == null ||
      values.lyse_kontraindikation_beeinflusst_text === "")
  ) {
    missing.push("Beschreibung zur Lyse-Beeinflussung");
  }
  const hasUmstand =
    values.umstaende_keine ||
    UMSTAENDE.some((item) => Boolean(values[item.flag]));
  if (!hasUmstand) {
    missing.push("Umstände der Untersuchung");
  }
  const hasAnmerkung =
    values.sonstige_anmerkungen_keine || Boolean(values.sonstige_anmerkungen);
  if (!hasAnmerkung) {
    missing.push("Sonstige Anmerkungen");
  }
  return missing;
}

export function isFollowupIncomplete(values: FollowupValues): boolean {
  return missingFollowupLabels(values).length > 0;
}

export function erhebungCloseWarning(missing: readonly string[]): string {
  const lock =
    "Die Angaben zum Konsil können danach nicht mehr geändert werden.";
  const question =
    missing.length > 0
      ? "Erhebung trotzdem abschließen?"
      : "Erhebung wirklich abschließen?";
  if (missing.length > 0) {
    return `Nicht alle Angaben zum Konsil sind ausgefüllt: ${missing.join(", ")}. ${lock} ${question}`;
  }
  return `${lock} ${question}`;
}

export function erhebungCloseConfirmQuestion(missing: readonly string[]): string {
  const lock =
    "Die Angaben zum Konsil können danach nicht mehr geändert werden.";
  if (missing.length > 0) {
    return `${lock} Erhebung trotzdem abschließen?`;
  }
  return `${lock} Erhebung wirklich abschließen?`;
}
