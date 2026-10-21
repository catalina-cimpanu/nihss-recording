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
  /** Returns an error message, or null when the pause was added. */
  onAdd: (von: string, bis: string, grund: PauseGrundAngabe) => Promise<string | null>;
  onRemove: (index: number) => Promise<void>;
};

const EMPTY_GRUND: PauseGrundDraft = { gruende: [], sonstige_text: "" };
const NOUN = "Pause / Unterbrechung";

function AddPauseForm({
  onAdd,
  onCancel,
}: {
  onAdd: PauseListProps["onAdd"];
  onCancel: () => void;
}) {
  const [von, setVon] = useState("");
  const [bis, setBis] = useState("");
  const [grund, setGrund] = useState<PauseGrundDraft>(EMPTY_GRUND);
  const [error, setError] = useState<string | null>(null);
  const missing =
    !von || !bis
      ? `Bitte Beginn und Ende der ${NOUN} angeben.`
      : pauseGrundMissing(grund, NOUN);

  return (
    <div className={`space-y-3 ${optionStyles.fieldFrame} ${optionStyles.fieldFrameSide}`}>
      <h3 className="text-sm font-semibold">{NOUN} nachträglich hinzufügen</h3>
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          Beginn
          <input
            type="time"
            value={von}
            onChange={(event) => {
              setError(null);
              setVon(event.target.value);
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 tabular-nums"
          />
        </label>
        <label className="flex items-center gap-2">
          Ende
          <input
            type="time"
            value={bis}
            onChange={(event) => {
              setError(null);
              setBis(event.target.value);
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 tabular-nums"
          />
        </label>
      </div>
      <PauseGrundFields
        noun={NOUN}
        value={grund}
        onChange={(next) => {
          setError(null);
          setGrund(next);
        }}
      />
      {error ?? missing ? (
        <p className="text-sm text-tempis-signal">{error ?? missing}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={missing != null}
          onClick={() => {
            void onAdd(von, bis, grund).then((result) => {
              if (result) {
                setError(result);
              } else {
                onCancel();
              }
            });
          }}
          className="rounded-lg bg-tempis-blue-dark px-4 py-2 font-semibold text-white hover:bg-tempis-blue-darker disabled:bg-tempis-dusty"
        >
          Speichern
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 font-semibold"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}

export default function PauseList({ pausen, onSave, onAdd, onRemove }: PauseListProps) {
  // The pause whose reason is being edited, with its draft.
  const [editing, setEditing] = useState<{ index: number; draft: PauseGrundDraft } | null>(
    null,
  );
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {pausen.length === 0 ? (
        <p className="text-sm text-muted">Keine Pausen / Unterbrechungen erfasst.</p>
      ) : null}
      {pausen.map((pause, index) => {
        const durationMs = pause.bis ? Date.parse(pause.bis) - Date.parse(pause.von) : null;
        const draft = editing?.index === index ? editing.draft : null;
        const missing = draft ? pauseGrundMissing(draft, NOUN) : null;

        return (
          <div
            key={pause.von}
            className={`space-y-2 ${optionStyles.fieldFrame} ${optionStyles.fieldFrameSide}`}
          >
            <h3 className="text-sm font-semibold">
              {pauseLabel(pause, index, NOUN)}
              {durationMs != null ? ` · Dauer ${formatElapsedClock(durationMs)}` : ""}
              {pause.nachgetragen ? (
                <span className="font-normal text-muted"> · nachgetragen</span>
              ) : null}
            </h3>
            {draft ? (
              <>
                <PauseGrundFields
                  noun={NOUN}
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
                <div className="flex flex-wrap gap-2">
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
                      Grund der {NOUN} nachträglich bearbeiten
                    </button>
                  ) : null}
                  {pause.nachgetragen ? (
                    <button
                      type="button"
                      onClick={() => {
                        void onRemove(index);
                      }}
                      className="rounded-lg border border-tempis-signal px-4 py-2 text-sm font-semibold text-tempis-signal"
                    >
                      Entfernen
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        );
      })}
      {adding ? (
        <AddPauseForm onAdd={onAdd} onCancel={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-lg border border-border px-4 py-3 font-semibold"
        >
          {NOUN} nachträglich hinzufügen
        </button>
      )}
    </div>
  );
}
