"use client";

import { useState } from "react";
import AppDialog from "@/components/erhebung/AppDialog";
import FieldOptions from "@/components/erhebung/FieldOptions";
import {
  HYPOTHETICAL_EXPLANATION,
  HypotheticalInfoButton,
} from "@/components/erhebung/HypotheticalInfo";
import {
  AFTER_COMPLETION_LYSE_FIELD,
  AFTER_COMPLETION_STROKE_FIELD,
  type ClickableField,
} from "@/lib/nihss/config";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type AfterCompletionDialogProps = {
  erhebung: ErhebungRow;
  canContinue: boolean;
  stepLabel?: string;
  onSelect: (field: ClickableField, value: string) => void;
  onContinue: () => void;
};

export default function AfterCompletionDialog({
  erhebung,
  canContinue,
  stepLabel,
  onSelect,
  onContinue,
}: AfterCompletionDialogProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <AppDialog
      title="Hypothetische Entscheidung"
      stepLabel={stepLabel}
      // The Untersuchung is already ended: the decision is required.
      dismissible={false}
    >
      <p className="text-sm">
        Bitte{" "}
        <span className="whitespace-nowrap">
          hypothetische Entscheidung
          <HypotheticalInfoButton
            open={infoOpen}
            onToggle={() => setInfoOpen((open) => !open)}
          />
        </span>{" "}
        <strong className="underline">nach</strong> Vervollständigung der NIHSS
        Erhebung ergänzen.
      </p>
      {infoOpen ? (
        <p className="rounded-lg bg-tempis-ice px-3 py-2 text-xs text-muted">
          {HYPOTHETICAL_EXPLANATION}
        </p>
      ) : null}

      <div className="space-y-1">
        <p className="text-xs font-semibold text-tempis-blue-darker">Stroke</p>
        <FieldOptions
          field={AFTER_COMPLETION_STROKE_FIELD}
          erhebung={erhebung}
          readOnly={false}
          compact
          singleLine
          onSelect={onSelect}
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-tempis-signal">Lyse</p>
        <FieldOptions
          field={AFTER_COMPLETION_LYSE_FIELD}
          erhebung={erhebung}
          readOnly={false}
          compact
          singleLine
          onSelect={onSelect}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="rounded-lg bg-tempis-blue-dark px-4 py-2 font-semibold text-white hover:bg-tempis-blue-darker disabled:opacity-50"
        >
          Weiter
        </button>
      </div>
    </AppDialog>
  );
}

