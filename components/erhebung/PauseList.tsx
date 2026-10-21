"use client";

import { useState } from "react";
import PauseGrundFields, {
  pauseGrundMissing,
  type PauseGrundDraft,
} from "@/components/erhebung/PauseGrundFields";
import optionStyles from "@/components/nihss_items/nihssOptions.module.css";
import { pauseGrundLabel, pauseLabel, type PauseGrundAngabe } from "@/lib/nihss/clicks";
import { formatElapsedClock } from "@/lib/nihss/duration";
import type { Pause } from "@/lib/supabase/database.types";

type PauseListProps = {
  pausen: Pause[];
  onSave: (index: number, grund: PauseGrundAngabe) => Promise<void>;
};

export default function PauseList({ pausen, onSave }: PauseListProps) {
  // The pause whose reason is being edited, with its draft.
  const [editing, setEditing] = useState<{ index: number; draft: PauseGrundDraft } | null>(
    null,
  );

  return (
    <div className="space-y-3">
      {pausen.map((pause, index) => {
        const durationMs = pause.bis ? Date.parse(pause.bis) - Date.parse(pause.von) : null;
        const draft = editing?.index === index ? editing.draft : null;
        const missing = draft ? pauseGrundMissing(draft) : null;

        return (
          <div
            key={pause.von}
            className={`space-y-2 ${optionStyles.fieldFrame} ${optionStyles.fieldFrameSide}`}
          >
            <h3 className="text-sm font-semibold">
              {pauseLabel(pause, index)}
              {durationMs != null ? ` · Dauer ${formatElapsedClock(durationMs)}` : ""}
            </h3>
            {draft ? (
              <>
                <PauseGrundFields
                  value={draft}
                  onChange={(next) => setEditing({ index, draft: next })}
                />
                {missing ? <p className="text-sm text-tempis-signal">{missing}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={missing != null}
                    onClick={() => {
                      void onSave(index, draft).then(() => setEditing(null));
                    }}
                    className="rounded-lg bg-tempis-blue-dark px-4 py-2 font-semibold text-white hover:bg-tempis-blue-darker disabled:bg-tempis-dusty"
                  >
                    Speichern
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-lg border border-border px-4 py-2 font-semibold"
                  >
                    Abbrechen
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm">Grund: {pauseGrundLabel(pause)}</p>
                {pause.bis ? (
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        index,
                        draft: {
                          gruende: pause.gruende ?? [],
                          sonstige_text: pause.sonstige_text ?? "",
                        },
                      })
                    }
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
                  >
                    Pausengrund nachträglich bearbeiten
                  </button>
                ) : null}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
