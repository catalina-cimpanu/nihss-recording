"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ExamViewToggle from "@/components/erhebung/ExamViewToggle";
import FieldOptions from "@/components/erhebung/FieldOptions";
import KlickprotokollExportButton from "@/components/erhebung/KlickprotokollExportButton";
import ScrollToTopButton from "@/components/erhebung/ScrollToTopButton";
import StickyScoreBar from "@/components/erhebung/StickyScoreBar";
import { useExamViewMode } from "@/components/erhebung/useExamViewMode";
import { useStickyOptionHeight } from "@/components/erhebung/useStickyOptionHeight";
import WarningToasts, {
  WARNING_TOAST_MS,
  type WarningToast,
} from "@/components/erhebung/WarningToasts";
import optionStyles from "@/components/nihss_items/nihssOptions.module.css";
import { persistErhebungAndEreignisse } from "@/lib/db/erhebungen";
import {
  FORM_SECTIONS,
  LYSE_FIELD,
  NIHSS_FIELDS,
  STROKE_FIELD,
  getFieldByKey,
  getSelectedFieldColor,
  type ClickableField,
  type ScoreColor,
} from "@/lib/nihss/config";
import {
  applyFieldClick,
  applyLifecycleEvent,
  applyMissingFieldsAsNormal,
} from "@/lib/nihss/clicks";
import {
  AUTO_CLOSE_AFTER_MS,
  autoCloseStopAt,
  shouldAutoCloseExam,
} from "@/lib/nihss/duration";
import { formatBerlinTime } from "@/lib/nihss/timeline";
import {
  getAtaxiaIncompleteLabel,
  getDocumentationWarnings,
  getMissingNihssFields,
  getUndecidedStrokeLyseLabels,
  hasAtaxiaScoreWithoutLimbFinding,
  hasInvalidAtaxiaLimbCount,
  hasLyseJaWithKeinStroke,
  isExamLongerThan60Minutes,
  isRapidRepeatClick,
} from "@/lib/nihss/validation-exam";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type ErhebungWorkspaceProps = {
  initialErhebung: ErhebungRow;
};

function findOption(field: ClickableField, value: string) {
  return field.options.find((option) => option.value === value);
}

function fieldFrameClass(color: ScoreColor | null): string {
  if (!color) {
    return optionStyles.fieldFrameEmpty;
  }

  const frames: Record<ScoreColor, string> = {
    score0: optionStyles.fieldFrameScore0,
    score1: optionStyles.fieldFrameScore1,
    score2: optionStyles.fieldFrameScore2,
    score3: optionStyles.fieldFrameScore3,
    score4: optionStyles.fieldFrameScore4,
    scoreUN: optionStyles.fieldFrameScoreUN,
    stroke: optionStyles.fieldFrameEmpty,
    lyse: optionStyles.fieldFrameEmpty,
    side: optionStyles.fieldFrameSide,
  };

  return frames[color];
}

function closeDialogMessage(args: {
  isIncomplete: boolean;
  missingFieldLabels: string[];
  ataxiaIncompleteLabel: string | null;
  undecidedStrokeLyse: string[];
  lyseJaWithKeinStroke: boolean;
  longerThan60Minutes: boolean;
  needsCloseAnyway: boolean;
}): string {
  const parts: string[] = [];

  if (args.isIncomplete) {
    parts.push(
      `Die Erhebung ist unvollständig. Fehlende NIHSS-Felder: ${[
        ...args.missingFieldLabels,
        ...(args.ataxiaIncompleteLabel ? [args.ataxiaIncompleteLabel] : []),
      ].join(", ")}.`,
    );
  }

  if (args.lyseJaWithKeinStroke) {
    parts.push("Kein Stroke und Lyse Ja gehören nicht zusammen.");
  }

  if (args.undecidedStrokeLyse.length === 2) {
    parts.push("Stroke und Lyse sind noch nicht entschieden.");
  } else if (args.undecidedStrokeLyse.length === 1) {
    parts.push(`${args.undecidedStrokeLyse[0]} ist noch nicht entschieden.`);
  }

  if (args.longerThan60Minutes) {
    parts.push("Die Untersuchungsdauer beträgt mehr als 60 Minuten.");
  }

  if (!args.needsCloseAnyway) {
    return `Untersuchung beenden und als abgeschlossen markieren?${
      args.longerThan60Minutes
        ? " Die Untersuchungsdauer beträgt mehr als 60 Minuten."
        : ""
    }`;
  }

  return `${parts.join(" ")} Trotzdem abschließen?`;
}

