"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import FollowupFields from "@/components/erhebung/FollowupFields";
import OptionButton from "@/components/erhebung/OptionButton";
import optionStyles from "@/components/nihss_items/nihssOptions.module.css";
import {
  createErhebung,
  persistErhebungAndEreignisse,
} from "@/lib/db/erhebungen";
import { isSupabaseConfigured } from "@/lib/env";
import type { NihssOption } from "@/lib/nihss/config";
import {
  applyFollowupChange,
  emptyFollowupValues,
  preExamFollowupPatch,
  type FollowupValues,
} from "@/lib/nihss/followup";
import { untersuchungstypSchema } from "@/lib/nihss/validation";
import { createErhebungsId } from "@/lib/time/berlin";
import type { Untersuchungstyp } from "@/lib/nihss/types";
import type { ErhebungRow } from "@/lib/supabase/database.types";

const UNTERSUCHUNGSTYP_OPTIONS: NihssOption[] = [
  { value: "Test", label: "Test", score: null, color: "stroke" },
  {
    value: "Echter Patient",
    label: "Echter Patient",
    score: null,
    color: "stroke",
  },
];

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Die Erhebung konnte nicht erstellt werden. Bitte erneut versuchen.";
}

export default function NewErhebungForm() {
  const router = useRouter();
  const [untersuchungstyp, setUntersuchungstyp] =
    useState<Untersuchungstyp | null>(null);
  const [step, setStep] = useState<"typ" | "pre">("typ");
  const [created, setCreated] = useState<ErhebungRow | null>(null);
  const [preFollowup, setPreFollowup] = useState<FollowupValues>(
    emptyFollowupValues,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRecord() {
    const parsedType = untersuchungstypSchema.safeParse(untersuchungstyp);
    if (!parsedType.success) {
      setError("Bitte wählen Sie einen Untersuchungstyp.");
      setStep("typ");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase ist nicht konfiguriert. Bitte .env.local prüfen und den Dev-Server neu starten.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const next = await createErhebung({
        erhebungs_id: createErhebungsId(),
        untersuchungstyp: parsedType.data,
      });
      setCreated(next);
      setStep("pre");
      setIsSubmitting(false);
    } catch (caught) {
      setError(errorMessage(caught));
      setIsSubmitting(false);
    }
  }

  async function savePreAndOpen(values: FollowupValues) {
    if (!created) {
      setError("Die Erhebung konnte nicht erstellt werden. Bitte erneut versuchen.");
      setStep("typ");
      return;
    }

    setIsSubmitting(true);

    try {
      const patch = preExamFollowupPatch(values);
      const result = applyFollowupChange(created, patch);
      if (
        result.erhebung.solo_patienten_id !== created.solo_patienten_id ||
        result.erhebung.lyse_kontraindikation_vor_untersuchung !==
          created.lyse_kontraindikation_vor_untersuchung ||
        result.ereignisse.length > 0
      ) {
        await persistErhebungAndEreignisse(result.erhebung, result.ereignisse);
      }
      router.push(`/records/${created.id}`);
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (step === "typ") {
      await createRecord();
      return;
    }

    await savePreAndOpen(preFollowup);
  }

  const frameClass = untersuchungstyp
    ? optionStyles.fieldFrameSide
    : optionStyles.fieldFrameEmpty;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`space-y-2 ${optionStyles.fieldFrame} ${frameClass}`}>
        <h2 className="text-sm font-semibold">Untersuchungstyp</h2>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Untersuchungstyp">
          {UNTERSUCHUNGSTYP_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              option={option}
              selected={untersuchungstyp === option.value}
              disabled={step === "pre" || isSubmitting}
              onSelect={() =>
                setUntersuchungstyp(option.value as Untersuchungstyp)
              }
            />
          ))}
        </div>
      </div>

      {step === "pre" ? (
        <>
          <p className="text-sm text-muted">
            Beide Angaben sind optional. Leere Felder können am Ende der
            Untersuchung nachgetragen werden.
          </p>
          <FollowupFields
            values={preFollowup}
            mode="pre"
            disabled={isSubmitting}
            onChange={(patch) =>
              setPreFollowup((current) => {
                const next = { ...current, ...patch };
                return { ...next, ...preExamFollowupPatch(next) };
              })
            }
          />
        </>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-tempis-signal/30 bg-surface px-3 py-2 text-sm text-tempis-signal">
          {error}
        </p>
      ) : null}

      {step === "typ" ? (
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-tempis-blue-dark px-4 py-3 font-semibold text-white hover:bg-tempis-blue-darker disabled:bg-tempis-dusty disabled:text-white sm:w-auto"
        >
        {isSubmitting ? "Erhebung wird erstellt…" : "Erhebung erstellen"}
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-tempis-blue-dark px-4 py-3 font-semibold text-white hover:bg-tempis-blue-darker disabled:bg-tempis-dusty disabled:text-white"
          >
            {isSubmitting ? "Wird gespeichert…" : "Weiter"}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setError(null);
              void savePreAndOpen(preFollowup);
            }}
            className="rounded-lg border border-border px-4 py-3 font-semibold"
          >
            Überspringen
          </button>
        </div>
      )}
    </form>
  );
}
