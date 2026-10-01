"use client";

import AppDialog from "@/components/erhebung/AppDialog";
import FollowupFields from "@/components/erhebung/FollowupFields";
import {
  emptyFollowupValues,
  isLyseKiVorMissing,
  isSoloPatientenIdMissing,
} from "@/lib/nihss/followup";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type FollowupDialogProps = {
  values: ErhebungRow;
  stepLabel?: string;
  inert?: boolean;
  onChange: (patch: Partial<ErhebungRow>) => void;
  onSave: () => void;
  onCloseErhebung: () => void;
};

export default function FollowupDialog({
  values,
  stepLabel,
  inert = false,
  onChange,
  onSave,
  onCloseErhebung,
}: FollowupDialogProps) {
  return (
    <AppDialog
      title="Angaben zum Konsil"
      stepLabel={stepLabel}
      dismissible
      onClose={onSave}
      inert={inert}
      panelClassName="flex max-h-[90vh] flex-col overflow-hidden"
    >
      <p className="text-sm text-muted">
        Die Angaben können später auf der Erhebungsseite ergänzt werden.
        {isSoloPatientenIdMissing(values)
          ? " Die Solo-Patienten-ID kann hier nachgetragen werden."
          : ""}
        {isLyseKiVorMissing(values)
          ? " Die Lyse-Kontraindikation vor der Untersuchung kann hier nachgetragen werden."
          : ""}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <FollowupFields
          values={{ ...emptyFollowupValues(), ...values }}
          mode="post"
          preFields="ifMissing"
          onChange={onChange}
        />
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onSave}
          className="rounded-lg border border-border px-4 py-2 font-semibold"
        >
          Nur speichern
        </button>
        <button
          type="button"
          onClick={onCloseErhebung}
          className="rounded-lg bg-tempis-signal px-4 py-3 font-semibold text-white"
        >
          Erhebung speichern und abschließen
        </button>
      </div>
    </AppDialog>
  );
}
