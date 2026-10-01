"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AfterCompletionDialog from "@/components/erhebung/AfterCompletionDialog";
import AppDialog from "@/components/erhebung/AppDialog";
import FollowupDialog from "@/components/erhebung/FollowupDialog";
import FollowupFields from "@/components/erhebung/FollowupFields";
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
import { useQueuedPersist } from "@/components/erhebung/useQueuedPersist";
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
  type FollowupValues,
} from "@/lib/nihss/followup";
import {
  closeFlowStep,
  formatCloseFlowStep,
  type CloseFlowStage,
} from "@/lib/nihss/close-flow";
import {
  erhebungCloseConfirmQuestion,
  missingFollowupLabels,
} from "@/lib/nihss/erhebung-status";
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
  continueQuestion?: string;
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

  return `${parts.join(" ")} ${args.continueQuestion ?? "Trotzdem abschließen?"}`;
}

function ErhebungCloseWarningBody({ values }: { values: FollowupValues }) {
  const missing = missingFollowupLabels(values);
  return (
    <>
      {missing.length > 0 ? (
        <div className="space-y-2 text-sm">
          <p>Nicht alle Angaben zum Konsil sind ausgefüllt:</p>
          <ul className="list-disc space-y-1 pl-5">
            {missing.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="text-sm">{erhebungCloseConfirmQuestion(missing)}</p>
    </>
  );
}

export default function ErhebungWorkspace({
  initialErhebung,
}: ErhebungWorkspaceProps) {
  const [erhebung, setErhebung] = useState(initialErhebung);
  const [error, setError] = useState<string | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [afterCompletionOpen, setAfterCompletionOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [erhebungCloseOpen, setErhebungCloseOpen] = useState(false);
  const [strokeLyseOrderOpen, setStrokeLyseOrderOpen] = useState(false);
  const [closeFlowHasWarning, setCloseFlowHasWarning] = useState(false);
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
  const { persistQueued, saveStatus, saveError, isSaving } =
    useQueuedPersist(initialErhebung);
  erhebungRef.current = erhebung;

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
      setWarningDialogOpen(false);
      setAfterCompletionOpen(false);
      setFollowupOpen(false);
      setCloseDialogOpen(false);
      setErhebungCloseOpen(false);
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
    if (readOnly || strokeLyseOrderOpen) {
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
      setStrokeLyseOrderOpen(true);
    }
  }

  async function confirmStrokeLyseSimultaneous() {
    const result = applyStrokeLyseSimultaneous({
      erhebung: erhebungRef.current,
      now: new Date(),
    });
    setStrokeLyseOrderOpen(false);
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
    setStrokeLyseOrderOpen(false);
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
    if (readOnly || strokeLyseOrderOpen) {
      return;
    }
    if (!erhebung.startzeit_untersuchung) {
      setError("Die Untersuchung wurde noch nicht gestartet.");
      return;
    }

    if (needsIncompleteWarning || needsDecisionWarning) {
      setCloseFlowHasWarning(true);
      setWarningDialogOpen(true);
      return;
    }

    setCloseFlowHasWarning(false);
    proceedToAfterCompletion();
  }

  function proceedToAfterCompletion() {
    setWarningDialogOpen(false);
    setCloseDialogOpen(false);
    setFollowupOpen(false);
    const current = erhebungRef.current;
    setPopupStroke(current.stroke_after_completion_status);
    setPopupLyse(current.lyse_after_completion_status);
    setAfterCompletionOpen(true);
  }

  function proceedToFollowup() {
    setWarningDialogOpen(false);
    setAfterCompletionOpen(false);
    setCloseDialogOpen(false);
    setFollowupOpen(true);
  }

  function proceedToFinalClose() {
    setAfterCompletionOpen(false);
    setFollowupOpen(false);
    setCloseDialogOpen(true);
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
    setFollowupOpen(false);
  }

  async function handleFollowupSaveAndClose() {
    clearFollowupTextTimer();
    void persist(erhebungRef.current, []);
    setErhebungCloseOpen(true);
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
      setWarningDialogOpen(false);
      setAfterCompletionOpen(false);
      setFollowupOpen(false);
      setCloseDialogOpen(false);
      setError("Die Endzeit wäre vor der Startzeit. Bitte Uhrzeit prüfen.");
      return;
    }

    setWarningDialogOpen(false);
    setAfterCompletionOpen(false);
    setFollowupOpen(false);
    setCloseDialogOpen(false);
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
      setErhebungCloseOpen(false);
      setFollowupOpen(false);
      return;
    }
    setErhebungCloseOpen(false);
    setFollowupOpen(false);
    const result = applyErhebungClose({
      erhebung: erhebungRef.current,
      now: new Date(),
    });
    await persist(result.erhebung, result.ereignisse);
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

  function closeStepLabel(stage: CloseFlowStage): string {
    return formatCloseFlowStep(closeFlowStep(stage, closeFlowHasWarning));
  }

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
                void persistQueued(erhebungRef.current, []);
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

        {afterCompletionOpen ? (
          <AfterCompletionDialog
            erhebung={{
              ...erhebung,
              stroke_after_completion_status:
                popupStroke === "Ja" || popupStroke === "Kein Stroke"
                  ? popupStroke
                  : null,
              lyse_after_completion_status:
                popupLyse === "Ja" || popupLyse === "Keine Lyse"
                  ? popupLyse
                  : null,
            }}
            canContinue={Boolean(popupStroke && popupLyse)}
            stepLabel={closeStepLabel("afterCompletion")}
            onSelect={handleAfterCompletionSelect}
            onContinue={proceedToFinalClose}
            onCancel={() => setAfterCompletionOpen(false)}
          />
        ) : null}

        {followupOpen ? (
          <FollowupDialog
            values={erhebung}
            stepLabel={closeStepLabel("followup")}
            inert={erhebungCloseOpen}
            onChange={handleFollowupChange}
            onSave={() => {
              void handleFollowupFinish();
            }}
            onCloseErhebung={() => {
              void handleFollowupSaveAndClose();
            }}
          />
        ) : null}

        {warningDialogOpen ? (
          <AppDialog
            title="Hinweise"
            stepLabel={closeStepLabel("warning")}
            dismissible
            onClose={() => setWarningDialogOpen(false)}
          >
            <p className="text-sm">
              {closeDialogMessage({
                isIncomplete,
                missingFieldLabels: missingFields.map((field) => field.label),
                ataxiaIncompleteLabel,
                undecidedStrokeLyse,
                lyseJaWithKeinStroke,
                longerThan60Minutes: false,
                needsCloseAnyway: true,
                continueQuestion: "Trotzdem fortfahren?",
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={proceedToAfterCompletion}
                className="rounded-lg bg-tempis-signal px-4 py-2 font-semibold text-white"
              >
                Trotzdem fortfahren
              </button>
              {canNormalizeMissing ? (
                <button
                  type="button"
                  onClick={markMissingAsNormal}
                  className="rounded-lg bg-tempis-blue-dark px-4 py-2 font-semibold text-white hover:bg-tempis-blue-darker"
                >
                  Alle fehlenden Felder als normal markieren
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setWarningDialogOpen(false)}
                className="rounded-lg border border-border px-4 py-2 font-semibold"
              >
                Abbrechen
              </button>
            </div>
          </AppDialog>
        ) : null}

        {strokeLyseOrderOpen ? (
          <AppDialog
            label="Lyse vor Stroke"
            dismissible={false}
          >
            <p className="text-sm">
                Lyse wurde vor Stroke dokumentiert. Bitte wählen, wie damit
                umgegangen werden soll.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void confirmLyseReset();
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-left font-semibold"
                >
                  Ich habe mich verklickt
                  <span className="mt-0.5 block text-xs font-medium text-muted">
                    Lyse-Auswahl zurücksetzen
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void confirmStrokeLyseSimultaneous();
                  }}
                  className="rounded-lg bg-tempis-blue-dark px-4 py-2 text-left font-semibold text-white hover:bg-tempis-blue-darker"
                >
                  Ich habe beide gleichzeitig entschieden
                  <span className="mt-0.5 block text-xs font-medium text-white/80">
                    Stroke → Lyse als 0 Sek. speichern
                  </span>
                </button>
              </div>
          </AppDialog>
        ) : null}

        {closeDialogOpen ? (
          <AppDialog
            title="Untersuchung beenden"
            stepLabel={closeStepLabel("examClose")}
            dismissible
            onClose={() => setCloseDialogOpen(false)}
          >
            <p className="text-sm">
              Untersuchung beenden und als abgeschlossen markieren?
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
                Untersuchung beenden
              </button>
              <button
                type="button"
                onClick={() => setCloseDialogOpen(false)}
                className="rounded-lg border border-border px-4 py-2 font-semibold"
              >
                Abbrechen
              </button>
            </div>
          </AppDialog>
        ) : null}

        {erhebungCloseOpen ? (
          <AppDialog
            title="Erhebung abschließen"
            stepLabel={followupOpen ? closeStepLabel("followup") : undefined}
            dismissible
            onClose={() => setErhebungCloseOpen(false)}
            zClass="z-[80]"
          >
              <ErhebungCloseWarningBody
                values={{ ...emptyFollowupValues(), ...erhebung }}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void confirmErhebungClose();
                  }}
                  className="rounded-lg bg-tempis-signal px-4 py-2 font-semibold text-white"
                >
                  Erhebung abschließen
                </button>
                <button
                  type="button"
                  onClick={() => setErhebungCloseOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 font-semibold"
                >
                  Abbrechen
                </button>
              </div>
          </AppDialog>
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
                  onClick={() => setErhebungCloseOpen(true)}
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

      {saveStatus === "saving" || saveStatus === "saved" || saveStatus === "error" ? (
        <p
          role={saveStatus === "error" ? "button" : undefined}
          tabIndex={saveStatus === "error" ? 0 : undefined}
          onClick={
            saveStatus === "error"
              ? () => {
                  void persistQueued(erhebungRef.current, []);
                }
              : undefined
          }
          className={`fixed left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg ${
            saveStatus === "error"
              ? "pointer-events-auto cursor-pointer bg-tempis-signal"
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
              : "Speichern fehlgeschlagen — antippen zum Wiederholen"}
        </p>
      ) : null}
    </div>
  );
}
