"use client";

import { useMemo, useState } from "react";
import FieldOptions from "@/components/erhebung/FieldOptions";
import StickyScoreBar from "@/components/erhebung/StickyScoreBar";
import { persistErhebungAndEreignisse } from "@/lib/db/erhebungen";
import {
  FORM_SECTIONS,
  LYSE_FIELD,
  NIHSS_FIELDS,
  STROKE_FIELD,
  getFieldByKey,
  type ClickableField,
} from "@/lib/nihss/config";
import {
  applyFieldClick,
  applyLifecycleEvent,
  applyMissingFieldsAsNormal,
} from "@/lib/nihss/clicks";
import { formatBerlinTime } from "@/lib/nihss/timeline";
import {
  getDocumentationWarnings,
  getMissingNihssFields,
  isExamLongerThan60Minutes,
} from "@/lib/nihss/validation-exam";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type ErhebungWorkspaceProps = {
  initialErhebung: ErhebungRow;
};

function findOption(field: ClickableField, value: string) {
  return field.options.find((option) => option.value === value);
}

export default function ErhebungWorkspace({
  initialErhebung,
}: ErhebungWorkspaceProps) {
  const [erhebung, setErhebung] = useState(initialErhebung);
  const [error, setError] = useState<string | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const readOnly = erhebung.status === "abgeschlossen";
  const missingFields = useMemo(
    () => getMissingNihssFields(erhebung),
    [erhebung],
  );
  const warnings = useMemo(
    () => getDocumentationWarnings(erhebung),
    [erhebung],
  );

  async function persist(
    next: ErhebungRow,
    ereignisse: Parameters<typeof persistErhebungAndEreignisse>[1],
  ) {
    setErhebung(next);
    setIsSaving(true);
    setError(null);
    try {
      await persistErhebungAndEreignisse(next, ereignisse);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Speichern fehlgeschlagen. Bitte erneut klicken.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSelect(field: ClickableField, value: string) {
    if (readOnly) {
      return;
    }

    const option = findOption(field, value);
    if (!option) {
      return;
    }

    const result = applyFieldClick({
      erhebung,
      field,
      option,
      now: new Date(),
    });
    await persist(result.erhebung, [result.ereignis]);
  }

  async function handleStart() {
    if (readOnly) {
      return;
    }
    if (erhebung.startzeit_untersuchung) {
      setError("Die Untersuchung wurde bereits gestartet.");
      return;
    }

    const result = applyLifecycleEvent({
      erhebung,
      now: new Date(),
      kind: "start",
    });
    await persist(result.erhebung, [result.ereignis]);
  }

  async function handleStopRequest() {
    if (readOnly) {
      return;
    }
    if (!erhebung.startzeit_untersuchung) {
      setError("Die Untersuchung wurde noch nicht gestartet.");
      return;
    }

    setCloseDialogOpen(true);
  }

  async function confirmStop() {
    setCloseDialogOpen(false);
    const result = applyLifecycleEvent({
      erhebung,
      now: new Date(),
      kind: "stop",
    });
    await persist(result.erhebung, [result.ereignis]);
  }

  async function markMissingAsNormal() {
    const result = applyMissingFieldsAsNormal({
      erhebung,
      missingFields,
      now: new Date(),
    });
    await persist(result.erhebung, result.ereignisse);
  }

  const fieldMap = useMemo(() => {
    const map = new Map(NIHSS_FIELDS.map((field) => [field.key, field]));
    map.set(STROKE_FIELD.key, STROKE_FIELD);
    map.set(LYSE_FIELD.key, LYSE_FIELD);
    return map;
  }, []);

  return (
    <div>
      <StickyScoreBar
        erhebung={erhebung}
        readOnly={readOnly}
        incompleteCount={missingFields.length}
        onSelect={handleSelect}
      />

      <div className="mx-auto max-w-4xl space-y-4 px-4 py-4">
        {readOnly ? (
          <p className="rounded-lg bg-tempis-ice px-3 py-2 text-sm">
            Diese Erhebung ist abgeschlossen und nur noch lesbar.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-tempis-signal/30 bg-surface px-3 py-2 text-sm text-tempis-signal">
            {error}
          </p>
        ) : null}

        {warnings.map((warning) => (
          <p
            key={warning}
            className="rounded-lg border border-tempis-orange/40 bg-surface px-3 py-2 text-sm"
          >
            {warning}
          </p>
        ))}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={readOnly}
            className="rounded-lg bg-tempis-sage-dark px-4 py-3 font-semibold text-white hover:bg-tempis-sage-darker disabled:opacity-60"
          >
            Untersuchung starten
          </button>
          <button
            type="button"
            onClick={handleStopRequest}
            disabled={readOnly}
            className="rounded-lg bg-tempis-signal px-4 py-3 font-semibold text-white hover:bg-tempis-signal-dark disabled:opacity-60"
          >
            Untersuchung beenden
          </button>
        </div>

        {erhebung.startzeit_untersuchung ? (
          <p className="rounded-lg bg-tempis-sage/40 px-3 py-2 text-sm font-medium">
            Untersuchung um{" "}
            {formatBerlinTime(new Date(erhebung.startzeit_untersuchung))}{" "}
            gestartet.
            {erhebung.endzeit_untersuchung
              ? ` Untersuchung um ${formatBerlinTime(new Date(erhebung.endzeit_untersuchung))} beendet.`
              : ""}
          </p>
        ) : null}

        {closeDialogOpen ? (
          <div className="space-y-3 rounded-xl border border-tempis-orange bg-surface p-3">
            <p className="text-sm">
              {missingFields.length > 0
                ? `Die Erhebung ist unvollständig. Fehlende NIHSS-Felder: ${missingFields
                    .map((field) => field.label)
                    .join(", ")}. Trotzdem abschließen?`
                : "Untersuchung beenden und als abgeschlossen markieren?"}
              {isExamLongerThan60Minutes(erhebung)
                ? " Die Untersuchungsdauer beträgt mehr als 60 Minuten."
                : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={confirmStop}
                className="rounded-lg bg-tempis-signal px-4 py-2 font-semibold text-white"
              >
                {missingFields.length > 0
                  ? "Trotzdem abschließen"
                  : "Abschließen"}
              </button>
              {missingFields.length > 0 ? (
                <button
                  type="button"
                  onClick={markMissingAsNormal}
                  className="rounded-lg bg-tempis-blue-dark px-4 py-2 font-semibold text-white"
                >
                  Alle fehlenden Felder als normal markieren
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setCloseDialogOpen(false)}
                className="rounded-lg border border-border px-4 py-2 font-semibold"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : null}

        {FORM_SECTIONS.map((section) => {
          const fields = section.fieldKeys
            .map((key) => fieldMap.get(key) ?? getFieldByKey(key))
            .filter((field): field is ClickableField => Boolean(field))
            .filter((field) => !field.visibleWhen || field.visibleWhen(erhebung));

          if (fields.length === 0) {
            return null;
          }

          return (
            <section
              key={section.title}
              className="space-y-3 rounded-xl border border-border bg-surface p-3"
            >
              <div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                {section.prompt ? (
                  <p className="mt-1 text-sm text-muted">{section.prompt}</p>
                ) : null}
              </div>
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <h3 className="text-sm font-semibold">{field.label}</h3>
                  {field.selection === "multiple" ? (
                    <p className="text-xs text-muted">
                      Mehrfachauswahl möglich
                    </p>
                  ) : null}
                  <FieldOptions
                    field={field}
                    erhebung={erhebung}
                    readOnly={readOnly}
                    compact={
                      field.selection === "multiple" ||
                      field.options.every((option) => option.color === "side")
                    }
                    onSelect={handleSelect}
                  />
                </div>
              ))}
            </section>
          );
        })}

        <details className="rounded-xl border border-border bg-surface p-3">
          <summary className="cursor-pointer text-lg font-semibold">
            Zeitlinie
          </summary>
          <div className="mt-2">
            {erhebung.timeline ? (
              <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-muted">
                {erhebung.timeline}
              </pre>
            ) : (
              <p className="text-sm text-muted">Noch keine Einträge.</p>
            )}
          </div>
        </details>
      </div>

      {isSaving ? (
        <p className="pointer-events-none fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-tempis-blue-dark px-4 py-2 text-sm font-semibold text-white shadow-lg">
          Speichert…
        </p>
      ) : null}
    </div>
  );
}
