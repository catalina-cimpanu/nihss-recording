"use client";

import { useState } from "react";
import OptionButton from "@/components/erhebung/OptionButton";
import optionStyles from "@/components/nihss_items/nihssOptions.module.css";
import { AFTER_COMPLETION_LYSE_FIELD, AFTER_COMPLETION_STROKE_FIELD } from "@/lib/nihss/config";
import {
  TIME_ROWS,
  clickedDecision,
  initialTimeCorrectionDraft,
  minuteOfDay,
  timeCorrectionPatch,
  type DecisionKey,
  type TimeCorrectionDraft,
  type TimeCorrectionPatch,
} from "@/lib/nihss/time-correction";
import type { ErhebungRow } from "@/lib/supabase/database.types";
import { normalizeTimeOfDay } from "@/lib/time/berlin";

type TimeCorrectionFieldsProps = {
  erhebung: ErhebungRow;
  onSave: (patch: TimeCorrectionPatch) => Promise<string | null>;
};

const DECISION_FIELDS = {
  stroke: AFTER_COMPLETION_STROKE_FIELD,
  lyse: AFTER_COMPLETION_LYSE_FIELD,
} as const;

function decisionLabel(key: DecisionKey, value: string): string {
  return DECISION_FIELDS[key].options.find((option) => option.value === value)?.label ?? value;
}

function decisionKeyOf(key: string): DecisionKey | null {
  return key === "stroke" || key === "lyse" ? key : null;
}

/** Read-only summary while the Zeiten are abgeschlossen. */
function TimeSummary({ erhebung }: { erhebung: ErhebungRow }) {
  return (
    <ul className="space-y-1 text-sm">
      {TIME_ROWS.map((item) => {
        const clicked = item.clickedAt(erhebung);
        const decisionKey = decisionKeyOf(item.key);
        const corrected = erhebung[item.column];
        const clickedValue = decisionKey ? clickedDecision(erhebung, decisionKey) : null;
        const correctedValue = decisionKey ? erhebung[`${decisionKey}_status_korrigiert`] : null;
        const decision = correctedValue ?? clickedValue;
        if (!clicked && !decisionKey) {
          return null;
        }

        const at = corrected ?? clicked;
        const value = [
          decisionKey ? (decision ? decisionLabel(decisionKey, decision) : "nicht gewählt") : null,
          at ? minuteOfDay(at) : null,
        ]
          .filter(Boolean)
          .join(" · ");
        const notes = [
          correctedValue
            ? clickedValue
              ? `korrigiert, geklickt: ${decisionLabel(decisionKey!, clickedValue)}`
              : "nachgetragen"
            : null,
          corrected && clicked ? `Zeit korrigiert, geklickt: ${minuteOfDay(clicked)}` : null,
        ].filter(Boolean);

        return (
          <li key={item.key}>
            <span className="font-semibold">{item.label}:</span> {value}
            {notes.length > 0 ? (
              <span className="text-muted"> ({notes.join("; ")})</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function TimeCorrectionFields({
  erhebung,
  onSave,
}: TimeCorrectionFieldsProps) {
  // null = abgeschlossen (read-only); a draft while correcting.
  const [draft, setDraft] = useState<TimeCorrectionDraft | null>(null);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(
    null,
  );

  function update(change: Partial<TimeCorrectionDraft>) {
    setMessage(null);
    setDraft((current) => (current ? { ...current, ...change } : current));
  }

  function setTime(key: keyof TimeCorrectionDraft["times"], value: string) {
    setMessage(null);
    setDraft((current) =>
      current ? { ...current, times: { ...current.times, [key]: value } } : current,
    );
  }

  async function save() {
    if (!draft) {
      return;
    }
    const patch = timeCorrectionPatch(erhebung, draft);
    const error = "error" in patch ? patch.error : await onSave(patch);
    if (error) {
      setMessage({ error: true, text: error });
      return;
    }
    setDraft(null);
    setMessage({ error: false, text: "Zeiten gespeichert." });
  }

  const messageLine = message ? (
    <p className={`text-sm ${message.error ? "text-tempis-signal" : "text-muted"}`}>
      {message.text}
    </p>
  ) : null;

  if (!draft) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Die Zeiten und Stroke-/Lyse-Entscheidungen sind mit Ende der
          Untersuchung abgeschlossen. Die ursprünglich geklickten Werte bleiben
          gespeichert; für die Zeitanalysen werden Korrekturen verwendet.
        </p>
        <TimeSummary erhebung={erhebung} />
        {messageLine}
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setDraft(initialTimeCorrectionDraft(erhebung));
          }}
          className="rounded-lg border border-border px-4 py-3 font-semibold"
        >
          Zeiten nachträglich festlegen oder korrigieren
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Uhrzeiten (Stunde:Minute) und Stroke-/Lyse-Entscheidungen korrigieren.
        Die NIHSS-Angaben bleiben gesperrt.
      </p>
      {TIME_ROWS.map((item) => {
        const clicked = item.clickedAt(erhebung);
        const decisionKey = decisionKeyOf(item.key);
        if (!clicked && !decisionKey) {
          return null;
        }
        const clickedValue = decisionKey ? clickedDecision(erhebung, decisionKey) : null;
        const decision = decisionKey ? draft[decisionKey] : null;
        const timeCorrected =
          clicked != null &&
          normalizeTimeOfDay(draft.times[item.key])?.slice(0, 5) !== minuteOfDay(clicked);

        return (
          <div
            key={item.key}
            className={`space-y-2 ${optionStyles.fieldFrame} ${optionStyles.fieldFrameSide}`}
          >
            <h3 className="text-sm font-semibold">{item.label}</h3>
            {decisionKey ? (
              <>
                <p className="text-xs text-muted">
                  {clickedValue
                    ? `Geklickt: ${decisionLabel(decisionKey, clickedValue)}${
                        decision !== clickedValue ? " · korrigiert" : ""
                      }`
                    : "Während der Untersuchung nicht gewählt. Eine Auswahl wird als „nachgetragen“ gekennzeichnet."}
                </p>
                <div className={optionStyles.optionRowNowrap}>
                  {DECISION_FIELDS[decisionKey].options.map((option) => (
                    <OptionButton
                      key={option.value}
                      option={option}
                      selected={decision === option.value}
                      onSelect={() =>
                        update({
                          // A nachgetragene decision can be removed again by tapping it.
                          [decisionKey]:
                            !clickedValue && decision === option.value ? null : option.value,
                        } as Partial<TimeCorrectionDraft>)
                      }
                    />
                  ))}
                </div>
              </>
            ) : null}
            {clicked || decision ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <input
                  type="time"
                  aria-label={`${item.label} Uhrzeit`}
                  value={draft.times[item.key]}
                  onChange={(event) => setTime(item.key, event.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 tabular-nums"
                />
                {clicked ? (
                  <span className="text-xs text-muted">
                    geklickt: {minuteOfDay(clicked)}
                    {timeCorrected ? " · korrigiert" : ""}
                  </span>
                ) : null}
                {clicked && timeCorrected ? (
                  <button
                    type="button"
                    onClick={() => setTime(item.key, minuteOfDay(clicked))}
                    className="text-xs font-semibold text-tempis-blue-darker underline"
                  >
                    Zurücksetzen
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {messageLine}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void save();
          }}
          className="rounded-lg bg-tempis-blue-dark px-4 py-3 font-semibold text-white hover:bg-tempis-blue-darker"
        >
          Zeiten speichern
        </button>
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setDraft(null);
          }}
          className="rounded-lg border border-border px-4 py-3 font-semibold"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