export default function ErhebungWorkspace({
  initialErhebung,
}: ErhebungWorkspaceProps) {
  const [erhebung, setErhebung] = useState(initialErhebung);
  const [error, setError] = useState<string | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [toasts, setToasts] = useState<WarningToast[]>([]);
  const { mode: viewMode, setMode: setViewMode } = useExamViewMode();
  const stickyOptionHeight = useStickyOptionHeight();
  const lastClickRef = useRef<{ fieldKey: string; at: number } | null>(null);
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef<Map<number, number>>(new Map());
  const seenDocWarningsRef = useRef<Set<string>>(new Set());
  const erhebungRef = useRef(erhebung);
  const autoCloseLockRef = useRef(false);
  erhebungRef.current = erhebung;

  const readOnly = erhebung.status === "abgeschlossen";
  const missingFields = useMemo(
    () => getMissingNihssFields(erhebung),
    [erhebung],
  );
  const ataxiaWithoutLimb = hasAtaxiaScoreWithoutLimbFinding(erhebung);
  const ataxiaIncompleteLabel = getAtaxiaIncompleteLabel(erhebung);
  const invalidAtaxiaLimbs = hasInvalidAtaxiaLimbCount(erhebung);
  const canNormalizeMissing = missingFields.length > 0 || ataxiaWithoutLimb;
  const isIncomplete = missingFields.length > 0 || invalidAtaxiaLimbs;
  const incompleteCount =
    missingFields.length + (invalidAtaxiaLimbs ? 1 : 0);
  const undecidedStrokeLyse = getUndecidedStrokeLyseLabels(erhebung);
  const lyseJaWithKeinStroke = hasLyseJaWithKeinStroke(erhebung);
  const needsCloseAnyway =
    isIncomplete ||
    undecidedStrokeLyse.length > 0 ||
    lyseJaWithKeinStroke;
  const documentationWarnings = useMemo(
    () => getDocumentationWarnings(erhebung, now),
    [erhebung, now],
  );

  function pushToast(message: string) {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((current) => {
      const replaced = current.filter((toast) => {
        if (toast.message !== message) {
          return true;
        }
        const timer = toastTimersRef.current.get(toast.id);
        if (timer) {
          window.clearTimeout(timer);
          toastTimersRef.current.delete(toast.id);
        }
        return false;
      });
      return [...replaced, { id, message }];
    });
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      toastTimersRef.current.delete(id);
    }, WARNING_TOAST_MS);
    toastTimersRef.current.set(id, timer);
  }

  useEffect(() => {
    return () => {
      for (const timer of toastTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    const current = new Set(documentationWarnings);
    for (const warning of documentationWarnings) {
      if (!seenDocWarningsRef.current.has(warning)) {
        seenDocWarningsRef.current.add(warning);
        pushToast(warning);
      }
    }
    for (const warning of [...seenDocWarningsRef.current]) {
      if (!current.has(warning)) {
        seenDocWarningsRef.current.delete(warning);
      }
    }
  }, [documentationWarnings]);

  useEffect(() => {
    if (readOnly || !erhebung.startzeit_untersuchung) {
      return;
    }

    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [readOnly, erhebung.startzeit_untersuchung]);

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

  useEffect(() => {
    if (readOnly || isSaving || autoCloseLockRef.current) {
      return;
    }
    if (!erhebung.startzeit_untersuchung) {
      return;
    }

    const startMs = new Date(erhebung.startzeit_untersuchung).getTime();
    if (!Number.isFinite(startMs)) {
      return;
    }

    const delay = Math.max(0, startMs + AUTO_CLOSE_AFTER_MS - Date.now());
    const id = window.setTimeout(() => {
      const current = erhebungRef.current;
      if (autoCloseLockRef.current || current.status !== "offen") {
        return;
      }
      if (!shouldAutoCloseExam(current, new Date())) {
        return;
      }
      const stopAt = autoCloseStopAt(current);
      if (!stopAt) {
        return;
      }

      autoCloseLockRef.current = true;
      setCloseDialogOpen(false);
      const result = applyLifecycleEvent({
        erhebung: current,
        now: stopAt,
        kind: "stop",
      });
      void persist(result.erhebung, [result.ereignis]);
    }, delay);

    return () => window.clearTimeout(id);
  }, [readOnly, isSaving, erhebung.id, erhebung.startzeit_untersuchung]);

  async function handleSelect(field: ClickableField, value: string) {
    if (readOnly) {
      return;
    }

    const option = findOption(field, value);
    if (!option) {
      return;
    }

    const clickedAt = Date.now();
    if (isRapidRepeatClick(lastClickRef.current, field.key, clickedAt)) {
      pushToast(
        `Sehr schnelle wiederholte Klicks bei ${field.label}. Jeder Klick wird gespeichert.`,
      );
    }
    lastClickRef.current = { fieldKey: field.key, at: clickedAt };

    const result = applyFieldClick({
      erhebung,
      field,
      option,
      now: new Date(),
    });
    await persist(result.erhebung, result.ereignisse);
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
    const stopAt = new Date();
    if (
      erhebung.startzeit_untersuchung &&
      stopAt.getTime() < new Date(erhebung.startzeit_untersuchung).getTime()
    ) {
      setCloseDialogOpen(false);
      setError("Die Endzeit wäre vor der Startzeit. Bitte Uhrzeit prüfen.");
      return;
    }

    setCloseDialogOpen(false);
    const result = applyLifecycleEvent({
      erhebung,
      now: stopAt,
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
      <div className="sticky top-0 z-50">
        <StickyScoreBar
          erhebung={erhebung}
          readOnly={readOnly}
          incompleteCount={incompleteCount}
          onSelect={handleSelect}
        />
        <WarningToasts toasts={toasts} />
      </div>

      <div
        className={`mx-auto max-w-4xl px-4 py-4 ${
          viewMode === "compact" ? "space-y-3" : "space-y-4"
        } ${readOnly ? "pb-4" : "pb-28"}`}
      >
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

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={readOnly}
            className="rounded-lg bg-tempis-sage-dark px-4 py-3 font-semibold text-white hover:bg-tempis-sage-darker disabled:opacity-60"
          >
            Untersuchung starten
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
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 md:items-center">
            <div className="w-full max-w-lg space-y-3 rounded-xl border border-tempis-orange bg-surface p-4 shadow-lg">
            <p className="text-sm">
              {closeDialogMessage({
                isIncomplete,
                missingFieldLabels: missingFields.map((field) => field.label),
                ataxiaIncompleteLabel,
                undecidedStrokeLyse,
                lyseJaWithKeinStroke,
                longerThan60Minutes: isExamLongerThan60Minutes(erhebung),
                needsCloseAnyway,
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={confirmStop}
                className="rounded-lg bg-tempis-signal px-4 py-2 font-semibold text-white"
              >
                {needsCloseAnyway ? "Trotzdem abschließen" : "Abschließen"}
              </button>
              {canNormalizeMissing ? (
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
              className={`rounded-xl border border-border bg-surface ${
                viewMode === "compact" ? "space-y-2 p-2.5" : "space-y-3 p-3"
              }`}
            >
              <div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                {section.prompt ? (
                  <p className="mt-1 text-sm text-muted">{section.prompt}</p>
                ) : null}
              </div>
              {fields.map((field) => {
                const selectionColor = getSelectedFieldColor(field, erhebung);
                const frameColorClass = fieldFrameClass(selectionColor);

                return (
                  <div
                    key={field.key}
                    className={`space-y-2 ${optionStyles.fieldFrame} ${frameColorClass}`}
                  >
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
                      viewMode={viewMode}
                      compact={
                        field.selection === "multiple" ||
                        field.options.every((option) => option.color === "side")
                      }
                      onSelect={handleSelect}
                    />
                  </div>
                );
              })}
            </section>
          );
        })}

        <section className="space-y-3 rounded-xl border border-border bg-surface p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Zeitlinie</h2>
            <KlickprotokollExportButton
              erhebungId={erhebung.id}
              erhebungsId={erhebung.erhebungs_id}
            />
          </div>
          <details>
            <summary className="cursor-pointer text-sm font-semibold">
              Einträge anzeigen
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
        </section>
      </div>

      {!readOnly ? (
        <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col">
          <div className="mx-auto flex w-full max-w-4xl justify-end px-4">
            <ScrollToTopButton variant="docked" />
          </div>
          <div className="border-t border-border bg-surface px-4 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:pt-2">
            <div className="mx-auto flex max-w-4xl items-center gap-2">
              <ExamViewToggle
                value={viewMode}
                onChange={setViewMode}
                buttonHeight={stickyOptionHeight}
              />
              <button
                type="button"
                onClick={handleStopRequest}
                style={
                  stickyOptionHeight != null
                    ? {
                        height: stickyOptionHeight,
                        minHeight: stickyOptionHeight,
                        boxSizing: "border-box",
                      }
                    : undefined
                }
                className={`${optionStyles.optionButton} ${optionStyles.stopExamButton} ${optionStyles.stopExam} flex min-w-0 flex-1 items-center justify-center`}
              >
                Untersuchung beenden
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ScrollToTopButton className="bottom-4" />
      )}

      {isSaving ? (
        <p
          className={`pointer-events-none fixed left-1/2 z-[60] -translate-x-1/2 rounded-full bg-tempis-blue-dark px-4 py-2 text-sm font-semibold text-white shadow-lg ${
            readOnly
              ? "bottom-4"
              : "bottom-[calc(3.75rem+env(safe-area-inset-bottom))] md:bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
          }`}
        >
          Speichert…
        </p>
      ) : null}
    </div>
  );
}
