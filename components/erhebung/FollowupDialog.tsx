"use client";

import FollowupFields from "@/components/erhebung/FollowupFields";
import {
  emptyFollowupValues,
  isLyseKiVorMissing,
  isSoloPatientenIdMissing,
} from "@/lib/nihss/followup";
import type { ErhebungRow } from "@/lib/supabase/database.types";

type FollowupDialogProps = {
  values: ErhebungRow;
  onChange: (patch: Partial<ErhebungRow>) => void;
  onSave: () => void;
  onCloseErhebung: () => void;
};

export default function FollowupDialog({
  values,
  onChange,
  onSave,
  onCloseErhebung,
}: FollowupDialogProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 md:items-center">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 overflow-hidden rounded-xl border border-tempis-orange bg-surface p-4 shadow-lg">
        <h2 className="text-lg font-semibold">Angaben zum Konsil</h2>
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
      </div>
    </div>
  );
}
