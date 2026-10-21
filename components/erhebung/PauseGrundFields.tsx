"use client";

import { PAUSE_GRUENDE } from "@/lib/nihss/clicks";
import { SHORT_TEXT_MAX } from "@/lib/nihss/followup";
import type { PauseGrund } from "@/lib/supabase/database.types";

export type PauseGrundDraft = { gruende: PauseGrund[]; sonstige_text: string };

/** What is still missing before the reasons can be saved, or null. */
export function pauseGrundMissing(
  value: PauseGrundDraft,
  noun = "Pause",
): string | null {
  if (value.gruende.length === 0) {
    return `Bitte zuerst den Grund der ${noun} wählen.`;
  }
  if (value.gruende.includes("Sonstige") && !value.sonstige_text.trim()) {
    return "Bitte „Sonstige“ kurz beschreiben.";
  }
  return null;
}

type PauseGrundFieldsProps = {
  value: PauseGrundDraft;
  onChange: (value: PauseGrundDraft) => void;
  /** "overlay": white on the orange pause screen. */
  tone?: "overlay" | "plain";
  /** How the pause is called in the legend. */
  noun?: string;
};

export default function PauseGrundFields({
  value,
  onChange,
  tone = "plain",
  noun = "Pause",
}: PauseGrundFieldsProps) {
  const overlay = tone === "overlay";

  function toggle(grund: PauseGrund) {
    onChange({
      ...value,
      gruende: value.gruende.includes(grund)
        ? value.gruende.filter((item) => item !== grund)
        : [...value.gruende, grund],
    });
  }

  return (
    <fieldset className="w-full space-y-2 text-left">
      <legend className={`mb-2 ${overlay ? "font-semibold" : "text-sm font-semibold"}`}>
        Grund der {noun} (Mehrfachauswahl möglich)
      </legend>
      {PAUSE_GRUENDE.map((grund) => (
        <label
          key={grund}
          className={
            overlay
              ? "flex cursor-pointer items-center gap-3 rounded-lg bg-white/15 px-3 py-2 font-semibold"
              : "flex cursor-pointer items-center gap-2 text-sm"
          }
        >
          <input
            type="checkbox"
            className={overlay ? "size-5 accent-white" : undefined}
            checked={value.gruende.includes(grund)}
            onChange={() => toggle(grund)}
          />
          {grund}
        </label>
      ))}
      {value.gruende.includes("Sonstige") ? (
        <input
          type="text"
          maxLength={SHORT_TEXT_MAX}
          aria-label="Sonstiger Grund"
          placeholder="Bitte kurz beschreiben"
          value={value.sonstige_text}
          onChange={(event) => onChange({ ...value, sonstige_text: event.target.value })}
          className={`w-full rounded-lg border px-3 py-2 ${
            overlay ? "border-white bg-white text-foreground" : "border-border bg-surface"
          }`}
        />
      ) : null}
    </fieldset>
  );
}
