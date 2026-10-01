"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import ErhebungExamDialogs from "@/components/erhebung/ErhebungExamDialogs";
import ErhebungNihssForm from "@/components/erhebung/ErhebungNihssForm";
import FollowupFields from "@/components/erhebung/FollowupFields";
import ExamViewToggle from "@/components/erhebung/ExamViewToggle";
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
import { useQueuedPersist } from "@/components/erhebung/useQueuedPersist";
import {
  LYSE_FIELD,
  NIHSS_FIELDS,
  STROKE_FIELD,
  type ClickableField,
} from "@/lib/nihss/config";
import {
  applyAfterCompletionClick,
  applyErhebungClose,
  applyFieldClick,
  applyLifecycleEvent,
  applyMissingFieldsAsNormal,
  applyStrokeLyseSimultaneous,
  applyLyseReset,
} from "@/lib/nihss/clicks";
import {
  AUTO_CLOSE_AFTER_MS,
  autoCloseStopAt,
  isLyseBeforeStroke,
  shouldAutoCloseExam,
} from "@/lib/nihss/duration";
import {
  applyFollowupChange,
  emptyFollowupValues,
} from "@/lib/nihss/followup";
import {
  INITIAL_CLOSE_FLOW,
  reduceCloseFlow,
} from "@/lib/nihss/close-flow";
import { formatBerlinTime } from "@/lib/nihss/timeline";
import {
  getAtaxiaIncompleteLabel,
  getDocumentationWarnings,
  getMissingNihssFields,
  getUndecidedStrokeLyseLabels,
  hasAtaxiaScoreWithoutLimbFinding,
  hasInvalidAtaxiaLimbCount,
  hasLyseJaWithKeinStroke,
  isRapidRepeatClick,
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
  const [closeFlow, dispatchCloseFlow] = useReducer(
    reduceCloseFlow,
    INITIAL_CLOSE_FLOW,
  );
  const [popupStroke, setPopupStroke] = useState<string | null>(null);
  const [popupLyse, setPopupLyse] = useState<string | null>(null);
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
  const followupTextTimerRef = useRef<number | null>(null);
  const {
    persistQueued,
    retryQueued,
    saveStatus,
    saveError,
    isSaving,
    restoredLatest,
  } = useQueuedPersist(initialErhebung);
  erhebungRef.current = erhebung;

  useEffect(() => {
    if (restoredLatest) {
      setErhebung(restoredLatest);
      erhebungRef.current = restoredLatest;
    }
  }, [restoredLatest]);

  const followupClosed = erhebung.followup_status === "abgeschlossen";
  const readOnly = erhebung.untersuchung_status === "abgeschlossen";
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
  const needsIncompleteWarning = isIncomplete;
  const needsDecisionWarning =
    undecidedStrokeLyse.length > 0 || lyseJaWithKeinStroke;
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
      if (followupTextTimerRef.current != null) {
        window.clearTimeout(followupTextTimerRef.current);
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
    ereignisse: Parameters<typeof persistQueued>[1],
    silent = false,
  ) {
    setErhebung(next);
    if (!silent) {
      setError(null);
    }
    await persistQueued(next, ereignisse, silent);
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
      if (autoCloseLockRef.current || current.untersuchung_status !== "offen") {
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
      dispatchCloseFlow({ type: "auto-close-exam" });
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
    if (readOnly || closeFlow.lyseOrder) {
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
    if (
      (field.key === "stroke" || field.key === "lyse") &&
      isLyseBeforeStroke(result.erhebung) &&
      !result.erhebung.stroke_lyse_gleichzeitig
    ) {
      dispatchCloseFlow({ type: "lyse-order-open" });
    }
  }

  async function confirmStrokeLyseSimultaneous() {
    const result = applyStrokeLyseSimultaneous({
      erhebung: erhebungRef.current,
      now: new Date(),
    });
    dispatchCloseFlow({ type: "lyse-order-close" });
    if (result.ereignisse.length === 0) {
      return;
    }
    await persist(result.erhebung, result.ereignisse);
  }

  async function confirmLyseReset() {
    const result = applyLyseReset({
      erhebung: erhebungRef.current,
      now: new Date(),
    });
    dispatchCloseFlow({ type: "lyse-order-close" });
    if (result.ereignisse.length === 0) {
      return;
    }
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
    if (readOnly || closeFlow.lyseOrder) {
      return;
    }
    if (!erhebung.startzeit_untersuchung) {
      setError("Die Untersuchung wurde noch nicht gestartet.");
      return;
    }

    dispatchCloseFlow({
      type: "stop-requested",
      needsWarning: needsIncompleteWarning || needsDecisionWarning,
    });
    if (!(needsIncompleteWarning || needsDecisionWarning)) {
      const current = erhebungRef.current;
      setPopupStroke(current.stroke_after_completion_status);
      setPopupLyse(current.lyse_after_completion_status);
    }
  }

  function proceedToAfterCompletion() {
    const current = erhebungRef.current;
    setPopupStroke(current.stroke_after_completion_status);
    setPopupLyse(current.lyse_after_completion_status);
    dispatchCloseFlow({ type: "warning-continue" });
  }

  function proceedToFollowup() {
    dispatchCloseFlow({ type: "exam-closed" });
  }

  function proceedToFinalClose() {
    dispatchCloseFlow({ type: "after-continue" });
  }

  function clearFollowupTextTimer() {
    if (followupTextTimerRef.current != null) {
      window.clearTimeout(followupTextTimerRef.current);
      followupTextTimerRef.current = null;
    }
  }

  function handleFollowupChange(patch: Partial<ErhebungRow>) {
    if (erhebungRef.current.followup_status === "abgeschlossen") {
      return;
    }
    const result = applyFollowupChange(erhebungRef.current, patch);
    erhebungRef.current = result.erhebung;
    setErhebung(result.erhebung);

    if (result.ereignisse.length > 0) {
      clearFollowupTextTimer();
      void persist(result.erhebung, result.ereignisse);
      return;
    }

    clearFollowupTextTimer();
    followupTextTimerRef.current = window.setTimeout(() => {
      void persist(erhebungRef.current, [], true);
    }, 400);
  }

  async function handleFollowupFinish() {
    clearFollowupTextTimer();
    await persist(erhebungRef.current, []);
    dispatchCloseFlow({ type: "followup-saved" });
  }

  async function handleFollowupSaveAndClose() {
    clearFollowupTextTimer();
    void persist(erhebungRef.current, []);
    dispatchCloseFlow({ type: "followup-close-requested" });
  }

  async function handleAfterCompletionSelect(
    field: ClickableField,
    value: string,
  ) {
    if (readOnly) {
      return;
    }

    const option = findOption(field, value);
    if (!option) {
      return;
    }

    const result = applyAfterCompletionClick({
      erhebung,
      field,
      option,
      now: new Date(),
    });
    if (field.key.startsWith("stroke")) {
      setPopupStroke(value);
    } else {
      setPopupLyse(value);
    }
    await persist(result.erhebung, result.ereignisse);
  }

  async function confirmStop() {
    const stopAt = new Date();
    if (
      erhebung.startzeit_untersuchung &&
      stopAt.getTime() < new Date(erhebung.startzeit_untersuchung).getTime()
    ) {
      dispatchCloseFlow({ type: "cancel-exam-flow" });
      setError("Die Endzeit wäre vor der Startzeit. Bitte Uhrzeit prüfen.");
      return;
    }

    const result = applyLifecycleEvent({
      erhebung,
      now: stopAt,
      kind: "stop",
    });
    await persist(result.erhebung, [result.ereignis]);
    proceedToFollowup();
  }

  async function confirmErhebungClose() {
    if (erhebungRef.current.followup_status === "abgeschlossen") {
      dispatchCloseFlow({ type: "erhebung-closed" });
      return;
    }
    const result = applyErhebungClose({
      erhebung: erhebungRef.current,
      now: new Date(),
    });
    await persist(result.erhebung, result.ereignisse);
    dispatchCloseFlow({ type: "erhebung-closed" });
  }

  async function markMissingAsNormal() {
    const result = applyMissingFieldsAsNormal({
      erhebung,
      missingFields,
      now: new Date(),
    });
    await persist(result.erhebung, result.ereignisse);

    const stillNeedsWarning =
      getMissingNihssFields(result.erhebung).length > 0 ||
      hasInvalidAtaxiaLimbCount(result.erhebung) ||
      getUndecidedStrokeLyseLabels(result.erhebung).length > 0 ||
      hasLyseJaWithKeinStroke(result.erhebung);
    if (!stillNeedsWarning) {
      proceedToAfterCompletion();
    }
  }

  const fieldMap = useMemo(() => {
    const map = new Map(NIHSS_FIELDS.map((field) => [field.key, field]));
    map.set(STROKE_FIELD.key, STROKE_FIELD);
    map.set(LYSE_FIELD.key, LYSE_FIELD);
    return map;
  }, []);

  return (
    <div>
      <div className="sticky top-0 z-50 md:top-[var(--app-header-height,2.5rem)]">
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
        <h2 className="text-2xl font-bold">Untersuchung</h2>

        {readOnly ? (
          <p className="rounded-lg bg-tempis-ice px-3 py-2 text-sm">
            Die Untersuchung ist abgeschlossen und die NIHSS-Angaben sind nur
            noch lesbar.
            {followupClosed
              ? " Die Erhebung ist abgeschlossen. Angaben zum Konsil sind nicht mehr änderbar."
              : " Angaben zum Konsil können weiter bearbeitet werden."}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-tempis-signal/30 bg-surface px-3 py-2 text-sm text-tempis-signal">
            {error}
          </p>
        ) : null}

        {saveError ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-tempis-signal/30 bg-surface px-3 py-2 text-sm text-tempis-signal">
            <p>{saveError}</p>
            <button
              type="button"
              onClick={() => {
                void retryQueued();
              }}
              className="rounded-lg bg-tempis-blue-dark px-3 py-1.5 font-semibold text-white hover:bg-tempis-blue-darker"
            >
              Erneut speichern
            </button>
          </div>
        ) : null}

        {!readOnly ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="rounded-lg bg-tempis-sage-dark px-4 py-3 font-semibold text-white hover:bg-tempis-sage-darker"
            >
              Untersuchung starten
            </button>
          </div>
        ) : null}

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

        {erhebung.stroke_after_completion_status ||
        erhebung.lyse_after_completion_status ? (
          <p className="rounded-lg bg-tempis-ice px-3 py-2 text-sm">
            Hypothetische Entscheidung nach NIHSS
            {erhebung.stroke_after_completion_status
              ? `: ${erhebung.stroke_after_completion_status}`
              : ""}
            {erhebung.lyse_after_completion_status
              ? `${erhebung.stroke_after_completion_status ? " ·" : ":"} ${erhebung.lyse_after_completion_status}`
              : ""}
            .
          </p>
        ) : null}

        <ErhebungExamDialogs
          closeFlow={closeFlow}
          erhebung={erhebung}
          popupStroke={popupStroke}
          popupLyse={popupLyse}
          isIncomplete={isIncomplete}
          missingFieldLabels={missingFields.map((field) => field.label)}
          ataxiaIncompleteLabel={ataxiaIncompleteLabel}
          undecidedStrokeLyse={undecidedStrokeLyse}
          lyseJaWithKeinStroke={lyseJaWithKeinStroke}
          canNormalizeMissing={canNormalizeMissing}
          onAfterSelect={handleAfterCompletionSelect}
          onAfterContinue={proceedToFinalClose}
          onAfterCancel={() => dispatchCloseFlow({ type: "cancel-exam-flow" })}
          onFollowupChange={handleFollowupChange}
          onFollowupSave={() => {
            void handleFollowupFinish();
          }}
          onFollowupCloseErhebung={() => {
            void handleFollowupSaveAndClose();
          }}
          onWarningContinue={proceedToAfterCompletion}
          onNormalizeMissing={() => {
            void markMissingAsNormal();
          }}
          onCancelExamFlow={() => dispatchCloseFlow({ type: "cancel-exam-flow" })}
          onLyseReset={() => {
            void confirmLyseReset();
          }}
          onLyseSimultaneous={() => {
            void confirmStrokeLyseSimultaneous();
          }}
          onConfirmExamClose={() => {
            void confirmStop();
          }}
          onConfirmErhebungClose={() => {
            void confirmErhebungClose();
          }}
          onCancelErhebungConfirm={() =>
            dispatchCloseFlow({ type: "erhebung-confirm-cancel" })
          }
        />

        <ErhebungNihssForm
          erhebung={erhebung}
          readOnly={readOnly}
          viewMode={viewMode}
          fieldMap={fieldMap}
          onSelect={handleSelect}
        />

        {readOnly ? (
          <>
            <h2 className="text-2xl font-bold">Angaben zum Konsil</h2>
            <section className="space-y-3 rounded-xl border border-border bg-surface p-3">
              <p className="text-sm text-muted">
                {followupClosed
                  ? "Die Erhebung ist abgeschlossen. Diese Angaben sind nicht mehr änderbar."
                  : "Diese Angaben können nach Beenden der Untersuchung noch geändert werden."}
              </p>
              <FollowupFields
                values={{ ...emptyFollowupValues(), ...erhebung }}
                mode="post"
                preFields="always"
                vorKiFields="never"
                disabled={followupClosed}
                onChange={handleFollowupChange}
              />
              {!followupClosed ? (
                <button
                  type="button"
                  onClick={() =>
                    dispatchCloseFlow({ type: "open-erhebung-confirm" })
                  }
                  className="rounded-lg bg-tempis-signal px-4 py-3 font-semibold text-white"
                >
                  Erhebung abschließen
                </button>
              ) : null}
            </section>
          </>
        ) : null}

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

      {saveStatus === "saving" ||
      saveStatus === "saved" ||
      saveStatus === "error" ||
      saveStatus === "retrying" ? (
        <p
          role={
            saveStatus === "error" || saveStatus === "retrying"
              ? "button"
              : undefined
          }
          tabIndex={
            saveStatus === "error" || saveStatus === "retrying" ? 0 : undefined
          }
          onClick={
            saveStatus === "error" || saveStatus === "retrying"
              ? () => {
                  void retryQueued();
                }
              : undefined
          }
          className={`fixed left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg ${
            saveStatus === "error"
              ? "pointer-events-auto cursor-pointer bg-tempis-signal"
              : saveStatus === "retrying"
                ? "pointer-events-auto cursor-pointer bg-tempis-orange"
                : "pointer-events-none bg-tempis-blue-dark"
          } ${
            readOnly
              ? "bottom-4"
              : "bottom-[calc(3.75rem+env(safe-area-inset-bottom))] md:bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
          }`}
        >
          {saveStatus === "saving"
            ? "Speichert…"
            : saveStatus === "saved"
              ? "Gespeichert"
              : saveStatus === "retrying"
                ? "Keine Verbindung — Speichern wird wiederholt"
                : "Speichern fehlgeschlagen — antippen zum Wiederholen"}
        </p>
      ) : null}
    </div>
  );
}
