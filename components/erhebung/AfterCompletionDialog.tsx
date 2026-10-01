"use client";

import { useState } from "react";
import AppDialog from "@/components/erhebung/AppDialog";
import FieldOptions from "@/components/erhebung/FieldOptions";
import {
  AFTER_COMPLETION_LYSE_FIELD,
  AFTER_COMPLETION_STROKE_FIELD,
  type ClickableField,
} from "@/lib/nihss/config";
import type { ErhebungRow } from "@/lib/supabase/database.types";

const EXPLANATION =
  "unabhängig von vorliegenden Kontraindikationen, rein auf der NIHSS Untersuchung basiert";

type AfterCompletionDialogProps = {
  erhebung: ErhebungRow;
  canContinue: boolean;
  stepLabel?: string;
  onSelect: (field: ClickableField, value: string) => void;
  onContinue: () => void;
  onCancel: () => void;
};

export default function AfterCompletionDialog({
  erhebung,
  canContinue,
  stepLabel,
  onSelect,
  onContinue,
  onCancel,
}: AfterCompletionDialogProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <AppDialog
      title="Hypothetische Entscheidung"
      stepLabel={stepLabel}
      dismissible
      onClose={onCancel}
    >
      <p className="text-sm">
        Bitte{" "}
        <span className="whitespace-nowrap">
          hypothetische Entscheidung
          <button
            type="button"
            className="ml-1 inline-flex align-text-bottom text-tempis-blue-darker"
            aria-label={EXPLANATION}
            aria-expanded={infoOpen}
            title={EXPLANATION}
            onClick={() => setInfoOpen((open) => !open)}
          >
            <InfoIcon />
          </button>
        </span>{" "}
        <strong className="underline">nach</strong> Vervollständigung der NIHSS
        Erhebung ergänzen.
      </p>
      {infoOpen ? (
        <p className="rounded-lg bg-tempis-ice px-3 py-2 text-xs text-muted">
          {EXPLANATION}
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
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 font-semibold"
        >
          Abbrechen
        </button>
      </div>
    </AppDialog>
  );
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM9 8a1 1 0 0 1 2 0v5a1 1 0 1 1-2 0V8Zm1-4a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 10 4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
