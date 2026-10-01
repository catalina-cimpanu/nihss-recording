"use client";

import AfterCompletionDialog from "@/components/erhebung/AfterCompletionDialog";
import AppDialog from "@/components/erhebung/AppDialog";
import FollowupDialog from "@/components/erhebung/FollowupDialog";
import { closeDialogMessage } from "@/lib/nihss/close-copy";
import {
  closeFlowStep,
  formatCloseFlowStep,
  type CloseFlowUi,
} from "@/lib/nihss/close-flow";
import {
  erhebungCloseConfirmQuestion,
  missingFollowupLabels,
} from "@/lib/nihss/erhebung-status";
import { emptyFollowupValues, type FollowupValues } from "@/lib/nihss/followup";
import { isExamLongerThan60Minutes } from "@/lib/nihss/validation-exam";
import type { ClickableField } from "@/lib/nihss/config";
import type { ErhebungRow } from "@/lib/supabase/database.types";

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

type ErhebungExamDialogsProps = {
  closeFlow: CloseFlowUi;
  erhebung: ErhebungRow;
  popupStroke: string | null;
  popupLyse: string | null;
  isIncomplete: boolean;
  missingFieldLabels: string[];
  ataxiaIncompleteLabel: string | null;
  undecidedStrokeLyse: string[];
  lyseJaWithKeinStroke: boolean;
  canNormalizeMissing: boolean;
  onAfterSelect: (field: ClickableField, value: string) => void;
  onAfterContinue: () => void;
  onAfterCancel: () => void;
  onFollowupChange: (patch: Partial<ErhebungRow>) => void;
  onFollowupSave: () => void;
  onFollowupCloseErhebung: () => void;
  onWarningContinue: () => void;
  onNormalizeMissing: () => void;
  onCancelExamFlow: () => void;
  onLyseReset: () => void;
  onLyseSimultaneous: () => void;
  onConfirmExamClose: () => void;
  onConfirmErhebungClose: () => void;
  onCancelErhebungConfirm: () => void;
};

export default function ErhebungExamDialogs({
  closeFlow,
  erhebung,
  popupStroke,
  popupLyse,
  isIncomplete,
  missingFieldLabels,
  ataxiaIncompleteLabel,
  undecidedStrokeLyse,
  lyseJaWithKeinStroke,
  canNormalizeMissing,
  onAfterSelect,
  onAfterContinue,
  onAfterCancel,
  onFollowupChange,
  onFollowupSave,
  onFollowupCloseErhebung,
  onWarningContinue,
  onNormalizeMissing,
  onCancelExamFlow,
  onLyseReset,
  onLyseSimultaneous,
  onConfirmExamClose,
  onConfirmErhebungClose,
  onCancelErhebungConfirm,
}: ErhebungExamDialogsProps) {
  function stepLabel(
    stage: "warning" | "afterCompletion" | "examClose" | "followup",
  ): string {
    return formatCloseFlowStep(closeFlowStep(stage, closeFlow.hasWarning));
  }

  return (
    <>
      {closeFlow.screen === "afterCompletion" ? (
        <AfterCompletionDialog
          erhebung={{
            ...erhebung,
            stroke_after_completion_status:
              popupStroke === "Ja" || popupStroke === "Kein Stroke"
                ? popupStroke
                : null,
            lyse_after_completion_status:
              popupLyse === "Ja" || popupLyse === "Keine Lyse" ? popupLyse : null,
          }}
          canContinue={Boolean(popupStroke && popupLyse)}
          stepLabel={stepLabel("afterCompletion")}
          onSelect={onAfterSelect}
          onContinue={onAfterContinue}
          onCancel={onAfterCancel}
        />
      ) : null}

      {closeFlow.screen === "followup" ? (
        <FollowupDialog
          values={erhebung}
          stepLabel={stepLabel("followup")}
          inert={closeFlow.erhebungConfirm}
          onChange={onFollowupChange}
          onSave={onFollowupSave}
          onCloseErhebung={onFollowupCloseErhebung}
        />
      ) : null}

      {closeFlow.screen === "warning" ? (
        <AppDialog
          title="Hinweise"
          stepLabel={stepLabel("warning")}
          dismissible
          onClose={onCancelExamFlow}
        >
          <p className="text-sm">
            {closeDialogMessage({
              isIncomplete,
              missingFieldLabels,
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
              onClick={onWarningContinue}
              className="rounded-lg bg-tempis-signal px-4 py-2 font-semibold text-white"
            >
              Trotzdem fortfahren
            </button>
            {canNormalizeMissing ? (
              <button
                type="button"
                onClick={onNormalizeMissing}
                className="rounded-lg bg-tempis-blue-dark px-4 py-2 font-semibold text-white hover:bg-tempis-blue-darker"
              >
                Alle fehlenden Felder als normal markieren
              </button>
            ) : null}
            <button
              type="button"
              onClick={onCancelExamFlow}
              className="rounded-lg border border-border px-4 py-2 font-semibold"
            >
              Abbrechen
            </button>
          </div>
        </AppDialog>
      ) : null}

      {closeFlow.lyseOrder ? (
        <AppDialog label="Lyse vor Stroke" dismissible={false}>
          <p className="text-sm">
            Lyse wurde vor Stroke dokumentiert. Bitte wählen, wie damit
            umgegangen werden soll.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onLyseReset}
              className="rounded-lg border border-border px-4 py-2 text-left font-semibold"
            >
              Ich habe mich verklickt
              <span className="mt-0.5 block text-xs font-medium text-muted">
                Lyse-Auswahl zurücksetzen
              </span>
            </button>
            <button
              type="button"
              onClick={onLyseSimultaneous}
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

      {closeFlow.screen === "examClose" ? (
        <AppDialog
          title="Untersuchung beenden"
          stepLabel={stepLabel("examClose")}
          dismissible
          onClose={onCancelExamFlow}
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
              onClick={onConfirmExamClose}
              className="rounded-lg bg-tempis-signal px-4 py-2 font-semibold text-white"
            >
              Untersuchung beenden
            </button>
            <button
              type="button"
              onClick={onCancelExamFlow}
              className="rounded-lg border border-border px-4 py-2 font-semibold"
            >
              Abbrechen
            </button>
          </div>
        </AppDialog>
      ) : null}

      {closeFlow.erhebungConfirm ? (
        <AppDialog
          title="Erhebung abschließen"
          stepLabel={
            closeFlow.screen === "followup" ? stepLabel("followup") : undefined
          }
          dismissible
          onClose={onCancelErhebungConfirm}
          zClass="z-[80]"
        >
          <ErhebungCloseWarningBody
            values={{ ...emptyFollowupValues(), ...erhebung }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onConfirmErhebungClose}
              className="rounded-lg bg-tempis-signal px-4 py-2 font-semibold text-white"
            >
              Erhebung abschließen
            </button>
            <button
              type="button"
              onClick={onCancelErhebungConfirm}
              className="rounded-lg border border-border px-4 py-2 font-semibold"
            >
              Abbrechen
            </button>
          </div>
        </AppDialog>
      ) : null}
    </>
  );
}
